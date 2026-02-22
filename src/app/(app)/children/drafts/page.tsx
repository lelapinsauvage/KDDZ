import { redirect } from "next/navigation";

export default function ChildrenDraftsPage() {
  redirect("/children?status=DRAFT");
}
