"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateWorkspace } from "@/hooks/useWorkspaces";
import { useUIStore } from "@/store/ui.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { z } from "zod";

const createSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(80, "Name must be 80 characters or fewer")
    .trim(),
  description: z
    .string()
    .max(400, "Description must be 400 characters or fewer")
    .trim()
    .optional(),
});

export default function CreateWorkspaceModal() {
  const open = useUIStore((s) => s.createWorkspaceModalOpen);
  const setOpen = useUIStore((s) => s.setCreateWorkspaceModalOpen);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "description" | "form", string>>
  >({});
  const nameRef = useRef<HTMLInputElement>(null);

  const { mutate: createWorkspace, isPending } = useCreateWorkspace();

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setErrors({});
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = createSchema.safeParse({
      name,
      description: description || undefined,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
      });
      return;
    }

    createWorkspace(result.data, {
      onSuccess: (data) => {
        const workspace = data.workspace as { id: string };
        setActiveWorkspaceId(workspace.id);
        setOpen(false);
        router.push(`/workspace/${workspace.id}`);
      },
      onError: (error: Error) => {
        setErrors({
          form:
            error.message ?? "Failed to create workspace. Please try again.",
        });
      },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2
                  id="modal-title"
                  className="text-base font-semibold text-text-primary"
                >
                  New workspace
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-text-disabled hover:text-text-secondary transition-colors"
                  aria-label="Close"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  ref={nameRef}
                  label="Name"
                  type="text"
                  placeholder="e.g. Machine Learning, Final Year Research"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-text-primary font-medium">
                    Description
                    <span className="text-text-disabled font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    placeholder="What are you working on in this workspace?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm rounded-md bg-surface border border-border text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-accent resize-none"
                  />
                  {errors.description && (
                    <p className="text-xs text-danger">{errors.description}</p>
                  )}
                </div>

                {errors.form && (
                  <p className="text-xs text-danger text-center">
                    {errors.form}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isPending}>
                    Create workspace
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
