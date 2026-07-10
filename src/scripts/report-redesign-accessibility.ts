import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import ts from "typescript";

type Finding = {
  file: string;
  line: number;
  tag: string;
  detail: string;
};

type FileMetric = {
  file: string;
  findings: number;
};

const repositoryRoot = resolve(process.cwd());
const sourceRoot = resolve(repositoryRoot, "src");
const summaryOnly = process.argv.includes("--summary");
const excludedRuntimeSegments = [
  "/src/generated/",
  "/src/scripts/",
  "/src/app/design-lab/",
];

const findings = {
  unnamedButton: [] as Finding[],
  unlabeledControl: [] as Finding[],
  nonInteractiveClick: [] as Finding[],
  missingImageAlt: [] as Finding[],
  positiveTabIndex: [] as Finding[],
  autoFocus: [] as Finding[],
  undersizedProductTarget: [] as Finding[],
  dragAlternativeReview: [] as Finding[],
};

const counters = {
  tsxFiles: 0,
  pageFiles: 0,
  pageFilesWithoutLocalH1: 0,
  nativeButtons: 0,
  designSystemButtons: 0,
  nativeFormControls: 0,
  dialogs: 0,
  liveRegions: 0,
  errorAssociations: 0,
  hiddenAccessibleText: 0,
  tooltips: 0,
  toastCalls: 0,
  focusOutlineSuppression: 0,
  focusVisibleClasses: 0,
  transitionAllClasses: 0,
  repeatingAnimationClasses: 0,
  reducedMotionClasses: 0,
  reducedMotionMediaQueries: 0,
  draggableInteractions: 0,
};

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx|css)$/.test(entry.name) ? [path] : [];
  });
}

function runtimeFile(path: string) {
  const normalized = path.replaceAll("\\", "/");
  return !excludedRuntimeSegments.some((segment) => normalized.includes(segment));
}

function countMatches(contents: string, expression: RegExp) {
  return Array.from(contents.matchAll(new RegExp(expression.source, expression.flags))).length;
}

function tagName(node: ts.JsxOpeningLikeElement, sourceFile: ts.SourceFile) {
  return node.tagName.getText(sourceFile);
}

function attribute(
  node: ts.JsxOpeningLikeElement,
  name: string,
): ts.JsxAttribute | undefined {
  return node.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function attributeValue(node: ts.JsxOpeningLikeElement, name: string) {
  const match = attribute(node, name);
  if (!match?.initializer) return match ? "" : null;
  if (ts.isStringLiteral(match.initializer)) return match.initializer.text;
  if (!ts.isJsxExpression(match.initializer) || !match.initializer.expression) return null;

  const expression = match.initializer.expression;
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (ts.isNumericLiteral(expression)) return expression.text;
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return "true";
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return "false";
  return expression.getText();
}

function hasAttribute(node: ts.JsxOpeningLikeElement, name: string) {
  return attribute(node, name) !== undefined;
}

function hasSpreadAttribute(node: ts.JsxOpeningLikeElement) {
  return node.attributes.properties.some(ts.isJsxSpreadAttribute);
}

function jsxElementForOpening(node: ts.JsxOpeningLikeElement) {
  return ts.isJsxOpeningElement(node) && ts.isJsxElement(node.parent) ? node.parent : node;
}

function visibleText(node: ts.Node): string {
  const parts: string[] = [];

  function visit(current: ts.Node) {
    if (ts.isJsxText(current)) {
      const text = current.getText().replace(/\s+/g, " ").trim();
      if (text) parts.push(text);
      return;
    }

    if (ts.isJsxExpression(current) && current.expression) {
      if (
        ts.isStringLiteral(current.expression) ||
        ts.isNoSubstitutionTemplateLiteral(current.expression)
      ) {
        const text = current.expression.text.trim();
        if (text) parts.push(text);
      } else if (expressionMayRenderText(current.expression)) {
        parts.push("[dynamic text]");
      }
      return;
    }

    current.forEachChild(visit);
  }

  visit(node);
  return parts.join(" ");
}

function expressionMayRenderText(expression: ts.Expression): boolean {
  if (
    ts.isIdentifier(expression) ||
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression) ||
    ts.isNumericLiteral(expression) ||
    ts.isTemplateExpression(expression)
  ) {
    return true;
  }

  if (ts.isParenthesizedExpression(expression)) {
    return expressionMayRenderText(expression.expression);
  }

  if (ts.isConditionalExpression(expression)) {
    return (
      expressionMayRenderText(expression.whenTrue) ||
      expressionMayRenderText(expression.whenFalse)
    );
  }

  if (ts.isBinaryExpression(expression)) {
    return (
      expressionMayRenderText(expression.left) || expressionMayRenderText(expression.right)
    );
  }

  return false;
}

