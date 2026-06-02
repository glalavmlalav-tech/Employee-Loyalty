import React, { useState } from "react";
import { 
  Gift, 
  Bell, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Search, 
  Sparkles, 
  ArrowRight,
  PlusSquare,
  BookmarkCheck,
  Building,
  AlertCircle,
  HelpCircle,
  Download
} from "lucide-react";
import { AlertNotification, GiftLog, Employee, BusinessId, BUSINESSES } from "../types";

const getWhatsAppLink = (phone: string, name: string, type: "birthday" | "marriage_anniversary", language: "ku" | "en") => {
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
  } else {
    message = language === "ku"
      ? `سڵاو بەڕێز ${name}، ساڵیادی هاوسەرگیریتان پیرۆز بێت! بەناوی کۆمپانیاوە هیوای بەختەوەری و چرکە بە چرکە خۆشبەختیتان بۆ دەخوازین. 💍✨`
      : `Hello Dear ${name}, Happy Wedding Anniversary! Corporate congratulations on your marriage milestone. Wishing you a life of happiness together! 💍✨`;
  }
  
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`;
};

interface AlertsPanelProps {
  alerts: AlertNotification[];
  giftLogs: GiftLog[];
  employees: Employee[];
  onUpdateGiftStatus: (giftId: string, status: GiftLog["status"]) => Promise<void>;
  onAddGiftIdea: (giftData: Omit<GiftLog, "id" | "updatedAt">) => Promise<void>;
  onTriggerWhatsApp: (employee: Employee, eventType: "birthday" | "marriage_anniversary") => void;
  language: "ku" | "en";
}

export default function AlertsPanel({
  alerts,
  giftLogs,
  employees,
  onUpdateGiftStatus,
  onAddGiftIdea,
  onTriggerWhatsApp,
  language
}: AlertsPanelProps) {
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [giftInput, setGiftInput] = useState<string>("");
  const [selectedAlertForGift, setSelectedAlertForGift] = useState<AlertNotification | null>(null);
  const [newGiftIdea, setNewGiftIdea] = useState<string>("");

  const handlePrint = () => {
    const isKu = language === "ku";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${isKu ? "ڕاپۆڕتی بۆنە فەرمییەکانی کارمەندان" : "Staff Occasions & Gift Report"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              direction: ${isKu ? "rtl" : "ltr"};
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 2px solid #ea580c;
              padding-bottom: 10px;
              font-size: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1.5px solid #ddd;
              padding: 12px;
              text-align: ${isKu ? "right" : "left"};
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            .date {
              font-family: monospace;
              color: #555;
            }
          </style>
        </head>
        <body>
          <h1>${isKu ? "دۆسیەی کارمەندان - ڕاپۆرتی بۆنە نزیکەکان" : "Staff Loyalty Hub - Nearby Milestones & Gift Plan"}</h1>
          <p><strong>${isKu ? "ڕێکەوتی جێبەجێکردن:" : "Generated On:"}</strong> 2026-05-25</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isKu ? "ناوی کارمەند" : "Employee Name"}</th>
                <th>${isKu ? "کۆمپانیا" : "Business"}</th>
                <th>${isKu ? "جۆری بۆنە" : "Occasion Type"}</th>
                <th>${isKu ? "ڕێکەوتی بۆنە" : "Occasion Date"}</th>
                <th>${isKu ? "ڕۆژانی ماوە" : "Days Left"}</th>
              </tr>
            </thead>
            <tbody>
              ${alerts.map((al, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${al.employeeName}</strong></td>
                  <td>${getBusinessLabel(al.business)}</td>
                  <td>${al.type === "birthday" ? (isKu ? "رۆژی لەدایکبوون 🎂" : "Birthday 🎂") : (isKu ? "ساڵیادی هاوسەرگیری 💍" : "Wedding Anniversary 💍")}</td>
                  <td><span class="date">${al.actualDate}</span></td>
                  <td><strong>${al.daysRemaining === 0 ? (isKu ? "ئەمڕۆ!" : "Today!") : al.daysRemaining === 1 ? (isKu ? "سبەی!" : "Tomorrow!") : (isKu ? `${al.daysRemaining} ڕۆژ` : `${al.daysRemaining} days`)}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #888;">
            ${isKu ? "سیستەمی فەرمی دڵسۆزی دۆسیەی کارمەندان." : "Corporate Staff Loyalty System."}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const t = {
    alertsTitle: language === "ku" ? "بەشی ئاگەداریە بەپەلەکان (٢ رۆژ پێشتر)" : "Urgent Alerts & Warnings (2 Days Ahead)",
    noAlerts: language === "ku" ? "هیچ بۆنەیەکی نزیک نییە لە دوو رۆژی داهاتوودا." : "No upcoming employee birthdays or anniversaries in the next 2 days.",
    birthday: language === "ku" ? "رۆژی لەدایکبوون" : "Birthday",
    anniversary: language === "ku" ? "ساڵیادی هاوسەرگیری" : "Wedding Anniversary",
    today: language === "ku" ? "ئەمڕۆ!" : "Today!",
    tomorrow: language === "ku" ? "سبەی!" : "Tomorrow!",
    daysRemainingKu: (n: number) => n === 2 ? "٢ رۆژی ماوە" : `${n} رۆژ ماوە`,
    daysRemainingEn: (n: number) => n === 1 ? "1 day left" : `${n} days left`,
    prepareGiftButton: language === "ku" ? "پلانی پێدانی دیاری" : "Propose Gift Idea",
    giftTrackerTitle: language === "ku" ? "تۆماری ئامادەکردنی دیارییەکان (فایەربەیس)" : "Gift Preparation Tracker (Firebase Sync)",
    giftTrackerDesc: language === "ku" ? "ئامادەکاری کۆمپانیا بۆ بۆنەکانی کارمەندەکان" : "Review and prepare company gifts for the team's milestones.",
    employee: language === "ku" ? "کارمەند" : "Employee",
    business: language === "ku" ? "بزنس" : "Business",
    occasion: language === "ku" ? "بۆنە" : "Occasion",
    giftIdea: language === "ku" ? "دیاری پێشنیارکراو" : "Proposed Gift & Value",
    status: language === "ku" ? "بارودۆخ" : "Status",
    actions: language === "ku" ? "کردارەکان" : "Actions",
    noGifts: language === "ku" ? "هیچ تۆمارێکی دیاری لە ئێستادا نییە." : "No gift logs registered yet. Create one from an alert card above!",
    pendingStatus: language === "ku" ? "چاوەڕوانە" : "Pending",
    preparedStatus: language === "ku" ? "ئامادەکراوە" : "Prepared",
    deliveredStatus: language === "ku" ? "پێشکەشکراوە" : "Delivered",
    cancelledStatus: language === "ku" ? "پاشگەزبووەوە" : "Cancelled",
    save: language === "ku" ? "پاشەکەوتکردن" : "Save",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel",
    ageLabelKu: (age: number) => `تەمەن: ${age} ساڵ`,
    ageLabelEn: (age: number) => `Age: ${age} years old`,
    marriedYearsKu: (years: number) => `${years}ەمین ساڵیادی هاوسەرگیری`,
    marriedYearsEn: (years: number) => `${years}th Wedding Anniversary`,
    addCustomGiftTitle: language === "ku" ? "تۆمارکردنی دیارییەکی نوێ" : "Log New Gift Idea",
    enterIdea: language === "ku" ? "بیرۆکەی دیاریەکە یان بودجەکەی بنووسە..." : "Enter gift description or budget details...",
    loading: language === "ku" ? "چاوەڕوان بە..." : "Working..."
  };

  const getBusinessLabel = (id: BusinessId) => {
    const biz = BUSINESSES[id];
    if (!biz) return id;
    return language === "ku" ? biz.nameKu : biz.nameEn;
  };

  const registerGiftIdea = async (alertItem: AlertNotification) => {
    if (!newGiftIdea.trim()) return;
    try {
      await onAddGiftIdea({
        employeeId: alertItem.employeeId,
        employeeName: alertItem.employeeName,
        employeeBusiness: alertItem.business,
        occasionType: alertItem.type,
        occasionDate: alertItem.actualDate.substring(5), // e.g. "05-27"
        actualDate: alertItem.actualDate,
        giftIdea: newGiftIdea,
        status: "pending"
      });
      setNewGiftIdea("");
      setSelectedAlertForGift(null);
    } catch (e) {
      console.error("Error saving gift log:", e);
    }
  };

  const handleExportGiftLogsCSV = () => {
    const headers = language === "ku"
      ? ["ناوی کارمەند", "کۆمپانیا/بزنس", "جۆری بۆنە", "بیرۆکەی دیاری پێشنیارکراو", "بارودۆخی دیاری", "کاتی گۆڕانکاری"]
      : ["Employee Name", "Business", "Occasion", "Proposed Gift Idea", "Status", "Last Updated"];

    const rows = giftLogs.map((log) => {
      const bizName = BUSINESSES[log.employeeBusiness]
        ? (language === "ku" ? BUSINESSES[log.employeeBusiness].nameKu : BUSINESSES[log.employeeBusiness].nameEn)
        : log.employeeBusiness;
      const occasionText = log.occasionType === "birthday"
        ? (language === "ku" ? "ڕۆژی لەدایکبوون" : "Birthday")
        : (language === "ku" ? "ساڵیادی هاوسەرگیری" : "Wedding Anniversary");
      const statusText = log.status === "pending"
        ? (language === "ku" ? "چاوەڕوانکراو" : "Pending")
        : log.status === "prepared"
        ? (language === "ku" ? "ئامادەکراو" : "Prepared")
        : log.status === "delivered"
        ? (language === "ku" ? "گەیەندراو" : "Delivered")
        : (language === "ku" ? "ڕەتکراوەتەوە" : "Cancelled");

      return [
        log.employeeName,
        bizName,
        occasionText,
        log.giftIdea,
        statusText,
        new Date(log.updatedAt).toLocaleString(language === "ku" ? "ku-IQ" : "en-US")
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
    link.setAttribute("download", `Gift_Log_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8" id="alerts_panel_root">
      
      {/* 1. Milestone Alerts (Warnings section) */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/50 pb-5">
          <div>
            <h3 className="text-xl md:text-2xl font-display font-black text-slate-800 flex items-center gap-3">
              <span className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/10 rounded-2xl animate-pulse-slow">
                <Bell className="w-6 h-6" />
              </span>
              {t.alertsTitle}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-1 font-sans">
              {language === "ku" 
                ? "ئەو کارمەندانەی لە ٢ رۆژی داهاتوودا رۆژی لەدایکبوون یان هاوسەرگیریان هەیە" 
                : "Automatic 48-hour gift-preparation coordinator for your team's celebrations."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {alerts.length > 0 && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-sm font-sans"
              >
                <span>🖨️</span>
                <span>{language === "ku" ? "چاپکردنی ڕاپۆرت" : "Print Report"}</span>
              </button>
            )}
            <span className="self-start md:self-center bg-white/60 border border-white/80 text-slate-700 text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              2026-05-25 (ڕێکەوتی سیستەم)
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/30 backdrop-blur-sm rounded-[24px] border border-dashed border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 text-sm font-medium text-center">{t.noAlerts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => {
              const bgBadgeColor = alert.type === "birthday" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-purple-50 text-purple-700 border-purple-200";
              const isUrgent = alert.daysRemaining === 0;
              const daysColor = isUrgent 
                ? "bg-rose-500 text-white" 
                : alert.daysRemaining === 1 
                  ? "bg-orange-500 text-white" 
                  : "bg-slate-700 text-white";

              return (
                <div 
                  key={alert.id}
                  className={`relative rounded-[24px] border p-5 transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between ${
                    isUrgent ? "border-rose-300 bg-rose-500/5 shadow-[0_8px_20px_rgba(239,68,68,0.08)]" : "border-white/70 bg-white/45 backdrop-blur-md"
                  }`}
                  id={alert.id}
                >
                  <div>
                    {/* Days indicator bubble */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-lg ${daysColor} shadow-sm`}>
                        {alert.daysRemaining === 0 
                          ? t.today 
                          : alert.daysRemaining === 1 
                            ? t.tomorrow 
                            : language === "ku" 
                              ? t.daysRemainingKu(alert.daysRemaining) 
                              : t.daysRemainingEn(alert.daysRemaining)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1 bg-white/50 border border-white/70 px-2 py-0.5 rounded-lg shadow-inner">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {alert.dateLabel}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-800 font-display">{alert.employeeName}</h4>
                    <p className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border inline-block mt-2 font-medium ${bgBadgeColor}`}>
                      {alert.type === "birthday" ? t.birthday : t.anniversary}
                    </p>

                    <div className="my-3 space-y-1.5 text-xs text-slate-600 font-sans">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{getBusinessLabel(alert.business)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse-slow" />
                        <span className="font-bold text-slate-700 text-sm">
                          {alert.type === "birthday" 
                            ? (language === "ku" ? t.ageLabelKu(alert.age || 0) : t.ageLabelEn(alert.age || 0))
                            : (language === "ku" ? t.marriedYearsKu(alert.marriedYears || 0) : t.marriedYearsEn(alert.marriedYears || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/50 pt-4">
                    {selectedAlertForGift?.id === alert.id ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full text-xs p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans shadow-inner"
                          placeholder={t.enterIdea}
                          rows={2}
                          value={newGiftIdea}
                          onChange={(e) => setNewGiftIdea(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedAlertForGift(null)}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-500 bg-white/60 border border-white/80 rounded-xl hover:bg-slate-200 transition"
                          >
                            {t.cancel}
                          </button>
                          <button
                            onClick={() => registerGiftIdea(alert)}
                            disabled={!newGiftIdea.trim()}
                            className="px-3 py-1.5 text-xs text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 font-bold shadow-md shadow-slate-900/10"
                          >
                            {t.save}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedAlertForGift(alert);
                            // Suggest a default gift based on type
                            setNewGiftIdea(alert.type === "birthday" 
                              ? (language === "ku" ? "کارتێکی پیرۆزبایی کۆمپانیا + کتێبێکی ناوازە یان کاتژمێر" : "Company birthday card + Premium branded watch or book")
                              : (language === "ku" ? "کەبۆنەیەکی شیرینی خێزانی یان باوچەر بۆ دوو پیتزا گەرمە" : "Kurdish sweet box + Dinner voucher for two")
                            );
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold glass-btn-primary shadow-sm whitespace-nowrap cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-rose-300" />
                          <span>{t.prepareGiftButton}</span>
                        </button>

                        {(() => {
                          const emp = employees.find((e) => e.id === alert.employeeId);
                          const hasPhone = emp && emp.phone && emp.phone.trim().length > 3;
                          return (
                            <button
                              disabled={!hasPhone}
                              onClick={() => {
                                if (emp) {
                                  onTriggerWhatsApp(emp, alert.type);
                                }
                              }}
                              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold transition-all duration-300 shadow-sm whitespace-nowrap ${
                                hasPhone 
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 hover:shadow-md hover:scale-[1.02] cursor-pointer" 
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
                              }`}
                              title={hasPhone ? (language === "ku" ? "ناردنی نامەی پیرۆزبایی بە واتسئەپ" : "Send greeting via WhatsApp") : (language === "ku" ? "ژمارە دابین نەکراوە" : "No phone number available")}
                            >
                              <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.325 1.451 5.405.002 9.801-4.394 9.804-9.801.002-2.617-1.013-5.08-2.862-6.93C16.035 2.014 13.57 1 11.999 1c-5.41 0-9.802 4.392-9.806 9.8a9.771 9.771 0 001.492 5.101l-.979 3.575 3.67-.962zm10.748-5.34c-.29-.145-1.72-.848-1.986-.944-.266-.096-.46-.145-.653.145-.194.291-.749.944-.919 1.138-.17.194-.34.218-.63.073-.29-.145-1.229-.453-2.34-1.445-.864-.772-1.448-1.724-1.618-2.015-.17-.29-.018-.448.127-.592.131-.13.29-.34.436-.509.145-.17.194-.291.291-.485.097-.194.049-.364-.025-.509-.073-.145-.653-1.573-.894-2.155-.235-.567-.474-.49-.653-.498-.17-.008-.364-.01-.557-.01s-.508.073-.774.364c-.266.291-1.016.994-1.016 2.425s1.04 2.812 1.185 3.006c.145.194 2.046 3.125 4.957 4.382.693.3 1.233.479 1.654.613.697.221 1.332.19 1.833.115.558-.081 1.72-.703 1.962-1.382.242-.678.242-1.26.17-1.381-.073-.122-.266-.195-.557-.34z"/>
                              </svg>
                              <span>{language === "ku" ? "پیرۆزبایی واتسئەپ" : "WhatsApp Wish"}</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Firebase Saved Gift Logs Tracking */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-display font-black text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-amber-500/10 text-amber-600 border border-amber-500/10 rounded-2xl">
                <BookmarkCheck className="w-5.5 h-4 text-emerald-600" />
              </span>
              {t.giftTrackerTitle}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-1.5 font-sans">{t.giftTrackerDesc}</p>
          </div>
          {giftLogs.length > 0 && (
            <button
              onClick={handleExportGiftLogsCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition duration-200 cursor-pointer self-start sm:self-auto"
              title={language === "ku" ? "داونلۆدکردنی ڕاپۆرتی دیارییەکان بە فایلی ئێکسڵ" : "Download Gift preparation logs report as CSV Excel Sheet"}
            >
              <Download className="w-4 h-4" />
              {language === "ku" ? "داونلۆدی کۆی دیارییەکان" : "Export Gift Log"}
            </button>
          )}
        </div>

        {giftLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white/30 backdrop-blur-sm rounded-[24px] border border-dashed border-slate-200">
            <Gift className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-pulse-slow" />
            <p className="text-xs">{t.noGifts}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/60 bg-white/30 backdrop-blur-sm">
              <table className="w-full text-sm text-left border-collapse" id="gift_logs_table">
                <thead>
                  <tr className="border-b border-white/60 text-slate-500 uppercase text-[10px] tracking-wider bg-white/40">
                    <th className="py-3.5 px-4 text-right font-extrabold">{t.employee}</th>
                    <th className="py-3.5 px-4 text-right font-extrabold">{t.business}</th>
                    <th className="py-3.5 px-4 text-right font-extrabold">{t.occasion}</th>
                    <th className="py-3.5 px-4 text-right font-extrabold">{t.giftIdea}</th>
                    <th className="py-3.5 px-4 text-center font-extrabold">{t.status}</th>
                    <th className="py-3.5 px-4 text-center font-extrabold">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {giftLogs.map((log) => {
                    const giftStatusClasses = {
                      pending: "bg-amber-50 text-amber-700 border-amber-100",
                      prepared: "bg-sky-50 text-sky-700 border-sky-100",
                      delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
                      cancelled: "bg-slate-100 text-slate-600 border-slate-100"
                    };
                    const currStatusClass = giftStatusClasses[log.status] || "bg-slate-50";

                    return (
                      <tr key={log.id} className="border-b border-white/20 hover:bg-white/40 transition">
                        <td className="py-4 px-4 font-extrabold text-slate-800 text-right">
                          {log.employeeName}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600 text-xs font-sans font-bold">
                          {getBusinessLabel(log.employeeBusiness)}
                        </td>
                        <td className="py-4 px-4 text-right text-xs">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                            log.occasionType === "birthday" ? "bg-amber-500/10 border-amber-500/10 text-amber-700" : "bg-purple-500/10 border-purple-500/10 text-purple-700"
                          }`}>
                            {log.occasionType === "birthday" ? t.birthday : t.anniversary} ({log.occasionDate})
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right max-w-xs text-xs text-slate-700 font-sans break-words font-medium">
                          {log.giftIdea}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg border inline-block font-extrabold ${currStatusClass} shadow-sm`}>
                            {log.status === "pending" ? t.pendingStatus : 
                             log.status === "prepared" ? t.preparedStatus :
                             log.status === "delivered" ? t.deliveredStatus : t.cancelledStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {log.status === "pending" && (
                              <button
                                onClick={() => onUpdateGiftStatus(log.id, "prepared")}
                                className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition font-sans font-bold shadow-sm"
                              >
                                {language === "ku" ? "دیاریکردن بۆ ئامادەکراو" : "Set Prepared"}
                              </button>
                            )}
                            {(log.status === "pending" || log.status === "prepared") && (
                              <button
                                onClick={() => onUpdateGiftStatus(log.id, "delivered")}
                                className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition font-sans font-bold shadow-sm"
                              >
                                {language === "ku" ? "دیاریکردن بۆ بەخشراو" : "Set Delivered"}
                              </button>
                            )}
                            {log.status !== "cancelled" && log.status !== "delivered" && (
                              <button
                                onClick={() => onUpdateGiftStatus(log.id, "cancelled")}
                                className="text-[10px] bg-slate-100 border border-slate-100 text-slate-500 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition font-sans font-bold"
                              >
                                {t.cancel}
                              </button>
                            )}
                            {(log.status === "cancelled" || log.status === "delivered") && (
                              <span className="text-[10px] text-slate-400 italic">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 inline shadow-sm" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stack View */}
            <div className="lg:hidden space-y-4">
              {giftLogs.map((log) => {
                const giftStatusClasses = {
                  pending: "bg-amber-50 text-amber-700 border-amber-200",
                  prepared: "bg-sky-50 text-sky-700 border-sky-200",
                  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  cancelled: "bg-slate-100 text-slate-600 border-slate-200"
                };
                const currStatusClass = giftStatusClasses[log.status] || "bg-slate-50";

                return (
                  <div 
                    key={log.id} 
                    className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/70 p-5 flex flex-col gap-4 shadow-sm"
                    dir={language === "ku" ? "rtl" : "ltr"}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200/50 pb-3">
                      <div className="text-right">
                        <h4 className="font-extrabold text-slate-800 text-sm">{log.employeeName}</h4>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          {getBusinessLabel(log.employeeBusiness)}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-extrabold ${currStatusClass} shadow-sm`}>
                        {log.status === "pending" ? t.pendingStatus : 
                         log.status === "prepared" ? t.preparedStatus :
                         log.status === "delivered" ? t.deliveredStatus : t.cancelledStatus}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400">{t.occasion}:</span>
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                          log.occasionType === "birthday" ? "bg-amber-500/10 border-amber-500/10 text-amber-700" : "bg-purple-500/10 border-purple-500/10 text-purple-700"
                        }`}>
                          {log.occasionType === "birthday" ? t.birthday : t.anniversary} ({log.occasionDate})
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-slate-400 text-right">{t.giftIdea}:</span>
                        <p className="bg-white/60 p-2.5 rounded-xl border border-white/80 text-slate-800 font-medium leading-relaxed font-sans text-right">
                          {log.giftIdea}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50">
                      {log.status === "pending" && (
                        <button
                          onClick={() => onUpdateGiftStatus(log.id, "prepared")}
                          className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition font-sans font-bold shadow-sm cursor-pointer"
                        >
                          {language === "ku" ? "دیاریکردن بۆ ئامادەکراو" : "Set Prepared"}
                        </button>
                      )}
                      {(log.status === "pending" || log.status === "prepared") && (
                        <button
                          onClick={() => onUpdateGiftStatus(log.id, "delivered")}
                          className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition font-sans font-bold shadow-sm cursor-pointer"
                        >
                          {language === "ku" ? "دیاریکردن بۆ بەخشراو" : "Set Delivered"}
                        </button>
                      )}
                      {log.status !== "cancelled" && log.status !== "delivered" && (
                        <button
                          onClick={() => onUpdateGiftStatus(log.id, "cancelled")}
                          className="text-[10px] bg-slate-100 border border-slate-100 text-slate-500 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition font-sans font-bold cursor-pointer"
                        >
                          {t.cancel}
                        </button>
                      )}
                      {(log.status === "cancelled" || log.status === "delivered") && (
                        <span className="text-[10px] text-slate-400 italic">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 inline shadow-sm" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
