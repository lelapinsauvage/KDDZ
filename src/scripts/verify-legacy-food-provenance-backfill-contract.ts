import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "src/scripts/migration/migrate-food-calendar.ts",
  "utf8",
);
const backfill = fs.readFileSync(
  "src/scripts/migration/backfill-food-legacy-provenance.ts",
  "utf8",
);
const foodPage = fs.readFileSync("src/app/(app)/food/page.tsx", "utf8");
const foodClient = fs.readFileSync(
  "src/components/food/food-listing-client.tsx",
  "utf8",
);

assert.match(
  migration,
  /SELECT \* FROM t_food WHERE deleted = 0 ORDER BY fid/,
  "food migration must import active legacy t_food rows in fid order",
);
assert.match(
  migration,
  /legacyKey: key,[\s\S]+legacyId: row\.fid,[\s\S]+legacyData,/,
  "food migration must preserve sourceDatabase, legacyKey, legacyId, and raw legacyData",
);
assert.match(
  migration,
  /where:\s*\{[\s\S]+organizationId,[\s\S]+name,[\s\S]+category,[\s\S]+legacyKey: null,/,
  "food migration must deterministically attach provenance to pre-existing unlinked food rows",
);

assert.match(
  backfill,
  /SELECT \* FROM t_food WHERE deleted = 0 ORDER BY fid/,
  "backfill must read the same active legacy food corpus as the importer",
);
assert.match(
  backfill,
  /const legacyKey = `\$\{sourceDatabase\}:t_food:\$\{row\.fid\}`/,
  "backfill must recreate the canonical food legacyKey",
);
assert.match(
  backfill,
  /food\.sourceDatabase === sourceDatabase && food\.legacyId === row\.fid/,
  "backfill must scope legacyId checks by sourceDatabase",
);
assert.match(
  backfill,
  /const matchKey = `\$\{category\}:\$\{normalizeFoodName\(name\)\}`/,
  "backfill must match by normalized legacy name plus mapped food category",
);
assert.match(
  backfill,
  /candidates\.length !== 1/,
  "backfill must skip ambiguous or missing matches instead of guessing",
);
assert.match(
  backfill,
  /sourceDatabase,[\s\S]+legacyKey,[\s\S]+legacyId: row\.fid,[\s\S]+legacyData: legacyFoodData\(sourceDatabase, row\),/,
  "backfill must write sourceDatabase, legacyKey, legacyId, and raw legacyData",
);
assert.match(
  backfill,
  /isActive: row\.active\.toLowerCase\(\) === "on"/,
  "backfill must restore legacy On/Off status",
);
assert.match(
  backfill,
  /createdAt: parseDate\(row\.datetime\) \?\? undefined/,
  "backfill must restore the legacy date when available",
);

assert.match(
  foodPage,
  /rowNumber: String\(food\.legacyId \?\? index \+ 1\)/,
  "food listing # column must prefer legacy fid",
);
assert.match(
  foodClient,
  /header: "#", key: "rowNumber"/,
  "food export must include the legacy # column",
);
assert.match(foodClient, /BreakFast/, "legacy category spelling must remain");
assert.match(foodClient, /\? "On" : "Off"/, "legacy active wording must remain");

console.log("legacy food provenance backfill contract assertions passed");
