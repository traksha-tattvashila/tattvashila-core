import type { ContentService } from './content-service.js';
import type { MembershipService } from './membership-service.js';
import type {
  AggregateProgress,
  ProgressRecord,
  StoredProgressStatus,
  UnitProgress,
} from './progress-models.js';
import { ProgressError, ProgressErrorCode } from './progress-errors.js';
import type { ProgressRepository } from './progress-repository.js';

// ─── Tattvaloka progress service interface ──────────────────────────────────────
// Records and computes a member's advancement through published content,
// without redefining membership (Sprint 16) or content (Sprint 17).
//
// Constitutional rules:
// — Every progress record references a membership record, never a raw
//   identity — resolved here via MembershipService.getMembership().
// — Every progress record references an immutable content unit version,
//   never a mutable unit — resolved here via ContentService.getCurrentVersion().
// — Aggregate progress is always computed from stored records; no aggregate
//   total is ever persisted.
// — A progress record is never deleted or rewritten to a different version
//   when content is revised or retired — it remains exactly as recorded.
export interface ProgressService {
  // Starts progress on a unit for the given identity, against the unit's
  // current version. Idempotent if already in progress. Throws
  // ProgressError(INVALID_TRANSITION) if the record is already completed.
  // Throws ProgressError(UNIT_NOT_TRACKABLE) if the unit is not published.
  startUnitProgress(identityId: string, unitId: string): Promise<UnitProgress>;

  // Marks a unit as completed for the given identity, against the unit's
  // current version. Valid from "not started" or "in progress". Idempotent
  // if already completed. Throws ProgressError(UNIT_NOT_TRACKABLE) if the
  // unit is not published.
  completeUnitProgress(identityId: string, unitId: string): Promise<UnitProgress>;

  // Returns the computed progress for a single unit — reflects the record
  // against the unit's current version, or "not_started" if none exists.
  // Always resolvable, regardless of the unit's status.
  getUnitProgress(identityId: string, unitId: string): Promise<UnitProgress>;

  // Returns computed, never-cached aggregate progress across a
  // caller-supplied set of units (e.g. all units in a module or path, as
  // resolved by the caller through the content hierarchy).
  getAggregateProgress(
    identityId: string,
    unitIds: readonly string[],
  ): Promise<AggregateProgress>;
}

export function createProgressService(
  repository: ProgressRepository,
  contentService: ContentService,
  membershipService: MembershipService,
): ProgressService {
  function toUnitProgress(
    unitId: string,
    record: ProgressRecord | undefined,
  ): UnitProgress {
    if (record === undefined) {
      return { unitId, status: 'not_started', startedAt: undefined, completedAt: undefined };
    }
    return {
      unitId,
      status: record.status,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
    };
  }

  async function resolveTrackableUnitVersion(unitId: string): Promise<string> {
    // Propagates ContentError(UNIT_NOT_FOUND) / ContentError(VERSION_NOT_FOUND)
    // unchanged if the unit or its current version does not exist.
    const unit = await contentService.getUnit(unitId);
    if (unit.status !== 'published') {
      throw new ProgressError(
        `Cannot record progress against content unit "${unitId}" because it is not published.`,
        ProgressErrorCode.UNIT_NOT_TRACKABLE,
      );
    }
    const version = await contentService.getCurrentVersion(unitId);
    return version.id;
  }

  async function setStatus(
    membershipId: string,
    unitVersionId: string,
    status: StoredProgressStatus,
  ): Promise<ProgressRecord> {
    const existing = await repository.findByMembershipAndVersion(membershipId, unitVersionId);

    if (existing === undefined) {
      return repository.create(membershipId, unitVersionId, status);
    }

    // Completed is terminal — it never regresses to in_progress.
    if (existing.status === 'completed' && status === 'in_progress') {
      throw new ProgressError(
        'Cannot move a completed progress record back to in progress.',
        ProgressErrorCode.INVALID_TRANSITION,
      );
    }

    // Idempotent no-op when the requested status already holds.
    if (existing.status === status) {
      return existing;
    }

    return repository.updateStatus(
      existing.id,
      status,
      status === 'completed' ? new Date() : undefined,
    );
  }

  return {
    async startUnitProgress(identityId, unitId) {
      const membership = await membershipService.getMembership(identityId);
      const unitVersionId = await resolveTrackableUnitVersion(unitId);
      const record = await setStatus(membership.id, unitVersionId, 'in_progress');
      return toUnitProgress(unitId, record);
    },

    async completeUnitProgress(identityId, unitId) {
      const membership = await membershipService.getMembership(identityId);
      const unitVersionId = await resolveTrackableUnitVersion(unitId);
      const record = await setStatus(membership.id, unitVersionId, 'completed');
      return toUnitProgress(unitId, record);
    },

    async getUnitProgress(identityId, unitId) {
      const membership = await membershipService.getMembership(identityId);
      // A unit's current version must always be resolvable to report
      // progress against it, regardless of the unit's status — this is
      // what keeps historical progress records permanently readable even
      // after the unit is retired.
      const version = await contentService.getCurrentVersion(unitId);
      const record = await repository.findByMembershipAndVersion(membership.id, version.id);
      return toUnitProgress(unitId, record);
    },

    async getAggregateProgress(identityId, unitIds) {
      const membership = await membershipService.getMembership(identityId);

      const units: UnitProgress[] = [];
      for (const unitId of unitIds) {
        const version = await contentService.getCurrentVersion(unitId);
        const record = await repository.findByMembershipAndVersion(membership.id, version.id);
        units.push(toUnitProgress(unitId, record));
      }

      const total = units.length;
      const completed = units.filter((u) => u.status === 'completed').length;
      const inProgress = units.filter((u) => u.status === 'in_progress').length;
      const notStarted = total - completed - inProgress;

      return {
        total,
        notStarted,
        inProgress,
        completed,
        percentComplete: total === 0 ? 0 : Math.round((completed / total) * 100),
        units,
      };
    },
  };
}
