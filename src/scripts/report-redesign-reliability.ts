import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

type PatternDefinition = {
  id: string;
  expression: RegExp;
  risk: "critical" | "high" | "medium" | "inventory";
};

type PatternResult = PatternDefinition & {
  occurrences: number;
  files: string[];
};

type FileResult = {
  file: string;
  occurrences: number;
  patterns: Record<string, number>;
};

type MutationHotspot = {
  file: string;
  mutationCalls: number;
  transactions: number;
};

const repositoryRoot = resolve(process.cwd());
const sourceRoot = resolve(repositoryRoot, "src");
const actionRoot = resolve(sourceRoot, "lib/actions");
const schemaPath = resolve(repositoryRoot, "prisma/schema.prisma");
const serviceWorkerPath = resolve(sourceRoot, "app/sw.ts");
const nextConfigPath = resolve(repositoryRoot, "next.config.ts");
const offlinePagePath = resolve(sourceRoot, "app/offline/page.tsx");
const summaryOnly = process.argv.includes("--summary");

const excludedRuntimeSegments = [
  "/src/generated/",
  "/src/scripts/",
  "/src/app/design-lab/",
];

const patterns: PatternDefinition[] = [
  {
    id: "local-storage-read",
    expression: /(?:window\.)?localStorage\.getItem\s*\(/g,
    risk: "high",
  },
  {
    id: "local-storage-write",
    expression: /(?:window\.)?localStorage\.setItem\s*\(/g,
    risk: "critical",
  },
  {
    id: "local-storage-remove",
    expression: /(?:window\.)?localStorage\.removeItem\s*\(/g,
    risk: "inventory",
  },
  {
    id: "session-storage-access",
    expression: /(?:window\.)?sessionStorage\.(?:getItem|setItem|removeItem)\s*\(/g,
    risk: "inventory",
  },
  {
    id: "indexed-db-access",
    expression: /\bindexedDB\b/g,
    risk: "inventory",
  },
  {
    id: "connectivity-read",
    expression: /navigator\.onLine/g,
    risk: "inventory",
  },
  {
    id: "connectivity-listener",
    expression: /addEventListener\(\s*["'](?:online|offline)["']/g,
    risk: "inventory",
  },
  {
    id: "service-worker-access",
    expression: /navigator\.serviceWorker/g,
    risk: "high",
  },
  {
    id: "background-sync-access",
    expression: /(?:registration\.)?sync\.register\s*\(|addEventListener\(\s*["']sync["']/g,
    risk: "inventory",
  },
  {
    id: "cache-api-access",
    expression: /\bcaches\.(?:open|match|keys|delete)\s*\(/g,
    risk: "high",
  },
  {
    id: "react-optimistic",
    expression: /\buseOptimistic\s*\(/g,
    risk: "inventory",
  },
  {
    id: "react-transition",
    expression: /\b(?:useTransition|startTransition)\s*\(/g,
    risk: "medium",
  },
  {
    id: "retry-language",
    expression: /\b(?:retry|retries|retrying|backoff)\b/gi,
    risk: "inventory",
  },
  {
    id: "idempotency-language",
    expression: /\bidempoten(?:cy|t|tly)\b/gi,
    risk: "inventory",
  },
  {
    id: "prisma-transaction",
    expression: /\bdb\.\$transaction\s*\(/g,
    risk: "inventory",
  },
  {
    id: "revalidate-path",
    expression: /\brevalidatePath\s*\(/g,
    risk: "inventory",
  },
];

const mutationExpression =
  /\b(?:db|tx)\.[A-Za-z0-9_]+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(|\bmodel\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g;
const transactionExpression = /\bdb\.\$transaction\s*\(/g;

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function runtimeFile(path: string) {
  const normalized = path.replaceAll("\\", "/");
  return !excludedRuntimeSegments.some((segment) => normalized.includes(segment));
}

function countMatches(contents: string, expression: RegExp) {
  return Array.from(contents.matchAll(new RegExp(expression.source, expression.flags))).length;
}

function fileContents(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const files = walk(sourceRoot).filter(runtimeFile);
const fileResults: FileResult[] = [];
const patternResults = new Map<string, PatternResult>(
  patterns.map((pattern) => [pattern.id, { ...pattern, occurrences: 0, files: [] }]),
);

for (const file of files) {
  const contents = readFileSync(file, "utf8");
  const filePath = relative(repositoryRoot, file);
  const filePatterns: Record<string, number> = {};
  let fileOccurrences = 0;

  for (const pattern of patterns) {
    const occurrences = countMatches(contents, pattern.expression);
    if (occurrences === 0) continue;

    filePatterns[pattern.id] = occurrences;
    fileOccurrences += occurrences;
    const result = patternResults.get(pattern.id);
    if (!result) continue;
    result.occurrences += occurrences;
    result.files.push(filePath);
  }

  if (fileOccurrences > 0) {
    fileResults.push({ file: filePath, occurrences: fileOccurrences, patterns: filePatterns });
  }
}

const actionFiles = walk(actionRoot);
const mutationHotspots: MutationHotspot[] = actionFiles
  .map((file) => {
    const contents = readFileSync(file, "utf8");
    return {
      file: relative(repositoryRoot, file),
      mutationCalls: countMatches(contents, mutationExpression),
      transactions: countMatches(contents, transactionExpression),
    };
  })
  .filter(({ mutationCalls }) => mutationCalls > 0)
  .sort(
    (left, right) =>
      right.mutationCalls - left.mutationCalls || left.file.localeCompare(right.file),
  );

const schema = fileContents(schemaPath);
const serviceWorker = fileContents(serviceWorkerPath);
const nextConfig = fileContents(nextConfigPath);
const offlinePage = fileContents(offlinePagePath);
const childForm = fileContents(resolve(sourceRoot, "components/children/child-form.tsx"));
const parentPortal = fileContents(
  resolve(sourceRoot, "app/(parent)/parent/parent-portal-client.tsx"),
);
const parentLogin = fileContents(
  resolve(sourceRoot, "app/(parent)/parent/login/parent-login-client.tsx"),
);
const parentSurface = `${parentLogin}\n${parentPortal}`;
const header = fileContents(resolve(sourceRoot, "components/layout/header.tsx"));

const report = {
  generatedAt: new Date().toISOString(),
  scope: {
    sourceRoot: relative(repositoryRoot, sourceRoot),
    includedFiles: files.length,
    actionFiles: actionFiles.length,
    excludedSegments: excludedRuntimeSegments.map((segment) => segment.replace(/^\//, "")),
  },
  patterns: Array.from(patternResults.values()).map(
    ({ expression: _expression, ...result }) => result,
  ),
  offlineSurface: {
    serviceWorkerExists: serviceWorker.length > 0,
    usesSerwistDefaultCache: /runtimeCaching:\s*defaultCache/.test(serviceWorker),
    serviceWorkerClaimsClients: /clientsClaim:\s*true/.test(serviceWorker),
    serviceWorkerSkipsWaiting: /skipWaiting:\s*true/.test(serviceWorker),
    rootScopeRegistration:
      /serviceWorker\.register\(\s*["']\/sw\.js["']\s*,\s*\{\s*scope:\s*["']\/["']/.test(
        parentPortal,
      ),
    productionOnlyWorker: /disable:\s*process\.env\.NODE_ENV\s*===\s*["']development["']/.test(
      nextConfig,
    ),
    offlineFallbackExists: offlinePage.length > 0,
    offlineFallbackUsesGenericAvailabilityCopy: /Some features may\s+not be available/i.test(
      offlinePage,
    ),
  },
  sensitiveBrowserStorage: {
    childEnrollmentDraftPersistsLocally:
      /DRAFT_STORAGE_KEY\s*=\s*["']child-enrollment-draft["']/.test(childForm) &&
      /localStorage\.setItem\(DRAFT_STORAGE_KEY/.test(childForm),
    childEnrollmentDraftClearedOnStaffLogout:
      /signOut[\s\S]*child-enrollment-draft|child-enrollment-draft[\s\S]*signOut/.test(header),
    parentBearerTokenPersistsLocally:
      /TOKEN_KEY\s*=\s*["']kiddzonline_parent_token["']/.test(parentSurface) &&
      /localStorage\.setItem\(TOKEN_KEY/.test(parentSurface),
    parentTokenRemovedByParentLogout:
      /localStorage\.removeItem\(TOKEN_KEY/.test(parentSurface),
  },
  mutationSafety: {
    mutationActionFiles: mutationHotspots.length,
    transactionCalls: mutationHotspots.reduce(
      (total, hotspot) => total + hotspot.transactions,
      0,
    ),
    actionFilesWithMultipleWrites: mutationHotspots.filter(
      ({ mutationCalls }) => mutationCalls >= 2,
    ).length,
    multiWriteActionFilesWithoutTransaction: mutationHotspots.filter(
      ({ mutationCalls, transactions }) => mutationCalls >= 2 && transactions === 0,
    ).length,
    schemaHasVersionField: /^\s*version\s+/m.test(schema),
    schemaHasIdempotencyModel:
      /model\s+(?:Idempotency|IdempotencyKey|OperationRequest|MutationRequest)\b/.test(schema),
    hotspots: mutationHotspots.slice(0, 30),
    multiWriteWithoutTransaction: mutationHotspots
      .filter(({ mutationCalls, transactions }) => mutationCalls >= 2 && transactions === 0)
      .slice(0, 30),
  },
  hotspots: fileResults
    .sort(
      (left, right) =>
        right.occurrences - left.occurrences || left.file.localeCompare(right.file),
    )
    .slice(0, 30),
};

const output = summaryOnly
  ? {
      generatedAt: report.generatedAt,
      scope: report.scope,
      counts: Object.fromEntries(
        report.patterns.map((pattern) => [pattern.id, pattern.occurrences]),
      ),
      offlineSurface: report.offlineSurface,
      sensitiveBrowserStorage: report.sensitiveBrowserStorage,
      mutationSafety: {
        mutationActionFiles: report.mutationSafety.mutationActionFiles,
        transactionCalls: report.mutationSafety.transactionCalls,
        actionFilesWithMultipleWrites: report.mutationSafety.actionFilesWithMultipleWrites,
        multiWriteActionFilesWithoutTransaction:
          report.mutationSafety.multiWriteActionFilesWithoutTransaction,
        schemaHasVersionField: report.mutationSafety.schemaHasVersionField,
        schemaHasIdempotencyModel: report.mutationSafety.schemaHasIdempotencyModel,
        topMultiWriteWithoutTransaction:
          report.mutationSafety.multiWriteWithoutTransaction.slice(0, 10),
      },
      hotspots: report.hotspots.slice(0, 10).map(({ file, occurrences }) => ({
        file,
        occurrences,
      })),
    }
  : report;

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
