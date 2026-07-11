import type { Request, Response } from 'express';

import type { ContentService } from '../content-service.js';
import {
  toContentModuleResponse,
  toContentPathResponse,
  toContentUnitResponse,
  toContentUnitVersionResponse,
} from './content-responses.js';
import {
  AddVersionBodySchema,
  CreateModuleBodySchema,
  CreatePathBodySchema,
  CreateUnitBodySchema,
  TransitionStatusBodySchema,
} from './content-validation.js';

function sendValidationError(res: Response, error: { flatten(): unknown }): void {
  res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body.',
      details: (error.flatten as () => { fieldErrors: unknown })().fieldErrors,
    },
  });
}

// ─── Tattvaloka content handlers ───────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, middleware) is the responsibility of routes.ts.
// Handlers call the content service and return JSON; no business logic
// lives here.
export interface ContentHandlers {
  createPath(req: Request, res: Response): Promise<void>;
  getPath(req: Request<{ id: string }>, res: Response): Promise<void>;
  transitionPathStatus(req: Request<{ id: string }>, res: Response): Promise<void>;

  createModule(req: Request, res: Response): Promise<void>;
  getModule(req: Request<{ id: string }>, res: Response): Promise<void>;
  transitionModuleStatus(req: Request<{ id: string }>, res: Response): Promise<void>;

  createUnit(req: Request, res: Response): Promise<void>;
  getUnit(req: Request<{ id: string }>, res: Response): Promise<void>;
  addUnitVersion(req: Request<{ id: string }>, res: Response): Promise<void>;
  getCurrentVersion(req: Request<{ id: string }>, res: Response): Promise<void>;
  publishUnit(req: Request<{ id: string }>, res: Response): Promise<void>;
  retireUnit(req: Request<{ id: string }>, res: Response): Promise<void>;
}

export function createContentHandlers(service: ContentService): ContentHandlers {
  return {
    async createPath(req, res) {
      const parsed = CreatePathBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const path = await service.createPath(parsed.data.contentKey, parsed.data.title);
      res.status(201).json(toContentPathResponse(path));
    },

    async getPath(req, res) {
      const path = await service.getPath(req.params.id);
      res.status(200).json(toContentPathResponse(path));
    },

    async transitionPathStatus(req, res) {
      const parsed = TransitionStatusBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const path = await service.transitionPathStatus(req.params.id, parsed.data.status);
      res.status(200).json(toContentPathResponse(path));
    },

    async createModule(req, res) {
      const parsed = CreateModuleBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const module_ = await service.createModule(
        parsed.data.pathId,
        parsed.data.contentKey,
        parsed.data.title,
      );
      res.status(201).json(toContentModuleResponse(module_));
    },

    async getModule(req, res) {
      const module_ = await service.getModule(req.params.id);
      res.status(200).json(toContentModuleResponse(module_));
    },

    async transitionModuleStatus(req, res) {
      const parsed = TransitionStatusBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const module_ = await service.transitionModuleStatus(
        req.params.id,
        parsed.data.status,
      );
      res.status(200).json(toContentModuleResponse(module_));
    },

    async createUnit(req, res) {
      const parsed = CreateUnitBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const unit = await service.createUnit(parsed.data.moduleId, parsed.data.contentKey);
      res.status(201).json(toContentUnitResponse(unit));
    },

    async getUnit(req, res) {
      const unit = await service.getUnit(req.params.id);
      res.status(200).json(toContentUnitResponse(unit));
    },

    async addUnitVersion(req, res) {
      const parsed = AddVersionBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const version = await service.addUnitVersion(
        req.params.id,
        parsed.data.title,
        parsed.data.body,
      );
      res.status(201).json(toContentUnitVersionResponse(version));
    },

    async getCurrentVersion(req, res) {
      const version = await service.getCurrentVersion(req.params.id);
      res.status(200).json(toContentUnitVersionResponse(version));
    },

    async publishUnit(req, res) {
      const unit = await service.publishUnit(req.params.id);
      res.status(200).json(toContentUnitResponse(unit));
    },

    async retireUnit(req, res) {
      const unit = await service.retireUnit(req.params.id);
      res.status(200).json(toContentUnitResponse(unit));
    },
  };
}
