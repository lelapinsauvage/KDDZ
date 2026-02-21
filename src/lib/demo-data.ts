// ─────────────────────────────────────────────
// Demo data for client-side pages (until DB queries are wired up)
// Names and structure mirror prisma/seed.ts
// ─────────────────────────────────────────────

export interface DemoBranch {
  id: string;
  name: string;
}

export interface DemoClass {
  id: string;
  name: string;
  branchId: string;
  ageGroup: string;
}

export type ChildStatus = "ACTIVE" | "DRAFT";
export type ChildGender = "MALE" | "FEMALE";

export interface DemoChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO string, e.g. "2023-03-12"
  gender: ChildGender;
  nationality: string;
  bloodType: string;
  branchId: string;
  branchName: string;
  classId: string;
  className: string;
  status: ChildStatus;
  isActive: boolean;
  isDraft: boolean;
}

// ── Branches ──────────────────────────────────
export const demoBranches: DemoBranch[] = [
  { id: "branch-1", name: "Main Branch" },
  { id: "branch-2", name: "Downtown Branch" },
  { id: "branch-3", name: "Suburb Branch" },
];

// ── Classes (2 per branch, 6 total) ──────────
export const demoClasses: DemoClass[] = [
  { id: "class-1", name: "Nursery A", branchId: "branch-1", ageGroup: "0-1" },
  { id: "class-2", name: "Toddler A", branchId: "branch-1", ageGroup: "1-2" },
  { id: "class-3", name: "Nursery B", branchId: "branch-2", ageGroup: "0-1" },
  { id: "class-4", name: "Pre-K A", branchId: "branch-2", ageGroup: "3-4" },
  { id: "class-5", name: "Toddler B", branchId: "branch-3", ageGroup: "1-2" },
  { id: "class-6", name: "Pre-K B", branchId: "branch-3", ageGroup: "3-4" },
];

// ── Children (12, matching seed.ts) ──────────
export const demoChildren: DemoChild[] = [
  // Main Branch — Nursery A
  {
    id: "child-1",
    firstName: "Lara",
    lastName: "Haddad",
    dateOfBirth: "2023-03-12",
    gender: "FEMALE",
    nationality: "Lebanese",
    bloodType: "A+",
    branchId: "branch-1",
    branchName: "Main Branch",
    classId: "class-1",
    className: "Nursery A",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
  {
    id: "child-2",
    firstName: "Adam",
    lastName: "Khoury",
    dateOfBirth: "2023-06-22",
    gender: "MALE",
    nationality: "Lebanese",
    bloodType: "O+",
    branchId: "branch-1",
    branchName: "Main Branch",
    classId: "class-1",
    className: "Nursery A",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
  {
    id: "child-3",
    firstName: "Mia",
    lastName: "Gemayel",
    dateOfBirth: "2023-01-05",
    gender: "FEMALE",
    nationality: "Lebanese",
    bloodType: "B+",
    branchId: "branch-1",
    branchName: "Main Branch",
    classId: "class-1",
    className: "Nursery A",
    status: "DRAFT",
    isActive: false,
    isDraft: true,
  },

  // Main Branch — Toddler A
  {
    id: "child-4",
    firstName: "Jad",
    lastName: "Nassar",
    dateOfBirth: "2022-08-15",
    gender: "MALE",
    nationality: "Lebanese",
    bloodType: "AB+",
    branchId: "branch-1",
    branchName: "Main Branch",
    classId: "class-2",
    className: "Toddler A",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
  {
    id: "child-5",
    firstName: "Lea",
    lastName: "Boustany",
    dateOfBirth: "2022-11-30",
    gender: "FEMALE",
    nationality: "Lebanese",
    bloodType: "O-",
    branchId: "branch-1",
    branchName: "Main Branch",
    classId: "class-2",
    className: "Toddler A",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },

  // Downtown Branch — Nursery B
  {
    id: "child-6",
    firstName: "Karim",
    lastName: "Saab",
    dateOfBirth: "2023-04-18",
    gender: "MALE",
    nationality: "Lebanese",
    bloodType: "A-",
    branchId: "branch-2",
    branchName: "Downtown Branch",
    classId: "class-3",
    className: "Nursery B",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
  {
    id: "child-7",
    firstName: "Nour",
    lastName: "Mansour",
    dateOfBirth: "2023-07-09",
    gender: "FEMALE",
    nationality: "Lebanese",
    bloodType: "B-",
    branchId: "branch-2",
    branchName: "Downtown Branch",
    classId: "class-3",
    className: "Nursery B",
    status: "DRAFT",
    isActive: false,
    isDraft: true,
  },

  // Downtown Branch — Pre-K A
  {
    id: "child-8",
    firstName: "Zein",
    lastName: "Abi Saab",
    dateOfBirth: "2020-12-03",
    gender: "MALE",
    nationality: "Lebanese",
    bloodType: "O+",
    branchId: "branch-2",
    branchName: "Downtown Branch",
    classId: "class-4",
    className: "Pre-K A",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
  {
    id: "child-9",
    firstName: "Tia",
    lastName: "Daher",
    dateOfBirth: "2021-02-14",
    gender: "FEMALE",
    nationality: "Lebanese",
    bloodType: "A+",
    branchId: "branch-2",
    branchName: "Downtown Branch",
    classId: "class-4",
    className: "Pre-K A",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },

  // Suburb Branch — Toddler B
  {
    id: "child-10",
    firstName: "Rayan",
    lastName: "Frem",
    dateOfBirth: "2022-09-20",
    gender: "MALE",
    nationality: "Lebanese",
    bloodType: "AB-",
    branchId: "branch-3",
    branchName: "Suburb Branch",
    classId: "class-5",
    className: "Toddler B",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
  {
    id: "child-11",
    firstName: "Yasmine",
    lastName: "Geagea",
    dateOfBirth: "2022-05-07",
    gender: "FEMALE",
    nationality: "Lebanese",
    bloodType: "B+",
    branchId: "branch-3",
    branchName: "Suburb Branch",
    classId: "class-5",
    className: "Toddler B",
    status: "DRAFT",
    isActive: false,
    isDraft: true,
  },

  // Suburb Branch — Pre-K B
  {
    id: "child-12",
    firstName: "Tarek",
    lastName: "Hariri",
    dateOfBirth: "2021-06-28",
    gender: "MALE",
    nationality: "Lebanese",
    bloodType: "O+",
    branchId: "branch-3",
    branchName: "Suburb Branch",
    classId: "class-6",
    className: "Pre-K B",
    status: "ACTIVE",
    isActive: true,
    isDraft: false,
  },
];
