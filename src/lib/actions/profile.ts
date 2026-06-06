"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

import { db } from "@/lib/db";
import { requireOrgSafe } from "@/lib/require-org";

const MIN_PASSWORD_LENGTH = 5;

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function changeCurrentUserPassword(
  password: string,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };

  if (!password) {
    return { success: false, error: "No Change !" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  try {
    const existing = await db.user.findUnique({
      where: { id: result.ctx.userId },
      select: { id: true, isActive: true },
    });
    if (!existing?.isActive) {
      return { success: false, error: "User not found" };
    }

    const passwordHash = await hash(password, 12);
    await db.user.update({
      where: { id: result.ctx.userId },
      data: { passwordHash },
    });

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("changeCurrentUserPassword error:", error);
    return { success: false, error: "Failed to update password" };
  }
}
