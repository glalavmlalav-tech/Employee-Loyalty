import React, { useState } from "react";
import { 
  Calendar, 
  Users, 
  Cake, 
  Heart, 
  ChevronRight, 
  Search, 
  Sparkles,
  Gift,
  Award,
  Download
} from "lucide-react";
import { Employee, BusinessId, BUSINESSES } from "../types";
import { formatServiceTenure } from "./EmployeeDirectory";
import { formatDateToDDMMYYYY } from "../utils";

const getWhatsAppLink = (phone: string, name: string, type: "birthday" | "marriage_anniversary" | "work_anniversary", language: "ku" | "en") => {
  if (!phone) return "";
  let cleanedPhone = phone.replace(/[^0-9+]/g, ""); // remove dashes, spaces, etc.
  if (cleanedPhone.startsWith("0")) {
    cleanedPhone = "964" + cleanedPhone.substring(1);
  } else if (!cleanedPhone.startsWith("+") && !cleanedPhone.startsWith("964")) {
    cleanedPhone = "964" + cleanedPhone;
  }
  
  let message = "";
  if (type === "birthday") {
    message = language === "ku"
      ? `سڵاو بەڕێز ${name}، ڕۆژی لەدایکبوونت پیرۆز بێت! بەناوی کۆمپانیاوە هیوای تەمەندرێژی و هەمیشە سەرکەوتنت بۆ دەخوازین. 🎂🎉`
      : `Hello Dear ${name}, Happy Birthday! Corporate greetings on your special day. Wishing you a long life and endless success! 🎂🎉`;
  } else if (type === "marriage_anniversary") {
    message = language === "ku"
      ? `سڵاو بەڕێز ${name}، ساڵیادی هاوسەرگیریتان پیرۆز بێت! بەناوی کۆمپانیاوە هیوای بەختەوەری و چرکە بە چرکە خۆشبەختیتان بۆ دەخوازین. 💍✨`
      : `Hello Dear ${name}, Happy Wedding Anniversary! Corporate congratulations on your marriage milestone. Wishing you a life of happiness together! 💍✨`;
  } else {
    message = language === "ku"
      ? `سڵاو هێژا بەڕێز ${name}، ساڵیادی دامەزراندنت لە کۆمپانیا پیرۆز بێت! سوپاسگوزاری ستاف و دڵسۆزیتین بۆ تەواوی کارە ناوازەکانت لەم ساڵانەدا. 🏆✨`
      : `Hello Dear ${name}, Happy Work Anniversary! We are deeply grateful for your loyalty, dedication, and wonderful contributions over these years. 🏆✨`;
  }
  
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`;
};

interface MonthlyCelebrationsProps {
  employees: Employee[];
  onTriggerWhatsApp: (employee: Employee, eventType: "birthday" | "marriage_anniversary" | "work_anniversary") => void;
  language: "ku" | "en";
  systemDate?: string;
}

export default function MonthlyCelebrations({ employees, onTriggerWhatsApp, language, systemDate }: MonthlyCelebrationsProps) {
  // Translate labels
  const t = {
    title: language === "ku" ? "کۆنترۆڵی بۆنە مانگییەکان 📅" : "Monthly Celebrations & Milestones 📅",
    description: language === "ku" 
      ? "تۆماری هەموو بۆنە و جەژنەکانی کارمەندان بەپێی مانگەکانی ساڵ بۆ ئامادەکردنی باشترین پیرۆزبایی و دیارییەکان." 
      : "Calendar grid of all staff birthdays and wedding anniversaries segmented by month for corporate celebrations.",
    activeStaffOnly: language === "ku" ? "تەنها لیستکردنی کارمەندانی چالاک" : "Active employees only",
    noEvents: language === "ku" ? "هیچ بۆنەیەک نەدۆزرایەوە لەم مانگەدا!" : "No events scheduled for this month!",
    noEventsDesc: language === "ku" 
      ? "هیچ لەدایکبوون یان ساڵیادی هاوسەرگیریەک فۆرمۆڵە نەکراوە لەم مانگەدا بۆ کارمەندە چالاکەکان." 
      : "No employee birthdays or wedding anniversaries fall on this month.",
    totalEvents: language === "ku" ? "کۆی بۆنەکان" : "Total events",
    birthday: language === "ku" ? "ڕۆژی لەدایکبوون" : "Birthday",
    anniversary: language === "ku" ? "ساڵیادی هاوسەرگیری" : "Marriage Anniversary",
    searchPlaceholder: language === "ku" ? "گەڕان بەدوای کارمەند..." : "Search employee...",
    dateLabel: language === "ku" ? "ڕێکەوتی جەژن" : "Milestone Date",
    roleLabel: language === "ku" ? "پۆست یان ئەرک" : "Role & Department",
    businessLabel: language === "ku" ? "کۆمپانیا" : "Business Entity",
    eventStatus: language === "ku" ? "جۆری بۆنە" : "Occasion",
    eventsInMonth: language === "ku" ? "بۆنەکانی مانگی" : "Occasions in",
    pointsBonus: language === "ku" ? "خاڵی مۆڕاڵی هاپێچ" : "Morale Points Allocated",
    ageText: language === "ku" ? "ساڵان (تەمەن)" : "years old",
    annivYearsText: language === "ku" ? "ساڵ هاوسەرگیری" : "years married",
    workYearsText: language === "ku" ? "ساڵ لە کۆمپانیا" : "years at company",
    workAnniversary: language === "ku" ? "ساڵیادی دامەزراندن" : "Work Anniversary"
  };

  const monthsKu = [
    "کانونی دووەم (ڕێبەندان)", // 1
    "شوبات (ڕێبەندانی ناوەڕاست)", // 2
    "ئادار (نەورۆز)", // 3
    "نیسان (بەهار)", // 4
    "ئایار (گوڵان)", // 5
    "حوزەیران (هاوین)", // 6
    "تەممووز (گەرمای هاوین)", // 7
    "ئاب (خەرمانان)", // 8
    "ئەیلوول (پاییز)", // 9
    "تشرینی یەکەم (باران)", // 10
    "تشرینی دووەم (گەڵاڕێزان)", // 11
    "کانونی یەکەم (بەفر)" // 12
  ];

  const monthsEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Dynamically default to the month of systemDate, or fallback to real-world current month
  const getInitialMonth = () => {
    if (systemDate) {
      const parts = systemDate.split("-");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) {
          return m - 1;
        }
      }
    }
    return new Date().getMonth(); // 0-indexed
  };

  const [selectedMonth, setSelectedMonth] = useState<number>(getInitialMonth);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync selectedMonth if the systemDate changes
  React.useEffect(() => {
    if (systemDate) {
      const parts = systemDate.split("-");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) {
          setSelectedMonth(m - 1);
        }
      }
    }
  }, [systemDate]);

  // Only consider active employees for celebrations
  const activeEmployees = employees.filter(emp => emp.status === "active");

  interface OccasionItem {
    id: string;
    employee: Employee;
    type: "birthday" | "marriage_anniversary" | "work_anniversary";
    originalDate: string; // YYYY-MM-DD
    day: number;
    month: number; // 1-indexed
    yearsCount: number; // calculated age/marriage/hire years for reference in 2026
  }

  // Parse all occasions
  const allOccasions: OccasionItem[] = [];

  activeEmployees.forEach(emp => {
    // 1. Birthday
    if (emp.birthDate) {
      try {
        const parts = emp.birthDate.split("-");
        if (parts.length === 3) {
          const birthYear = parseInt(parts[0]);
          const month = parseInt(parts[1]); // 1 to 12
          const day = parseInt(parts[2]);
          const ageIn2026 = 2026 - birthYear;

          allOccasions.push({
            id: `bday-${emp.id}`,
            employee: emp,
            type: "birthday",
            originalDate: emp.birthDate,
            day,
            month,
            yearsCount: ageIn2026
          });
        }
      } catch (err) {
        // ignore bad dates
      }
    }

    // 2. Marriage Anniversary
    if (emp.maritalStatus === "married" && emp.marriageAnniversary) {
      try {
        const parts = emp.marriageAnniversary.split("-");
        if (parts.length === 3) {
          const marriageYear = parseInt(parts[0]);
          const month = parseInt(parts[1]); // 1 to 12
          const day = parseInt(parts[2]);
          const yearsIn2026 = 2026 - marriageYear;

          allOccasions.push({
            id: `anniv-${emp.id}`,
            employee: emp,
            type: "marriage_anniversary",
            originalDate: emp.marriageAnniversary,
            day,
            month,
            yearsCount: yearsIn2026
          });
        }
      } catch (err) {
        // ignore bad dates
      }
    }
  });

  // Calculate event count per month (1-indexed keys)
  const monthCounts = Array(12).fill(0).map((_, idx) => {
    const monthNum = idx + 1;
    return allOccasions.filter(occ => occ.month === monthNum).length;
  });

  // Filter occasions for current selected month
  const selectedMonthOccasions = allOccasions
    .filter(occ => occ.month === (selectedMonth + 1))
    .filter(occ => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return (
        occ.employee.name.toLowerCase().includes(lowerQuery) ||
        occ.employee.role.toLowerCase().includes(lowerQuery) ||
        (BUSINESSES[occ.employee.business]?.nameKu || "").toLowerCase().includes(lowerQuery) ||
        (BUSINESSES[occ.employee.business]?.nameEn || "").toLowerCase().includes(lowerQuery)
      );
    })
    // Sort chronologically by day
    .sort((a, b) => a.day - b.day);

  const handleExportSelectedMonthOccasionsCSV = () => {
    const monthName = language === "ku" ? monthsKu[selectedMonth] : monthsEn[selectedMonth];
    const headers = language === "ku"
      ? ["ڕێککەوت (ڕۆژ)", "ناوی کارمەند", "کۆمپانیا/بزنس", "پیشە/پۆست", "ژمارەی مۆبایل", "جۆری بۆنە", "ساڵان/ماوە"]
      : ["Date (Day)", "Employee Name", "Company/Showroom", "Role/Title", "Phone", "Celebration Type", "Age/Years Married"];

    const rows = selectedMonthOccasions.map((occ) => {
      const bizName = BUSINESSES[occ.employee.business]
        ? (language === "ku" ? BUSINESSES[occ.employee.business].nameKu : BUSINESSES[occ.employee.business].nameEn)
        : occ.employee.business;
      const occasionText = occ.type === "birthday"
        ? (language === "ku" ? "ڕۆژی لەدایکبوون" : "Birthday")
        : occ.type === "marriage_anniversary"
          ? (language === "ku" ? "ساڵیادی هاوسەرگیری" : "Wedding Anniversary")
          : (language === "ku" ? "ساڵیادی دامەزراندن" : "Work Anniversary");

      return [
        occ.day,
        occ.employee.name,
        bizName,
        occ.employee.role,
        occ.employee.phone || "",
        occasionText,
        occ.yearsCount
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Milestones_Month_${selectedMonth + 1}_${monthName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting for business color badges
  const getBusinessColor = (bizId: BusinessId) => {
    if (bizId.startsWith("linia")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    switch (bizId) {
      case "massimo": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "liston": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8" id="monthly_celebrations_panel">
      {/* Upper header section */}
      <div className="glass-panel p-6 md:p-8 rounded-[36px] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-amber-500" />
              {t.title}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-3xl">
              {t.description}
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/55 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/70 flex items-center gap-3 shadow-inner">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white text-xs font-black shadow-md shadow-amber-500/10">
              {allOccasions.length}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">{language === "ku" ? "کۆی گشتی بۆنەکان" : "Total Annual Occasions"}</span>
              <span className="text-xs font-bold text-slate-700 font-sans">{language === "ku" ? `${allOccasions.length} بۆنە لە کارمەندان` : `${allOccasions.length} verified events`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array(12).fill(null).map((_, index) => {
          const monthNum = index + 1;
          const count = monthCounts[index];
          const isSelected = selectedMonth === index;
          
          return (
            <button
              key={index}
              onClick={() => {
                setSelectedMonth(index);
                setSearchQuery(""); // Reset search on month change
              }}
              className={`
                relative p-5 rounded-[22px] text-right transition-all duration-300 border flex flex-col justify-between h-32 group select-none
                ${isSelected 
                  ? "bg-slate-950/85 backdrop-blur-xl border-amber-400/35 text-white shadow-[0_12px_24px_rgba(245,158,11,0.18)] scale-102 ring-1 ring-amber-400/30" 
                  : "bg-white/50 backdrop-blur-md hover:bg-white/85 border-white/60 text-slate-800 shadow-sm hover:shadow-md"
                }
              `}
              id={`month_card_${monthNum}`}
            >
              {/* Backglow element for active month card */}
              {isSelected && (
                <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" />
              )}

              {/* Month Index Indicator & Event Counter */}
              <div className="flex items-start justify-between w-full">
                <span className={`text-2xl font-black font-mono tracking-tight ${isSelected ? "text-amber-400" : "text-slate-300 group-hover:text-amber-500/40 transition-colors"}`}>
                  {monthNum.toString().padStart(2, "0")}
                </span>
                
                {count > 0 ? (
                  <span className={`
                    w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition-transform duration-300 group-hover:scale-110
                    ${isSelected 
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10 animate-pulse-slow" 
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-600 font-sans"
                    }
                  `}>
                    {count}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold px-1.5 py-0.5 rounded">
                    -
                  </span>
                )}
              </div>

              {/* Kurdish & English month names */}
              <div className="w-full mt-auto">
                <div className={`text-xs font-bold leading-tight truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                  {language === "ku" ? monthsKu[index].split(" ")[0] : monthsEn[index]}
                </div>
                <div className={`text-[10px] font-medium leading-none mt-1 truncate ${isSelected ? "text-slate-400/80" : "text-slate-400"}`}>
                  {language === "ku" ? monthsEn[index] : monthsKu[index].split(" ")[0]}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Month detailed viewport panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Main Column: List of Occasions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-[36px] shadow-sm space-y-6">
            
            {/* Header controls for search filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/50 pb-5">
              <div>
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  {t.eventsInMonth} {language === "ku" ? monthsKu[selectedMonth] : monthsEn[selectedMonth]}
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/60 border border-white/85 text-slate-600 font-mono ml-1 shadow-sm">
                    {selectedMonthOccasions.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {language === "ku" ? "ساڵی مووچە و پیرۆزبایی ٢٠٢٦" : "Loyalty target calendar year of 2026"}
                </p>
              </div>

              {/* Dynamic search input inside category and export button */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {selectedMonthOccasions.length > 0 && (
                  <button
                    onClick={handleExportSelectedMonthOccasionsCSV}
                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition duration-200 cursor-pointer"
                    title={language === "ku" ? "داونلۆدکردنی جەژن و بۆنەکانی ئەم مانگە بە فایلی ئێکسڵ" : "Download current month milestones as CSV Excel Sheet"}
                  >
                    <Download className="w-4 h-4" />
                    {language === "ku" ? "داونلۆدی مانگ" : "Export Month"}
                  </button>
                )}
                
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/55 backdrop-blur-sm border border-white/80 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs font-sans placeholder-slate-400 focus:bg-white text-slate-800 transition"
                  />
                </div>
              </div>
            </div>

            {/* List Body */}
            {selectedMonthOccasions.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4 bg-white/30 backdrop-blur-sm rounded-[24px] border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-700">{t.noEvents}</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed animate-pulse">
                    {t.noEventsDesc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMonthOccasions.map((occ) => {
                  const biz = BUSINESSES[occ.employee.business];
                  const monthsName = language === "ku" ? monthsKu[occ.month - 1].split(" ")[0] : monthsEn[occ.month - 1];
                  const dateStringStr = language === "ku" 
                    ? `${occ.day}ی ${monthsName}`
                    : `${monthsName} ${occ.day}`;

                  return (
                    <div 
                      key={occ.id}
                      className="group bg-white/40 backdrop-blur-sm p-4 rounded-[22px] border border-white/60 shadow-sm hover:ring-1 hover:ring-amber-500/20 hover:border-white transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      id={`celebration_row_${occ.id}`}
                    >
                      <div className="flex items-center gap-3.5 pb-2 sm:pb-0">
                        {/* Event type specific graphic icon bubble */}
                        <div className={`p-3 rounded-2xl flex-shrink-0 shadow-sm ${
                          occ.type === "birthday" 
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/10" 
                            : occ.type === "marriage_anniversary"
                              ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/10"
                              : "bg-teal-500/10 text-teal-500 border border-teal-500/10"
                        }`}>
                          {occ.type === "birthday" 
                            ? <Cake className="w-5 h-5 animate-pulse-slow" /> 
                            : occ.type === "marriage_anniversary" 
                              ? <Heart className="w-5 h-5 animate-pulse-slow" /> 
                              : <Award className="w-5 h-5 animate-pulse-slow" />
                          }
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-800">{occ.employee.name}</span>
                            <span className="text-[10px] bg-white/60 text-slate-500 px-2 py-0.5 rounded-lg border border-white/80 font-mono font-bold">
                              {occ.yearsCount} {occ.type === "birthday" ? t.ageText : occ.type === "marriage_anniversary" ? t.annivYearsText : t.workYearsText}
                            </span>
                          </div>
                          
                          {/* Business and role subtitles */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap font-sans">
                            <span className={`text-[9px] uppercase tracking-wider leading-none font-bold px-2 py-1 rounded-lg border shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${getBusinessColor(occ.employee.business)}`}>
                              {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : occ.employee.business}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold font-sans">
                              • {occ.employee.role}
                              {occ.employee.hireDate && (
                                <span className="text-[10px] text-slate-400 font-mono font-medium ml-1.5 whitespace-nowrap">
                                  ({formatDateToDDMMYYYY(occ.employee.hireDate)}) ({formatServiceTenure(occ.employee.hireDate, language)})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date block and quick WhatsApp button */}
                      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/40">
                        <div className="text-right flex flex-col">
                          <span className="text-xs font-bold text-slate-800 bg-white/60 px-3 py-1.5 rounded-xl border border-white/80 shadow-sm font-mono whitespace-nowrap">
                            {dateStringStr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1 font-mono">
                            {formatDateToDDMMYYYY(occ.originalDate)}
                          </span>
                        </div>
                        
                        {(() => {
                          const hasPhone = occ.employee.phone && occ.employee.phone.trim().length > 3;
                          return (
                            <button
                              disabled={!hasPhone}
                              onClick={() => {
                                onTriggerWhatsApp(occ.employee, occ.type);
                              }}
                              className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center border shadow-sm ${
                                hasPhone 
                                  ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 hover:scale-[1.05] cursor-pointer" 
                                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                              }`}
                              title={hasPhone ? (language === "ku" ? "نامەی پیرۆزبایی بە واتسئەپ" : "Send greeting via WhatsApp") : (language === "ku" ? "ژمارەی مۆبایل تۆمار نەکراوە" : "No phone number registered")}
                            >
                              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.325 1.451 5.405.002 9.801-4.394 9.804-9.801.002-2.617-1.013-5.08-2.862-6.93C16.035 2.014 13.57 1 11.999 1c-5.41 0-9.802 4.392-9.806 9.8a9.771 9.771 0 001.492 5.101l-.979 3.575 3.67-.962zm10.748-5.34c-.29-.145-1.72-.848-1.986-.944-.266-.096-.46-.145-.653.145-.194.291-.749.944-.919 1.138-.17.194-.34.218-.63.073-.29-.145-1.229-.453-2.34-1.445-.864-.772-1.448-1.724-1.618-2.015-.17-.29-.018-.448.127-.592.131-.13.29-.34.436-.509.145-.17.194-.291.291-.485.097-.194.049-.364-.025-.509-.073-.145-.653-1.573-.894-2.155-.235-.567-.474-.49-.653-.498-.17-.008-.364-.01-.557-.01s-.508.073-.774.364c-.266.291-1.016.994-1.016 2.425s1.04 2.812 1.185 3.006c.145.194 2.046 3.125 4.957 4.382.693.3 1.233.479 1.654.613.697.221 1.332.19 1.833.115.558-.081 1.72-.703 1.962-1.382.242-.678.242-1.26.17-1.381-.073-.122-.266-.195-.557-.34z"/>
                              </svg>
                            </button>
                          );
                        })()}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Mini Statistics & Action panel */}
        <div className="space-y-6">
          
          {/* Quick Stats widget */}
          <div className="glass-panel p-6 rounded-[36px] shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500 animate-pulse-slow" />
              {language === "ku" ? "سیستمی سوپرایزی مانگەکە" : "Monthly Surprise Action Checklist"}
            </h4>
            <div className="text-xs text-slate-500 leading-relaxed font-sans">
              {language === "ku" 
                ? "ڕێنمایی گشتی: بەپێی سیستەمەکە کارمەندانی ئەم مانگی دیاریکراوە پیرۆزباییان لێ دەکرێت لەگەڵ پێشکەشکردنی دیاری فەرمی کۆمپانیا بۆ دەربڕینی ڕێز و دڵسۆزی."
                : "Standard guidelines: Employees falling in this selected month should be congratulated and receive corporate gifts as tokens of appreciation."
              }
            </div>

            <div className="h-px bg-white/50" />

            {/* Quick Summary Grid of event distribution for the selected month */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Cake className="w-3.5 h-3.5 text-rose-500" />
                  {language === "ku" ? "ڕۆژی لەدایکبوونەکان" : "Total Birthdays"}
                </span>
                <span className="text-xs font-bold font-mono text-slate-700 bg-white/50 border border-white/80 shadow-sm px-2.5 py-0.5 rounded-lg">
                  {selectedMonthOccasions.filter(o => o.type === "birthday").length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-indigo-500" />
                  {language === "ku" ? "ساڵیادی هاوسەرگیریەکان" : "Wedding Anniversaries"}
                </span>
                <span className="text-xs font-bold font-mono text-slate-700 bg-white/50 border border-white/80 shadow-sm px-2.5 py-0.5 rounded-lg">
                  {selectedMonthOccasions.filter(o => o.type === "marriage_anniversary").length}
                </span>
              </div>
            </div>

          </div>

          {/* Seed hint box / Loyalty points multiplier information */}
          <div className="glass-panel p-6 rounded-[36px] shadow-sm flex gap-4 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/10">
            <span className="p-3 bg-indigo-500/10 border border-indigo-500/10 text-indigo-500 rounded-2xl h-fit">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </span>
            <div>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest">{language === "ku" ? "دیموی هاوبەشکراو" : "Dynamic Sync Platform"}</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 font-sans">
                {language === "ku" 
                  ? "ئەم لاپەڕەیە کار دەکات بەپێی نوێترین زانیاریەکانت لە فایەربەیس دەیتا بەیسدا بە شێوەی ڕاستەوخۆ."
                  : "All changes made to employees inside the 'Employee Profiles' tab will dynamically propagate and update these counters automatically in real-time."
                }
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
