import assert from "node:assert/strict";
import type { CollectionResult } from "../lib/collection-contracts";
import {
  collectionHasUsableResult,
  initialCollectionState,
  reduceCollectionState,
} from "../lib/collection-state";

type Row = { id: string; label: string };

function result(
  rows: Row[],
  completeness: CollectionResult<Row>["completeness"] = "complete",
): CollectionResult<Row> {
  return {
    rows,
    scope: { organizationId: "organization-1", branchId: "branch-1" },
    window: {
      mode: "offset",
      page: 1,
      pageSize: 25,
      hasNext: false,
      hasPrevious: false,
    },
    count: { kind: "exact", value: rows.length },
    snapshot: "snapshot-1",
    asOf: "2026-07-10T15:00:00.000Z",
    completeness,
  };
}

const empty = initialCollectionState<Row>();
assert.deepEqual(empty, {
  phase: "idle",
  result: null,
  activeRequestId: null,
  error: null,
  refreshError: null,
  isStale: false,
});
assert.equal(collectionHasUsableResult(empty), false);

const loading = reduceCollectionState<Row>(empty, {
  type: "request-started",
  requestId: "request-1",
});
assert.equal(loading.phase, "loading");
assert.equal(loading.activeRequestId, "request-1");

const ignoredStaleSuccess = reduceCollectionState(loading, {
  type: "request-succeeded",
  requestId: "request-old",
  result: result([{ id: "old", label: "Old" }]),
});
assert.equal(ignoredStaleSuccess, loading);

const ready = reduceCollectionState<Row>(loading, {
  type: "request-succeeded",
  requestId: "request-1",
  result: result([{ id: "row-1", label: "One" }]),
});
assert.equal(ready.phase, "ready");
assert.equal(ready.result?.rows[0]?.id, "row-1");
assert.equal(collectionHasUsableResult(ready), true);

const refreshing = reduceCollectionState(ready, {
  type: "request-started",
  requestId: "request-2",
});
assert.equal(refreshing.phase, "refreshing");
assert.equal(refreshing.result, ready.result);
assert.equal(collectionHasUsableResult(refreshing), true);

const refreshFailed = reduceCollectionState(refreshing, {
  type: "request-failed",
  requestId: "request-2",
  error: "Network unavailable",
});
assert.equal(refreshFailed.phase, "ready");
assert.equal(refreshFailed.result, ready.result);
assert.equal(refreshFailed.refreshError, "Network unavailable");
assert.equal(refreshFailed.isStale, true);

const staleSuccessLoading = reduceCollectionState<Row>(empty, {
  type: "request-started",
  requestId: "request-3",
});
const staleSuccess = reduceCollectionState(staleSuccessLoading, {
  type: "request-succeeded",
  requestId: "request-3",
  result: result([{ id: "row-2", label: "Two" }], "stale"),
});
assert.equal(staleSuccess.phase, "ready");
assert.equal(staleSuccess.isStale, true);

const initialFailureLoading = reduceCollectionState<Row>(empty, {
  type: "request-started",
  requestId: "request-4",
});
const initialFailure = reduceCollectionState(initialFailureLoading, {
  type: "request-failed",
  requestId: "request-4",
  error: "Access denied",
});
assert.deepEqual(initialFailure, {
  phase: "failed",
  result: null,
  activeRequestId: null,
  error: "Access denied",
  refreshError: null,
  isStale: false,
});

assert.equal(reduceCollectionState(ready, { type: "marked-stale" }).isStale, true);
assert.deepEqual(reduceCollectionState(refreshFailed, { type: "reset" }), empty);
assert.throws(
  () => reduceCollectionState(empty, { type: "request-started", requestId: " " }),
  /must not be empty/,
);

process.stdout.write("Collection state verification passed\n");
