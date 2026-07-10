import assert from "node:assert/strict";
import {
  performanceConnectionClass,
  performanceDeviceClass,
  performanceOrganizationSize,
  performanceRoleClass,
  performanceRouteFamily,
  validatePerformanceMetric,
} from "../lib/performance-metrics";

assert.equal(
  performanceRouteFamily(
    "https://example.test/children/9e6ec1d0-8bb8-4c86-a32f-d47c26673cf1/dashboard?childId=secret",
  ),
  "/children",
);
assert.equal(performanceRouteFamily("/child_dashboard.php?id=123"), "/children");
assert.equal(performanceRouteFamily("/unrecognized/private-value?token=secret"), "/other");
assert.equal(performanceRouteFamily("/"), "/root");
assert.equal(performanceRouteFamily(null), "/unknown");

assert.equal(performanceDeviceClass(390), "mobile");
assert.equal(performanceDeviceClass(768), "tablet");
assert.equal(performanceDeviceClass(1440), "desktop");
assert.equal(performanceDeviceClass("1440"), "unknown");

assert.equal(performanceConnectionClass("2g"), "constrained");
assert.equal(performanceConnectionClass("3g"), "moderate");
assert.equal(performanceConnectionClass("4g"), "fast");
assert.equal(performanceConnectionClass("wifi"), "unknown");

assert.equal(performanceRoleClass("ADMIN"), "administrator");
assert.equal(performanceRoleClass("teacher"), "practitioner");
assert.equal(performanceRoleClass("DOCTOR"), "clinical");
assert.equal(performanceRoleClass("unexpected"), "unknown");

assert.equal(performanceOrganizationSize(0), "0-25");
assert.equal(performanceOrganizationSize(75), "26-75");
assert.equal(performanceOrganizationSize(151), "151-300");
assert.equal(performanceOrganizationSize(301), "301+");
assert.equal(performanceOrganizationSize(-1), "unknown");

const valid = validatePerformanceMetric({
  metric: "INP",
  value: 184,
  delta: 12,
  rating: "good",
  pathname: "/medical/visits/123?child=private-child-id",
  viewportWidth: 1024,
  effectiveType: "3g",
  role: "NURSE",
  activeChildren: 132,
  navigationType: "navigate",
  build: "build_2026-07-10.1",
  childId: "must-not-survive",
  note: "must-not-survive",
});
assert.equal(valid.valid, true);
assert.deepEqual(valid.payload, {
  metric: "INP",
  value: 184,
  delta: 12,
  rating: "good",
  routeFamily: "/medical",
  device: "tablet",
  connection: "moderate",
  role: "clinical",
  organizationSize: "76-150",
  navigationType: "navigate",
  build: "build_2026-07-10.1",
});
assert.equal(JSON.stringify(valid.payload).includes("private-child-id"), false);
assert.equal(JSON.stringify(valid.payload).includes("must-not-survive"), false);

assert.equal(
  validatePerformanceMetric({ metric: "FID", value: 10, delta: 2, rating: "good" }).valid,
  false,
);
assert.equal(
  validatePerformanceMetric({ metric: "CLS", value: -1, delta: 0, rating: "poor" }).valid,
  false,
);
assert.equal(
  validatePerformanceMetric({ metric: "LCP", value: 1200, delta: 2, rating: "fast" }).valid,
  false,
);

process.stdout.write("Performance metric verification passed\n");
