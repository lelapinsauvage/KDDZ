import type { Metadata } from "next";
import { ParentPortalClient } from "./parent-portal-client";

export const metadata: Metadata = {
  title: "Parent Portal | KiddzOnline",
};

export default function ParentPortalPage() {
  return <ParentPortalClient />;
}
