import { readFileSync, readdirSync } from "node:fs";
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

const repositoryRoot = resolve(process.cwd());
const sourceRoot = resolve(repositoryRoot, "src");
const schemaPath = resolve(repositoryRoot, "prisma/schema.prisma");
const packagePath = resolve(repositoryRoot, "package.json");
const summaryOnly = process.argv.includes("--summary");

const excludedRuntimeSegments = [
  "/src/generated/",
  "/src/scripts/",
  "/src/app/design-lab/",
];

const patterns: PatternDefinition[] = [
  {
    id: "utc-date-truncation",
    expression: /toISOString\(\)\.(?:slice\(0,\s*10\)|split\(["']T["']\)\[0\])/g,
    risk: "critical",
  },
  {
    id: "utc-today-default",
    expression: /new Date\(\)\.toISOString\(\)\.(?:slice\(0,\s*10\)|split\(["']T["']\)\[0\])/g,
    risk: "critical",
  },
  {
    id: "hard-coded-en-us",
    expression: /["']en-US["']/g,
    risk: "high",
  },
  {
    id: "hard-coded-en-gb",
    expression: /["']en-GB["']/g,
    risk: "high",
  },
  {
    id: "locale-date-call",
    expression: /toLocaleDateString\s*\(/g,
    risk: "medium",
  },
  {
    id: "locale-time-call",
    expression: /toLocaleTimeString\s*\(/g,
    risk: "medium",
  },
  {
    id: "locale-string-call",
    expression: /toLocaleString\s*\(/g,
    risk: "medium",
  },
  {
    id: "intl-date-formatter",
    expression: /Intl\.DateTimeFormat\s*\(/g,
    risk: "inventory",
  },
  {
    id: "intl-number-formatter",
    expression: /Intl\.NumberFormat\s*\(/g,
    risk: "inventory",
  },
  {
    id: "date-fns-format",
    expression: /\bformat\s*\(/g,
    risk: "medium",
  },
  {
    id: "locale-compare",
    expression: /\.localeCompare\s*\(/g,
    risk: "medium",
  },
  {
    id: "explicit-rtl",
    expression: /dir\s*=\s*["']rtl["']/g,
    risk: "inventory",
  },
  {
    id: "usd-token",
    expression: /["']USD["']/g,
    risk: "high",
  },
  {
    id: "lbp-token",
    expression: /["']LBP["']/g,
    risk: "high",
  },
  {
    id: "eur-token",
    expression: /["']EUR["']/g,
    risk: "inventory",
  },
];

function walk(directory: string): string[] {
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

const files = walk(sourceRoot).filter(runtimeFile);
const fileResults: FileResult[] = [];
const patternResults = new Map<string, PatternResult>(
  patterns.map((pattern) => [pattern.id, { ...pattern, occurrences: 0, files: [] }]),
);

let arabicCodepoints = 0;
const filesWithArabic: string[] = [];

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

  const fileArabicCodepoints = Array.from(contents.matchAll(/[\u0600-\u06ff]/g)).length;
  if (fileArabicCodepoints > 0) {
    arabicCodepoints += fileArabicCodepoints;
    filesWithArabic.push(filePath);
  }

  if (fileOccurrences > 0) {
    fileResults.push({ file: filePath, occurrences: fileOccurrences, patterns: filePatterns });
  }
}

const schema = readFileSync(schemaPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
const internationalizationDependencies = Object.keys(dependencies).filter((dependency) =>
  /^(next-intl|i18next|react-i18next|react-intl|@formatjs|@lingui|date-fns-tz|luxon|moment-timezone)$/.test(dependency),
);

const report = {
  generatedAt: new Date().toISOString(),
  scope: {
    sourceRoot: relative(repositoryRoot, sourceRoot),
    includedFiles: files.length,
    excludedSegments: excludedRuntimeSegments.map((segment) => segment.replace(/^\//, "")),
  },
  patterns: Array.from(patternResults.values()).map(({ expression: _expression, ...result }) => result),
  writingSystems: {
    arabicCodepoints,
    filesWithArabic: filesWithArabic.sort(),
    explicitRtlOccurrences: patternResults.get("explicit-rtl")?.occurrences ?? 0,
  },
  schema: {
    organizationHasLocaleField: /model Organization\s*\{[\s\S]*?\n\}/.exec(schema)?.[0].match(/\blocale\b/) !== null,
    organizationHasTimeZoneField: /model Organization\s*\{[\s\S]*?\n\}/.exec(schema)?.[0].match(/\btimeZone\b|\btimezone\b/i) !== null,
    branchHasLocaleField: /model Branch\s*\{[\s\S]*?\n\}/.exec(schema)?.[0].match(/\blocale\b/) !== null,
    branchHasTimeZoneField: /model Branch\s*\{[\s\S]*?\n\}/.exec(schema)?.[0].match(/\btimeZone\b|\btimezone\b/i) !== null,
    userHasLocaleField: /model User\s*\{[\s\S]*?\n\}/.exec(schema)?.[0].match(/\blocale\b/) !== null,
    userHasTimeZoneField: /model User\s*\{[\s\S]*?\n\}/.exec(schema)?.[0].match(/\btimeZone\b|\btimezone\b/i) !== null,
    paymentDefaultCurrency: /model Payment\s*\{[\s\S]*?currency\s+String\s+@default\(["']([^"']+)["']\)/.exec(schema)?.[1] ?? null,
    branchComplianceDefaultCountry: /model BranchCompliance\s*\{[\s\S]*?country\s+String\?\s+@default\(["']([^"']+)["']\)/.exec(schema)?.[1] ?? null,
  },
  dependencies: {
    internationalizationDependencies,
  },
  hotspots: fileResults
    .sort((left, right) => right.occurrences - left.occurrences || left.file.localeCompare(right.file))
    .slice(0, 30),
};

const output = summaryOnly
  ? {
      generatedAt: report.generatedAt,
      scope: report.scope,
      counts: Object.fromEntries(report.patterns.map((pattern) => [pattern.id, pattern.occurrences])),
      writingSystems: {
        arabicCodepoints: report.writingSystems.arabicCodepoints,
        filesWithArabic: report.writingSystems.filesWithArabic.length,
        explicitRtlOccurrences: report.writingSystems.explicitRtlOccurrences,
      },
      schema: report.schema,
      dependencies: report.dependencies,
      hotspots: report.hotspots.slice(0, 10).map(({ file, occurrences }) => ({ file, occurrences })),
    }
  : report;

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
