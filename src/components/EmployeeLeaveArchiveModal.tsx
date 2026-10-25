import React, { useState, useMemo } from "react";
import { 
  X, 
  Archive, 
  Plus, 
  Calendar, 
  Clock, 
  Printer, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  User, 
  Phone,
  Search,
  Download,
  AlertCircle,
  ShieldCheck,
  Check
} from "lucide-react";
import { Employee, LeaveRequest, BUSINESSES, AppUser } from "../types";
import { formatDateToDDMMYYYY } from "../utils";
import PrintableLeaveForm from "./PrintableLeaveForm";

interface EmployeeLeaveArchiveModalProps {
  employee: Employee;
  leaveRequests: LeaveRequest[];
  onOpenNewLeaveModal: (emp: Employee) => void;
  onDeleteLeaveRequest: (id: string) => Promise<void>;
  onClose: () => void;
  language?: "ku" | "en";
  userSession?: { role?: string; [key: string]: any } | null;
}

export default function EmployeeLeaveArchiveModal({
  employee,
  leaveRequests,
  onOpenNewLeaveModal,
  onDeleteLeaveRequest,
  onClose,
  language = "ku",
  userSession
}: EmployeeLeaveArchiveModalProps) {
  const isSuperAdmin = userSession?.role === "super_admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedGuardLink, setCopiedGuardLink] = useState(false);

  const biz = BUSINESSES[employee.business];

  // Leaves for this employee
  const employeeLeaves = useMemo(() => {
    return leaveRequests
      .filter(l => l.employeeId === employee.id)
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  }, [leaveRequests, employee.id]);

  // Aggregate statistics
  const stats = useMemo(() => {
    let totalCount = employeeLeaves.length;
    let totalDays = 0;
    let totalHours = 0;
    let annualCount = 0;
    let sickCount = 0;
    let hourlyCount = 0;
    let emergencyCount = 0;
    let unpaidCount = 0;

    for (const l of employeeLeaves) {
      if (l.durationType === "daily" && l.totalDays) {
        totalDays += l.totalDays;
      }
      if (l.durationType === "hourly" && l.totalHours) {
        totalHours += l.totalHours;
      }

      if (l.leaveType === "annual") annualCount++;
      else if (l.leaveType === "sick") sickCount++;
      else if (l.leaveType === "hourly") hourlyCount++;
      else if (l.leaveType === "emergency") emergencyCount++;
      else if (l.leaveType === "unpaid") unpaidCount++;
    }

    return {
      totalCount,
      totalDays,
      totalHours,
      annualCount,
      sickCount,
      hourlyCount,
      emergencyCount,
      unpaidCount
    };
  }, [employeeLeaves]);

  // Filtered list
  const filteredLeaves = useMemo(() => {
    return employeeLeaves.filter(l => {
      if (filterType !== "all" && l.leaveType !== filterType) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesForm = l.formNumber?.toLowerCase().includes(query);
        const matchesReason = l.reason?.toLowerCase().includes(query);
        const matchesDeputized = l.deputizedEmployee?.toLowerCase().includes(query);
        const matchesDate = l.date?.includes(query) || l.startDate?.includes(query);
        return matchesForm || matchesReason || matchesDeputized || matchesDate;
      }
      return true;
    });
  }, [employeeLeaves, filterType, searchTerm]);

  const handleDelete = async (id: string) => {
    const confirmText = language === "ku" 
      ? "ئایا دڵنیایت لە سڕینەوەی ئەم فۆرمەی مۆڵەت لە ئەرشیف؟"
      : "Are you sure you want to delete this leave request?";
    if (!window.confirm(confirmText)) return;

    try {
      setDeletingId(id);
      await onDeleteLeaveRequest(id);
    } catch (e) {
      alert("Error deleting leave request");
    } finally {
      setDeletingId(null);
    }
  };

  const getLeaveTypeBadge = (type: string, otherText?: string) => {
    switch (type) {
      case "annual":
        return { label: language === "ku" ? "مۆڵەتی ساڵانە" : "Annual", bg: "bg-teal-50 text-teal-800 border-teal-200" };
      case "sick":
        return { label: language === "ku" ? "مۆڵەتی نەخۆشی" : "Sick", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "hourly":
        return { label: language === "ku" ? "مۆڵەتی کاتژمێری" : "Hourly", bg: "bg-sky-50 text-sky-800 border-sky-200" };
      case "emergency":
        return { label: language === "ku" ? "مۆڵەتی کتوپڕ" : "Emergency", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "unpaid":
        return { label: language === "ku" ? "مۆڵەتی بێ مووچە" : "Unpaid", bg: "bg-rose-50 text-rose-800 border-rose-200" };
      default:
        return { label: otherText || (language === "ku" ? "هی تر" : "Other"), bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header with Employee Summary */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-14 rounded-xl overflow-hidden border-2 border-white/30 bg-slate-800 flex items-center justify-center shrink-0">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  {language === "ku" ? `ئەرشیفی مۆڵەتەکانی: ${employee.name}` : `Leave Archive: ${employee.name}`}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : employee.business}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-sans">
                {employee.role} • {language === "ku" ? "مۆبایل:" : "Phone:"} {employee.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/security`;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                }
                setCopiedGuardLink(true);
                setTimeout(() => setCopiedGuardLink(false), 2000);
              }}
              title={language === "ku" ? "کۆپیکردنی بەستەری گشتی پاسەوان بۆ دەروازە" : "Copy Security Guard Public Link"}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedGuardLink ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-teal-400" />}
              <span className="hidden md:inline">
                {copiedGuardLink ? (language === "ku" ? "کۆپیکرا!" : "Copied!") : (language === "ku" ? "لینکی پاسەوان" : "Guard Link")}
              </span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenNewLeaveModal(employee);
              }}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">{language === "ku" ? "تۆمارکردنی مۆڵەتی نوێ" : "New Leave Request"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {language === "ku" ? "کۆی گشتی مۆڵەتەکان" : "Total Requests"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-slate-800 font-mono">{stats.totalCount}</span>
                <span className="text-xs font-bold text-slate-400">{language === "ku" ? "جار" : "times"}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs">
              <span className="text-[10px] font-black text-teal-700 uppercase tracking-wider block">
                {language === "ku" ? "کۆی ڕۆژەکانی مۆڵەت" : "Total Daily Days"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-teal-800 font-mono">{stats.totalDays}</span>
                <span className="text-xs font-bold text-teal-600">{language === "ku" ? "ڕۆژ" : "days"}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-xs">
              <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider block">
                {language === "ku" ? "کۆی کاتژمێرەکانی مۆڵەت" : "Total Hourly Hours"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-sky-800 font-mono">{stats.totalHours}</span>
                <span className="text-xs font-bold text-sky-600">{language === "ku" ? "کاتژمێر" : "hrs"}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {language === "ku" ? "جۆرەکانی مۆڵەت" : "Types Breakdown"}
              </span>
              <div className="text-[11px] font-bold text-slate-600 mt-1 flex flex-wrap gap-1 font-sans">
                <span>🏖️ {stats.annualCount} ساڵانە</span>
                <span>• 🩺 {stats.sickCount} نەخۆشی</span>
                <span>• ⏱️ {stats.hourlyCount} کاتژمێری</span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder={language === "ku" ? "گەڕان لە مۆڵەتەکان (هۆکار، بەروار، ژمارە)..." : "Search leaves (reason, date, #)..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "all", labelKu: "هەمووی", labelEn: "All" },
                { id: "annual", labelKu: "ساڵانە", labelEn: "Annual" },
                { id: "sick", labelKu: "نەخۆشی", labelEn: "Sick" },
                { id: "hourly", labelKu: "کاتژمێری", labelEn: "Hourly" },
                { id: "emergency", labelKu: "کتوپڕ", labelEn: "Emergency" },
                { id: "unpaid", labelKu: "بێ مووچە", labelEn: "Unpaid" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    filterType === f.id
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {language === "ku" ? f.labelKu : f.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Leaves List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-black text-slate-700">
                {language === "ku" ? "هیچ فۆڕمێکی مۆڵەت نەدۆزرایەوە" : "No Leave Records Found"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-sans">
                {language === "ku" 
                  ? "ئەم کارمەندە تا ئێستا هیچ داواکارییەکی مۆڵەتی بۆ تۆمار نەکراوە."
                  : "No leave requests have been archived for this employee yet."}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewLeaveModal(employee);
                }}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{language === "ku" ? "تۆمارکردنی یەکەم مۆڵەت" : "Record First Leave"}</span>
              </button>
            </div>
          ) : (
            filteredLeaves.map((leave) => {
              const badge = getLeaveTypeBadge(leave.leaveType, leave.leaveTypeOtherText);
              return (
                <div 
                  key={leave.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition space-y-3"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        #{leave.formNumber}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {language === "ku" ? "پەسەندکراوە" : "Approved"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingLeave(leave)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl border border-indigo-200/60 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        title={language === "ku" ? "بینینی فۆڕمی فەرمی و چاپکردن" : "View and Print Official Form"}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{language === "ku" ? "فۆڕمی فەرمی / چاپ" : "View / Print"}</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(leave.id)}
                          disabled={deletingId === leave.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title={language === "ku" ? "سڕینەوەی ئەم فۆرمە (تەنیا سوپەر ئەدمین)" : "Delete this leave record (Super Admin only)"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date & Duration Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {language === "ku" ? "ڕێکەوتی تۆمارکردن" : "Date of Request"}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatDateToDDMMYYYY(leave.date)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {leave.durationType === "daily" 
                          ? (language === "ku" ? "ماوەی مۆڵەت (ڕۆژانە)" : "Duration (Daily)") 
                          : (language === "ku" ? "ماوەی مۆڵەت (کاتژمێری)" : "Duration (Hourly)")}
                      </span>
                      {leave.durationType === "daily" ? (
                        <div className="font-mono text-slate-800 font-bold flex items-center gap-1.5">
                          <span>{leave.startDate ? formatDateToDDMMYYYY(leave.startDate) : "-"}</span>
                          <span className="text-slate-400">تا</span>
                          <span>{leave.endDate ? formatDateToDDMMYYYY(leave.endDate) : "-"}</span>
                          <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-black text-[11px] mr-1">
                            {leave.totalDays} {language === "ku" ? "ڕۆژ" : "days"}
                          </span>
                        </div>
                      ) : (
                        <div className="font-mono text-slate-800 font-bold flex items-center gap-1.5">
                          <span>{leave.hourlyDate ? formatDateToDDMMYYYY(leave.hourlyDate) : "-"}</span>
                          <span>({leave.startHour} - {leave.endHour})</span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-black text-[11px] mr-1">
                            {leave.totalHours} {language === "ku" ? "کاتژمێر" : "hrs"}
                          </span>
                        </div>
                      )}
                    </div>

                    {leave.returnDate && (
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          {language === "ku" ? "بەرواری گەڕانەوە بۆ کار" : "Return to Work"}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatDateToDDMMYYYY(leave.returnDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason & Replacement */}
                  <div className="text-xs space-y-1 font-sans">
                    <div>
                      <span className="font-extrabold text-slate-500">
                        {language === "ku" ? "هۆکاری مۆڵەت: " : "Reason: "}
                      </span>
                      <span className="text-slate-800 font-medium">
                        {leave.reason}
                      </span>
                    </div>

                    {leave.deputizedEmployee && (
                      <div className="text-slate-600">
                        <span className="font-extrabold text-slate-500">
                          {language === "ku" ? "کارمەندی جێگر: " : "Deputized replacement: "}
                        </span>
                        <span className="font-bold text-indigo-700">
                          {leave.deputizedEmployee}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer & Signature Preview */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span>{language === "ku" ? "تۆمارکراوە لەلایەن:" : "Recorded by:"} <b>{leave.createdBy}</b></span>
                      {leave.signatureDataUrl && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          ✍️ {language === "ku" ? "واژوو کراوە" : "Signed"}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold">
            {language === "ku" ? `کۆی مۆڵەتە تۆمارکراوەکان: ${employeeLeaves.length}` : `Total Leaves: ${employeeLeaves.length}`}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
          >
            {language === "ku" ? "داخستن" : "Close"}
          </button>
        </div>

      </div>

      {/* Printable / View Official Form Overlay */}
      {viewingLeave && (
        <PrintableLeaveForm
          leave={viewingLeave}
          onClose={() => setViewingLeave(null)}
          language={language}
          isSuperAdmin={isSuperAdmin}
          onDelete={onDeleteLeaveRequest}
        />
      )}
    </div>
  );
}
