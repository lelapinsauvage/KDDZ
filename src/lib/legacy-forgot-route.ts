import { NextResponse, type NextRequest } from "next/server";

import { requestPasswordReset } from "@/lib/actions/password-recovery";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function legacyAlert(kind: "success" | "danger", message: string) {
  return `<div class="alert alert-${kind}">${escapeHtml(message)}</div>`;
}

export function legacyForgotGet(request: NextRequest) {
  const url = new URL(request.url);
  const target = new URL("/forgot", url.origin);
  const key = url.searchParams.get("key");

  if (key) {
    target.searchParams.set("key", key);
  }

  return NextResponse.redirect(target);
}

export async function legacyForgotPost(request: NextRequest) {
  let usernamemail = "";

  try {
    const formData = await request.formData();
    usernamemail = String(formData.get("usernamemail") ?? "");
  } catch {
    usernamemail = "";
  }

  const result = await requestPasswordReset(usernamemail).catch((error) => {
    console.warn("legacy forgot password fallback:", error);
    return { success: false, error: "This account does not exist." };
  });
  const html = result.success
    ? legacyAlert(
        "success",
        "We've emailed you password reset instructions. Check your email.",
      )
    : legacyAlert("danger", result.error ?? "This account does not exist.");

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
