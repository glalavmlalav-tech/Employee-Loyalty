import React, { useState } from "react";
import { Printer, X, Download, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { LeaveRequest, BUSINESSES } from "../types";
import { formatDateToDDMMYYYY } from "../utils";
import AppLogo from "./AppLogo";
import { useCustomLogo } from "../utils/logoManager";

interface PrintableLeaveFormProps {
  leave: LeaveRequest;
  onClose: () => void;
  language?: "ku" | "en";
  isSuperAdmin?: boolean;
  onDelete?: (id: string) => Promise<void> | void;
}

export default function PrintableLeaveForm({
  leave,
  onClose,
  language = "ku",
  isSuperAdmin = false,
  onDelete
}: PrintableLeaveFormProps) {
  const biz = BUSINESSES[leave.employeeBusiness];
  const customLogo = useCustomLogo();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(leave.id);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error("Failed to delete leave:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual":
        return { ku: "مۆڵەتی ساڵانە", en: "Annual Leave" };
      case "sick":
        return { ku: "مۆڵەتی نەخۆشی", en: "Sick Leave" };
      case "unpaid":
        return { ku: "مۆڵەتی بێ مووچە", en: "Unpaid Leave" };
      case "emergency":
        return { ku: "مۆڵەتی بۆنە / کتوپڕ", en: "Emergency Leave" };
      case "hourly":
        return { ku: "مۆڵەتی کاتژمێری", en: "Hourly Leave" };
      default:
        return { ku: leave.leaveTypeOtherText || "هی تر", en: leave.leaveTypeOtherText || "Other" };
    }
  };

  const currentType = getLeaveTypeLabel(leave.leaveType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Bar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800">
              {language === "ku" ? "فۆڕمی فەرمی داواکاری مۆڵەت" : "Official Leave Request Form"}
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
              #{leave.formNumber}
            </span>
          </div>
          
          <div className="flex items-center gap-2.5">
            {isSuperAdmin && onDelete && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                title={language === "ku" ? "سڕینەوەی ئەم مۆڵەتە (تەنیا سوپەر ئەدمین)" : "Delete Leave (Super Admin Only)"}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{language === "ku" ? "سڕینەوەی مۆڵەت" : "Delete"}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {language === "ku" ? "چاپکردن (Print / PDF)" : "Print / PDF"}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal for Super Admin */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-start font-sans">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {language === "ku" ? "دڵنیایت لە سڕینەوەی ئەم مۆڵەتە؟" : "Confirm Leave Deletion?"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === "ku"
                    ? `فۆڕمی ژمارە (#${leave.formNumber}) بۆ کارمەند (${leave.employeeName}) بە تەواوی لە داتابەیسی فایربەیس و سەرجەم ئامێرەکان دەسڕدرێتەوە. ئەم کردارە گەڕانەوەی نییە.`
                    : `Leave form #${leave.formNumber} for ${leave.employeeName} will be permanently removed from Firestore and all devices.`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {language === "ku" ? "پەشیمانبوونەوە" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? (language === "ku" ? "دەسڕدرێتەوە..." : "Deleting...") : (language === "ku" ? "بەڵێ، بسڕەوە" : "Yes, Delete")}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Paper Form Content */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible text-slate-800 font-sans">
          <div className="border-2 border-slate-700 p-6 sm:p-8 rounded-lg max-w-3xl mx-auto bg-white print:border-slate-800 print:shadow-none shadow-sm space-y-6">
            
            {/* Form Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-700 pb-5">
              {/* Form Info Box */}
              <div className="border border-slate-400 p-2.5 rounded text-xs space-y-1 font-mono font-bold bg-slate-50/50">
                <div>
                  <span className="text-slate-500 font-sans">{language === "ku" ? "ژمارەی فۆڕم:" : "Form No:"}</span>{" "}
                  <span className="text-slate-900">{leave.formNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">{language === "ku" ? "بەروار:" : "Date:"}</span>{" "}
                  <span className="text-slate-900">{formatDateToDDMMYYYY(leave.date)}</span>
                </div>
              </div>

              {/* Title & Brand */}
              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-black tracking-wider text-slate-900 uppercase">
                  LENYA INTERIORS KITCHEN
                </h1>
                <h2 className="text-base sm:text-lg font-black text-teal-800 mt-1">
                  فۆڕمی داواکاری مۆڵەت
                </h2>
                <div className="text-xs font-bold text-slate-500 tracking-wide">
                  Leave Request Form
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                  {biz ? biz.nameKu : ""}
                </div>
              </div>

              {/* Logo */}
              <div className="flex flex-col items-center justify-center p-1.5 border border-slate-300 rounded-xl bg-slate-50/50 w-20 h-20 overflow-hidden shadow-xs">
                <AppLogo className="w-12 h-12 max-w-full max-h-full" color="#0f766e" />
                {!customLogo && (
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase mt-0.5">LENYA</span>
                )}
              </div>
            </div>

            {/* Section 1: Employee Information */}
            <div>
              <div className="bg-teal-800 text-white px-3 py-1.5 text-xs font-black rounded-t flex justify-between items-center">
                <span>١. زانیاری کارمەند</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest">Employee Information</span>
              </div>
              
              <div className="border border-slate-400 border-t-0 p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                {/* Employee Photo */}
                <div className="sm:col-span-1 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-l sm:border-slate-300 pb-3 sm:pb-0 sm:pl-3">
                  <div className="w-24 h-28 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center shadow-inner">
                    {leave.employeePhotoUrl ? (
                      <img 
                        src={leave.employeePhotoUrl} 
                        alt={leave.employeeName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-center text-slate-400 p-2">
                        <span className="text-2xl block mb-1">👤</span>
                        <span className="text-[9px] font-bold leading-tight block">وێنەی کارمەند</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 mt-1.5">
                    ID: {leave.employeeId}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="sm:col-span-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">کۆدی کارمەند / Employee Code</span>
                    <span className="font-mono font-black text-slate-800 text-sm">{leave.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ناوی سیانی کارمەند / Employee Name</span>
                    <span className="font-black text-slate-900 text-sm">{leave.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">پۆست / Post Title</span>
                    <span className="font-bold text-slate-800">{leave.employeeRole}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">بەش / Department</span>
                    <span className="font-bold text-slate-800">{biz ? biz.nameKu : leave.employeeBusiness}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ژمارەی مۆبایل / Phone No.</span>
                    <span className="font-mono font-bold text-slate-800">{leave.employeePhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">بەرواری دەستپێکردنی کار / Hire Date</span>
                    <span className="font-mono font-bold text-slate-800">
                      {leave.employeeHireDate ? formatDateToDDMMYYYY(leave.employeeHireDate) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Leave Type */}
            <div>
              <div className="bg-teal-800 text-white px-3 py-1.5 text-xs font-black rounded-t flex justify-between items-center">
                <span>٢. جۆری مۆڵەت (تەنها یەکێک هەڵبژێردراوە)</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest">Leave Type</span>
              </div>
              <div className="border border-slate-400 border-t-0 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { id: "annual", ku: "مۆڵەتی ساڵانە", en: "Annual" },
                  { id: "sick", ku: "مۆڵەتی نەخۆشی", en: "Sick" },
                  { id: "unpaid", ku: "مۆڵەتی بێ مووچە", en: "Unpaid" },
                  { id: "emergency", ku: "مۆڵەتی بۆنە / کتوپڕ", en: "Emergency" },
                  { id: "hourly", ku: "مۆڵەتی کاتژمێری", en: "Hourly" },
                  { id: "other", ku: `هی تر: ${leave.leaveTypeOtherText || "..."}`, en: "Other" }
                ].map((item) => {
                  const isSelected = leave.leaveType === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center gap-2 p-2 rounded border ${
                        isSelected ? "bg-teal-50 border-teal-600 font-black text-teal-900" : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center font-mono text-[10px] ${
                        isSelected ? "bg-teal-700 text-white border-teal-700" : "border-slate-400"
                      }`}>
                        {isSelected ? "✓" : ""}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[11px] leading-tight">{item.ku}</span>
                        <span className="text-[9px] opacity-70 leading-none">{item.en}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {leave.leaveType === "sick" && leave.hasMedicalReport && (
                <div className="border border-slate-400 border-t-0 px-3 py-1.5 text-[11px] bg-slate-50 text-slate-700 flex items-center gap-2 font-bold">
                  <span className="text-emerald-600 font-mono">☑</span>
                  <span>ڕاپۆرتی پزیشکی پەیوەندیدار هاوپێچکراوە / Medical Report Attached</span>
                </div>
              )}
            </div>

            {/* Section 3: Duration */}
            <div>
              <div className="bg-teal-800 text-white px-3 py-1.5 text-xs font-black rounded-t flex justify-between items-center">
                <span>٣. ماوەی مۆڵەت</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest">Duration</span>
              </div>
              
              <div className="border border-slate-400 border-t-0 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Daily Sub-section */}
                <div className={`p-3 rounded-lg border ${leave.durationType === "daily" ? "border-teal-600 bg-teal-50/40" : "border-slate-200 opacity-60"}`}>
                  <div className="font-black text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>أ) مۆڵەتی ڕۆژانە / Daily</span>
                    {leave.durationType === "daily" && <span className="text-teal-700 text-[10px] font-bold">★ دیاریکراوە</span>}
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">لە بەرواری:</span>
                      <span className="font-mono font-bold">{leave.startDate ? formatDateToDDMMYYYY(leave.startDate) : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">تا بەرواری:</span>
                      <span className="font-mono font-bold">{leave.endDate ? formatDateToDDMMYYYY(leave.endDate) : "-"}</span>
                    </div>
                    <div className="flex justify-between bg-white/80 p-1 rounded font-bold border border-slate-200">
                      <span className="text-teal-900">کۆی ڕۆژەکان:</span>
                      <span className="font-mono text-teal-800">{leave.totalDays || 0} ڕۆژ</span>
                    </div>
                    <div className="flex justify-between pt-1 text-[11px]">
                      <span className="text-slate-500">بەرواری گەڕانەوە بۆ کار:</span>
                      <span className="font-mono font-bold text-slate-700">{leave.returnDate ? formatDateToDDMMYYYY(leave.returnDate) : "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Hourly Sub-section */}
                <div className={`p-3 rounded-lg border ${leave.durationType === "hourly" ? "border-teal-600 bg-teal-50/40" : "border-slate-200 opacity-60"}`}>
                  <div className="font-black text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>ب) مۆڵەتی کاتژمێری / Hourly</span>
                    {leave.durationType === "hourly" && <span className="text-teal-700 text-[10px] font-bold">★ دیاریکراوە</span>}
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">بەروار:</span>
                      <span className="font-mono font-bold">{leave.hourlyDate ? formatDateToDDMMYYYY(leave.hourlyDate) : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">لە کاتژمێر:</span>
                      <span className="font-mono font-bold">{leave.startHour || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">تا کاتژمێر:</span>
                      <span className="font-mono font-bold">{leave.endHour || "-"}</span>
                    </div>
                    <div className="flex justify-between bg-white/80 p-1 rounded font-bold border border-slate-200">
                      <span className="text-teal-900">کۆی کاتژمێرەکان:</span>
                      <span className="font-mono text-teal-800">{leave.totalHours || 0} کاتژمێر</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Reason & Contact */}
            <div>
              <div className="bg-teal-800 text-white px-3 py-1.5 text-xs font-black rounded-t flex justify-between items-center">
                <span>٤. هۆکار و زانیاری لە کاتی مۆڵەتدا</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest">Reason & Contact</span>
              </div>
              <div className="border border-slate-400 border-t-0 p-3 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">هۆکاری مۆڵەت / Leave Reason</span>
                  <p className="font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 mt-1 whitespace-pre-wrap">
                    {leave.reason || "دیارینەکراوە"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">کارمەندی جێگر (کێ کارەکان ئەنجام دەدات) / Deputized Staff</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{leave.deputizedEmployee || "دیارینەکراوە"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ژمارەی پەیوەندی لە کاتی مۆڵەتدا / Contact No.</span>
                    <span className="font-mono font-bold text-slate-800 block mt-0.5">{leave.contactPhone || leave.employeePhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Signatures & Verification */}
            <div>
              <div className="bg-teal-800 text-white px-3 py-1.5 text-xs font-black rounded-t flex justify-between items-center">
                <span>٥. واژوو و پەسەندکردن</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest">Signatures & Status</span>
              </div>
              
              <div className="border border-slate-400 border-t-0 p-4 grid grid-cols-2 gap-4 text-xs">
                {/* Employee Signature Card */}
                <div className="border border-slate-300 rounded-lg p-3 flex flex-col justify-between min-h-[140px] bg-slate-50/50">
                  <div>
                    <div className="font-black text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                      <span>کارمەند / Employee</span>
                      <span className="text-[10px] text-emerald-700 font-bold">✓ ڕەزامەندبوو</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      دڵنیام لە ڕاستی سەرجەم زانیارییەکان.
                    </div>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {leave.signatureDataUrl ? (
                      <div className="bg-white p-1 rounded border border-slate-200 shadow-inner max-w-full">
                        <img 
                          src={leave.signatureDataUrl} 
                          alt="Signature" 
                          className="h-14 max-w-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="h-12 border-b border-dashed border-slate-300 w-full flex items-end justify-center text-slate-400 text-[10px]">
                        (واژووی تۆمارنەکراو)
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 flex justify-between border-t border-slate-200 pt-1">
                    <span>ناو: <b>{leave.employeeName}</b></span>
                    <span>بەروار: <b className="font-mono">{formatDateToDDMMYYYY(leave.date)}</b></span>
                  </div>
                </div>

                {/* Branch Manager / Admin Verification Card */}
                <div className="border border-teal-300 rounded-lg p-3 flex flex-col justify-between min-h-[140px] bg-teal-50/30">
                  <div>
                    <div className="font-black text-teal-900 border-b border-teal-200 pb-1 flex justify-between items-center">
                      <span>بەڕێوەبەری لق / Showroom Manager</span>
                      <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                        پەسەندکراوە ✓
                      </span>
                    </div>
                    <div className="text-[10px] text-teal-700 mt-1">
                      لە ڕێگەی سیستمەوە بەشێوەی ئۆتۆماتیکی پەسەندکراوە و ئەرشیف کراوە.
                    </div>
                  </div>

                  <div className="my-2 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-teal-300 rounded-lg text-teal-800 text-[11px] font-bold">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>تۆمارکرا لەلایەن: {leave.createdBy}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-600 flex justify-between border-t border-teal-200 pt-1">
                    <span>بەش: <b>{biz ? biz.nameKu : ""}</b></span>
                    <span>سیستم: <b className="font-mono">LENYA-HR</b></span>
                  </div>
                </div>
              </div>

              {leave.notes && (
                <div className="border border-slate-400 border-t-0 p-3 bg-slate-50 text-xs">
                  <span className="font-bold text-slate-700 block mb-0.5">تێبینی:</span>
                  <p className="text-slate-600 font-sans">{leave.notes}</p>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
              ئەم بەڵگەنامەیە بەشێوەی دیجیتالی لە سیستەمی مۆڵەتی LENYA دەرکراوە و بە فەرمی هەژمار دەکرێت.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
