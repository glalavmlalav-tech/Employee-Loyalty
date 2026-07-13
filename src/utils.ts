import { Employee, AlertNotification, BusinessId } from "./types";

/**
 * Calculates how many days are left until an anniversary/birthday this year.
 * Target date is treated with the reference year of 2026.
 */
export function getDaysRemaining(eventDateStr: string, referenceDateStr: string = "2026-05-25"): { days: number; label: string; yearOfEvent: number } | null {
  if (!eventDateStr) return null;
  
  try {
    const parts = eventDateStr.split("-");
    if (parts.length !== 3) return null;
    
    const eventYear = parseInt(parts[0]);
    const eventMonth = parseInt(parts[1]) - 1; // 0-indexed
    const eventDay = parseInt(parts[2]);
    
    // Parse referenceDateStr safely in local time to avoid timezone offset shifts
    const refParts = referenceDateStr.split("-");
    if (refParts.length !== 3) return null;
    const refYear = parseInt(refParts[0]);
    const refMonth = parseInt(refParts[1]) - 1;
    const refDay = parseInt(refParts[2]);
    
    const refDate = new Date(refYear, refMonth, refDay);
    
    // Create event date for current year (2026)
    const eventThisYear = new Date(refYear, eventMonth, eventDay);
    
    // Calculate difference
    // Set both times to midnight to calculate clear days
    refDate.setHours(0, 0, 0, 0);
    eventThisYear.setHours(0, 0, 0, 0);
    
    let diffPercent = eventThisYear.getTime() - refDate.getTime();
    let diffDays = Math.round(diffPercent / (1000 * 60 * 60 * 24));
    
    // If the event already passed by days, we check if it is within 2 days in the past or handle year wrap,
    // but the user says “2 days before the date”: رۆژی لەدایکبوون و رۆژی هاوسەرگیری لە بەشی ئاگەداریەکان دوورۆژ پێشتر تا رێکەوتی لەدایکبوونەکە
    // This means we alert if diffDays is 0, 1, or 2!
    
    const monthsKu = ["کانونی دووەم", "شوبات", "ئادار", "نیسان", "ئایار", "حوزەیران", "تەممووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانونی یەکەم"];
    const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const label = `${eventDay}ی ${monthsKu[eventMonth]} / ${eventDay} ${monthsEn[eventMonth]}`;
    
    return {
      days: diffDays,
      label,
      yearOfEvent: eventYear
    };
  } catch (e) {
    return null;
  }
}

/**
 * Sweeps the complete employee list to extract alerts for the next 2 days.
 */
