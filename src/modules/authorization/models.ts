// ─── Authorization domain models ─────────────────────────────────────────────
// Read-side domain shapes for the authorization application layer.

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Permission {
  readonly id: string;
  readonly resource: string;
  readonly action: string;
  readonly createdAt: Date;
}

// The resolved permission set for a constitutional identity, computed by
// flattening all roles the identity holds into their constituent permissions.
// permissions is a Set of "resource:action" strings for O(1) lookup.
// This structure is attached to the request by the resolve-permissions
// middleware and consumed by requirePermission guards.
export interface ResolvedPermissions {
  readonly identityId: string;
  readonly permissions: ReadonlySet<string>;
}
