import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import ts from "typescript";

type AssetMetric = {
  file: string;
  rawBytes: number;
  gzipBytes: number;
};

type SourceMetric = {
  file: string;
  bytes: number;
  lines: number;
  useClient: boolean;
  isPage: boolean;
  isLoading: boolean;
  awaitCount: number;
  promiseAllCount: number;
  suspenseCount: number;
  dynamicImportCount: number;
  findManyCount: number;
  unboundedFindManyCount: number;
  importedPackages: string[];
};

type QueryFinding = {
  file: string;
  line: number;
  query: string;
  hasTake: boolean;
  hasCursor: boolean;
  hasSkip: boolean;
};

const repositoryRoot = resolve(process.cwd());
const sourceRoot = resolve(repositoryRoot, "src");
const appRoot = resolve(sourceRoot, "app");
const buildRoot = resolve(repositoryRoot, ".next");
const staticRoot = resolve(buildRoot, "static");
const publicRoot = resolve(repositoryRoot, "public");
const summaryOnly = process.argv.includes("--summary");

const excludedRuntimeSegments = [
  "/src/generated/",
  "/src/scripts/",
  "/src/app/design-lab/",
];

const watchedPackages = [
  "recharts",
  "@react-pdf/renderer",
  "@tanstack/react-table",
  "motion/react",
  "react-hook-form",
  "zod",
  "lucide-react",
  "radix-ui",
];

function walk(directory: string, extensions?: Set<string>): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path, extensions);
    if (!extensions || extensions.has(extname(entry.name))) return [path];
    return [];
  });
}

function runtimeFile(path: string) {
  const normalized = path.replaceAll("\\", "/");
  return !excludedRuntimeSegments.some((segment) => normalized.includes(segment));
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function hasProperty(object: ts.ObjectLiteralExpression, propertyName: string) {
  return object.properties.some((property) => {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      return false;
    }
    return property.name?.getText().replaceAll(/["']/g, "") === propertyName;
  });
}

function nearestLoadingBoundary(pagePath: string) {
  let current = dirname(pagePath);
  while (current.startsWith(appRoot)) {
    const boundary = [resolve(current, "loading.tsx"), resolve(current, "loading.ts")]
      .find((candidate) => existsSync(candidate));
    if (boundary) return relative(repositoryRoot, boundary);
    if (current === appRoot) break;
    current = dirname(current);
  }
  return null;
}

function packageName(specifier: string) {
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

const sourceFiles = walk(sourceRoot, new Set([".ts", ".tsx", ".css"]))
  .filter(runtimeFile)
  .filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));
const sourceMetrics: SourceMetric[] = [];
const queryFindings: QueryFinding[] = [];
const packageFiles = new Map<string, Set<string>>(
  watchedPackages.map((packageNameValue) => [packageNameValue, new Set<string>()]),
);

let nativeImageCount = 0;
let nextImageCount = 0;
let useEffectCount = 0;
let suspenseCount = 0;
let dynamicImportCount = 0;
let promiseAllCount = 0;

for (const file of sourceFiles) {
  const contents = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const importedPackages = new Set<string>();
  const useClient = /^\s*["']use client["'];?/m.test(contents);
  const normalized = file.replaceAll("\\", "/");
  const isPage = /\/page\.tsx?$/.test(normalized);
  const isLoading = /\/loading\.tsx?$/.test(normalized);
  let fileAwaitCount = 0;
  let filePromiseAllCount = 0;
  let fileSuspenseCount = 0;
  let fileDynamicImportCount = 0;
  let fileFindManyCount = 0;
  let fileUnboundedFindManyCount = 0;
  let importsNextImage = false;

  function inspect(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      const importedPackage = packageName(specifier);
      importedPackages.add(importedPackage);
      if (specifier === "next/image") importsNextImage = true;

      for (const watchedPackage of watchedPackages) {
        if (specifier === watchedPackage || specifier.startsWith(`${watchedPackage}/`)) {
          packageFiles.get(watchedPackage)?.add(relative(repositoryRoot, file));
        }
      }
    }

    if (ts.isAwaitExpression(node)) fileAwaitCount += 1;

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(sourceFile) === "Promise" &&
      node.expression.name.text === "all"
    ) {
      filePromiseAllCount += 1;
      promiseAllCount += 1;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "useEffect"
    ) {
      useEffectCount += 1;
    }

    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      fileDynamicImportCount += 1;
      dynamicImportCount += 1;
    }

    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(sourceFile) === "Suspense"
    ) {
      fileSuspenseCount += 1;
      suspenseCount += 1;
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      if (tag === "img") nativeImageCount += 1;
      if (tag === "Image" && importsNextImage) nextImageCount += 1;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "findMany"
    ) {
      fileFindManyCount += 1;
      const argument = node.arguments[0];
      const object = argument && ts.isObjectLiteralExpression(argument) ? argument : null;
      const hasTake = object ? hasProperty(object, "take") : false;
      const hasCursor = object ? hasProperty(object, "cursor") : false;
      const hasSkip = object ? hasProperty(object, "skip") : false;

      if (!hasTake) fileUnboundedFindManyCount += 1;
      queryFindings.push({
        file: relative(repositoryRoot, file),
        line: lineOf(sourceFile, node),
        query: node.expression.expression.getText(sourceFile),
        hasTake,
        hasCursor,
        hasSkip,
      });
    }

    node.forEachChild(inspect);
  }

  inspect(sourceFile);
  sourceMetrics.push({
    file: relative(repositoryRoot, file),
    bytes: Buffer.byteLength(contents),
    lines: contents.split(/\r?\n/).length,
    useClient,
    isPage,
    isLoading,
    awaitCount: fileAwaitCount,
    promiseAllCount: filePromiseAllCount,
    suspenseCount: fileSuspenseCount,
    dynamicImportCount: fileDynamicImportCount,
    findManyCount: fileFindManyCount,
    unboundedFindManyCount: fileUnboundedFindManyCount,
    importedPackages: Array.from(importedPackages).sort(),
  });
}

