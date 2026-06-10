import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isExpiredIsoDate,
  isLegacyParentWsPath,
  isPublicAuthPath,
} from "@/lib/auth-public-paths";

const publicPaths = [
  "/login",
  "/forgot",
  "/forgot.php",
  "/users/forgot.php",
  "/signup",
  "/sign_up.php",
  "/users/sign_up.php",
  "/users/admin/login.php",
  "/users/protected.php",
  "/users/whoami.php",
  "/logout.php",
  "/users/logout.php",
  "/disabled.php",
  "/users/disabled.php",
  "/profile.php",
  "/users/profile.php",
  "/activate.php",
  "/users/activate.php",
  "/master.php",
  "/parent",
  "/parent/login",
  "/ws/login.php",
  "/ws/notifications_master.php",
  "/legacy-school/ws/notifications_master.php",
  "/api/auth/session",
  "/api/cron/event-alarms",
  "/api/parent/login",
];

for (const pathname of publicPaths) {
  assert.equal(isPublicAuthPath(pathname), true, `${pathname} is public`);
}

for (const pathname of [
  "/dashboard",
  "/accounting",
  "/settings/events",
  "/children/new",
  "/alarms/events",
  "/api/uploads/presign",
  "/api/pdf/child/123",
]) {
  assert.equal(isPublicAuthPath(pathname), false, `${pathname} is protected`);
}

assert.equal(isLegacyParentWsPath("/ws/daily.php"), true);
assert.equal(isLegacyParentWsPath("/abc/ws/daily.php"), true);
assert.equal(isLegacyParentWsPath("/abc/def/ws/daily.php"), false);
assert.equal(isLegacyParentWsPath("/dashboard/ws/daily.php"), true);
assert.equal(isLegacyParentWsPath("/api/ws/daily.php"), false);
assert.equal(isLegacyParentWsPath("/_next/ws/daily.php"), false);

assert.equal(isExpiredIsoDate(null), false);
assert.equal(isExpiredIsoDate("2999-01-01T00:00:00.000Z"), false);
assert.equal(isExpiredIsoDate("2000-01-01T00:00:00.000Z"), true);

const middleware = readFileSync("src/middleware.ts", "utf8");
const authConfig = readFileSync("src/lib/auth.config.ts", "utf8");

assert.match(middleware, /isPublicAuthPath\(pathname\)/);
assert.match(middleware, /callbackUrl/);
assert.match(middleware, /x-current-pathname/);
assert.doesNotMatch(middleware, /pathname\.includes\("\/ws\/"\)/);
assert.match(authConfig, /isPublicAuthPath\(pathname\)/);
assert.match(authConfig, /isExpiredIsoDate\(legacySessionExpiresAt\)/);

console.log("auth public path contract assertions passed");
