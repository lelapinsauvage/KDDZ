import assert from "node:assert/strict";
import {
  buildFailedLegacyParentLogin,
  buildSuccessfulLegacyParentLogin,
} from "@/lib/parent-login-contracts";

const failed = buildFailedLegacyParentLogin();

assert.deepEqual(failed, {
  id: 0,
  usites: 0,
  status: false,
  fname: "",
  lname: "",
  url: "",
  urlLabel: "View Full Reports",
  feedback: "",
  token: "",
  childId: "",
});

const failedWithFeedback = buildFailedLegacyParentLogin("Too many login attempts");
assert.equal(failedWithFeedback.feedback, "Too many login attempts");
assert.equal(failedWithFeedback.status, false);
assert.equal(failedWithFeedback.urlLabel, "View Full Reports");

const success = buildSuccessfulLegacyParentLogin({
  id: "123",
  usites: "456",
  fname: "Mira",
  lname: "Saab",
  token: "token with spaces",
  childId: "modern-child-id",
  modernParentUserId: "modern-parent-id",
});

assert.equal(success.id, "123");
assert.equal(success.usites, "456");
assert.equal(success.status, true);
assert.equal(success.fname, "Mira");
assert.equal(success.lname, "Saab");
assert.equal(success.urlLabel, "View Full Reports");
assert.equal(success.feedback, "");
assert.equal(success.token, "token with spaces");
assert.equal(success.childId, "modern-child-id");
assert.equal(success.modernParentUserId, "modern-parent-id");
assert.equal(
  success.url,
  "https://kiddzonline.com/Garderie_parent/Front/templates/admin/users/login.php?token=token%20with%20spaces"
);

const modernIdSuccess = buildSuccessfulLegacyParentLogin({
  id: "modern-parent-id",
  usites: "modern-child-id",
  fname: null,
  lname: undefined,
  token: "",
  childId: "modern-child-id",
  modernParentUserId: "modern-parent-id",
});

assert.equal(modernIdSuccess.id, "modern-parent-id");
assert.equal(modernIdSuccess.usites, "modern-child-id");
assert.equal(modernIdSuccess.fname, "");
assert.equal(modernIdSuccess.lname, "");
assert.equal(modernIdSuccess.url, "");

console.log("parent login legacy contract assertions passed");
