import "dotenv/config";
import { PrismaClient, UserRole, Gender, ParentType, FoodCategory } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hashSync } from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const HASH_ROUNDS = 10;
const DEFAULT_PASSWORD = "password123";

async function main() {
  console.log("Seeding database...\n");

  const passwordHash = hashSync(DEFAULT_PASSWORD, HASH_ROUNDS);

  await prisma.$transaction(async (tx) => {
    // ─────────────────────────────────────────────
    // DELETE ALL EXISTING DATA (reverse dependency order)
    // ─────────────────────────────────────────────
    console.log("Cleaning existing data...");

    await tx.pushToken.deleteMany();
    await tx.notification.deleteMany();
    await tx.notificationReceipt.deleteMany();
    await tx.legacyNotificationLog.deleteMany();
    await tx.legacyLoginTimestamp.deleteMany();
    await tx.legacySetting.deleteMany();
    await tx.alarm.deleteMany();
    await tx.holiday.deleteMany();
    await tx.event.deleteMany();
    await tx.eventType.deleteMany();
    await tx.message.deleteMany();
    await tx.messageThread.deleteMany();
    await tx.accountingEntry.deleteMany();
    await tx.paymentReminder.deleteMany();
    await tx.payment.deleteMany();
    await tx.assessmentDate.deleteMany();
    await tx.assessment.deleteMany();
    await tx.foodApplication.deleteMany();
    await tx.foodCalendar.deleteMany();
    await tx.food.deleteMany();
    await tx.vaccination.deleteMany();
    await tx.formAttachment.deleteMany();
    await tx.callCause.deleteMany();
    await tx.medicalFormEntry.deleteMany();
    await tx.medicalForm.deleteMany();
    await tx.absenceAttachment.deleteMany();
    await tx.absenceReport.deleteMany();
    await tx.dailyReportAttachment.deleteMany();
    await tx.dailyReportMilk.deleteMany();
    await tx.dailyReportFever.deleteMany();
    await tx.dailyReport.deleteMany();
    await tx.childHistory.deleteMany();
    await tx.childAttachment.deleteMany();
    await tx.relative.deleteMany();
    await tx.parent.deleteMany();
    await tx.childAddress.deleteMany();
    await tx.parentUser.deleteMany();
    await tx.child.deleteMany();
    await tx.managerAttachment.deleteMany();
    await tx.managerAddress.deleteMany();
    await tx.manager.deleteMany();
    await tx.doctorAttachment.deleteMany();
    await tx.doctorAddress.deleteMany();
    await tx.doctor.deleteMany();
    await tx.nurseAttachment.deleteMany();
    await tx.nurseAddress.deleteMany();
    await tx.nurse.deleteMany();
    await tx.teacherExperience.deleteMany();
    await tx.teacherAttachment.deleteMany();
    await tx.teacherAddress.deleteMany();
    await tx.teacher.deleteMany();
    await tx.session.deleteMany();
    await tx.account.deleteMany();
    await tx.verificationToken.deleteMany();
    await tx.settings.deleteMany();
    await tx.class.deleteMany();
    await tx.user.deleteMany();
    await tx.region.deleteMany();
    await tx.district.deleteMany();
    await tx.province.deleteMany();
    await tx.schoolYear.deleteMany();
    await tx.branch.deleteMany();
    await tx.organization.deleteMany();

    console.log("All existing data deleted.\n");

    // ─────────────────────────────────────────────
    // ORGANIZATION
    // ─────────────────────────────────────────────
    console.log("Creating organization...");

    const org = await tx.organization.create({
      data: {
        name: "KiddzOnline Nursery",
        slug: "kiddzonline-nursery",
        settings: {
          timezone: "Asia/Beirut",
          currency: "USD",
          language: "en",
        },
      },
    });

    // ─────────────────────────────────────────────
    // BRANCHES
    // ─────────────────────────────────────────────
    console.log("Creating branches...");

    const mainBranch = await tx.branch.create({
      data: {
        organizationId: org.id,
        name: "Main Branch",
        address: "Achrafieh, Beirut",
        phone: "+961-1-123456",
        email: "main@kiddzoline.com",
        isActive: true,
      },
    });

    const downtownBranch = await tx.branch.create({
      data: {
        organizationId: org.id,
        name: "Downtown Branch",
        address: "Hamra, Beirut",
        phone: "+961-1-654321",
        email: "downtown@kiddzoline.com",
        isActive: true,
      },
    });

    const suburbBranch = await tx.branch.create({
      data: {
        organizationId: org.id,
        name: "Suburb Branch",
        address: "Jdeideh, Mount Lebanon",
        phone: "+961-4-987654",
        email: "suburb@kiddzoline.com",
        isActive: true,
      },
    });

    // ─────────────────────────────────────────────
    // SCHOOL YEARS
    // ─────────────────────────────────────────────
    console.log("Creating school years...");

    const activeSchoolYear = await tx.schoolYear.create({
      data: {
        label: "2024-2025",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-06-30"),
        isActive: true,
      },
    });

    const _inactiveSchoolYear = await tx.schoolYear.create({
      data: {
        label: "2023-2024",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2024-06-30"),
        isActive: false,
      },
    });

    // ─────────────────────────────────────────────
    // CLASSES (6 total, 2 per branch)
    // ─────────────────────────────────────────────
    console.log("Creating classes...");

    // Main Branch
    const nurseryA = await tx.class.create({
      data: {
        branchId: mainBranch.id,
        name: "Nursery A",
        capacity: 15,
        ageGroup: "0-1",
        isActive: true,
      },
    });

    const toddlerA = await tx.class.create({
      data: {
        branchId: mainBranch.id,
        name: "Toddler A",
        capacity: 12,
        ageGroup: "1-2",
        isActive: true,
      },
    });

    // Downtown Branch
    const nurseryB = await tx.class.create({
      data: {
        branchId: downtownBranch.id,
        name: "Nursery B",
        capacity: 18,
        ageGroup: "0-1",
        isActive: true,
      },
    });

    const preKA = await tx.class.create({
      data: {
        branchId: downtownBranch.id,
        name: "Pre-K A",
        capacity: 20,
        ageGroup: "3-4",
        isActive: true,
      },
    });

    // Suburb Branch
    const toddlerB = await tx.class.create({
      data: {
        branchId: suburbBranch.id,
        name: "Toddler B",
        capacity: 10,
        ageGroup: "1-2",
        isActive: true,
      },
    });

    const preKB = await tx.class.create({
      data: {
        branchId: suburbBranch.id,
        name: "Pre-K B",
        capacity: 16,
        ageGroup: "3-4",
        isActive: true,
      },
    });

    // ─────────────────────────────────────────────
    // USERS (5 staff + 1 admin)
    // ─────────────────────────────────────────────
    console.log("Creating users...");

    const _adminUser = await tx.user.create({
      data: {
        email: "admin@garderie.com",
        passwordHash,
        name: "Karim Admin",
        role: UserRole.ADMIN,
        isActive: true,
        branchId: null,
      },
    });

    const teacherUser = await tx.user.create({
      data: {
        email: "teacher@garderie.com",
        passwordHash,
        name: "Sara Teacher",
        role: UserRole.TEACHER,
        isActive: true,
        branchId: mainBranch.id,
      },
    });

    const nurseUser = await tx.user.create({
      data: {
        email: "nurse@garderie.com",
        passwordHash,
        name: "Layla Nurse",
        role: UserRole.NURSE,
        isActive: true,
        branchId: mainBranch.id,
      },
    });

    const doctorUser = await tx.user.create({
      data: {
        email: "doctor@garderie.com",
        passwordHash,
        name: "Ahmad Doctor",
        role: UserRole.DOCTOR,
        isActive: true,
        branchId: downtownBranch.id,
      },
    });

    const managerUser = await tx.user.create({
      data: {
        email: "manager@garderie.com",
        passwordHash,
        name: "Omar Manager",
        role: UserRole.MANAGER,
        isActive: true,
        branchId: suburbBranch.id,
      },
    });

    // ─────────────────────────────────────────────
    // STAFF PROFILES (linked to users)
    // ─────────────────────────────────────────────
    console.log("Creating staff profiles...");

    await tx.teacher.create({
      data: {
        userId: teacherUser.id,
        firstName: "Sara",
        lastName: "Teacher",
        phone: "+961-3-111111",
        mobile: "+961-71-111111",
        email: "teacher@garderie.com",
        nationality: "Lebanese",
        dateOfBirth: new Date("1990-05-15"),
        hireDate: new Date("2022-09-01"),
        branchId: mainBranch.id,
        specialization: "Early Childhood Education",
        isActive: true,
      },
    });

    await tx.nurse.create({
      data: {
        userId: nurseUser.id,
        firstName: "Layla",
        lastName: "Nurse",
        phone: "+961-3-222222",
        mobile: "+961-71-222222",
        email: "nurse@garderie.com",
        nationality: "Lebanese",
        dateOfBirth: new Date("1988-03-20"),
        hireDate: new Date("2021-01-15"),
        branchId: mainBranch.id,
        specialization: "Pediatric Nursing",
        isActive: true,
      },
    });

    await tx.doctor.create({
      data: {
        userId: doctorUser.id,
        firstName: "Ahmad",
        lastName: "Doctor",
        phone: "+961-3-333333",
        mobile: "+961-71-333333",
        email: "doctor@garderie.com",
        nationality: "Lebanese",
        dateOfBirth: new Date("1985-11-10"),
        hireDate: new Date("2023-03-01"),
        branchId: downtownBranch.id,
        specialization: "Pediatrics",
        licenseNumber: "LB-PED-12345",
        isActive: true,
      },
    });

    await tx.manager.create({
      data: {
        userId: managerUser.id,
        firstName: "Omar",
        lastName: "Manager",
        phone: "+961-3-444444",
        mobile: "+961-71-444444",
        email: "manager@garderie.com",
        nationality: "Lebanese",
        dateOfBirth: new Date("1982-07-25"),
        hireDate: new Date("2020-06-01"),
        branchId: suburbBranch.id,
        specialization: "School Administration",
        isActive: true,
      },
    });

    // ─────────────────────────────────────────────
    // CHILDREN (12 children with Lebanese names)
    // ─────────────────────────────────────────────
    console.log("Creating children...");

    const childrenData: Array<{
      firstName: string;
      middleName: string;
      lastName: string;
      dateOfBirth: Date;
      gender: Gender;
      bloodType: string;
      branchId: string;
      classId: string;
      parentType: ParentType;
      parentFirstName: string;
      parentLastName: string;
      parentPhone: string;
      parentEmail: string;
    }> = [
      // Main Branch - Nursery A (3 children)
      {
        firstName: "Lara",
        middleName: "Sami",
        lastName: "Haddad",
        dateOfBirth: new Date("2023-03-12"),
        gender: Gender.FEMALE,
        bloodType: "A+",
        branchId: mainBranch.id,
        classId: nurseryA.id,
        parentType: ParentType.MOTHER,
        parentFirstName: "Nadia",
        parentLastName: "Haddad",
        parentPhone: "+961-3-500001",
        parentEmail: "nadia.haddad@email.com",
      },
      {
        firstName: "Adam",
        middleName: "Fadi",
        lastName: "Khoury",
        dateOfBirth: new Date("2023-06-22"),
        gender: Gender.MALE,
        bloodType: "O+",
        branchId: mainBranch.id,
        classId: nurseryA.id,
        parentType: ParentType.FATHER,
        parentFirstName: "Fadi",
        parentLastName: "Khoury",
        parentPhone: "+961-3-500002",
        parentEmail: "fadi.khoury@email.com",
      },
      {
        firstName: "Mia",
        middleName: "Georges",
        lastName: "Gemayel",
        dateOfBirth: new Date("2023-01-05"),
        gender: Gender.FEMALE,
        bloodType: "B+",
        branchId: mainBranch.id,
        classId: nurseryA.id,
        parentType: ParentType.MOTHER,
        parentFirstName: "Rita",
        parentLastName: "Gemayel",
        parentPhone: "+961-3-500003",
        parentEmail: "rita.gemayel@email.com",
      },

      // Main Branch - Toddler A (2 children)
      {
        firstName: "Jad",
        middleName: "Walid",
        lastName: "Nassar",
        dateOfBirth: new Date("2022-08-15"),
        gender: Gender.MALE,
        bloodType: "AB+",
        branchId: mainBranch.id,
        classId: toddlerA.id,
        parentType: ParentType.FATHER,
        parentFirstName: "Walid",
        parentLastName: "Nassar",
        parentPhone: "+961-3-500004",
        parentEmail: "walid.nassar@email.com",
      },
      {
        firstName: "Lea",
        middleName: "Tony",
        lastName: "Boustany",
        dateOfBirth: new Date("2022-11-30"),
        gender: Gender.FEMALE,
        bloodType: "O-",
        branchId: mainBranch.id,
        classId: toddlerA.id,
        parentType: ParentType.MOTHER,
        parentFirstName: "Maya",
        parentLastName: "Boustany",
        parentPhone: "+961-3-500005",
        parentEmail: "maya.boustany@email.com",
      },

      // Downtown Branch - Nursery B (2 children)
      {
        firstName: "Karim",
        middleName: "Hassan",
        lastName: "Saab",
        dateOfBirth: new Date("2023-04-18"),
        gender: Gender.MALE,
        bloodType: "A-",
        branchId: downtownBranch.id,
        classId: nurseryB.id,
        parentType: ParentType.FATHER,
        parentFirstName: "Hassan",
        parentLastName: "Saab",
        parentPhone: "+961-3-500006",
        parentEmail: "hassan.saab@email.com",
      },
      {
        firstName: "Nour",
        middleName: "Ali",
        lastName: "Mansour",
        dateOfBirth: new Date("2023-07-09"),
        gender: Gender.FEMALE,
        bloodType: "B-",
        branchId: downtownBranch.id,
        classId: nurseryB.id,
        parentType: ParentType.MOTHER,
        parentFirstName: "Rima",
        parentLastName: "Mansour",
        parentPhone: "+961-3-500007",
        parentEmail: "rima.mansour@email.com",
      },

      // Downtown Branch - Pre-K A (2 children)
      {
        firstName: "Zein",
        middleName: "Khalil",
        lastName: "Abi Saab",
        dateOfBirth: new Date("2020-12-03"),
        gender: Gender.MALE,
        bloodType: "O+",
        branchId: downtownBranch.id,
        classId: preKA.id,
        parentType: ParentType.FATHER,
        parentFirstName: "Khalil",
        parentLastName: "Abi Saab",
        parentPhone: "+961-3-500008",
        parentEmail: "khalil.abisaab@email.com",
      },
      {
        firstName: "Tia",
        middleName: "Marwan",
        lastName: "Daher",
        dateOfBirth: new Date("2021-02-14"),
        gender: Gender.FEMALE,
        bloodType: "A+",
        branchId: downtownBranch.id,
        classId: preKA.id,
        parentType: ParentType.MOTHER,
        parentFirstName: "Lina",
        parentLastName: "Daher",
        parentPhone: "+961-3-500009",
        parentEmail: "lina.daher@email.com",
      },

      // Suburb Branch - Toddler B (2 children)
      {
        firstName: "Rayan",
        middleName: "Elie",
        lastName: "Frem",
        dateOfBirth: new Date("2022-09-20"),
        gender: Gender.MALE,
        bloodType: "AB-",
        branchId: suburbBranch.id,
        classId: toddlerB.id,
        parentType: ParentType.FATHER,
        parentFirstName: "Elie",
        parentLastName: "Frem",
        parentPhone: "+961-3-500010",
        parentEmail: "elie.frem@email.com",
      },
      {
        firstName: "Yasmine",
        middleName: "Samir",
        lastName: "Geagea",
        dateOfBirth: new Date("2022-05-07"),
        gender: Gender.FEMALE,
        bloodType: "B+",
        branchId: suburbBranch.id,
        classId: toddlerB.id,
        parentType: ParentType.MOTHER,
        parentFirstName: "Carla",
        parentLastName: "Geagea",
        parentPhone: "+961-3-500011",
        parentEmail: "carla.geagea@email.com",
      },

      // Suburb Branch - Pre-K B (1 child)
      {
        firstName: "Tarek",
        middleName: "Bassam",
        lastName: "Hariri",
        dateOfBirth: new Date("2021-06-28"),
        gender: Gender.MALE,
        bloodType: "O+",
        branchId: suburbBranch.id,
        classId: preKB.id,
        parentType: ParentType.FATHER,
        parentFirstName: "Bassam",
        parentLastName: "Hariri",
        parentPhone: "+961-3-500012",
        parentEmail: "bassam.hariri@email.com",
      },
    ];

    for (const data of childrenData) {
      const child = await tx.child.create({
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          nationality: "Lebanese",
          bloodType: data.bloodType,
          branchId: data.branchId,
          classId: data.classId,
          schoolYearId: activeSchoolYear.id,
          isActive: true,
          isDraft: false,
          enrollmentDate: new Date("2024-09-01"),
          language: "Arabic",
        },
      });

      // Create one parent per child
      await tx.parent.create({
        data: {
          childId: child.id,
          type: data.parentType,
          firstName: data.parentFirstName,
          lastName: data.parentLastName,
          nationality: "Lebanese",
          phone: data.parentPhone,
          mobile: data.parentPhone,
          email: data.parentEmail,
        },
      });
    }

    // ─────────────────────────────────────────────
    // FOOD (8 items)
    // ─────────────────────────────────────────────
    console.log("Creating food items...");

    // Breakfast (3)
    await tx.food.create({
      data: { name: "Cereal", category: FoodCategory.BREAKFAST, isActive: true },
    });
    await tx.food.create({
      data: { name: "Pancakes", category: FoodCategory.BREAKFAST, isActive: true },
    });
    await tx.food.create({
      data: { name: "Fruit Bowl", category: FoodCategory.BREAKFAST, isActive: true },
    });

    // Lunch (3)
    await tx.food.create({
      data: { name: "Chicken Rice", category: FoodCategory.LUNCH, isActive: true },
    });
    await tx.food.create({
      data: { name: "Pasta", category: FoodCategory.LUNCH, isActive: true },
    });
    await tx.food.create({
      data: { name: "Grilled Fish", category: FoodCategory.LUNCH, isActive: true },
    });

    // Dessert (2)
    await tx.food.create({
      data: { name: "Yogurt", category: FoodCategory.DESSERT, isActive: true },
    });
    await tx.food.create({
      data: { name: "Fruit Salad", category: FoodCategory.DESSERT, isActive: true },
    });

    // ─────────────────────────────────────────────
    // PROVINCES / DISTRICTS / REGIONS
    // ─────────────────────────────────────────────
    console.log("Creating locations (provinces, districts, regions)...");

    // Beirut
    const beirut = await tx.province.create({
      data: { name: "Beirut" },
    });

    const beirutDistrict = await tx.district.create({
      data: {
        name: "Beirut District",
        provinceId: beirut.id,
      },
    });

    await tx.region.create({
      data: { name: "Achrafieh", districtId: beirutDistrict.id },
    });
    await tx.region.create({
      data: { name: "Hamra", districtId: beirutDistrict.id },
    });
    await tx.region.create({
      data: { name: "Verdun", districtId: beirutDistrict.id },
    });

    // Mount Lebanon
    const mountLebanon = await tx.province.create({
      data: { name: "Mount Lebanon" },
    });

    const metnDistrict = await tx.district.create({
      data: {
        name: "Metn",
        provinceId: mountLebanon.id,
      },
    });

    await tx.region.create({
      data: { name: "Jdeideh", districtId: metnDistrict.id },
    });
    await tx.region.create({
      data: { name: "Antelias", districtId: metnDistrict.id },
    });
    await tx.region.create({
      data: { name: "Dbayeh", districtId: metnDistrict.id },
    });

    console.log("\nSeed completed successfully!");
    console.log("──────────────────────────────────────");
    console.log("Summary:");
    console.log("  1 Organization: KiddzOnline Nursery");
    console.log("  3 Branches: Main, Downtown, Suburb");
    console.log("  2 School Years: 2024-2025 (active), 2023-2024 (inactive)");
    console.log("  6 Classes: 2 per branch");
    console.log("  6 Users: 1 admin + 5 staff");
    console.log("  4 Staff profiles: 1 teacher, 1 nurse, 1 doctor, 1 manager");
    console.log("  12 Children with 12 parents");
    console.log("  8 Food items: 3 breakfast, 3 lunch, 2 dessert");
    console.log("  2 Provinces, 2 Districts, 6 Regions");
    console.log("──────────────────────────────────────");
    console.log(`\nAll passwords: "${DEFAULT_PASSWORD}"`);
  }, { maxWait: 60000, timeout: 60000 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
