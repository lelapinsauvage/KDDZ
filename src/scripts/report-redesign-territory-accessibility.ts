import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

type Rgb = [number, number, number];

type TerritoryTokens = Record<string, string>;

type ContrastCheck = {
  background: string;
  foreground: string;
  label: string;
  minimum: number;
  territory: string;
};

const repositoryRoot = resolve(process.cwd());
const stylesheetPath = resolve(
  repositoryRoot,
  "src/app/design-lab/territories/territories.css",
);
const stylesheet = readFileSync(stylesheetPath, "utf8");
const failures: string[] = [];

function cssBlock(source: string, marker: string) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing CSS block: ${marker}`);

  const openingBrace = source.indexOf("{", start);
  if (openingBrace < 0) throw new Error(`Missing opening brace: ${marker}`);

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  throw new Error(`Missing closing brace: ${marker}`);
}

function customProperties(block: string) {
  return Object.fromEntries(
    Array.from(block.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-f]{3,8})\s*;/gi)).map(
      (match) => [match[1], match[2].toLowerCase()],
    ),
  );
}

function rgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) throw new Error(`Unsupported color: ${hex}`);
  return [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16)) as Rgb;
}

function luminance(color: string) {
  const channels = rgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function token(tokens: TerritoryTokens, name: string) {
  const value = tokens[name];
  if (!value) throw new Error(`Missing token: --${name}`);
  return value;
}

function checkSource(label: string, expression: RegExp, source = stylesheet) {
  const passed = expression.test(source);
  console.log(`${passed ? "PASS" : "FAIL"} source  ${label}`);
  if (!passed) failures.push(label);
}

const baseCanvasIndex = stylesheet.indexOf("--canvas: #fffcf7;");
const baseTerritoryIndex = stylesheet.lastIndexOf(".territory-lab {", baseCanvasIndex);
if (baseCanvasIndex < 0 || baseTerritoryIndex < 0) {
  throw new Error("Missing base territory token block");
}
const baseTokens = customProperties(
  cssBlock(stylesheet.slice(baseTerritoryIndex), ".territory-lab {"),
);
const territoryTokens: Record<string, TerritoryTokens> = {
  daylight: baseTokens,
  signal: {
    ...baseTokens,
    ...customProperties(cssBlock(stylesheet, '.territory-lab[data-territory="signal"] {')),
  },
  carebook: {
    ...baseTokens,
    ...customProperties(cssBlock(stylesheet, '.territory-lab[data-territory="carebook"] {')),
  },
};

const contrastChecks: ContrastCheck[] = Object.entries(territoryTokens).flatMap(
  ([territory, tokens]) => {
    const sidebarBackground = territory === "daylight"
      ? "#fffaf2"
      : territory === "carebook"
        ? "#f8efe2"
        : token(tokens, "surface");

    return [
      { territory, label: "muted on canvas", foreground: token(tokens, "muted"), background: token(tokens, "canvas"), minimum: 4.5 },
      { territory, label: "muted on surface", foreground: token(tokens, "muted"), background: token(tokens, "surface"), minimum: 4.5 },
      { territory, label: "muted in sidebar", foreground: token(tokens, "muted"), background: sidebarBackground, minimum: 4.5 },
      { territory, label: "accent content", foreground: token(tokens, "accent-ink"), background: token(tokens, "accent"), minimum: 4.5 },
      { territory, label: "safe status", foreground: token(tokens, "safe"), background: token(tokens, "safe-bg"), minimum: 4.5 },
      { territory, label: "forecast status", foreground: token(tokens, "forecast"), background: token(tokens, "forecast-bg"), minimum: 4.5 },
      { territory, label: "critical status", foreground: token(tokens, "critical"), background: token(tokens, "critical-bg"), minimum: 4.5 },
      { territory, label: "unknown status", foreground: token(tokens, "unknown"), background: token(tokens, "unknown-bg"), minimum: 4.5 },
      { territory, label: "accent text on finance tint", foreground: token(tokens, "accent-text"), background: "#eef3ff", minimum: 4.5 },
    ];
  },
);

contrastChecks.push({
  territory: "daylight",
  label: "readiness text on brand surface",
  foreground: token(territoryTokens.daylight, "ink"),
  background: token(territoryTokens.daylight, "brand"),
  minimum: 4.5,
});

console.log(`Territory accessibility source report`);
console.log(`CSS: ${relative(repositoryRoot, stylesheetPath)}\n`);

for (const check of contrastChecks) {
  const ratio = contrast(check.foreground, check.background);
  const passed = ratio + Number.EPSILON >= check.minimum;
  console.log(
    `${passed ? "PASS" : "FAIL"} contrast ${check.territory.padEnd(8)} ${check.label.padEnd(34)} ${ratio.toFixed(2)}:1`,
  );
  if (!passed) failures.push(`${check.territory}: ${check.label} (${ratio.toFixed(2)}:1)`);
}

console.log("");
checkSource(
  "visible focus treatment exists",
  /\.territory-lab (?:button|a):focus-visible[\s\S]*?outline:\s*2px solid var\(--focus(?:,\s*#[0-9a-f]+)?\)/i,
);
checkSource(
  "desktop checkboxes expose a 32px target",
  /\.record-table input\[type="checkbox"\][\s\S]*?width:\s*32px;[\s\S]*?height:\s*32px;/,
);
checkSource(
  "desktop row actions expose a 32px target",
  /\.record-table \.territory-icon-button\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;/,
);
checkSource(
  "desktop pagination exposes a 32px target",
  /\.record-table-footer button\s*\{[^}]*min-height:\s*32px;/,
);
checkSource(
  "mobile controls expose a 44px target",
  /@media \(max-width:\s*680px\)[\s\S]*?\.territory-main \.territory-primary-button[\s\S]*?min-height:\s*44px;/,
);
checkSource(
  "mobile checkboxes expose a 44px target",
  /@media \(max-width:\s*680px\)[\s\S]*?\.record-table input\[type="checkbox"\][\s\S]*?width:\s*44px;\s*height:\s*44px;/,
);
checkSource(
  "system reduced-motion preference is honored",
  /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.territory-view-enter,[\s\S]*?animation:\s*none;/,
);
checkSource(
  "deterministic reduced-motion test hook is present",
  /\.territory-lab\[data-reduced-motion="true"\][\s\S]*?\.territory-view-enter,[\s\S]*?animation:\s*none;/,
);

const rawPixelFontDeclarations = Array.from(
  stylesheet.matchAll(/font-size:\s*\d+(?:\.\d+)?px/g),
);
console.log(`\nREVIEW raw pixel font-size declarations: ${rawPixelFontDeclarations.length}`);
console.log("       Runtime zoom, localization, and large-text checks remain mandatory.");

if (failures.length > 0) {
  console.error(`\nTerritory accessibility source contract failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nTerritory accessibility source contract passed.");
}
