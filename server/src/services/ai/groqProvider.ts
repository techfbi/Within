import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import { AIError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

/*
  Primary and fallback models.
  If the primary model is rate limited or unavailable,
  the fallback is automatically tried before giving up.
*/
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

export interface StreamOptions {
  systemPrompt: string;
  contextSection: string;
  conversationHistory: ConversationMessage[];
  userQuery: string;
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/*
  Builds the message array for the Groq API call.
  Message order is critical for both correctness and security:
  1. System prompt (application controlled, model behaviour rules)
  2. Context section (retrieved document content, labelled as reference)
  3. Conversation history (previous turns in this conversation)
  4. Current user query

  The context is injected as a user turn followed by an assistant
  acknowledgement rather than appended to the system prompt.
  This keeps the system prompt clean and works better with
  instruction-tuned models that expect system/user/assistant turns.
*/
const buildMessages = (options: StreamOptions): Groq.Chat.ChatCompletionMessageParam[] => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: options.systemPrompt,
    },
  ];

  if (options.contextSection) {
    messages.push(
      {
        role: "user",
        content: options.contextSection,
      },
      {
        role: "assistant",
        content: "I have read the document context and will use it to answer your questions accurately.",
      }
    );
  }

  for (const msg of options.conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({
    role: "user",
    content: options.userQuery,
  });

  return messages;
};

/*
  Streams a response from Groq with automatic fallback to the
  smaller model if the primary model is rate limited (429) or
  temporarily unavailable (503).
  Calls onToken for each streamed chunk and onComplete when done.
*/
export const streamGroqResponse = async (
  options: StreamOptions,
  useModel = PRIMARY_MODEL
): Promise<void> => {
  try {
    const messages = buildMessages(options);

    const stream = await groq.chat.completions.create({
      model: useModel,
      messages,
      max_tokens: 2000,
      temperature: 0.2,
      stream: true,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? "";
      if (token) {
        fullText += token;
        options.onToken(token);
      }
    }

    options.onComplete(fullText);
  } catch (err: unknown) {
    const isRateLimit = err instanceof Groq.APIError && err.status === 429;
    const isUnavailable = err instanceof Groq.APIError && err.status === 503;

    if ((isRateLimit || isUnavailable) && useModel === PRIMARY_MODEL) {
      logger.warn("Groq primary model unavailable, falling back", {
        model: PRIMARY_MODEL,
        fallback: FALLBACK_MODEL,
        status: err instanceof Groq.APIError ? err.status : "unknown",
      });
      return streamGroqResponse(options, FALLBACK_MODEL);
    }

    logger.error("Groq streaming failed", {
      model: useModel,
      error: err instanceof Error ? err.message : String(err),
    });

    throw new AIError();
  }
};