function isWrappedByLabel(node: ts.Node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current)) {
      const opening = current.openingElement;
      if (opening.tagName.getText() === "label") return true;
    }
    if (ts.isFunctionLike(current)) return false;
    current = current.parent;
  }
  return false;
}

function sourceLocation(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  tag: string,
  detail: string,
): Finding {
  return {
    file: relative(repositoryRoot, sourceFile.fileName),
    line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
    tag,
    detail,
  };
}

function hasAccessibleName(node: ts.JsxOpeningLikeElement, sourceFile: ts.SourceFile) {
  const element = jsxElementForOpening(node);
  const markup = element.getText(sourceFile);
  return Boolean(
    attributeValue(node, "aria-label") ||
      attributeValue(node, "aria-labelledby") ||
      attributeValue(node, "title") ||
      visibleText(element) ||
      /\bsr-only\b/.test(markup) ||
      /aria-label\s*=|aria-labelledby\s*=/.test(markup),
  );
}

function classNameValue(node: ts.JsxOpeningLikeElement) {
  return attributeValue(node, "className") ?? "";
}

function isBelowProductTarget(className: string) {
  const compactDimension = /(?:^|\s)(?:h|w|size)-(?:3|4|5|6|7|8|9|10)(?:\s|$)/;
  return compactDimension.test(className);
}

function hasDetectedDragAlternative(node: ts.JsxOpeningLikeElement, sourceFile: ts.SourceFile) {
  const element = jsxElementForOpening(node);
  const markup = element.getText(sourceFile);
  return /Move (?:up|down|left|right)|aria-label=["'{`].*Move|<select|<input|<button|<Button/.test(
    markup,
  );
}

const files = walk(sourceRoot).filter(runtimeFile);

