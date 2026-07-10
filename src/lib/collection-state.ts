import type { CollectionResult } from "./collection-contracts";

export type CollectionPhase = "idle" | "loading" | "ready" | "refreshing" | "failed";

export type CollectionState<Row> = {
  phase: CollectionPhase;
  result: CollectionResult<Row> | null;
  activeRequestId: string | null;
  error: string | null;
  refreshError: string | null;
  isStale: boolean;
};

export type CollectionStateEvent<Row> =
  | { type: "request-started"; requestId: string }
  | { type: "request-succeeded"; requestId: string; result: CollectionResult<Row> }
  | { type: "request-failed"; requestId: string; error: string }
  | { type: "marked-stale" }
  | { type: "reset" };

export function initialCollectionState<Row>(): CollectionState<Row> {
  return {
    phase: "idle",
    result: null,
    activeRequestId: null,
    error: null,
    refreshError: null,
    isStale: false,
  };
}

function requiredText(value: string, label: string) {
  const text = value.trim();
  if (!text) throw new Error(`${label} must not be empty`);
  return text;
}

export function reduceCollectionState<Row>(
  state: CollectionState<Row>,
  event: CollectionStateEvent<Row>,
): CollectionState<Row> {
  switch (event.type) {
    case "request-started": {
      const requestId = requiredText(event.requestId, "Collection request ID");
      return {
        ...state,
        phase: state.result ? "refreshing" : "loading",
        activeRequestId: requestId,
        error: null,
        refreshError: null,
      };
    }

    case "request-succeeded": {
      if (event.requestId !== state.activeRequestId) return state;
      return {
        phase: "ready",
        result: event.result,
        activeRequestId: null,
        error: null,
        refreshError: null,
        isStale: event.result.completeness === "stale",
      };
    }

    case "request-failed": {
      if (event.requestId !== state.activeRequestId) return state;
      const error = requiredText(event.error, "Collection request error");
      if (state.result) {
        return {
          ...state,
          phase: "ready",
          activeRequestId: null,
          error: null,
          refreshError: error,
          isStale: true,
        };
      }
      return {
        phase: "failed",
        result: null,
        activeRequestId: null,
        error,
        refreshError: null,
        isStale: false,
      };
    }

    case "marked-stale":
      return state.result ? { ...state, isStale: true } : state;

    case "reset":
      return initialCollectionState<Row>();
  }
}

export function collectionHasUsableResult<Row>(state: CollectionState<Row>) {
  return state.result !== null && ["ready", "refreshing"].includes(state.phase);
}
