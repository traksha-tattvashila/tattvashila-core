import type {
  ContentModule,
  ContentPath,
  ContentUnit,
  ContentUnitVersion,
} from '../content-models.js';

// ─── Tattvaloka content API response models ────────────────────────────────────
// Typed shapes returned by the Tattvaloka content HTTP endpoints. Dates are
// serialised to ISO 8601 — the domain model never leaks Date instances
// directly to the HTTP layer.

export interface ContentPathResponse {
  readonly id: string;
  readonly contentKey: string;
  readonly title: string;
  readonly status: string;
  readonly position: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toContentPathResponse(path: ContentPath): ContentPathResponse {
  return {
    id: path.id,
    contentKey: path.contentKey,
    title: path.title,
    status: path.status,
    position: path.position,
    createdAt: path.createdAt.toISOString(),
    updatedAt: path.updatedAt.toISOString(),
  };
}

export interface ContentModuleResponse {
  readonly id: string;
  readonly pathId: string;
  readonly contentKey: string;
  readonly title: string;
  readonly status: string;
  readonly position: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toContentModuleResponse(module_: ContentModule): ContentModuleResponse {
  return {
    id: module_.id,
    pathId: module_.pathId,
    contentKey: module_.contentKey,
    title: module_.title,
    status: module_.status,
    position: module_.position,
    createdAt: module_.createdAt.toISOString(),
    updatedAt: module_.updatedAt.toISOString(),
  };
}

export interface ContentUnitResponse {
  readonly id: string;
  readonly moduleId: string;
  readonly contentKey: string;
  readonly status: string;
  readonly position: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toContentUnitResponse(unit: ContentUnit): ContentUnitResponse {
  return {
    id: unit.id,
    moduleId: unit.moduleId,
    contentKey: unit.contentKey,
    status: unit.status,
    position: unit.position,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
  };
}

export interface ContentUnitVersionResponse {
  readonly id: string;
  readonly unitId: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly body: string;
  readonly isCurrent: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toContentUnitVersionResponse(
  version: ContentUnitVersion,
): ContentUnitVersionResponse {
  return {
    id: version.id,
    unitId: version.unitId,
    versionNumber: version.versionNumber,
    title: version.title,
    body: version.body,
    isCurrent: version.isCurrent,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}
