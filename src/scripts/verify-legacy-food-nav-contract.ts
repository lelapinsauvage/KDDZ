import assert from "node:assert/strict";
import {
  getNavForRole,
  isAccordion,
  isSectionAccordion,
  type NavAccordionItem,
  type NavLeaf,
} from "@/components/layout/app-sidebar";

const branches = [
  { id: "branch-one", name: "Branch One" },
  { id: "branch/two", name: "Branch Two" },
];

const sections = getNavForRole("ADMIN", [], branches);
const foodSection = sections.find((section) => section.label === "Food Management");

assert.ok(foodSection, "Food Management section must exist for admin");
assert.ok(isSectionAccordion(foodSection), "Food Management must be an accordion");

const foodListing = foodSection.children.find(
  (item): item is NavLeaf => !isAccordion(item) && item.title === "Food Listing"
);
assert.ok(foodListing, "Food Listing leaf must remain present");
assert.equal(foodListing.href, "/food");
assert.equal(foodListing.legacyPage, "food.php");

const calendarItem = foodSection.children.find(
  (item): item is NavAccordionItem =>
    isAccordion(item) && item.title === "Food Calendar"
);
assert.ok(calendarItem, "Food Calendar must become a branch submenu");
assert.equal(calendarItem.legacyPage, "food_calendar.php");
assert.deepEqual(
  calendarItem.children.map((child) => {
    assert.ok(!isAccordion(child), "Food Calendar branch child must be a leaf");
    return {
      title: child.title,
      href: child.href,
      legacyPage: child.legacyPage,
    };
  }),
  [
    {
      title: "Branch One",
      href: "/food/calendar?branch=branch-one",
      legacyPage: "food_calendar.php",
    },
    {
      title: "Branch Two",
      href: "/food/calendar?branch=branch%2Ftwo",
      legacyPage: "food_calendar.php",
    },
  ]
);

const noBranchSections = getNavForRole("ADMIN", [], []);
const noBranchFoodSection = noBranchSections.find(
  (section) => section.label === "Food Management"
);
assert.ok(noBranchFoodSection && isSectionAccordion(noBranchFoodSection));
const noBranchCalendar = noBranchFoodSection.children.find(
  (item): item is NavLeaf => !isAccordion(item) && item.title === "Food Calendar"
);
assert.ok(noBranchCalendar, "Food Calendar must stay reachable when no branches load");
assert.equal(noBranchCalendar.href, "/food/calendar");

const deniedSections = getNavForRole("ADMIN", [], branches, null, {
  "food_calendar.php": { isConfigured: true, isAllowed: false },
});
const deniedFoodSection = deniedSections.find(
  (section) => section.label === "Food Management"
);
assert.ok(deniedFoodSection && isSectionAccordion(deniedFoodSection));
assert.equal(
  deniedFoodSection.children.some((item) => item.title === "Food Calendar"),
  false,
  "Food Calendar submenu must respect legacy PAGE guards"
);

console.log("legacy food navigation contract assertions passed");
