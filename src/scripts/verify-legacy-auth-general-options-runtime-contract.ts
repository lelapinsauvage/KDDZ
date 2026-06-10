import assert from "node:assert/strict";
import fs from "node:fs";

const settings = fs.readFileSync("src/lib/actions/legacy-auth-settings.ts", "utf8");
const auth = fs.readFileSync("src/lib/auth.ts", "utf8");
const authConfig = fs.readFileSync("src/lib/auth.config.ts", "utf8");
const appLayout = fs.readFileSync("src/app/(app)/layout.tsx", "utf8");
const middleware = fs.readFileSync("src/middleware.ts", "utf8");
const guestRedirect = fs.readFileSync("src/lib/legacy-guest-redirect.ts", "utf8");
const login = fs.readFileSync("src/lib/actions/legacy-login.ts", "utf8");
const logout = fs.readFileSync("src/lib/legacy-logout.ts", "utf8");
const signup = fs.readFileSync("src/lib/actions/legacy-signup.ts", "utf8");

for (const key of [
  "admin_email",
  "site_address",
  "default_session",
  "default-level",
  "custom-avatar-enable",
  "email-as-username-enable",
  "disable-registrations-enable",
  "disable-logins-enable",
  "user-activation-enable",
  "email-welcome-disable",
  "notify-new-user-enable",
  "notify-new-users",
  "restrict-signups-by-email",
  "pw-encrypt-force-enable",
  "pw-encryption",
  "guest-redirect",
  "new-user-redirect",
  "signout-redirect-referrer-enable",
  "signout-redirect-url",
  "signin-redirect-referrer-enable",
  "signin-redirect-url",
]) {
  assert.match(
    settings,
    new RegExp(JSON.stringify(key).slice(1, -1)),
    `general options save must preserve ${key}`,
  );
}

assert.match(
  settings,
  /You must enter a default session \(numeric value only\)\./,
  "default_session must keep legacy numeric validation",
);
assert.match(
  settings,
  /serializePhpNumberArray\(\s*defaultLevelIds\.length \? defaultLevelIds : \[3\],/,
  "default-level must be saved as a legacy PHP array with legacy fallback",
);
assert.match(
  settings,
  /serializePhpStringArray\(domains\)/,
  "restricted signup domains must be saved as a legacy PHP array",
);

assert.match(auth, /settingKey: "default_session"/);
assert.match(auth, /legacySessionMode: "remember"/);
assert.match(auth, /LEGACY_REMEMBER_SESSION_MS = 100 \* 24 \* 60 \* 60 \* 1000/);
assert.match(auth, /minutes === 0/);
assert.match(auth, /legacySessionMode: "browser_session"/);
assert.match(auth, /legacySessionMode: "default_session"/);
assert.match(authConfig, /isExpiredIsoDate\(legacySessionExpiresAt\)/);
assert.match(appLayout, /isExpiredIsoDate\(legacySessionExpiresAt\)/);

assert.match(
  middleware,
  /requestHeaders\.set\("x-current-path", `\$\{pathname\}\$\{search\}`\)/,
  "middleware must forward the full current path for legacy guest redirects",
);
assert.match(
  middleware,
  /if \(!pathname\.startsWith\("\/api\/"\)\)/,
  "middleware must let protected page requests reach the DB-backed app layout",
);
assert.match(appLayout, /legacyGuestRedirectPath/);
assert.match(guestRedirect, /settingKey: GUEST_REDIRECT_SETTING_KEY/);
assert.match(guestRedirect, /endsWith\("\/users\/login\.php"\)/);
assert.match(guestRedirect, /url\.searchParams\.set\("callbackUrl", callbackPath\)/);

assert.match(login, /signin-redirect-referrer-enable/);
assert.match(login, /signin-redirect-url/);
assert.match(login, /safeInternalRedirect\(callbackUrl, origin\)/);
assert.match(logout, /signout-redirect-referrer-enable/);
assert.match(logout, /signout-redirect-url/);

assert.match(signup, /disable-registrations-enable/);
assert.match(signup, /email-as-username-enable/);
assert.match(signup, /restrict-signups-by-email/);
assert.match(signup, /defaultLevelIds/);
assert.match(signup, /user-activation-enable/);
assert.match(signup, /email-welcome-disable/);
assert.match(signup, /notify-new-user-enable/);
assert.match(signup, /notify-new-users/);
assert.match(signup, /new-user-redirect/);

console.log("legacy auth general-options runtime contract assertions passed");
