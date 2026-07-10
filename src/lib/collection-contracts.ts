export type CollectionCount =
  | { kind: "exact" | "estimated"; value: number }
  | { kind: "unknown" };

export type RequestedCollectionScope = {
  branchId?: string;
  classId?: string;
  roomId?: string;
  operationalDate?: string;
};

export type ResolvedCollectionScope = RequestedCollectionScope & {
  organizationId: string;
};

export type OffsetCollectionWindow = {
  mode: "offset";
  page: number;
  pageSize: number;
};

export type CursorCollectionWindow = {
  mode: "cursor";
  after?: string;
  before?: string;
  limit: number;
};

export type WorkingSetCollectionWindow = {
  mode: "working-set";
  boundary: string;
};

export type CollectionWindow =
  | OffsetCollectionWindow
  | CursorCollectionWindow
  | WorkingSetCollectionWindow;

export type CollectionWindowResult = {
  mode: CollectionWindow["mode"];
  page?: number;
  pageSize?: number;
  nextCursor?: string;
  previousCursor?: string;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type CollectionCompleteness = "complete" | "partial" | "stale";

export type CollectionResult<Row> = {
  rows: Row[];
  scope: ResolvedCollectionScope;
  window: CollectionWindowResult;
  count: CollectionCount;
  snapshot: string;
  asOf: string;
  completeness: CollectionCompleteness;
};

export type ExplicitCollectionSelection = {
  mode: "ids";
  ids: string[];
};

export type AllMatchingCollectionSelection = {
  mode: "all-matching";
  queryToken: string;
  snapshot: string;
  excludedIds: string[];
};

export type CollectionSelection =
  | ExplicitCollectionSelection
  | AllMatchingCollectionSelection;

export type CollectionOperationResult = {
  operationId: string;
  state: "accepted" | "partial" | "rejected";
  succeeded: number;
  failed: number;
  skipped: number;
  denied: number;
  stale: number;
};

export type CollectionWindowPolicy = {
  defaultPageSize: number;
  maxPageSize: number;
};

export type NormalizedOffsetWindow = OffsetCollectionWindow & {
  wasAdjusted: boolean;
};

export type NormalizedCursorWindow = CursorCollectionWindow & {
  wasAdjusted: boolean;
};

export type CollectionContractValidation =
  | { valid: true }
  | { valid: false; reason: string };

function positiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value);
  }
  return null;
}

function normalizePolicy(policy: CollectionWindowPolicy) {
  const maxPageSize = positiveInteger(policy.maxPageSize);
  const defaultPageSize = positiveInteger(policy.defaultPageSize);

  if (!maxPageSize || maxPageSize < 1) {
    throw new Error("Collection maxPageSize must be a positive integer");
  }
  if (!defaultPageSize || defaultPageSize < 1 || defaultPageSize > maxPageSize) {
    throw new Error("Collection defaultPageSize must be within the allowed maximum");
  }

  return { defaultPageSize, maxPageSize };
}

export function normalizeOffsetWindow(
  input: { page?: unknown; pageSize?: unknown },
  policy: CollectionWindowPolicy,
): NormalizedOffsetWindow {
  const normalizedPolicy = normalizePolicy(policy);
  const requestedPage = positiveInteger(input.page);
  const requestedPageSize = positiveInteger(input.pageSize);
  const page = requestedPage && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Math.min(
    requestedPageSize && requestedPageSize > 0
      ? requestedPageSize
      : normalizedPolicy.defaultPageSize,
    normalizedPolicy.maxPageSize,
  );

  return {
    mode: "offset",
    page,
    pageSize,
    wasAdjusted: requestedPage !== page || requestedPageSize !== pageSize,
  };
}

