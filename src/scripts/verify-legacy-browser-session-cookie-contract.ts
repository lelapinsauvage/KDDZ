import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripPersistentAuthSessionCookie } from "@/lib/legacy-session-cookies";

const files = {
  legacyLogin:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/login.class.php",
  auth: "src/lib/auth.ts",
  middleware: "src/middleware.ts",
  authRoute: "src/app/api/auth/[...nextauth]/route.ts",
  sessionCookies: "src/lib/legacy-session-cookies.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyLogin, /parent::getOption\('default_session'\)/);
assert.match(text.legacyLogin, /ini_set\('session\.cookie_lifetime', 60 \* \$minutes\)/);
assert.match(text.legacyLogin, /isset\(\$_POST\['remember'\]\)/);
assert.match(text.legacyLogin, /ini_set\('session\.cookie_lifetime', 60\*60\*24\*100\)/);

assert.match(text.auth, /legacySessionMode: "browser_session"/);
assert.match(text.auth, /legacySessionMode: "remember"/);
assert.match(text.auth, /LEGACY_REMEMBER_SESSION_MS = 100 \* 24 \* 60 \* 60 \* 1000/);
assert.match(text.auth, /legacySessionMode: "default_session"/);

assert.match(text.middleware, /getToken/);
assert.doesNotMatch(text.middleware, /NextAuth\(authConfig\)/);
assert.match(text.middleware, /isExpiredIsoDate\(legacySessionExpiresAt\)/);
assert.match(text.middleware, /responseWithCurrentPath/);

assert.match(text.authRoute, /makeAuthSessionCookiesBrowserScoped/);
assert.match(text.sessionCookies, /authjs\\\.session-token/);
assert.match(text.sessionCookies, /expires=/);
assert.match(text.sessionCookies, /max-age=/);
assert.match(text.sessionCookies, /Max-Age=0/);

const persistentCookie =
  "authjs.session-token=value; Path=/; Expires=Wed, 10 Jun 2026 10:00:00 GMT; HttpOnly; SameSite=Lax";
assert.equal(
  stripPersistentAuthSessionCookie(persistentCookie),
  "authjs.session-token=value; Path=/; HttpOnly; SameSite=Lax",
);
const chunkedSecureCookie =
  "__Secure-authjs.session-token.0=value; Path=/; Max-Age=2592000; Expires=Wed, 10 Jun 2026 10:00:00 GMT; HttpOnly; Secure";
assert.equal(
  stripPersistentAuthSessionCookie(chunkedSecureCookie),
  "__Secure-authjs.session-token.0=value; Path=/; HttpOnly; Secure",
);
const cleanupCookie = "authjs.session-token=; Path=/; Max-Age=0; HttpOnly";
assert.equal(stripPersistentAuthSessionCookie(cleanupCookie), cleanupCookie);
const csrfCookie =
  "authjs.csrf-token=value; Path=/; Expires=Wed, 10 Jun 2026 10:00:00 GMT; HttpOnly";
assert.equal(stripPersistentAuthSessionCookie(csrfCookie), csrfCookie);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
for (const legacyPhp of [
  "Front/templates/admin/users/classes/login.class.php",
  "Front/templates/admin/users/login.php",
]) {
  const row = matrix.find((entry) => entry.legacyPhp === legacyPhp);
  assert.ok(row, `${legacyPhp} row exists`);
  assert.match(row.status ?? "", /browser-session/);
  assert.match(row.verification ?? "", /session-token cookie/);
  assert.match(row.verification ?? "", /verify-legacy-browser-session-cookie-contract\.ts/);
}

assert.match(text.markdownMatrix, /verify-legacy-browser-session-cookie-contract\.ts/);
assert.match(text.topGaps, /browser-session Auth\.js session-token cookie/);

console.log("legacy browser-session cookie contract assertions passed");
