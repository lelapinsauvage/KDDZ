import assert from "node:assert/strict";
import {
  normalizeCursorWindow,
  normalizeOffsetWindow,
  uniqueCollectionIds,
  validateCollectionCount,
  validateCollectionOperationResult,
  validateCollectionSelection,
} from "../lib/collection-contracts";

const offset = normalizeOffsetWindow(
  { page: "3", pageSize: "25" },
  { defaultPageSize: 20, maxPageSize: 100 },
);
assert.deepEqual(offset, {
  mode: "offset",
  page: 3,
  pageSize: 25,
  wasAdjusted: false,
});

const boundedOffset = normalizeOffsetWindow(
  { page: -4, pageSize: 500 },
  { defaultPageSize: 20, maxPageSize: 100 },
);
assert.deepEqual(boundedOffset, {
  mode: "offset",
  page: 1,
  pageSize: 100,
  wasAdjusted: true,
});

const cursor = normalizeCursorWindow(
  { after: " next-token ", limit: 200 },
  { defaultPageSize: 25, maxPageSize: 50 },
);
assert.deepEqual(cursor, {
  mode: "cursor",
  after: "next-token",
  limit: 50,
  wasAdjusted: true,
});

assert.throws(
  () =>
    normalizeCursorWindow(
      { after: "next", before: "previous" },
      { defaultPageSize: 25, maxPageSize: 50 },
    ),
  /cannot request after and before together/,
);

assert.deepEqual(uniqueCollectionIds([" a ", "b", "a", "", " b "]), ["a", "b"]);

assert.deepEqual(
  validateCollectionSelection(
    { mode: "ids", ids: ["a", "b"] },
    { maxExplicitIds: 10, maxExcludedIds: 10 },
  ),
  { valid: true },
);
assert.equal(
  validateCollectionSelection(
    { mode: "ids", ids: ["a", "a"] },
    { maxExplicitIds: 10, maxExcludedIds: 10 },
  ).valid,
  false,
);
assert.equal(
  validateCollectionSelection(
    { mode: "all-matching", queryToken: " ", snapshot: "v1", excludedIds: [] },
    { maxExplicitIds: 10, maxExcludedIds: 10 },
  ).valid,
  false,
);
assert.deepEqual(
  validateCollectionSelection(
    {
      mode: "all-matching",
      queryToken: "query-1",
      snapshot: "revision-3",
      excludedIds: ["row-9"],
    },
    { maxExplicitIds: 10, maxExcludedIds: 10 },
  ),
  { valid: true },
);

assert.deepEqual(validateCollectionCount({ kind: "exact", value: 0 }), { valid: true });
assert.equal(validateCollectionCount({ kind: "estimated", value: -1 }).valid, false);
assert.deepEqual(validateCollectionCount({ kind: "unknown" }), { valid: true });

assert.deepEqual(
  validateCollectionOperationResult({
    operationId: "operation-1",
    state: "accepted",
    succeeded: 4,
    failed: 0,
    skipped: 0,
    denied: 0,
    stale: 0,
  }),
  { valid: true },
);
assert.equal(
  validateCollectionOperationResult({
    operationId: "operation-2",
    state: "accepted",
    succeeded: 3,
    failed: 1,
    skipped: 0,
    denied: 0,
    stale: 0,
  }).valid,
  false,
);
assert.deepEqual(
  validateCollectionOperationResult({
    operationId: "operation-3",
    state: "partial",
    succeeded: 3,
    failed: 1,
    skipped: 0,
    denied: 1,
    stale: 0,
  }),
  { valid: true },
);

process.stdout.write("Collection contract verification passed\n");