export function normalizeCursorWindow(
  input: { after?: unknown; before?: unknown; limit?: unknown },
  policy: CollectionWindowPolicy,
): NormalizedCursorWindow {
  const normalizedPolicy = normalizePolicy(policy);
  const requestedLimit = positiveInteger(input.limit);
  const limit = Math.min(
    requestedLimit && requestedLimit > 0
      ? requestedLimit
      : normalizedPolicy.defaultPageSize,
    normalizedPolicy.maxPageSize,
  );
  const after = typeof input.after === "string" && input.after.trim()
    ? input.after.trim()
    : undefined;
  const before = typeof input.before === "string" && input.before.trim()
    ? input.before.trim()
    : undefined;

  if (after && before) {
    throw new Error("Collection cursor window cannot request after and before together");
  }

  return {
    mode: "cursor",
    ...(after ? { after } : {}),
    ...(before ? { before } : {}),
    limit,
    wasAdjusted:
      requestedLimit !== limit ||
      (typeof input.after === "string" && input.after !== after) ||
      (typeof input.before === "string" && input.before !== before),
  };
}

export function uniqueCollectionIds(ids: readonly string[]) {
  const unique = new Set<string>();
  for (const id of ids) {
    const normalized = id.trim();
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique);
}

export function validateCollectionSelection(
  selection: CollectionSelection,
  options: { maxExplicitIds: number; maxExcludedIds: number },
): CollectionContractValidation {
  const maxExplicitIds = positiveInteger(options.maxExplicitIds);
  const maxExcludedIds = positiveInteger(options.maxExcludedIds);
  if (!maxExplicitIds || !maxExcludedIds) {
    throw new Error("Collection selection limits must be positive integers");
  }

  if (selection.mode === "ids") {
    const ids = uniqueCollectionIds(selection.ids);
    if (ids.length === 0) return { valid: false, reason: "Select at least one record" };
    if (ids.length !== selection.ids.length) {
      return { valid: false, reason: "Explicit selection IDs must be unique and non-empty" };
    }
    if (ids.length > maxExplicitIds) {
      return {
        valid: false,
        reason: `Explicit selection exceeds the ${maxExplicitIds}-record request limit`,
      };
    }
    return { valid: true };
  }

  if (!selection.queryToken.trim() || !selection.snapshot.trim()) {
    return {
      valid: false,
      reason: "All-matching selection requires a query token and snapshot",
    };
  }

  const excludedIds = uniqueCollectionIds(selection.excludedIds);
  if (excludedIds.length !== selection.excludedIds.length) {
    return { valid: false, reason: "Excluded IDs must be unique and non-empty" };
  }
  if (excludedIds.length > maxExcludedIds) {
    return {
      valid: false,
      reason: `All-matching exclusions exceed the ${maxExcludedIds}-record request limit`,
    };
  }
  return { valid: true };
}

export function validateCollectionCount(count: CollectionCount): CollectionContractValidation {
  if (count.kind === "unknown") return { valid: true };
  if (!Number.isSafeInteger(count.value) || count.value < 0) {
    return { valid: false, reason: "Collection count must be a non-negative safe integer" };
  }
  return { valid: true };
}

export function validateCollectionOperationResult(
  result: CollectionOperationResult,
): CollectionContractValidation {
  if (!result.operationId.trim()) {
    return { valid: false, reason: "Collection operation requires an operation ID" };
  }

  const counts = [
    result.succeeded,
    result.failed,
    result.skipped,
    result.denied,
    result.stale,
  ];
  if (counts.some((count) => !Number.isSafeInteger(count) || count < 0)) {
    return { valid: false, reason: "Collection operation counts must be non-negative integers" };
  }

  const affected = counts.reduce((sum, count) => sum + count, 0);
  if (affected === 0) {
    return { valid: false, reason: "Collection operation result must account for at least one target" };
  }
  if (result.state === "accepted" && counts.slice(1).some((count) => count > 0)) {
    return { valid: false, reason: "Accepted collection operations cannot contain unresolved targets" };
  }
  if (result.state === "rejected" && result.succeeded > 0) {
    return { valid: false, reason: "Rejected collection operations cannot contain successes" };
  }
  return { valid: true };
}
