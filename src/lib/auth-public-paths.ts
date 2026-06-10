export function isExpiredIsoDate(value: string | null | undefined) {
  return Boolean(value) && Date.parse(value as string) <= Date.now();
}

export function isLegacyParentWsPath(pathname: string) {
  return (
    pathname.startsWith("/ws/") ||
    /^\/(?!(?:api|_next)\/)[^/]+\/ws\//.test(pathname)
  );
}

export function isPublicAuthPath(pathname: string) {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot") ||
    pathname === "/forgot.php" ||
    pathname === "/users/forgot.php" ||
    pathname === "/signup" ||
    pathname === "/sign_up.php" ||
    pathname === "/users/sign_up.php" ||
    pathname === "/users/admin/login.php" ||
    pathname === "/users/protected.php" ||
    pathname === "/users/whoami.php" ||
    pathname === "/logout.php" ||
    pathname === "/users/logout.php" ||
    pathname === "/disabled.php" ||
    pathname === "/users/disabled.php" ||
    pathname === "/profile.php" ||
    pathname === "/users/profile.php" ||
    pathname === "/activate.php" ||
    pathname === "/users/activate.php" ||
    pathname === "/master.php" ||
    pathname === "/parent" ||
    pathname.startsWith("/parent/") ||
    isLegacyParentWsPath(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/parent")
  );
}
