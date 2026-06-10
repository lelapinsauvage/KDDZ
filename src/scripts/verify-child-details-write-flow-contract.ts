import "dotenv/config";
import assert from "node:assert/strict";

import { db } from "@/lib/db";
import {
  getLegacyAccessPermissionDecision,
  legacyAccessAllows,
} from "@/lib/legacy-access-permissions";
import type { OrgContext } from "@/lib/require-org";

type ActionModule = typeof import("@/lib/actions/children");

const marker = `codex-write-flow-${Date.now()}`;

function jsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function cleanup() {
  await db.child.deleteMany({
    where: {
      childNumber: {
        startsWith: "codex-write-flow-",
      },
    },
  });
}

async function findVerificationContext(): Promise<{
  ctx: OrgContext;
  branchId: string;
  classId: string;
  schoolYearId: string;
}> {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      role: "ADMIN",
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      branchId: true,
      organizationId: true,
      branch: { select: { organizationId: true } },
    },
  });

  for (const user of users) {
    const organizationId = user.organizationId ?? user.branch?.organizationId;
    if (!organizationId) continue;

    const ctx: OrgContext = {
      userId: user.id,
      organizationId,
      branchId: user.branchId,
      role: user.role,
    };
    const addDecision = await getLegacyAccessPermissionDecision(
      ctx,
      "addChild",
      "ACTION",
    );
    const updateDecision = await getLegacyAccessPermissionDecision(
      ctx,
      "updateChild",
      "ACTION",
    );
    if (!legacyAccessAllows(addDecision) || !legacyAccessAllows(updateDecision)) {
      continue;
    }

    const branch = await db.branch.findFirst({
      where: {
        organizationId,
        isActive: true,
        classes: {
          some: {
            isActive: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        classes: {
          where: { isActive: true },
          orderBy: [{ createdAt: "asc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
    const schoolYear = await db.schoolYear.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: [{ startDate: "desc" }],
      select: { id: true },
    });

    if (branch?.classes[0]?.id && schoolYear?.id) {
      return {
        ctx,
        branchId: branch.id,
        classId: branch.classes[0].id,
        schoolYearId: schoolYear.id,
      };
    }
  }

  throw new Error(
    "No active admin context with addChild/updateChild permission, branch, class, and school year was found.",
  );
}

function childFormData(params: {
  marker: string;
  branchId: string;
  classId: string;
  schoolYearId: string;
  isDraft: boolean;
  addressRecordId?: string;
  siblingRecordId?: string;
  relativeRecordId?: string;
  accountingRecordId?: string;
  revision: "create" | "update";
}) {
  const fd = new FormData();
  const isUpdate = params.revision === "update";

  fd.set("firstName", isUpdate ? "WriteFlowUpdated" : "WriteFlowDraft");
  fd.set("firstNameAr", "");
  fd.set("middleName", "");
  fd.set("lastName", "Codex");
  fd.set("lastNameAr", "");
  fd.set("dateOfBirth", "2020-01-02");
  fd.set("placeOfBirth", "Beirut");
  fd.set("gender", "MALE");
  fd.set("nationality", "Lebanese");
  fd.set("religion", "");
  fd.set("idNumber", params.marker);
  fd.set("bloodType", "");
  fd.set("allergies", "");
  fd.set("photo", "");
  fd.set("branchId", params.branchId);
  fd.set("classId", params.classId);
  fd.set("schoolYearId", params.schoolYearId);
  fd.set("enrollmentDate", "2024-09-01");
  fd.set("isActive", params.isDraft ? "false" : "true");
  fd.set("isDraft", params.isDraft ? "true" : "false");
  fd.set("childNumber", params.marker);
  fd.set("busAttendance", "false");
  fd.set("diaperType", "");
  fd.set("milkType", "");
  fd.set("milkPortions", "0");
  fd.set("milkScoop", "0");
  fd.set("milkTime1", "");
  fd.set("milkTime2", "");
  fd.set("milkTime3", "");
  fd.set("lunchIncluded", "true");
  fd.set("sleepFrom", "");
  fd.set("sleepTo", "");
  fd.set("remarks", "temporary write-flow verification");
  fd.set("language", "English");
  fd.set("previousGarderie", "false");
  fd.set("previousGarderieName", "");
  fd.set("garderieFees", isUpdate ? "125" : "100");
  fd.set("extraFees", "0");
  fd.set("busFees", "0");
  fd.set("apronFees", "0");
  fd.set("registrationFees", "0");
  fd.set("activitiesFees", "0");
  fd.set("discount", "0");
  fd.set("tva", "0");
  fd.set("financialRemarks", "");

  fd.set(
    "mother",
    JSON.stringify({
      firstName: "Verifier",
      lastName: "Mother",
      nationality: "",
      phone: "",
      mobile: "+961000000",
      email: "",
      profession: "",
      workplace: "",
      workPhone: "",
      maritalStatus: "",
      divorceSituation: "",
      medicalCase: "",
      canPickUp: true,
      idNumber: "",
    }),
  );
  fd.set(
    "father",
    JSON.stringify({
      firstName: "Verifier",
      lastName: "Father",
      nationality: "",
      phone: "",
      mobile: "+961000001",
      email: "",
      profession: "",
      workplace: "",
      workPhone: "",
      maritalStatus: "",
      divorceSituation: "",
      medicalCase: "",
      canPickUp: true,
      idNumber: "",
    }),
  );
  fd.set(
    "addresses",
    JSON.stringify([
      {
        recordId: params.addressRecordId,
        addressType: "Home",
        country: "Lebanon",
        street: isUpdate ? "Updated Street" : "Draft Street",
        building: "Verification Building",
        floor: "2",
        city: "Beirut",
        telephone: "",
        latitude: isUpdate ? "34.12345" : "33.885",
        longitude: isUpdate ? "35.98765" : "35.513",
      },
    ]),
  );
  fd.set(
    "siblings",
    JSON.stringify([
      {
        recordId: params.siblingRecordId,
        relation: "Brother",
        firstName: isUpdate ? "SiblingUpdated" : "SiblingDraft",
        dateOfBirth: "2018-03-04",
        medicalCase: "",
        canPickUp: false,
      },
    ]),
  );
  fd.set(
    "relatives",
    JSON.stringify([
      {
        recordId: params.relativeRecordId,
        name: isUpdate ? "RelativeUpdated" : "RelativeDraft",
        lastName: "Codex",
        relation: "Uncle",
        phone: "+961000002",
        mobile: "",
        isAuthorized: true,
        isEmergencyContact: true,
      },
    ]),
  );
  fd.set(
    "accountingEntries",
    JSON.stringify([
      {
        recordId: params.accountingRecordId,
        description: isUpdate ? "Updated write-flow fee" : "Draft write-flow fee",
        amount: isUpdate ? 125 : 100,
        type: "FEE",
      },
    ]),
  );
  fd.set("attachments", JSON.stringify([]));

  return fd;
}

async function main() {
  await cleanup();
  const { ctx, branchId, classId, schoolYearId } =
    await findVerificationContext();
  process.env.GARDERIE_VERIFY_USER_ID = ctx.userId;

  const actions = (await import("@/lib/actions/children")) as ActionModule;
  const draftResult = await actions.createChild(
    childFormData({
      marker,
      branchId,
      classId,
      schoolYearId,
      isDraft: true,
      revision: "create",
    }),
  );
  assert.equal(
    draftResult.success,
    true,
    `draft create action should succeed: ${JSON.stringify(draftResult)}`,
  );

  const childId = draftResult.id;
  const draft = await db.child.findUnique({
    where: { id: childId },
    include: {
      addresses: true,
      siblings: true,
      relatives: true,
      accountingEntries: true,
      history: true,
    },
  });
  assert.ok(draft, "created draft child should exist");
  assert.equal(draft.isDraft, true);
  assert.equal(draft.isActive, false);
  assert.equal(draft.addresses.length, 1);
  assert.equal(draft.siblings.length, 1);
  assert.equal(draft.relatives.length, 1);
  assert.equal(draft.accountingEntries.length, 1);
  assert.equal(jsonRecord(draft.addresses[0].legacyData).Latitude, "33.885");
  assert.equal(jsonRecord(draft.addresses[0].legacyData).Longitude, "35.513");

  const updateResult = await actions.updateChild(
    childId,
    childFormData({
      marker,
      branchId,
      classId,
      schoolYearId,
      isDraft: false,
      revision: "update",
      addressRecordId: draft.addresses[0].id,
      siblingRecordId: draft.siblings[0].id,
      relativeRecordId: draft.relatives[0].id,
      accountingRecordId: draft.accountingEntries[0].id,
    }),
  );
  assert.equal(
    updateResult.success,
    true,
    `update action should succeed: ${JSON.stringify(updateResult)}`,
  );

  const updated = await db.child.findUnique({
    where: { id: childId },
    include: {
      addresses: true,
      siblings: true,
      relatives: true,
      accountingEntries: true,
      history: true,
    },
  });
  assert.ok(updated, "updated child should exist");
  assert.equal(updated.isDraft, false);
  assert.equal(updated.isActive, true);
  assert.equal(updated.firstName, "WriteFlowUpdated");
  assert.equal(updated.addresses.length, 1);
  assert.equal(updated.siblings.length, 1);
  assert.equal(updated.relatives.length, 1);
  assert.equal(updated.accountingEntries.length, 1);
  assert.equal(updated.addresses[0].id, draft.addresses[0].id);
  assert.equal(updated.siblings[0].id, draft.siblings[0].id);
  assert.equal(updated.relatives[0].id, draft.relatives[0].id);
  assert.equal(updated.accountingEntries[0].id, draft.accountingEntries[0].id);
  assert.equal(
    jsonRecord(updated.addresses[0].legacyData).Latitude,
    "34.12345",
  );
  assert.equal(
    jsonRecord(updated.addresses[0].legacyData).Longitude,
    "35.98765",
  );
  assert.ok(
    updated.history.length >= 2,
    "create and update actions should write child history snapshots",
  );

  await cleanup();
  const leftovers = await db.child.count({
    where: {
      childNumber: {
        startsWith: "codex-write-flow-",
      },
    },
  });
  assert.equal(leftovers, 0, "temporary child write-flow rows should be cleaned");

  console.log(
    JSON.stringify(
      {
        verifier: "child-details-write-flow",
        userId: ctx.userId,
        branchId,
        classId,
        schoolYearId,
        draftCreated: true,
        updatePreservedNestedRows: true,
        cleanedUp: true,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error: unknown) => {
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error(cleanupError);
    }
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
