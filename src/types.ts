export type BusinessId = "linia" | "linia_karge" | "linia_shorish" | "linia_shasty" | "linia_mosul" | "massimo" | "liston";

export interface BusinessInfo {
  id: BusinessId;
  nameKu: string;
  nameEn: string;
  typeKu: string;
  typeEn: string;
  scaleKu: string;
  scaleEn: string;
  color: string; // Tailwind color class for badges
}

export const BUSINESSES: Record<BusinessId, BusinessInfo> = {
  linia: {
    id: "linia",
    nameKu: "لینیا کارگە",
    nameEn: "Lenya Factory (Legacy)",
    typeKu: "کارگەی دارتاشی گەورە",
    typeEn: "Large woodwork factory",
    scaleKu: "نزیکەی ٢٠ کارمەند",
    scaleEn: "~20 Employees",
    color: "amber",
  },
  linia_karge: {
    id: "linia_karge",
    nameKu: "لینیا کارگە",
    nameEn: "Lenya Factory",
    typeKu: "کارگەی دارتاشی گەورە",
    typeEn: "Large woodwork factory",
    scaleKu: "نزیکەی ٢٠ کارمەند",
    scaleEn: "~20 Employees",
    color: "amber",
  },
  linia_shorish: {
    id: "linia_shorish",
    nameKu: "لینیا شۆرش",
    nameEn: "Lenya Shorish Showroom",
    typeKu: "پێشانگای ناومۆبیلی سەرەکی کۆمپانیا",
    typeEn: "Furniture & Decor Showroom",
    scaleKu: "نزیکەی ١٠ کارمەند",
    scaleEn: "~10 Employees",
    color: "orange",
  },
  linia_shasty: {
    id: "linia_shasty",
    nameKu: "لینیا شەستی",
    nameEn: "Lenya Shasty Showroom",
    typeKu: "پێشانگای شەست مەتری مۆبێل",
    typeEn: "60-Meter Showroom",
    scaleKu: "نزیکەی ١٠ کارمەند",
    scaleEn: "~10 Employees",
    color: "yellow",
  },
  linia_mosul: {
    id: "linia_mosul",
    nameKu: "لینیا موسڵ",
    nameEn: "Lenya Mosul Showroom",
    typeKu: "پێشانگای لقی موسڵ",
    typeEn: "Mosul Showroom Shop",
    scaleKu: "نزیکەی ١٠ کارمەند",
    scaleEn: "~10 Employees",
    color: "red",
  },
  massimo: {
    id: "massimo",
    nameKu: "ماسیمۆ",
    nameEn: "Massimo Stone Gallery",
    typeKu: "شۆوروم بۆ فرۆشتنی مەرمەر، پۆرسەلین و بەردی ڕازاندنەوە",
    typeEn: "Premium Marble, Porcelain & Decorative Stone Showroom",
    scaleKu: "نزیکەی ٨ کارمەند",
    scaleEn: "~8 Employees",
    color: "emerald",
  },
  liston: {
    id: "liston",
    nameKu: "لیستۆن",
    nameEn: "Liston Stone Factory",
    typeKu: "کارگە بۆ بڕین و سافکردنی بەرد",
    typeEn: "Factory for stone cutting and polishing",
    scaleKu: "نزیکەی ١٠ کارمەند",
    scaleEn: "~10 Employees",
    color: "cyan",
  }
};

export type MaritalStatus = "single" | "married";
export type EmployeeStatus = "active" | "suspended" | "retired";

export interface Employee {
  id: string;
  name: string;
  business: BusinessId;
  role: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  maritalStatus: MaritalStatus;
  marriageAnniversary?: string; // YYYY-MM-DD (optional)
  hireDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  photoUrl?: string; // placeholder support
  emergencyContactPhone?: string; // ژمارەی کەسی نزیک لە کاتی پێویست
  emergencyContactRelation?: string; // پەیوەندی کەسەکە (کەسەکە چییەتی)
  ethnicity?: string; // نەتەوە (کورد، عەرەب، فارس، کلدانی ئەشوری...)
  citizenship?: string; // ڕەگەزنامە (عیراقی، ئێرانی، هیندستانی...)
  residenceAddress?: string; // ناونیشانی نیشتەجێبوون (بۆ نموونە: هەولێر - گەڕەکی نەورۆز)
  createdBy?: string; // Username of creator
  reportText?: string; // Detail about incorrect info reported by admin
  reportStatus?: "pending" | "resolved"; // Status of the report
  reportUser?: string; // Who sent the report
  reportCreatedAt?: string; // Timestamp when it was reported
}

export interface AppUser {
  id: string; // username or email as doc ID
  username: string;
  email?: string; // Verified Google Email
  password?: string; // Optional/legacy for backward compatibility
  name: string;
  role: "super_admin" | "admin" | "observer";
  business: BusinessId | "all";
  createdAt: string;
}

export type ActivityStatus = "suggested" | "scheduled" | "completed";

export interface LoyaltyActivity {
  id: string;
  titleKu: string;
  titleEn: string;
  descriptionKu: string;
  descriptionEn: string;
  stepsKu: string[];
  stepsEn: string[];
  month: string; // YYYY-MM
  year: string;
  businessFocus: BusinessId | "all";
  budgetClass: "Low" | "Medium" | "High";
  estimatedCostKu: string;
  impactScore: number; // 1 to 5 stars
  createdAt: string; // ISO string
  status: ActivityStatus;
}

export interface GiftLog {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeBusiness: BusinessId;
  occasionType: "birthday" | "marriage_anniversary" | "work_anniversary";
  occasionDate: string; // MM-DD
  actualDate: string; // Description or YYYY-MM-DD representing birth/marriage/hire
  giftIdea: string;
  status: "pending" | "prepared" | "delivered" | "cancelled";
  updatedAt: string; // ISO String
}

export interface AlertNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  business: BusinessId;
  type: "birthday" | "marriage_anniversary" | "work_anniversary";
  daysRemaining: number; // 2, 1, or 0
  dateLabel: string; // formatted Kurdish / English date
  actualDate: string; // standard value
  marriedYears?: number; // calculated if anniversary
  age?: number; // calculated if birthday
  yearsAtCompany?: number; // calculated if work anniversary
}

export interface WhatsAppTemplate {
  id: string;
  title: string; // human readable name
  message: string; // message text containing placeholders like {name} or {type} or {business}
  type: "birthday" | "marriage_anniversary" | "work_anniversary" | "general";
  isDefault?: boolean;
}
