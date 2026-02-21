-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'NURSE', 'DOCTOR', 'MANAGER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('MOTHER', 'FATHER');

-- CreateEnum
CREATE TYPE "DailyReportStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MedicalFormType" AS ENUM ('GENERAL', 'CONDITIONS', 'VISITS', 'VACCINATIONS', 'ACCIDENTS');

-- CreateEnum
CREATE TYPE "MedicalFormStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('BREAKFAST', 'LUNCH', 'DESSERT', 'SNACK');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DESSERT', 'SNACK');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'TRANSFER');

-- CreateEnum
CREATE TYPE "AccountingEntryType" AS ENUM ('FEE', 'DISCOUNT', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "AlarmType" AS ENUM ('BIRTHDAY', 'ASSESSMENT', 'VACCINATION', 'MEDICAL', 'MEDICINE', 'EVENT', 'INSURANCE', 'PAYMENT', 'REQUEST', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "PortionSize" AS ENUM ('NONE', 'LITTLE', 'HALF', 'MOST', 'ALL');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_years" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "ageGroup" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "parent_users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "token" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "childId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "placeOfBirth" TEXT,
    "gender" "Gender",
    "nationality" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT,
    "photo" TEXT,
    "branchId" UUID NOT NULL,
    "classId" UUID,
    "schoolYearId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "enrollmentDate" DATE,
    "busAttendance" BOOLEAN NOT NULL DEFAULT false,
    "diaperType" TEXT,
    "milkType" TEXT,
    "milkPortions" INTEGER,
    "sleepFrom" TIME(6),
    "sleepTo" TIME(6),
    "remarks" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_addresses" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "street" TEXT,
    "building" TEXT,
    "floor" TEXT,
    "city" TEXT,
    "regionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "type" "ParentType" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nationality" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "workplace" TEXT,
    "workPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatives" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "phone" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_attachments" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_history" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "nationality" TEXT,
    "dateOfBirth" DATE,
    "hireDate" DATE,
    "branchId" UUID NOT NULL,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_addresses" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_attachments" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurses" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "nationality" TEXT,
    "dateOfBirth" DATE,
    "hireDate" DATE,
    "branchId" UUID NOT NULL,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurse_addresses" (
    "id" UUID NOT NULL,
    "nurseId" UUID NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurse_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurse_attachments" (
    "id" UUID NOT NULL,
    "nurseId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurse_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "nationality" TEXT,
    "dateOfBirth" DATE,
    "hireDate" DATE,
    "branchId" UUID NOT NULL,
    "specialization" TEXT,
    "licenseNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_addresses" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_attachments" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managers" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "nationality" TEXT,
    "dateOfBirth" DATE,
    "hireDate" DATE,
    "branchId" UUID NOT NULL,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_addresses" (
    "id" UUID NOT NULL,
    "managerId" UUID NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_attachments" (
    "id" UUID NOT NULL,
    "managerId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "reportDate" DATE NOT NULL,
    "status" "DailyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "breakfastFoodId" UUID,
    "breakfastPortion" "PortionSize",
    "breakfastTime" TIME(6),
    "lunchFoodId" UUID,
    "lunchPortion" "PortionSize",
    "lunchTime" TIME(6),
    "dessert" TEXT,
    "dessertPortion" "PortionSize",
    "dessertTime" TIME(6),
    "isSleep" BOOLEAN NOT NULL DEFAULT false,
    "sleepFrom" TIME(6),
    "sleepTo" TIME(6),
    "diarrhea" BOOLEAN NOT NULL DEFAULT false,
    "urinePotty" INTEGER NOT NULL DEFAULT 0,
    "stoolPotty" INTEGER NOT NULL DEFAULT 0,
    "urineDiaper" INTEGER NOT NULL DEFAULT 0,
    "stoolDiaper" INTEGER NOT NULL DEFAULT 0,
    "mood" TEXT,
    "cough" BOOLEAN NOT NULL DEFAULT false,
    "runnyNose" BOOLEAN NOT NULL DEFAULT false,
    "vomit" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_report_fevers" (
    "id" UUID NOT NULL,
    "dailyReportId" UUID NOT NULL,
    "temperature" DECIMAL(4,1) NOT NULL,
    "time" TIME(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_fevers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_report_milks" (
    "id" UUID NOT NULL,
    "dailyReportId" UUID NOT NULL,
    "amountCc" INTEGER NOT NULL,
    "time" TIME(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_milks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_report_attachments" (
    "id" UUID NOT NULL,
    "dailyReportId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absence_reports" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absence_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absence_attachments" (
    "id" UUID NOT NULL,
    "absenceReportId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_forms" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "formType" "MedicalFormType" NOT NULL,
    "status" "MedicalFormStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_form_entries" (
    "id" UUID NOT NULL,
    "medicalFormId" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_form_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dateGiven" DATE,
    "nextDueDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FoodCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_calendars" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "foodId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "assessmentType" INTEGER NOT NULL,
    "schoolYearId" UUID,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_dates" (
    "id" UUID NOT NULL,
    "assessmentType" INTEGER NOT NULL,
    "branchId" UUID NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "AccountingEntryType" NOT NULL,
    "date" DATE NOT NULL,
    "schoolYearId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "recipientId" UUID NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "threadId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "eventTypeId" UUID,
    "branchId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "branchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alarms" (
    "id" UUID NOT NULL,
    "type" "AlarmType" NOT NULL,
    "referenceId" UUID,
    "referenceType" TEXT,
    "message" TEXT,
    "dueDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alarms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "parentUserId" UUID,
    "token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_organizationId_idx" ON "branches"("organizationId");

-- CreateIndex
CREATE INDEX "classes_branchId_idx" ON "classes"("branchId");

-- CreateIndex
CREATE INDEX "settings_branchId_idx" ON "settings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_branchId_key_key" ON "settings"("branchId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_idx" ON "users"("branchId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "parent_users_username_key" ON "parent_users"("username");

-- CreateIndex
CREATE INDEX "parent_users_childId_idx" ON "parent_users"("childId");

-- CreateIndex
CREATE INDEX "parent_users_username_idx" ON "parent_users"("username");

-- CreateIndex
CREATE INDEX "children_branchId_idx" ON "children"("branchId");

-- CreateIndex
CREATE INDEX "children_classId_idx" ON "children"("classId");

-- CreateIndex
CREATE INDEX "children_schoolYearId_idx" ON "children"("schoolYearId");

-- CreateIndex
CREATE INDEX "children_isActive_idx" ON "children"("isActive");

-- CreateIndex
CREATE INDEX "children_lastName_firstName_idx" ON "children"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "child_addresses_childId_idx" ON "child_addresses"("childId");

-- CreateIndex
CREATE INDEX "child_addresses_regionId_idx" ON "child_addresses"("regionId");

-- CreateIndex
CREATE INDEX "parents_childId_idx" ON "parents"("childId");

-- CreateIndex
CREATE INDEX "parents_type_idx" ON "parents"("type");

-- CreateIndex
CREATE INDEX "relatives_childId_idx" ON "relatives"("childId");

-- CreateIndex
CREATE INDEX "child_attachments_childId_idx" ON "child_attachments"("childId");

-- CreateIndex
CREATE INDEX "child_history_childId_idx" ON "child_history"("childId");

-- CreateIndex
CREATE INDEX "child_history_createdAt_idx" ON "child_history"("createdAt");

-- CreateIndex
CREATE INDEX "teachers_branchId_idx" ON "teachers"("branchId");

-- CreateIndex
CREATE INDEX "teachers_userId_idx" ON "teachers"("userId");

-- CreateIndex
CREATE INDEX "teachers_isActive_idx" ON "teachers"("isActive");

-- CreateIndex
CREATE INDEX "teacher_addresses_teacherId_idx" ON "teacher_addresses"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_attachments_teacherId_idx" ON "teacher_attachments"("teacherId");

-- CreateIndex
CREATE INDEX "nurses_branchId_idx" ON "nurses"("branchId");

-- CreateIndex
CREATE INDEX "nurses_userId_idx" ON "nurses"("userId");

-- CreateIndex
CREATE INDEX "nurses_isActive_idx" ON "nurses"("isActive");

-- CreateIndex
CREATE INDEX "nurse_addresses_nurseId_idx" ON "nurse_addresses"("nurseId");

-- CreateIndex
CREATE INDEX "nurse_attachments_nurseId_idx" ON "nurse_attachments"("nurseId");

-- CreateIndex
CREATE INDEX "doctors_branchId_idx" ON "doctors"("branchId");

-- CreateIndex
CREATE INDEX "doctors_userId_idx" ON "doctors"("userId");

-- CreateIndex
CREATE INDEX "doctors_isActive_idx" ON "doctors"("isActive");

-- CreateIndex
CREATE INDEX "doctor_addresses_doctorId_idx" ON "doctor_addresses"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_attachments_doctorId_idx" ON "doctor_attachments"("doctorId");

-- CreateIndex
CREATE INDEX "managers_branchId_idx" ON "managers"("branchId");

-- CreateIndex
CREATE INDEX "managers_userId_idx" ON "managers"("userId");

-- CreateIndex
CREATE INDEX "managers_isActive_idx" ON "managers"("isActive");

-- CreateIndex
CREATE INDEX "manager_addresses_managerId_idx" ON "manager_addresses"("managerId");

-- CreateIndex
CREATE INDEX "manager_attachments_managerId_idx" ON "manager_attachments"("managerId");

-- CreateIndex
CREATE INDEX "daily_reports_childId_idx" ON "daily_reports"("childId");

-- CreateIndex
CREATE INDEX "daily_reports_reportDate_idx" ON "daily_reports"("reportDate");

-- CreateIndex
CREATE INDEX "daily_reports_status_idx" ON "daily_reports"("status");

-- CreateIndex
CREATE INDEX "daily_reports_createdById_idx" ON "daily_reports"("createdById");

-- CreateIndex
CREATE INDEX "daily_reports_breakfastFoodId_idx" ON "daily_reports"("breakfastFoodId");

-- CreateIndex
CREATE INDEX "daily_reports_lunchFoodId_idx" ON "daily_reports"("lunchFoodId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_childId_reportDate_key" ON "daily_reports"("childId", "reportDate");

-- CreateIndex
CREATE INDEX "daily_report_fevers_dailyReportId_idx" ON "daily_report_fevers"("dailyReportId");

-- CreateIndex
CREATE INDEX "daily_report_milks_dailyReportId_idx" ON "daily_report_milks"("dailyReportId");

-- CreateIndex
CREATE INDEX "daily_report_attachments_dailyReportId_idx" ON "daily_report_attachments"("dailyReportId");

-- CreateIndex
CREATE INDEX "absence_reports_childId_idx" ON "absence_reports"("childId");

-- CreateIndex
CREATE INDEX "absence_reports_date_idx" ON "absence_reports"("date");

-- CreateIndex
CREATE INDEX "absence_reports_status_idx" ON "absence_reports"("status");

-- CreateIndex
CREATE INDEX "absence_reports_createdById_idx" ON "absence_reports"("createdById");

-- CreateIndex
CREATE INDEX "absence_attachments_absenceReportId_idx" ON "absence_attachments"("absenceReportId");

-- CreateIndex
CREATE INDEX "medical_forms_childId_idx" ON "medical_forms"("childId");

-- CreateIndex
CREATE INDEX "medical_forms_formType_idx" ON "medical_forms"("formType");

-- CreateIndex
CREATE INDEX "medical_forms_status_idx" ON "medical_forms"("status");

-- CreateIndex
CREATE INDEX "medical_form_entries_medicalFormId_idx" ON "medical_form_entries"("medicalFormId");

-- CreateIndex
CREATE INDEX "medical_form_entries_field_idx" ON "medical_form_entries"("field");

-- CreateIndex
CREATE INDEX "vaccinations_childId_idx" ON "vaccinations"("childId");

-- CreateIndex
CREATE INDEX "vaccinations_nextDueDate_idx" ON "vaccinations"("nextDueDate");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE INDEX "foods_isActive_idx" ON "foods"("isActive");

-- CreateIndex
CREATE INDEX "food_calendars_branchId_idx" ON "food_calendars"("branchId");

-- CreateIndex
CREATE INDEX "food_calendars_date_idx" ON "food_calendars"("date");

-- CreateIndex
CREATE INDEX "food_calendars_foodId_idx" ON "food_calendars"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "food_calendars_branchId_date_mealType_key" ON "food_calendars"("branchId", "date", "mealType");

-- CreateIndex
CREATE INDEX "assessments_childId_idx" ON "assessments"("childId");

-- CreateIndex
CREATE INDEX "assessments_assessmentType_idx" ON "assessments"("assessmentType");

-- CreateIndex
CREATE INDEX "assessments_schoolYearId_idx" ON "assessments"("schoolYearId");

-- CreateIndex
CREATE INDEX "assessments_createdById_idx" ON "assessments"("createdById");

-- CreateIndex
CREATE INDEX "assessment_dates_branchId_idx" ON "assessment_dates"("branchId");

-- CreateIndex
CREATE INDEX "assessment_dates_assessmentType_idx" ON "assessment_dates"("assessmentType");

-- CreateIndex
CREATE INDEX "assessment_dates_scheduledDate_idx" ON "assessment_dates"("scheduledDate");

-- CreateIndex
CREATE INDEX "payments_childId_idx" ON "payments"("childId");

-- CreateIndex
CREATE INDEX "payments_date_idx" ON "payments"("date");

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");

-- CreateIndex
CREATE INDEX "payments_createdById_idx" ON "payments"("createdById");

-- CreateIndex
CREATE INDEX "accounting_entries_childId_idx" ON "accounting_entries"("childId");

-- CreateIndex
CREATE INDEX "accounting_entries_type_idx" ON "accounting_entries"("type");

-- CreateIndex
CREATE INDEX "accounting_entries_date_idx" ON "accounting_entries"("date");

-- CreateIndex
CREATE INDEX "accounting_entries_schoolYearId_idx" ON "accounting_entries"("schoolYearId");

-- CreateIndex
CREATE INDEX "messages_senderId_senderType_idx" ON "messages"("senderId", "senderType");

-- CreateIndex
CREATE INDEX "messages_recipientId_recipientType_idx" ON "messages"("recipientId", "recipientType");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "messages_isRead_idx" ON "messages"("isRead");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_eventTypeId_idx" ON "events"("eventTypeId");

-- CreateIndex
CREATE INDEX "events_branchId_idx" ON "events"("branchId");

-- CreateIndex
CREATE INDEX "events_isActive_idx" ON "events"("isActive");

-- CreateIndex
CREATE INDEX "holidays_date_idx" ON "holidays"("date");

-- CreateIndex
CREATE INDEX "holidays_branchId_idx" ON "holidays"("branchId");

-- CreateIndex
CREATE INDEX "alarms_type_idx" ON "alarms"("type");

-- CreateIndex
CREATE INDEX "alarms_dueDate_idx" ON "alarms"("dueDate");

-- CreateIndex
CREATE INDEX "alarms_isActive_idx" ON "alarms"("isActive");

-- CreateIndex
CREATE INDEX "alarms_branchId_idx" ON "alarms"("branchId");

-- CreateIndex
CREATE INDEX "alarms_referenceId_referenceType_idx" ON "alarms"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_userId_idx" ON "push_tokens"("userId");

-- CreateIndex
CREATE INDEX "push_tokens_parentUserId_idx" ON "push_tokens"("parentUserId");

-- CreateIndex
CREATE INDEX "push_tokens_platform_idx" ON "push_tokens"("platform");

-- CreateIndex
CREATE INDEX "districts_provinceId_idx" ON "districts"("provinceId");

-- CreateIndex
CREATE INDEX "regions_districtId_idx" ON "regions"("districtId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_users" ADD CONSTRAINT "parent_users_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_addresses" ADD CONSTRAINT "child_addresses_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_addresses" ADD CONSTRAINT "child_addresses_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatives" ADD CONSTRAINT "relatives_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_attachments" ADD CONSTRAINT "child_attachments_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_history" ADD CONSTRAINT "child_history_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_addresses" ADD CONSTRAINT "teacher_addresses_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attachments" ADD CONSTRAINT "teacher_attachments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurses" ADD CONSTRAINT "nurses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_addresses" ADD CONSTRAINT "nurse_addresses_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_attachments" ADD CONSTRAINT "nurse_attachments_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_addresses" ADD CONSTRAINT "doctor_addresses_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_attachments" ADD CONSTRAINT "doctor_attachments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managers" ADD CONSTRAINT "managers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_addresses" ADD CONSTRAINT "manager_addresses_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "managers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_attachments" ADD CONSTRAINT "manager_attachments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "managers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_breakfastFoodId_fkey" FOREIGN KEY ("breakfastFoodId") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_lunchFoodId_fkey" FOREIGN KEY ("lunchFoodId") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_fevers" ADD CONSTRAINT "daily_report_fevers_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_milks" ADD CONSTRAINT "daily_report_milks_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_attachments" ADD CONSTRAINT "daily_report_attachments_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_reports" ADD CONSTRAINT "absence_reports_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_reports" ADD CONSTRAINT "absence_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_attachments" ADD CONSTRAINT "absence_attachments_absenceReportId_fkey" FOREIGN KEY ("absenceReportId") REFERENCES "absence_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_forms" ADD CONSTRAINT "medical_forms_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_form_entries" ADD CONSTRAINT "medical_form_entries_medicalFormId_fkey" FOREIGN KEY ("medicalFormId") REFERENCES "medical_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_calendars" ADD CONSTRAINT "food_calendars_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_calendars" ADD CONSTRAINT "food_calendars_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_dates" ADD CONSTRAINT "assessment_dates_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarms" ADD CONSTRAINT "alarms_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "parent_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
