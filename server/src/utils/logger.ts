import { createLogger, format, transports } from "winston";
import { WinstonTransport as AxiomTransport } from "@axiomhq/winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, colorize, json } = format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
  return `[${ts}] ${String(level).toUpperCase().padEnd(5)} ${String(message)}${metaStr}`;
});

const buildTransports = () => {
  const list: (transports.ConsoleTransportInstance | AxiomTransport)[] = [
    new transports.Console({
      format:
        env.NODE_ENV === "production"
          ? combine(timestamp(), json())
          : combine(timestamp(), colorize(), devFormat),
    }),
  ];

  /*
    Axiom transport is only added in production when both env vars are present.
    In development logs go to stdout only.
    To activate: create a free account at axiom.co, create a dataset,
    generate an API token, then add both vars to your .env and Render env.
  */
  if (
    env.NODE_ENV === "production" &&
    env.AXIOM_TOKEN &&
    env.AXIOM_DATASET
  ) {
    list.push(
      new AxiomTransport({
        dataset: env.AXIOM_DATASET,
        token: env.AXIOM_TOKEN,
      })
    );
  }

  return list;
};

const winstonLogger = createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transports: buildTransports(),
  exitOnError: false,
});

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    winstonLogger.debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    winstonLogger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    winstonLogger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    winstonLogger.error(message, meta),
};

export const morganStream = {
  write: (message: string) => winstonLogger.http(message.trim()),
};