export function getActiveAlerts(employees: Employee[], referenceDateStr: string = "2026-05-25"): AlertNotification[] {
  const alerts: AlertNotification[] = [];
  const refDate = new Date(referenceDateStr);
  const currentYear = refDate.getFullYear();
  
  employees.forEach(emp => {
    if (emp.status !== "active") return;
    
    // Check Birthday
    const bdayCalc = getDaysRemaining(emp.birthDate, referenceDateStr);
    if (bdayCalc && bdayCalc.days >= -2 && bdayCalc.days <= 2) {
      const age = currentYear - bdayCalc.yearOfEvent;
      alerts.push({
        id: `bday-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        business: emp.business,
        type: "birthday",
        daysRemaining: bdayCalc.days,
        dateLabel: bdayCalc.label,
        actualDate: emp.birthDate,
        age
      });
    }
    
    // Check Wedding Anniversary
    if (emp.maritalStatus === "married" && emp.marriageAnniversary) {
      const annCalc = getDaysRemaining(emp.marriageAnniversary, referenceDateStr);
      if (annCalc && annCalc.days >= -2 && annCalc.days <= 2) {
        const marriedYears = currentYear - annCalc.yearOfEvent;
        alerts.push({
          id: `anniv-${emp.id}`,
          employeeId: emp.id,
          employeeName: emp.name,
          business: emp.business,
          type: "marriage_anniversary",
          daysRemaining: annCalc.days,
          dateLabel: annCalc.label,
          actualDate: emp.marriageAnniversary,
          marriedYears
        });
      }
    }
  });
  
  // Sort by soonest (daysRemaining ascending)
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Predefined quarterly and monthly loyalty activity suggestions (backup/presets).
 */
export interface PresetActivity {
  monthNum: string;
  monthNameEn: string;
  monthNameKu: string;
  titleKu: string;
  titleEn: string;
  descriptionKu: string;
  descriptionEn: string;
  stepsKu: string[];
  stepsEn: string[];
  budgetClass: "Low" | "Medium" | "High";
  estimatedCostKu: string;
  impactScore: number;
}

export const PRESET_ACTIVITIES: Record<string, PresetActivity> = {
  "01": {
    monthNum: "01",
    monthNameEn: "January",
    monthNameKu: "کانونی دووەم",
    titleKu: "رێزلێنانی ساڵی نوێ بۆ کارمەندی دڵسۆز",
    titleEn: "New Year Loyalty Honors ceremony",
    descriptionKu: "کۆبوونەوەیەکی خێزانی گەرم لە تەواوی کارگە و شۆورومەکان بۆ ڕێزلێنان لەو کارمەندانەی لە ساڵی پێشوودا کات و دڵسۆزی زۆریان بەخشیوە، بە پێدانی بڕوانامە و دیاری گەرم.",
    descriptionEn: "A warm corporate and factory gathering of all teams to honor high-performing craftsmen and sales floor managers with customized loyalty certificates and warm team achievements awards.",
    stepsKu: [
      "ئامادەکردنی بڕوانامەی ڕێزلێنان بۆ کارمەندە زۆر کۆن و دڵسۆزەکان.",
      "پێشکەشکردنی چای ناوخۆیی و شیرینی کوردی لە کاتی پشووی بەیانیاندا.",
      "پێدانی پاداشتی هاندەری بچووک بۆ ئەو کچ و کوڕانەی کە زۆرترین پابەندییان نیشانداوە."
    ],
    stepsEn: [
      "Prepare custom wooden certificates for loyal master craftsmen and showroom managers.",
      "Serve hot tea and traditional Kurdish sweets (Kliche / Halwa) during the morning break.",
      "Give small cash bonuses or tokens of appreciation to the most committed teams dynamically."
    ],
    budgetClass: "Medium",
    estimatedCostKu: "تێچووی مامناوەند",
    impactScore: 5
  },
  "05": {
    monthNum: "05",
    monthNameEn: "May",
    monthNameKu: "ئایار",
    titleKu: "سەیرانی بەهارەی خێزانی کۆمپانیاکان",
    titleEn: "Annual Spring Team Outing in nature",
    descriptionKu: "لەبەر ئەوەی ئایار رۆژگارێکی بێوێنە و بەهاری نیشتمانە، رێکخستنی سەیرانێکی خێزانی بۆ کارمەندانی هەر سێ کۆمپانیاکە (دارتاشی فۆکس، بەردی لیستۆن و مەڕمەڕ) کارێکی دڵسۆزانەی بێوێنەیە بۆ دوورکەوتنەوە لە ماندووبوونی بەردەوام.",
    descriptionEn: "Taking advantage of the gorgeous weather in May, a joint family-style spring picnic to a scenic nature site (like Dukan, Tawela, or Goizha) to build personal bonds and relieve work-stress for factory and gallery staff.",
    stepsKu: [
      "دیاریکردنی ناوچەیەکی گونجاو لە سروشتی کوردستان و ڕێکخستنی گواستنەوە هاوبەشەکان.",
      "ئامادەکردنی برژاوی کوردی هەمەجۆر (کەباب یان مریشک) لە لایەن سەرپەرشتیارەکان بۆ ستاف بە مانای هێمای رێز.",
      "ڕێکخستنی یاری بە کۆمەڵ لۆکاڵی وەک کێبڕکێی ڕاکێشانی حەبل و چەند چالاکیەکی هاندەر."
    ],
    stepsEn: [
      "Select a scenic site in nature and organize shared bus transport from factories.",
      "Managers cook and serve Kurdish barbeque (Kebab/Chicken) directly to workers as a sign of respect.",
      "Host local outdoor group games (tug-of-war, backgammon tournaments) with small prizes."
    ],
    budgetClass: "High",
    estimatedCostKu: "تێچووی کەمێک بەرزتر",
    impactScore: 5
  },
  "08": {
    monthNum: "08",
    monthNameEn: "August",
    monthNameKu: "ئاب",
    titleKu: "پرۆژەی فێنککەرەوە و سوپرایز لە رۆژە گەرمەکاندا",
    titleEn: "Summer Heat Cooling Refreshment Drive",
    descriptionKu: "لە کاتی گەرمای تینی هاویندا، هێنانی فێنکی و چێژ بۆ کارگەی دارتاشینەکە و بڕینی بەرد، لە رێگەی سوپرایزی شەربەت و میوەی هاوینە کە کارمەند هەست دەکات کێشەی تەندروستی ئەو بۆ کۆمپانیا گرنگە.",
    descriptionEn: "To beat the intense August heat in the wood and stone factories, launch a weekly refreshing treatment prioritizing hydration for craftsmen and heavy machinery operators.",
    stepsKu: [
      "سەردانی چاوەڕواننەکراوی ساردەمەنی و شەربەت بە درێژایی کاتەکانی نیوەڕۆ بۆ کارگەکان.",
      "پێدانی پشووی زیادەی ١٥ خولەکی فێنککەرەوە لە کاتی ماندووکەری نیوەڕوان.",
      "دابەشکردنی پارچەی شووتی فێنک و ئاوی سارد بە شێوەی بەردەوام و نەبڕاوە."
    ],
    stepsEn: [
      "Ensure unexpected afternoon deliveries of ice-cream/chilled natural juices to the workshop floors.",
      "Grant an extra 15-minute cooling break during the hottest hours.",
      "Provide endless cold water dispensers and distribute chilled watermelon slices to active physical workers."
    ],
    budgetClass: "Low",
    estimatedCostKu: "تێچووی کەم",
    impactScore: 4
  }
};

export function getFallbackActivity(monthNum: string): PresetActivity {
  return PRESET_ACTIVITIES[monthNum] || PRESET_ACTIVITIES["05"];
}

/**
 * Safely converts a date string formatted as "YYYY-MM-DD" or similar into Kurdish/International "DD/MM/YYYY" format.
 */
export function formatDateToDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  // Handling ISO string like "2026-06-11T12:00:00Z"
  const cleanStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  
  if (cleanStr.includes("-")) {
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      if (parts[2].length === 4) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
    } else if (parts.length === 2) {
      // Like "MM-DD" (e.g. "05-27") -> "27/05"
      if (parts[0].length <= 2 && parts[1].length <= 2) {
        return `${parts[1]}/${parts[0]}`;
      }
    }
  } else if (cleanStr.includes("/")) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return cleanStr;
    } else if (parts.length === 2) {
      // Like "MM/DD" (e.g. "05/27") -> "27/05"
      if (parts[0].length <= 2 && parts[1].length <= 2) {
        return `${parts[1]}/${parts[0]}`;
      }
    }
  }
  return dateStr;
}

/**
 * Checks if an employee was newly entered into the system (up to 10 days)
 * based on EITHER the reference system date OR the actual real-world today's date.
 */
export function isNewEmployee(emp: Employee, referenceDateStr: string = "2026-05-25"): boolean {
  try {
    if (!emp.createdAt) return false;

    // 1. Check relative to referenceDateStr
    const checkWithRef = (targetDateStr: string) => {
      const cleanStr = targetDateStr.includes("T") ? targetDateStr.split("T")[0] : targetDateStr;
      const parts = cleanStr.split("-");
      if (parts.length !== 3) return false;
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const refParts = referenceDateStr.split("-");
      if (refParts.length !== 3) return false;
      const refYear = parseInt(refParts[0]);
      const refMonth = parseInt(refParts[1]) - 1;
      const refDay = parseInt(refParts[2]);
      
      const empDate = new Date(year, month, day);
      const refDate = new Date(refYear, refMonth, refDay);
      empDate.setHours(0, 0, 0, 0);
      refDate.setHours(0, 0, 0, 0);
      
      const diffTime = refDate.getTime() - empDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 10;
    };

    // 2. Check relative to actual real-world today
    const checkWithRealToday = (targetDateStr: string) => {
      const cleanStr = targetDateStr.includes("T") ? targetDateStr.split("T")[0] : targetDateStr;
      const parts = cleanStr.split("-");
      if (parts.length !== 3) return false;
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const empDate = new Date(year, month, day);
      const today = new Date();
      empDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - empDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 10;
    };

    return checkWithRef(emp.createdAt) || checkWithRealToday(emp.createdAt);
  } catch (e) {
    return false;
  }
}

