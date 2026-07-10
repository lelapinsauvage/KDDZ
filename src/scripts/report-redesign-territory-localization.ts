import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { territoryStressCopy } from "../app/design-lab/territories/_stress";

type FlatCopy = Record<string, string>;

const repositoryRoot = resolve(process.cwd());
const stylesheetPath = resolve(
  repositoryRoot,
  "src/app/design-lab/territories/territories.css",
);
const prototypePath = resolve(
  repositoryRoot,
  "src/app/design-lab/territories/_components/territory-prototype.tsx",
);
const stylesheet = readFileSync(stylesheetPath, "utf8");
const prototype = readFileSync(prototypePath, "utf8");
const failures: string[] = [];
const typeSizes = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 26, 27, 28, 30, 34, 36, 39, 44];

function count(source: string, expression: RegExp) {
  return Array.from(source.matchAll(new RegExp(expression.source, expression.flags))).length;
}

function check(label: string, passed: boolean, detail?: string) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
  if (!passed) failures.push(label);
}

function flattenCopy(value: unknown, prefix = ""): FlatCopy {
  if (typeof value === "string") return { [prefix]: value };
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      Object.entries(flattenCopy(child, prefix ? `${prefix}.${key}` : key)),
    ),
  );
}

const defaultCopy = flattenCopy(territoryStressCopy.default);
const longCopy = flattenCopy(territoryStressCopy.long);
const rtlCopy = flattenCopy(territoryStressCopy.rtl);
const copyKeys = Object.keys(defaultCopy).sort();
const completeLongCopy = copyKeys.every((key) => typeof longCopy[key] === "string");
const completeRtlCopy = copyKeys.every((key) => typeof rtlCopy[key] === "string");
const expandedLongLabels = copyKeys.filter(
  (key) => longCopy[key]?.length > defaultCopy[key].length,
);
const arabicLabels = copyKeys.filter((key) => /[\u0600-\u06ff]/.test(rtlCopy[key] ?? ""));

const physicalPropertyMatches = Array.from(
  stylesheet.matchAll(
    /\b(?:left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:|text-align\s*:\s*(?:left|right)/g,
  ),
);
const rawPixelTypeMatches = Array.from(
  stylesheet.matchAll(/font-size\s*:\s*[0-9.]+px/g),
);
const missingTypePairs = typeSizes.filter(
  (size) => count(stylesheet, new RegExp(`--type-${size}\\s*:`, "g")) < 2,
);
const finalTerritoryTokenOverride = stylesheet.indexOf(
  '.territory-lab[data-territory="carebook"]',
);
const deterministicForcedColorOverride = stylesheet.lastIndexOf(
  '.territory-lab[data-forced-colors="true"]',
);

console.log("Territory localization and typography source report");
console.log(`CSS: ${relative(repositoryRoot, stylesheetPath)}`);
console.log(`Prototype: ${relative(repositoryRoot, prototypePath)}\n`);

check("no physical inline CSS properties", physicalPropertyMatches.length === 0, `${physicalPropertyMatches.length} found`);
check("no raw pixel font-size declarations", rawPixelTypeMatches.length === 0, `${rawPixelTypeMatches.length} found`);
check("base and 200% type tokens are paired", missingTypePairs.length === 0, missingTypePairs.length ? `missing ${missingTypePairs.join(", ")}` : `${typeSizes.length} sizes`);
check("long-copy fixture covers every governed label", completeLongCopy, `${Object.keys(longCopy).length}/${copyKeys.length}`);
check("RTL fixture covers every governed label", completeRtlCopy, `${Object.keys(rtlCopy).length}/${copyKeys.length}`);
check("long-copy fixture expands every governed label", expandedLongLabels.length === copyKeys.length, `${expandedLongLabels.length}/${copyKeys.length}`);
check("RTL fixture uses Arabic for every governed label", arabicLabels.length === copyKeys.length, `${arabicLabels.length}/${copyKeys.length}`);
check("prototype applies nested Arabic language and direction", /dir=\{stressMode === "rtl" \? "rtl" : "ltr"\}/.test(prototype) && /lang=\{stressMode === "rtl" \? "ar" : "en"\}/.test(prototype));
check("RTL drawer opens from the inline start edge", /--drawer-closed-shift:\s*104%/.test(stylesheet));
check("RTL directional icons have mirrored and expanded states", /\.territory-lab\[dir="rtl"\][\s\S]*?scaleX\(-1\)/.test(stylesheet) && /\.room-row\.is-selected[\s\S]*?rotate\(90deg\)/.test(stylesheet));
check("Arabic typography uses a writing-system fallback", /\.territory-lab\[lang="ar"\][\s\S]*?--territory-font-product:\s*system-ui/.test(stylesheet));
check("real forced-colors media contract exists", /@media \(forced-colors:\s*active\)/.test(stylesheet));
check("deterministic forced-colors hook exists", /\.territory-lab\[data-forced-colors="true"\]/.test(stylesheet) && /data-forced-colors=\{contrastMode === "forced"/.test(prototype));
check("deterministic forced colors override territory tokens", deterministicForcedColorOverride > finalTerritoryTokenOverride);

if (failures.length > 0) {
  console.error(`\nTerritory localization source contract failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nTerritory localization and typography source contract passed.");
}
