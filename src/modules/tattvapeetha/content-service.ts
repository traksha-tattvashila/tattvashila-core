import { ContentError, ContentErrorCode } from './content-errors.js';
import type {
  ContentModule,
  ContentPath,
  ContentUnit,
  ContentUnitVersion,
} from './content-models.js';
import type { ContentRepository } from './content-repository.js';

// ─── PostgreSQL error codes ────────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = '23505';

function pgCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  // drizzle-orm's node-postgres driver wraps the underlying pg error in
  // `cause` rather than exposing `code` directly on the thrown Error —
  // check both so a unique-violation is recognised regardless of shape.
  if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error && 'code' in cause && typeof (cause as { code?: unknown }).code === 'string') {
    return (cause as { code: string }).code;
  }
  return undefined;
}

function isUniqueViolation(error: unknown): boolean {
  return pgCode(error) === PG_UNIQUE_VIOLATION;
}

// ─── Closed status transition table ─────────────────────────────────────────────
// draft → published, draft → retired, published → retired. Retired is
// terminal. This single table governs paths, modules, and units alike.
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['published', 'retired'],
  published: ['retired'],
  retired: [],
};

function assertValidTransition(from: string, to: string): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new ContentError(
      `Cannot transition content status from "${from}" to "${to}".`,
      ContentErrorCode.INVALID_STATUS_TRANSITION,
    );
  }
}

// ─── Tattvapeetha content service interface ────────────────────────────────────
// Defines the constitutional content hierarchy (Path → Module → Unit) and
// its versioning discipline, independent of membership and progress.
//
// Constitutional rules:
// — Hierarchy depth is fixed at three levels: path, module, unit.
// — Content keys are immutable once assigned and distinct from UUID and
//   from the TMP/TRK/INS public identifier standard.
// — Status follows a closed enumeration (draft, published, retired) with
//   one-directional transitions; retired is terminal.
// — A unit cannot be published without at least one version.
// — Revising a unit's substance always creates a new version; no existing
//   version's title or body is ever mutated.
// — Retired units remain permanently resolvable but accept no new versions.
export interface ContentService {
  createPath(contentKey: string, title: string): Promise<ContentPath>;
  getPath(id: string): Promise<ContentPath>;
  transitionPathStatus(id: string, status: string): Promise<ContentPath>;

  createModule(pathId: string, contentKey: string, title: string): Promise<ContentModule>;
  getModule(id: string): Promise<ContentModule>;
  transitionModuleStatus(id: string, status: string): Promise<ContentModule>;

  createUnit(moduleId: string, contentKey: string): Promise<ContentUnit>;
  getUnit(id: string): Promise<ContentUnit>;
  // Adds a new immutable version to a unit. Allowed while the unit is draft
  // or published; rejected once the unit is retired.
  addUnitVersion(unitId: string, title: string, body: string): Promise<ContentUnitVersion>;
  getCurrentVersion(unitId: string): Promise<ContentUnitVersion>;
  // Publishes a unit. Requires at least one version to already exist.
  publishUnit(unitId: string): Promise<ContentUnit>;
  retireUnit(unitId: string): Promise<ContentUnit>;
}

export function createContentService(repository: ContentRepository): ContentService {
  async function getPath(id: string): Promise<ContentPath> {
    const path = await repository.findPathById(id);
    if (path === undefined) {
      throw new ContentError(
        'No content path exists for the given identifier.',
        ContentErrorCode.PATH_NOT_FOUND,
      );
    }
    return path;
  }

  async function getModule(id: string): Promise<ContentModule> {
    const module_ = await repository.findModuleById(id);
    if (module_ === undefined) {
      throw new ContentError(
        'No content module exists for the given identifier.',
        ContentErrorCode.MODULE_NOT_FOUND,
      );
    }
    return module_;
  }

  async function getUnit(id: string): Promise<ContentUnit> {
    const unit = await repository.findUnitById(id);
    if (unit === undefined) {
      throw new ContentError(
        'No content unit exists for the given identifier.',
        ContentErrorCode.UNIT_NOT_FOUND,
      );
    }
    return unit;
  }

  return {
    async createPath(contentKey, title) {
      try {
        return await repository.createPath(contentKey, title);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ContentError(
            `A content path with key "${contentKey}" already exists.`,
            ContentErrorCode.CONTENT_KEY_ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    getPath,

    async transitionPathStatus(id, status) {
      const path = await getPath(id);
      assertValidTransition(path.status, status);
      return repository.updatePathStatus(id, status as ContentPath['status']);
    },

    async createModule(pathId, contentKey, title) {
      // Ensures the parent path exists before a module can reference it —
      // propagates ContentError(PATH_NOT_FOUND) unchanged if not.
      await getPath(pathId);

      try {
        return await repository.createModule(pathId, contentKey, title);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ContentError(
            `A content module with key "${contentKey}" already exists.`,
            ContentErrorCode.CONTENT_KEY_ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    getModule,

    async transitionModuleStatus(id, status) {
      const module_ = await getModule(id);
      assertValidTransition(module_.status, status);
      return repository.updateModuleStatus(id, status as ContentModule['status']);
    },

    async createUnit(moduleId, contentKey) {
      // Ensures the parent module exists before a unit can reference it —
      // propagates ContentError(MODULE_NOT_FOUND) unchanged if not.
      await getModule(moduleId);

      try {
        return await repository.createUnit(moduleId, contentKey);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ContentError(
            `A content unit with key "${contentKey}" already exists.`,
            ContentErrorCode.CONTENT_KEY_ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    getUnit,

    async addUnitVersion(unitId, title, body) {
      const unit = await getUnit(unitId);
      if (unit.status === 'retired') {
        throw new ContentError(
          'Cannot add a version to a retired content unit.',
          ContentErrorCode.UNIT_RETIRED,
        );
      }
      return repository.addVersion(unitId, title, body);
    },

    async getCurrentVersion(unitId) {
      // Ensures the unit exists — propagates ContentError(UNIT_NOT_FOUND)
      // unchanged if not.
      await getUnit(unitId);

      const version = await repository.findCurrentVersion(unitId);
      if (version === undefined) {
        throw new ContentError(
          'No version exists for the given content unit.',
          ContentErrorCode.VERSION_NOT_FOUND,
        );
      }
      return version;
    },

    async publishUnit(unitId) {
      const unit = await getUnit(unitId);
      assertValidTransition(unit.status, 'published');

      const currentVersion = await repository.findCurrentVersion(unitId);
      if (currentVersion === undefined) {
        throw new ContentError(
          'Cannot publish a content unit with no version.',
          ContentErrorCode.NO_VERSION_TO_PUBLISH,
        );
      }

      return repository.updateUnitStatus(unitId, 'published');
    },

    async retireUnit(unitId) {
      const unit = await getUnit(unitId);
      assertValidTransition(unit.status, 'retired');
      return repository.updateUnitStatus(unitId, 'retired');
    },
  };
}