for (const file of files) {
  const contents = readFileSync(file, "utf8");

  counters.focusOutlineSuppression += countMatches(
    contents,
    /(?:focus:|focus-visible:)?outline-none/g,
  );
  counters.focusVisibleClasses += countMatches(contents, /focus-visible:/g);
  counters.transitionAllClasses += countMatches(contents, /\btransition-all\b/g);
  counters.repeatingAnimationClasses += countMatches(
    contents,
    /\banimate-(?:spin|pulse|bounce|ping)\b/g,
  );
  counters.reducedMotionClasses += countMatches(contents, /motion-reduce:|motion-safe:/g);
  counters.reducedMotionMediaQueries += countMatches(
    contents,
    /prefers-reduced-motion\s*:\s*reduce/g,
  );
  counters.liveRegions += countMatches(
    contents,
    /aria-live\s*=|role\s*=\s*["'](?:status|alert|log)["']/g,
  );
  counters.errorAssociations += countMatches(
    contents,
    /aria-invalid\s*=|aria-errormessage\s*=|aria-describedby\s*=/g,
  );
  counters.hiddenAccessibleText += countMatches(contents, /\bsr-only\b/g);
  counters.tooltips += countMatches(contents, /<Tooltip(?:Trigger|Content|Provider)?\b/g);
  counters.toastCalls += countMatches(contents, /\btoast\.(?:success|error|info|warning)\s*\(/g);

  if (!file.endsWith(".tsx")) continue;
  counters.tsxFiles += 1;

  const sourceFile = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const labelTargets = new Set<string>();
  let localH1Count = 0;

  function collectLabels(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = tagName(node, sourceFile);
      if (tag === "label" || tag === "Label") {
        const target = attributeValue(node, "htmlFor");
        if (target) labelTargets.add(target);
      }
      if (tag === "h1") localH1Count += 1;
    }
    node.forEachChild(collectLabels);
  }

  collectLabels(sourceFile);

  function inspect(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = tagName(node, sourceFile);
      const className = classNameValue(node);
      const normalizedTag = tag.toLowerCase();

      if (tag === "button") counters.nativeButtons += 1;
      if (tag === "Button") counters.designSystemButtons += 1;
      if (["input", "select", "textarea"].includes(tag)) counters.nativeFormControls += 1;
      if (/^(?:Alert)?DialogContent$/.test(tag) || attributeValue(node, "role") === "dialog") {
        counters.dialogs += 1;
      }

      const isButton = tag === "button" || tag === "Button";
      if (isButton && !hasAccessibleName(node, sourceFile)) {
        findings.unnamedButton.push(
          sourceLocation(sourceFile, node, tag, "No detected text or accessible name"),
        );
      }

      if (isButton && isBelowProductTarget(className)) {
        findings.undersizedProductTarget.push(
          sourceLocation(
            sourceFile,
            node,
            tag,
            `Compact dimension classes: ${className}`,
          ),
        );
      }

      if (["input", "select", "textarea"].includes(tag)) {
        const type = attributeValue(node, "type");
        const id = attributeValue(node, "id");
        const named =
          type === "hidden" ||
          /(?:^|\s)hidden(?:\s|$)/.test(className) ||
          (sourceFile.fileName.replaceAll("\\", "/").includes("/components/ui/") &&
            hasSpreadAttribute(node)) ||
          Boolean(attributeValue(node, "aria-label")) ||
          Boolean(attributeValue(node, "aria-labelledby")) ||
          Boolean(id && labelTargets.has(id)) ||
          isWrappedByLabel(node);

        if (!named) {
          findings.unlabeledControl.push(
            sourceLocation(
              sourceFile,
              node,
              tag,
              id ? `No label detected for id ${id}` : "No id, wrapping label, or ARIA name detected",
            ),
          );
        }
      }

      if ((tag === "img" || tag === "Image") && !hasAttribute(node, "alt")) {
        findings.missingImageAlt.push(
          sourceLocation(sourceFile, node, tag, "No alt attribute detected"),
        );
      }

      if (
        ["div", "span", "li", "p"].includes(normalizedTag) &&
        hasAttribute(node, "onClick") &&
        !hasAttribute(node, "role") &&
        !hasAttribute(node, "tabIndex")
      ) {
        findings.nonInteractiveClick.push(
          sourceLocation(
            sourceFile,
            node,
            tag,
            "Click handler on a non-interactive element without role/tabIndex",
          ),
        );
      }

      const tabIndex = attributeValue(node, "tabIndex");
      if (tabIndex && Number(tabIndex) > 0) {
        findings.positiveTabIndex.push(
          sourceLocation(sourceFile, node, tag, `Positive tabIndex ${tabIndex}`),
        );
      }

      if (hasAttribute(node, "autoFocus")) {
        findings.autoFocus.push(
          sourceLocation(sourceFile, node, tag, "autoFocus requires contextual review"),
        );
      }

      const draggable =
        attributeValue(node, "draggable") === "true" ||
        hasAttribute(node, "onDragStart") ||
        hasAttribute(node, "onDrop");
      if (draggable) {
        counters.draggableInteractions += 1;
        if (!hasDetectedDragAlternative(node, sourceFile)) {
          findings.dragAlternativeReview.push(
            sourceLocation(
              sourceFile,
              node,
              tag,
              "Drag interaction needs manual confirmation of a single-pointer alternative",
            ),
          );
        }
      }
    }

    node.forEachChild(inspect);
  }

  inspect(sourceFile);

  if (file.replaceAll("\\", "/").includes("/app/") && file.endsWith("/page.tsx")) {
    counters.pageFiles += 1;
    if (localH1Count === 0) counters.pageFilesWithoutLocalH1 += 1;
  }
}

const allFindings = Object.values(findings).flat();
const fileMetrics = new Map<string, number>();
for (const finding of allFindings) {
  fileMetrics.set(finding.file, (fileMetrics.get(finding.file) ?? 0) + 1);
}

const hotspots: FileMetric[] = Array.from(fileMetrics, ([file, findingCount]) => ({
  file,
  findings: findingCount,
})).sort(
  (left, right) => right.findings - left.findings || left.file.localeCompare(right.file),
);

const report = {
  generatedAt: new Date().toISOString(),
  scope: {
    sourceRoot: relative(repositoryRoot, sourceRoot),
    includedFiles: files.length,
    tsxFiles: counters.tsxFiles,
    excludedSegments: excludedRuntimeSegments.map((segment) => segment.replace(/^\//, "")),
  },
  counters,
  findingCounts: Object.fromEntries(
    Object.entries(findings).map(([key, value]) => [key, value.length]),
  ),
  findings,
  hotspots: hotspots.slice(0, 40),
};

const output = summaryOnly
  ? {
      generatedAt: report.generatedAt,
      scope: report.scope,
      counters: report.counters,
      findingCounts: report.findingCounts,
      hotspots: report.hotspots.slice(0, 12),
      sampleFindings: Object.fromEntries(
        Object.entries(report.findings).map(([key, value]) => [key, value.slice(0, 5)]),
      ),
    }
  : report;

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
