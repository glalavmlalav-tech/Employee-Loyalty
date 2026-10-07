import React, { useState } from "react";
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  ShieldCheck, 
  User, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Info,
  Phone,
  Clock,
  Sparkles
} from "lucide-react";
import { Employee, BUSINESSES } from "../types";
import { formatDateToDDMMYYYY } from "../utils";

interface TrashPanelProps {
  trashEmployees: Employee[];
  language: "ku" | "en";
  onRestoreEmployee: (id: string) => Promise<void>;
  onPermanentDeleteEmployee?: (id: string) => Promise<void>;
}

export default function TrashPanel({
  trashEmployees,
  language,
  onRestoreEmployee
}: TrashPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoredNotification, setRestoredNotification] = useState<string | null>(null);

  const getBusinessLabel = (bizId: string) => {
    const biz = BUSINESSES[bizId as keyof typeof BUSINESSES];
    if (biz) {
      return language === "ku" ? biz.nameKu : biz.nameEn;
    }
    return bizId;
  };

  // Filter employees
  const filteredEmployees = trashEmployees.filter((emp) => {
    const matchName = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchTerm));
    const matchBusiness = selectedBusiness === "all" || emp.business === selectedBusiness;
    return matchName && matchBusiness;
  });

  const handleRestore = async (emp: Employee) => {
    setRestoringId(emp.id);
    try {
      await onRestoreEmployee(emp.id);
      setRestoredNotification(
        language === "ku"
          ? `کارمەند (${emp.name}) بە سەرکەوتوویی گەڕێنرایەوە بۆ شوێنی خۆی لە ناو سیستەمدا.`
          : `Employee (${emp.name}) was successfully restored to active directory.`
      );
      setTimeout(() => {
        setRestoredNotification(null);
      }, 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification for successful restore */}
      {restoredNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-900/95 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 backdrop-blur-md animate-bounce-slow" dir={language === "ku" ? "rtl" : "ltr"}>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold leading-relaxed">{restoredNotification}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 text-right">
            <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 flex items-center justify-end gap-3" dir="rtl">
              <span className="p-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/15 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </span>
              {language === "ku" ? "سەبەتەی خۆڵ و ئەرشیف (تایبەت بە سوپەر ئەدمین)" : "Trash & Archive (Super Admin Only)"}
            </h2>
            <p className="text-slate-600 text-xs md:text-sm font-sans max-w-2xl leading-relaxed" dir={language === "ku" ? "rtl" : "ltr"}>
              {language === "ku" 
                ? "ئەو کارمەندانەی لەلایەن ئەدمینی لقەکان یان بەڕێوەبەرەوە دەسڕێنەوە لێرە بە پارێزراوی دەمێننەوە. هیچ کەسێک ناتوانێت کارمەند بە یەکجاری بسڕێتەوە و هەموو کات دەتوانیت بیانگەڕێنیتەوە شوێنی خۆیان." 
                : "Employees deleted by branch admins or super admin reside safely here. No one can permanently erase employee data, and super admins can restore them back to their place at any time."}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 max-w-md self-end" dir={language === "ku" ? "rtl" : "ltr"}>
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div className="text-xs font-bold text-emerald-800 font-sans leading-relaxed">
              <span className="block font-black text-emerald-950 mb-0.5">
                {language === "ku" ? "پاراستنی داتای تەواو (Zero Data Loss)" : "Zero Data Loss Policy"}
              </span>
              {language === "ku"
                ? "داتای سەرجەم کارمەندان بە هەمیشەیی دەپارێزرێت و توانای گەڕاندنەوەی دەستبەجێ بەردەستە."
                : "All employee records and documents are permanently safeguarded with instant 1-click restoration."}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-[24px] p-5 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search box */}
          <div className="relative" dir={language === "ku" ? "rtl" : "ltr"}>
            <span className={`absolute inset-y-0 ${language === "ku" ? "right-3" : "left-3"} flex items-center pointer-events-none`}>
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder={language === "ku" ? "گەڕان بەپێی ناو، پیشە، ژمارەی مۆبایل..." : "Search by name, role, phone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs p-3 ${language === "ku" ? "pr-9 text-right" : "pl-9 text-left"} bg-white/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans shadow-2xs`}
            />
          </div>

          {/* Business Select dropdown */}
          <div dir={language === "ku" ? "rtl" : "ltr"}>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="w-full text-xs p-3 bg-white/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans shadow-2xs cursor-pointer text-slate-700"
            >
              <option value="all">{language === "ku" ? "گشت کۆمپانیا/شۆوروومەکان" : "All Businesses / Showrooms"}</option>
              <option value="linia">{language === "ku" ? "لینیا - دارتاشی (Lenya)" : "Lenya - Darstashi"}</option>
              <option value="massimo">{language === "ku" ? "ماسیمۆ - ستۆن گالەری (Massimo)" : "Massimo - Stone Gallery"}</option>
              <option value="liston">{language === "ku" ? "لیستۆن (Liston)" : "Liston"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-white/35 backdrop-blur-md rounded-[36px] border border-dashed border-slate-200/80">
          <Trash2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-700 font-extrabold text-sm">
            {language === "ku" ? "هیچ کارمەندێک لە سەبەتەی خۆڵدا نییە" : "Trash is currently empty"}
          </h4>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
            {language === "ku" 
              ? "کاتێک ئەدمینی لقەکان یان بەڕێوەبەر کارمەندێک دەسڕنەوە، زانیارییەکانی لێرە دەپارێزرێت و دەتوانیت لە هەر کاتێکدا بێت بیگەڕێنیتەوە." 
              : "When branch admins delete employees, their profiles will reside here safely for one-click restoration."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const dateStr = emp.deletedAt 
              ? new Date(emp.deletedAt).toLocaleDateString(language === "ku" ? "ku-IQ" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })
              : "نادیار / Unknown";

            const isRestoring = restoringId === emp.id;

            return (
              <div 
                key={emp.id} 
                className="bg-white/55 backdrop-blur-md rounded-[30px] border border-white/90 p-6 flex flex-col justify-between shadow-2xs relative hover:shadow-md transition duration-300 text-right group"
                dir="rtl"
              >
                <div>
                  {/* Avatar & Header */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
                    {emp.photoUrl ? (
                      <img 
                        src={emp.photoUrl} 
                        alt={emp.name} 
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/20 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-slate-800 text-base truncate">{emp.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                          {language === "ku" ? "لە سەبەتەی خۆڵ" : "Trashed"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{emp.role}</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/40 text-[10px] font-bold text-slate-600 font-sans mt-0.5">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        {getBusinessLabel(emp.business)}
                      </span>
                    </div>
                  </div>

                  {/* Deletion details */}
                  <div className="py-4 space-y-2 text-xs text-slate-600 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {language === "ku" ? "کاتی سڕینەوە:" : "Deleted At:"}
                      </span>
                      <span className="font-mono text-slate-600 font-bold">{dateStr}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {language === "ku" ? "سڕاوەتەوە لەلایەن:" : "Deleted By:"}
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        👤 {emp.deletedBy || "Admin"}
                      </span>
                    </div>
                    {emp.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {language === "ku" ? "ژمارەی مۆبایل:" : "Phone:"}
                        </span>
                        <span className="font-mono text-slate-700 font-bold">{emp.phone}</span>
                      </div>
                    )}
                    {emp.hireDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {language === "ku" ? "ڕۆژی دەستپێکردن:" : "Hire Date:"}
                        </span>
                        <span className="font-mono text-slate-700 font-semibold">{formatDateToDDMMYYYY(emp.hireDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action: Restore to active system */}
                <div className="mt-4 pt-1">
                  <button
                    onClick={() => handleRestore(emp)}
                    disabled={isRestoring}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition duration-200 shadow-md shadow-emerald-600/15 cursor-pointer disabled:opacity-50 active:scale-98"
                    title={language === "ku" ? "گێڕانەوەی کارمەندەکە بۆ شوێنی خۆی لە ناو سیستەم" : "Restore employee to original directory"}
                  >
                    <RotateCcw className={`w-4 h-4 ${isRestoring ? "animate-spin" : ""}`} />
                    <span>
                      {isRestoring
                        ? (language === "ku" ? "دەگەڕێنرێتەوە..." : "Restoring...")
                        : (language === "ku" ? "گێڕانەوە بۆ شوێنی خۆی لە سیستەم ↺" : "Restore to Active Directory ↺")}
                    </span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                    {language === "ku"
                      ? "داتا و بەڵگەنامەکان پارێزراون، بە گەڕاندنەوە دەچێتەوە لقی خۆی"
                      : "Zero data loss: Restores directly to original branch"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
