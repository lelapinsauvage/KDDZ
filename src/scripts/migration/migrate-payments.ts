/**
 * Migration: t_payments → Payment + AccountingEntry
 *            t_accounting → AccountingEntry
 *
 * Field mapping (t_payments → Payment):
 *   cpid         → (old ID, mapped to UUID)
 *   cid          → childId (FK via child mapping)
 *   amount       → amount
 *   currency     → currency (normalize to "USD" / "LBP")
 *   datetime     → date
 *   from         → dateFrom
 *   to           → dateTo
 *   for          → month (extract month number if possible)
 *   type         → method (cash/check/creditcard/bank → PaymentMethod enum)
 *   target       → category (monthly/reg/bus/xtra/other → PaymentCategory enum)
 *   cheque       → reference
 *   notes        → notes
 *   active       → (skip inactive)
 *   uby          → createdById (if user mapping available)
 *   pay_num      → (not migrated — will be regenerated)
 *
 * Field mapping (t_accounting → AccountingEntry):
 *   accid                → (old ID)
 *   child_id             → childId
 *   general_fees_total   → amount (type=FEE, description="General Fees")
 *   xtra_fees_total      → amount (type=FEE, description="Extra Fees")
 *   bus_fees_total       → amount (type=FEE, description="Bus Fees")
 *   apron_fees_total     → amount (type=FEE, description="Apron Fees")
 *   reg_fees_total       → amount (type=FEE, description="Registration Fees")
 *   act_fees_total       → amount (type=FEE, description="Activity Fees")
 *   *_disc               → amount (type=DISCOUNT, description="... Discount")
 *
 * Prerequisites: Children must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  parseDate,
  mapPaymentMethod,
  mapPaymentCategory,
  toFloat,
  toInt,
  cleanString,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldPayment {
  cpid: number;
  cid: number;
  type: string;
  cheque: string;
  target: string;
  notes: string;
  for: string;
  year: string;
  from: string;
  to: string;
  image: string;
  amount: number;
  amount_init: number;
  currency: string;
  currency_nm: string;
  datetime: string;
  active: number;
  uby: number;
  pay_num: string;
  prefix: number;
}

interface OldAccounting {
  accid: number;
  general_fees_net: number;
  general_fees_disc: number;
  general_fees_total: number;
  xtra_fees_net: number;
  xtra_fees_disc: number;
  xtra_fees_total: number;
  bus_fees_net: number;
  bus_fees_disc: number;
  bus_fees_total: number;
  apron_fees_net: number;
  apron_fees_disc: number;
  apron_fees_total: number;
  reg_fees_net: number;
  reg_fees_disc: number;
  reg_fees_total: number;
  act_fees_net: number;
  act_fees_disc: number;
  act_fees_total: number;
  accounting_remarks: string;
  child_id: string;
  active: number;
  datetime: string;
}

function normalizeCurrency(val: string | null | undefined): string {
  if (!val) return "USD";
  const v = val.toUpperCase().trim();
  if (v === "LL" || v === "LBP" || v.includes("LBP") || v.includes("ليرة"))
    return "LBP";
  return "USD";
}

export async function migratePayments(prisma: PrismaClient) {
  log("=== Migrating Payments ===");
  const dryRun = isDryRun();

  // --- t_payments → Payment ---
  const oldRows = await queryMysql<OldPayment>(
    "SELECT * FROM t_payments WHERE active = 1 ORDER BY cpid"
  );
  log(`Found ${oldRows.length} payments in old DB`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const childId = getMapping("child", row.cid);
    if (!childId) {
      errors++;
      continue;
    }

    // Idempotency: check by child + amount + date
    const payDate = row.datetime ? new Date(row.datetime) : new Date();
    const existing = await prisma.payment.findFirst({
      where: {
        childId,
        amount: toFloat(row.amount),
        createdAt: payDate,
      },
    });
    if (existing) {
      setMapping("payment", row.cpid, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.payment.create({
        data: {
          id: newId,
          childId,
          amount: toFloat(row.amount),
          currency: normalizeCurrency(row.currency),
          date: payDate,
          dateFrom: parseDate(row.from),
          dateTo: parseDate(row.to),
          month: extractMonth(row.for),
          method: mapPaymentMethod(row.type),
          category: mapPaymentCategory(row.target),
          reference: cleanString(row.cheque),
          notes: cleanString(row.notes),
          status: "PAID",
          createdAt: payDate,
        },
      });
    }

    setMapping("payment", row.cpid, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Payments");
  }

  log(
    `Payments: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
  );

  // --- t_accounting → AccountingEntry ---
  await migrateAccounting(prisma, dryRun);

  log(`=== Payments migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

function extractMonth(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseInt(val, 10);
  if (!isNaN(n) && n >= 1 && n <= 12) return n;
  // Try month name matching
  const monthNames: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4,
    jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return monthNames[val.toLowerCase().trim()] ?? null;
}

async function migrateAccounting(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldAccounting>(
    "SELECT * FROM t_accounting WHERE active = 1 ORDER BY accid"
  );
  log(`Found ${rows.length} accounting records in old DB`);

  const feeTypes = [
    { netField: "general_fees_net", discField: "general_fees_disc", totalField: "general_fees_total", label: "General Fees" },
    { netField: "xtra_fees_net", discField: "xtra_fees_disc", totalField: "xtra_fees_total", label: "Extra Fees" },
    { netField: "bus_fees_net", discField: "bus_fees_disc", totalField: "bus_fees_total", label: "Bus Fees" },
    { netField: "apron_fees_net", discField: "apron_fees_disc", totalField: "apron_fees_total", label: "Apron Fees" },
    { netField: "reg_fees_net", discField: "reg_fees_disc", totalField: "reg_fees_total", label: "Registration Fees" },
    { netField: "act_fees_net", discField: "act_fees_disc", totalField: "act_fees_total", label: "Activity Fees" },
  ] as const;

  let feeCount = 0;
  let discCount = 0;

  for (const row of rows) {
    const childId = getMapping("child", row.child_id);
    if (!childId) continue;

    const entryDate = row.datetime ? new Date(row.datetime) : new Date();

    for (const ft of feeTypes) {
      const total = toFloat((row as unknown as Record<string, unknown>)[ft.totalField]);
      const disc = toFloat((row as unknown as Record<string, unknown>)[ft.discField]);

      // Create fee entry if total > 0
      if (total > 0 && !dryRun) {
        await prisma.accountingEntry.create({
          data: {
            id: generateUUID(),
            childId,
            description: ft.label,
            amount: total,
            type: "FEE",
            date: entryDate,
          },
        });
        feeCount++;
      }

      // Create discount entry if disc > 0
      if (disc > 0 && !dryRun) {
        await prisma.accountingEntry.create({
          data: {
            id: generateUUID(),
            childId,
            description: `${ft.label} Discount`,
            amount: disc,
            type: "DISCOUNT",
            date: entryDate,
          },
        });
        discCount++;
      }
    }
  }

  log(`Accounting: ${feeCount} fee entries, ${discCount} discount entries`);
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migratePayments(prisma);
    } catch (err) {
      logError("Payment migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