function assetMetrics(root: string, extensions: Set<string>): AssetMetric[] {
  return walk(root, extensions).map((file) => {
    const bytes = readFileSync(file);
    return {
      file: relative(repositoryRoot, file),
      rawBytes: bytes.length,
      gzipBytes: gzipSync(bytes).length,
    };
  });
}

function assetSummary(assets: AssetMetric[]) {
  return {
    files: assets.length,
    rawBytes: assets.reduce((sum, asset) => sum + asset.rawBytes, 0),
    gzipBytes: assets.reduce((sum, asset) => sum + asset.gzipBytes, 0),
    largest: [...assets]
      .sort(
        (left, right) =>
          right.gzipBytes - left.gzipBytes || left.file.localeCompare(right.file),
      )
      .slice(0, 20),
  };
}

const jsAssets = assetMetrics(resolve(staticRoot, "chunks"), new Set([".js"]));
const appJsAssets = jsAssets.filter((asset) => asset.file.includes(".next/static/chunks/app/"));
const sharedJsAssets = jsAssets.filter(
  (asset) => !asset.file.includes(".next/static/chunks/app/"),
);
const cssAssets = assetMetrics(staticRoot, new Set([".css"]));
const fontAssets = assetMetrics(resolve(staticRoot, "media"), new Set([".woff", ".woff2"]));
const publicAssets = assetMetrics(
  publicRoot,
  new Set([".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".json"]),
);

const pages = sourceMetrics.filter((metric) => metric.isPage);
const loadingFiles = sourceMetrics.filter((metric) => metric.isLoading);
const pageBoundaries = pages.map((page) => ({
  file: page.file,
  boundary: nearestLoadingBoundary(resolve(repositoryRoot, page.file)),
}));
const potentialPageWaterfalls = pages
  .filter(
    (metric) =>
      !metric.useClient && metric.awaitCount >= 3 && metric.promiseAllCount === 0,
  )
  .sort(
    (left, right) =>
      right.awaitCount - left.awaitCount || left.file.localeCompare(right.file),
  );
const unboundedQueries = queryFindings.filter((finding) => !finding.hasTake);
const buildIdPath = resolve(buildRoot, "BUILD_ID");

const report = {
  generatedAt: new Date().toISOString(),
  scope: {
    sourceRoot: relative(repositoryRoot, sourceRoot),
    sourceFiles: sourceFiles.length,
    pageFiles: pages.length,
    buildAvailable: existsSync(buildIdPath),
    buildId: existsSync(buildIdPath) ? readFileSync(buildIdPath, "utf8").trim() : null,
    excludedSegments: excludedRuntimeSegments.map((segment) => segment.replace(/^\//, "")),
  },
  source: {
    clientFiles: sourceMetrics.filter((metric) => metric.useClient).length,
    clientPages: pages.filter((metric) => metric.useClient).length,
    loadingFiles: loadingFiles.length,
    pagesWithInheritedLoadingBoundary: pageBoundaries.filter(({ boundary }) => boundary).length,
    suspenseCount,
    dynamicImportCount,
    promiseAllCount,
    useEffectCount,
    nativeImageCount,
    nextImageCount,
    findManyCalls: queryFindings.length,
    unboundedFindManyCalls: unboundedQueries.length,
    cursorFindManyCalls: queryFindings.filter(({ hasCursor }) => hasCursor).length,
    packageFileCounts: Object.fromEntries(
      watchedPackages.map((watchedPackage) => [
        watchedPackage,
        packageFiles.get(watchedPackage)?.size ?? 0,
      ]),
    ),
    largestClientFiles: sourceMetrics
      .filter((metric) => metric.useClient)
      .sort((left, right) => right.bytes - left.bytes || left.file.localeCompare(right.file))
      .slice(0, 25),
    largestPageFiles: pages
      .sort((left, right) => right.bytes - left.bytes || left.file.localeCompare(right.file))
      .slice(0, 25),
    potentialPageWaterfalls: potentialPageWaterfalls.slice(0, 30),
    unboundedQueryHotspots: sourceMetrics
      .filter((metric) => metric.unboundedFindManyCount > 0)
      .sort(
        (left, right) =>
          right.unboundedFindManyCount - left.unboundedFindManyCount ||
          left.file.localeCompare(right.file),
      )
      .slice(0, 30),
    unboundedQueries: unboundedQueries.slice(0, 100),
  },
  build: {
    javascript: assetSummary(jsAssets),
    appJavascript: assetSummary(appJsAssets),
    sharedJavascript: assetSummary(sharedJsAssets),
    css: assetSummary(cssAssets),
    fonts: assetSummary(fontAssets),
    publicAssets: assetSummary(publicAssets),
  },
};

const output = summaryOnly
  ? {
      generatedAt: report.generatedAt,
      scope: report.scope,
      source: {
        clientFiles: report.source.clientFiles,
        clientPages: report.source.clientPages,
        loadingFiles: report.source.loadingFiles,
        pagesWithInheritedLoadingBoundary: report.source.pagesWithInheritedLoadingBoundary,
        suspenseCount: report.source.suspenseCount,
        dynamicImportCount: report.source.dynamicImportCount,
        promiseAllCount: report.source.promiseAllCount,
        useEffectCount: report.source.useEffectCount,
        nativeImageCount: report.source.nativeImageCount,
        nextImageCount: report.source.nextImageCount,
        findManyCalls: report.source.findManyCalls,
        unboundedFindManyCalls: report.source.unboundedFindManyCalls,
        cursorFindManyCalls: report.source.cursorFindManyCalls,
        packageFileCounts: report.source.packageFileCounts,
        largestClientFiles: report.source.largestClientFiles.slice(0, 10).map(
          ({ file, bytes, lines }) => ({ file, bytes, lines }),
        ),
        potentialPageWaterfalls: report.source.potentialPageWaterfalls
          .slice(0, 10)
          .map(({ file, awaitCount }) => ({ file, awaitCount })),
        unboundedQueryHotspots: report.source.unboundedQueryHotspots
          .slice(0, 10)
          .map(({ file, unboundedFindManyCount }) => ({
            file,
            unboundedFindManyCount,
          })),
      },
      build: {
        javascript: {
          files: report.build.javascript.files,
          rawBytes: report.build.javascript.rawBytes,
          gzipBytes: report.build.javascript.gzipBytes,
          largest: report.build.javascript.largest.slice(0, 10),
        },
        appJavascript: {
          files: report.build.appJavascript.files,
          rawBytes: report.build.appJavascript.rawBytes,
          gzipBytes: report.build.appJavascript.gzipBytes,
        },
        sharedJavascript: {
          files: report.build.sharedJavascript.files,
          rawBytes: report.build.sharedJavascript.rawBytes,
          gzipBytes: report.build.sharedJavascript.gzipBytes,
        },
        css: report.build.css,
        fonts: report.build.fonts,
        publicAssets: {
          files: report.build.publicAssets.files,
          rawBytes: report.build.publicAssets.rawBytes,
          gzipBytes: report.build.publicAssets.gzipBytes,
          largest: report.build.publicAssets.largest.slice(0, 10),
        },
      },
    }
  : report;

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
