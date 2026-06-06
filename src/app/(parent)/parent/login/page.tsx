import type { Metadata } from "next";
import { ParentLoginClient } from "./parent-login-client";

export const metadata: Metadata = {
  title: "Parent Login | KiddzOnline",
};

export default function ParentLoginPage() {
  return <ParentLoginClient />;
}
