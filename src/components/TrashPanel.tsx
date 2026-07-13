import React, { useState } from "react";
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertTriangle, 
  User, 
  Layers, 
  Calendar, 
  CheckCircle, 
  X,
  ShieldAlert
} from "lucide-react";
import { Employee, BUSINESSES } from "../types";

interface TrashPanelProps {
  trashEmployees: Employee[];
  language: "ku" | "en";
  onRestoreEmployee: (id: string) => Promise<void>;
  onPermanentDeleteEmployee: (id: string) => Promise<void>;
}

export default function TrashPanel({
  trashEmployees,
  language,
  onRestoreEmployee,
  onPermanentDeleteEmployee
}: TrashPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [employeeToPermanentlyDelete, setEmployeeToPermanentlyDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getBusinessLabel = (bizId: string) => {
    const biz = BUSINESSES[bizId as keyof typeof BUSINESSES];
    if (biz) {
      return language === "ku" ? biz.nameKu : biz.nameEn;
    }
    return bizId;
  };

  // Filter employees
  const filteredEmployees = trashEmployees.filter((emp) => {
    const matchName = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBusiness = selectedBusiness === "all" || emp.business === selectedBusiness;
    return matchName && matchBusiness;
  });

  const handlePermanentDelete = async () => {
    if (!employeeToPermanentlyDelete) return;
    setIsDeleting(true);
    try {
      await onPermanentDeleteEmployee(employeeToPermanentlyDelete.id);
      setEmployeeToPermanentlyDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 text-right">
            <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 flex items-center justify-end gap-3" dir="rtl">
              <span className="p-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </span>
              {language === "ku" ? "سەبەتەی خۆڵ (تایبەت بە بەڕێوەبەر)" : "Trash / Archive (Super Admin Only)"}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-sans" dir={language === "ku" ? "rtl" : "ltr"}>
              {language === "ku" 
                ? "لێرەدا ئەو کارمەندانە دەبینیت کە پێشتر سڕاونەتەوە. دەتوانیت بیانگەڕێنیتەوە یان بە تەواوی لە سیستەمەکە بیانسڕیتەوە." 
                : "Here you can view employees that were soft-deleted. You can restore them to active directory or permanently purge them."}
            </p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/15 p-4 rounded-2xl flex items-center gap-3 max-w-md self-end" dir={language === "ku" ? "rtl" : "ltr"}>
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-xs font-bold text-rose-700 font-sans leading-relaxed">
              {language === "ku"
                ? "ئاگاداری: ئەم بەشە تەنیا بۆ بەڕێوەبەری سەرەکی (Super Admin) پیشاندەدرێت. سڕینەوەی یەکجاری بۆ هەمیشە زانیارییەکان ڕادەماڵێت."
                : "Security Warning: Only Super Admins have access to this portal. Permanent deletion is irreversible and completely wipes record."}
            </span>
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
              placeholder={language === "ku" ? "گەڕان بەپێی ناوی کارمەند..." : "Search by employee name..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs p-3 ${language === "ku" ? "pr-9 text-right" : "pl-9 text-left"} bg-white/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans shadow-2xs`}
            />
          </div>

          {/* Business Select dropdown */}
          <div dir={language === "ku" ? "rtl" : "ltr"}>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="w-full text-xs p-3 bg-white/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans shadow-2xs cursor-pointer text-slate-700"
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
          <h4 className="text-slate-600 font-bold text-sm">
            {language === "ku" ? "هیچ داتایەک لە سەبەتەی خۆڵدا نییە" : "Trash is currently empty"}
          </h4>
          <p className="text-slate-400 text-xs mt-1">
            {language === "ku" 
              ? "کاتێک کارمەندێک دەسڕیتەوە، زانیارییەکانی لێرە دەپارێزرێت." 
              : "When you soft-delete employees, their profiles will safely reside here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const dateStr = emp.deletedAt 
              ? new Date(emp.deletedAt).toLocaleDateString(language === "ku" ? "ku-IQ" : "en-US")
              : "نادیار / Unknown";

            return (
              <div 
                key={emp.id} 
                className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/80 p-6 flex flex-col justify-between shadow-2xs relative hover:shadow-xs transition duration-200 text-right group"
                dir="rtl"
              >
                <div>
                  {/* Avatar & Header */}
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    {emp.photoUrl ? (
                      <img 
                        src={emp.photoUrl} 
                        alt={emp.name} 
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/10 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200/50 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-800 text-base truncate">{emp.name}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{emp.role}</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/40 text-[10px] font-bold text-slate-600 font-sans mt-1">
                        <Layers className="w-3 h-3" />
                        {getBusinessLabel(emp.business)}
                      </span>
                    </div>
                  </div>

                  {/* Deletion details */}
                  <div className="py-4 space-y-2.5 text-xs text-slate-600 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{language === "ku" ? "کاتی سڕینەوە:" : "Deleted At:"}</span>
                      <span className="font-mono text-slate-500 font-bold">{dateStr}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{language === "ku" ? "سڕاوەتەوە لەلایەن:" : "Deleted By:"}</span>
                      <span className="font-bold text-slate-700">👤 {emp.deletedBy || "Admin"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{language === "ku" ? "هۆکار (تێبینی):" : "Reason / Notes:"}</span>
                      <span className="text-slate-600 font-medium max-w-[180px] truncate" title={emp.notes || ""}>
                        {emp.notes || (language === "ku" ? "هیچ" : "None")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Restore / Purge Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Restore button */}
                  <button
                    onClick={() => onRestoreEmployee(emp.id)}
                    className="py-2.5 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/40 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={language === "ku" ? "گێڕانەوەی کارمەند بۆ ناو سیستەم" : "Restore employee profile"}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {language === "ku" ? "گێڕانەوە" : "Restore"}
                  </button>

                  {/* Permanent Delete Button */}
                  <button
                    onClick={() => setEmployeeToPermanentlyDelete(emp)}
                    className="py-2.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/40 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={language === "ku" ? "سڕینەوەی یەکجاری و هەمیشەیی" : "Permanently purge from system"}
                  >
                    <Trash2 className="w-4 h-4" />
                    {language === "ku" ? "سڕینەوەی هەمیشەیی" : "Delete Perm"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permanent Delete Modal */}
      {employeeToPermanentlyDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 text-right relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1.5 bg-rose-500" />
            
            <button
              onClick={() => setEmployeeToPermanentlyDelete(null)}
              className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-bounce-slow" />
              </div>
              
              <h3 className="text-lg font-black text-slate-800 font-sans">
                {language === "ku" ? "دڵنیای لە سڕینەوەی یەکجاری؟" : "Are you absolutely sure?"}
              </h3>
              
              <p className="text-slate-500 text-xs md:text-sm mt-2 font-sans leading-relaxed px-2">
                {language === "ku"
                  ? `دەتەوێت کارمەند (${employeeToPermanentlyDelete.name}) بە هەمیشەیی بسڕیتەوە؟ ئەم کردارە بە هیچ جۆرێک ناگەڕێتەوە و سەرجەم داتاکان لە داتابەیس ڕادەماڵدرێت.`
                  : `This will permanently purge (${employeeToPermanentlyDelete.name}) and all associated records from the cloud. This operation cannot be undone.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setEmployeeToPermanentlyDelete(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
              >
                {language === "ku" ? "پاشگەزبوونەوە" : "Cancel"}
              </button>
              
              <button
                onClick={handlePermanentDelete}
                disabled={isDeleting}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition shadow-md shadow-rose-600/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting 
                  ? (language === "ku" ? "دەسڕێتەوە..." : "Purging...") 
                  : (language === "ku" ? "سڕینەوەی هەمیشەیی" : "Yes, Purge")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
