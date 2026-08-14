import { workspaceRepo } from "../../repositories/workspace.repo.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../../validators/workspace.schema.js";

// As the app grows, business logic accumulates here, workspace usage limits, storage quota checks before creation, cascade cleanup logic. 
// Controllers don't know about the database; services do. Right now it's a thin wrapper, intentionally

export const workspaceService = {
  getAll: (userId: string, accessToken: string) =>
    workspaceRepo.findAllByUser(accessToken),

  getById: (workspaceId: string, userId: string, accessToken: string) =>
    workspaceRepo.findById(workspaceId, accessToken),

  create: (userId: string, input: CreateWorkspaceInput) =>
    workspaceRepo.create(userId, input),

  update: (workspaceId: string, userId: string, input: UpdateWorkspaceInput) =>
    workspaceRepo.update(workspaceId, userId, input),

  delete: (workspaceId: string, userId: string) =>
    workspaceRepo.delete(workspaceId, userId),
};