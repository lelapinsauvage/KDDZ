import type { PrototypeView, TerritoryId } from "./_data"

export type TerritoryStressMode = "default" | "long" | "rtl"

type TerritoryStressCopy = {
  views: Record<PrototypeView, string>
  today: Record<TerritoryId, { heading: string; summary: string }>
  children: {
    heading: string
    description: string
    add: string
    search: string
    all: string
    unknown: string
    incomplete: string
    filters: string
  }
  care: {
    heading: string
    description: string
    choose: string
    record: string
    save: string
    submit: string
  }
  review: {
    heading: string
    description: string
    confirm: string
    allocate: string
  }
}

export const territoryStressCopy: Record<TerritoryStressMode, TerritoryStressCopy> = {
  default: {
    views: {
      today: "Today",
      children: "Children",
      care: "Daily care",
      review: "Safety review",
    },
    today: {
      daylight: {
        heading: "Safe now. Two things need handling before lunch.",
        summary: "All four rooms are open. Meadow needs qualified cover at 12:30 and one Orchard arrival is still unknown.",
      },
      signal: {
        heading: "Riverside is safe now",
        summary: "Meadow requires cover before 12:30. Orchard remains unconfirmed.",
      },
      carebook: {
        heading: "Riverside is safe now. Meadow needs cover before 12:30.",
        summary: "Forty-one children have arrived, eleven staff are present, and one expected arrival in Orchard still needs confirming.",
      },
    },
    children: {
      heading: "Children",
      description: "Attendance, care completion, and current child context.",
      add: "Add child",
      search: "Search child or room",
      all: "All children",
      unknown: "Attendance unknown",
      incomplete: "Care incomplete",
      filters: "Filters",
    },
    care: {
      heading: "Record room care",
      description: "Apply one observed value, then review each child exception.",
      choose: "Choose observed children",
      record: "Record the shared observation",
      save: "Save draft",
      submit: "Review and submit",
    },
    review: {
      heading: "Two consequential changes",
      description: "Review source evidence and result before commitment.",
      confirm: "Confirm manager review",
      allocate: "Allocate EUR 240",
    },
  },
  long: {
    views: {
      today: "Today's nursery operations overview",
      children: "Children and family records",
      care: "Daily care observations",
      review: "Safety and financial review",
    },
    today: {
      daylight: {
        heading: "Safe now. Two operational responsibilities need a decision before the lunch handover.",
        summary: "All four nursery rooms are open. Meadow requires qualified practitioner cover at 12:30, and one expected arrival in Orchard still needs confirmation.",
      },
      signal: {
        heading: "Riverside nursery is operating safely right now",
        summary: "Meadow requires qualified cover before the 12:30 break. Orchard attendance remains unconfirmed.",
      },
      carebook: {
        heading: "Riverside nursery is safe now. Meadow needs qualified cover before the lunch handover at 12:30.",
        summary: "Forty-one children have arrived, eleven practitioners are present, and one expected Orchard arrival still needs confirmation before the attendance record is complete.",
      },
    },
    children: {
      heading: "Children and family records",
      description: "Review attendance confirmation, daily care completion, and each child's current operational context.",
      add: "Register a new child",
      search: "Search for a child, family, or nursery room",
      all: "All active child records",
      unknown: "Attendance confirmation needed",
      incomplete: "Daily care records incomplete",
      filters: "More record filters",
    },
    care: {
      heading: "Record shared room care observations",
      description: "Apply one directly observed value to the selected group, then review every child-specific exception.",
      choose: "Choose children included in this observation",
      record: "Record the shared care observation for this group",
      save: "Save this observation as a draft",
      submit: "Review children and submit observation",
    },
    review: {
      heading: "Review two consequential safety and financial changes",
      description: "Inspect source evidence, affected records, and the resulting consequence before making either commitment.",
      confirm: "Confirm manager review and notify family",
      allocate: "Allocate EUR 240 to July nursery fees",
    },
  },
  rtl: {
    views: {
      today: "اليوم",
      children: "سجلات الأطفال",
      care: "الرعاية اليومية",
      review: "مراجعة السلامة",
    },
    today: {
      daylight: {
        heading: "الحضانة آمنة الآن. هناك مهمتان تحتاجان إلى معالجة قبل الغداء.",
        summary: "جميع الغرف الأربع مفتوحة. تحتاج غرفة ميدو إلى تغطية مؤهلة عند 12:30، وما زال وصول طفل إلى غرفة أوركارد غير مؤكد.",
      },
      signal: {
        heading: "حضانة ريفرسايد آمنة الآن",
        summary: "تحتاج غرفة ميدو إلى تغطية قبل 12:30. وما زال الحضور في أوركارد غير مؤكد.",
      },
      carebook: {
        heading: "حضانة ريفرسايد آمنة الآن. تحتاج غرفة ميدو إلى تغطية مؤهلة قبل 12:30.",
        summary: "وصل واحد وأربعون طفلاً، ويوجد أحد عشر موظفاً، وما زال وصول طفل متوقع إلى أوركارد بحاجة إلى تأكيد.",
      },
    },
    children: {
      heading: "سجلات الأطفال والعائلات",
      description: "متابعة الحضور واكتمال الرعاية والسياق الحالي لكل طفل.",
      add: "إضافة طفل جديد",
      search: "البحث عن طفل أو عائلة أو غرفة",
      all: "جميع الأطفال",
      unknown: "الحضور غير مؤكد",
      incomplete: "تقارير الرعاية غير مكتملة",
      filters: "خيارات التصفية",
    },
    care: {
      heading: "تسجيل ملاحظات الرعاية للغرفة",
      description: "طبّق قيمة تمت ملاحظتها مباشرة، ثم راجع الاستثناءات الخاصة بكل طفل.",
      choose: "اختيار الأطفال المشمولين بالملاحظة",
      record: "تسجيل الملاحظة المشتركة للمجموعة",
      save: "حفظ كمسودة",
      submit: "مراجعة الأطفال وإرسال الملاحظة",
    },
    review: {
      heading: "مراجعة تغييرين مهمين للسلامة والدفعات",
      description: "راجع الأدلة والنتيجة قبل تأكيد أي تغيير.",
      confirm: "تأكيد مراجعة المدير وإبلاغ العائلة",
      allocate: "تخصيص 240 يورو لرسوم شهر يوليو",
    },
  },
}
