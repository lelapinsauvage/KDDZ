-- Restore legacy newpayment rows used to drive payment reminder notifications.

CREATE TABLE "payment_reminders" (
    "id" UUID NOT NULL,
    "sourceDatabase" TEXT,
    "legacyKey" TEXT,
    "legacyId" INTEGER,
    "paymentId" UUID,
    "legacyPaymentId" INTEGER,
    "childId" UUID,
    "legacyChildId" INTEGER,
    "category" "PaymentCategory" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(10, 2),
    "currency" TEXT,
    "dueDate" DATE,
    "month" INTEGER,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "legacyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_reminders_legacyKey_key"
    ON "payment_reminders"("legacyKey");

CREATE INDEX "payment_reminders_sourceDatabase_idx"
    ON "payment_reminders"("sourceDatabase");

CREATE INDEX "payment_reminders_legacyId_idx"
    ON "payment_reminders"("legacyId");

CREATE INDEX "payment_reminders_paymentId_idx"
    ON "payment_reminders"("paymentId");

CREATE INDEX "payment_reminders_legacyPaymentId_idx"
    ON "payment_reminders"("legacyPaymentId");

CREATE INDEX "payment_reminders_childId_idx"
    ON "payment_reminders"("childId");

CREATE INDEX "payment_reminders_legacyChildId_idx"
    ON "payment_reminders"("legacyChildId");

CREATE INDEX "payment_reminders_category_idx"
    ON "payment_reminders"("category");

CREATE INDEX "payment_reminders_dueDate_idx"
    ON "payment_reminders"("dueDate");

CREATE INDEX "payment_reminders_sent_idx"
    ON "payment_reminders"("sent");

ALTER TABLE "payment_reminders"
    ADD CONSTRAINT "payment_reminders_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_reminders"
    ADD CONSTRAINT "payment_reminders_childId_fkey"
    FOREIGN KEY ("childId") REFERENCES "children"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
