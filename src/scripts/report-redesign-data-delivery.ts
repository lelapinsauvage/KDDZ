import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import ts from "typescript";

type FullDatasetCategory =
  | "explicit-export"
  | "form-option-source"
  | "operational-working-set"
  | "interactive-collection"
  | "unclassified";

type FullDatasetRequest = {
  file: string;
  line: number;
  callee: string;
  category: FullDatasetCategory;
};

type ClientPipeline = {
  file: string;
  lines: number;
  filtersInClient: boolean;
  slicesInClient: boolean;
  hasPageSizeState: boolean;
  supportsAllRows: boolean;
};

type FindManyFinding = {
  file: string;
  line: number;
  query: string;
  hasTake: boolean;
  hasCursor: boolean;
  hasSkip: boolean;
};

const repositoryRoot = resolve(process.cwd());
const sourceRoot = resolve(repositoryRoot, "src");
const summaryOnly = process.argv.includes("--summary");
const excludedSegments = [
  "/src/generated/",
  "/src/scripts/",
  "/src/app/design-lab/",
];

const formOptionCallees = new Set([
  "getBranches",
  "getChildren",
  "getClasses",
  "getEmployees",
  "getFoods",
  "getParentUsers",
  "getSchoolYears",
]);

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

function runtimeFile(path: string) {
  const normalized = path.replaceAll("\\", "/");
  return !excludedSegments.some((segment) => normalized.includes(segment));
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function propertyName(property: ts.ObjectLiteralElementLike) {
  if (!property.name) return null;
  return property.name.getText().replaceAll(/["']/g, "");
}

function objectHasProperty(object: ts.ObjectLiteralExpression, name: string) {
  return object.properties.some((property) => propertyName(property) === name);
}

function objectRequestsAll(object: ts.ObjectLiteralExpression) {
  return object.properties.some((property) => {
    if (!ts.isPropertyAssignment(property) || propertyName(property) !== "pageSize") {
      return false;
    }
    return ts.isStringLiteral(property.initializer) && property.initializer.text.toLowerCase() === "all";
  });
}

function calleeName(call: ts.CallExpression, sourceFile: ts.SourceFile) {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) return call.expression.name.text;
  return call.expression.getText(sourceFile);
}

function classifyFullDataset(file: string, callee: string): FullDatasetCategory {
  const normalized = file.replaceAll("\\", "/");
  if (normalized.includes("/settings/export/")) return "explicit-export";

  if (
    formOptionCallees.has(callee) &&
    (/\/(new|edit|compose|batch)\//.test(normalized) || /\/\[[^/]+\]\//.test(normalized))
  ) {
    return "form-option-source";
  }

  if (
    /\/(attendance|calendar|heatmap|today|batch)\//.test(normalized) ||
    normalized.includes("/employees/staff/")
  ) {
    return "operational-working-set";
  }

  if (/\/page\.tsx?$/.test(normalized)) return "interactive-collection";
  return "unclassified";
}

const sourceFiles = walk(sourceRoot).filter(runtimeFile);
const fullDatasetRequests: FullDatasetRequest[] = [];
const clientPipelines: ClientPipeline[] = [];
const findManyFindings: FindManyFinding[] = [];
const allSupportFiles = new Set<string>();

for (const file of sourceFiles) {
  const contents = readFileSync(file, "utf8");
  const relativeFile = relative(repositoryRoot, file);
  const sourceFile = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const useClient = /^\s*["']use client["'];?/m.test(contents);
  const filtersInClient = useClient && /\.filter\s*\(/.test(contents);
  const slicesInClient = useClient && /\.slice\s*\(/.test(contents);
  const hasPageSizeState = useClient && /\bpageSize\b/.test(contents);
  const supportsAllRows = useClient && /pageSize\s*===\s*["'](?:all|ALL)["']/.test(contents);

  if (filtersInClient && hasPageSizeState) {
    clientPipelines.push({
      file: relativeFile,
      lines: contents.split(/\r?\n/).length,
      filtersInClient,
      slicesInClient,
      hasPageSizeState,
      supportsAllRows,
    });
  }

  function inspect(node: ts.Node) {
    if (
      ts.isBinaryExpression(node) &&
      [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken]
        .includes(node.operatorToken.kind) &&
      (node.left.getText(sourceFile).includes("pageSize") ||
        node.right.getText(sourceFile).includes("pageSize")) &&
      [node.left, node.right].some(
        (side) => ts.isStringLiteral(side) && side.text.toLowerCase() === "all",
      )
    ) {
      allSupportFiles.add(relativeFile);
    }

    if (ts.isCallExpression(node)) {
      const callee = calleeName(node, sourceFile);
      for (const argument of node.arguments) {
        if (!ts.isObjectLiteralExpression(argument) || !objectRequestsAll(argument)) {
          continue;
        }
        fullDatasetRequests.push({
          file: relativeFile,
          line: lineOf(sourceFile, node),
          callee,
          category: classifyFullDataset(relativeFile, callee),
        });
      }

      if (
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "findMany"
      ) {
        const argument = node.arguments[0];
        const object = argument && ts.isObjectLiteralExpression(argument) ? argument : null;
        findManyFindings.push({
          file: relativeFile,
          line: lineOf(sourceFile, node),
          query: node.expression.expression.getText(sourceFile),
          hasTake: object ? objectHasProperty(object, "take") : false,
          hasCursor: object ? objectHasProperty(object, "cursor") : false,
          hasSkip: object ? objectHasProperty(object, "skip") : false,
        });
      }
    }

    node.forEachChild(inspect);
  }

  inspect(sourceFile);
}

function countBy<T extends string>(items: T[]) {
  return Object.fromEntries(
    Array.from(new Set(items))
      .sort()
      .map((item) => [item, items.filter((candidate) => candidate === item).length]),
  );
}

const unboundedFindMany = findManyFindings.filter((finding) => !finding.hasTake);
const report = {
  generatedAt: new Date().toISOString(),
  scope: {
    sourceFiles: sourceFiles.length,
    excludedSegments: excludedSegments.map((segment) => segment.replace(/^\//, "")),
  },
  fullDataset: {
    requests: fullDatasetRequests.length,
    files: new Set(fullDatasetRequests.map(({ file }) => file)).size,
    byCategory: countBy(fullDatasetRequests.map(({ category }) => category)),
    byCallee: countBy(fullDatasetRequests.map(({ callee }) => callee)),
    allSupportFiles: allSupportFiles.size,
    findings: fullDatasetRequests.sort(
      (left, right) => left.file.localeCompare(right.file) || left.line - right.line,
    ),
  },
  clientPipelines: {
    candidates: clientPipelines.length,
    allRowsCandidates: clientPipelines.filter(({ supportsAllRows }) => supportsAllRows).length,
    findings: clientPipelines.sort(
      (left, right) => right.lines - left.lines || left.file.localeCompare(right.file),
    ),
  },
  database: {
    findManyCalls: findManyFindings.length,
    withoutTopLevelTake: unboundedFindMany.length,
    cursorCalls: findManyFindings.filter(({ hasCursor }) => hasCursor).length,
    topLevelSkipCalls: findManyFindings.filter(({ hasSkip }) => hasSkip).length,
  },
};

const output = summaryOnly
  ? {
      generatedAt: report.generatedAt,
      scope: report.scope,
      fullDataset: {
        requests: report.fullDataset.requests,
        files: report.fullDataset.files,
        byCategory: report.fullDataset.byCategory,
        byCallee: report.fullDataset.byCallee,
        allSupportFiles: report.fullDataset.allSupportFiles,
        findings: report.fullDataset.findings,
      },
      clientPipelines: report.clientPipelines,
      database: report.database,
    }
  : report;

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
