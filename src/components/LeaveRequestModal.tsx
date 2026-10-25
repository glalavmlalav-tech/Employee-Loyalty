import React, { useState, useMemo } from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  Check, 
  AlertCircle, 
  FileText, 
  User, 
  Phone, 
  Briefcase, 
  Layers, 
  ShieldCheck,
  Sparkles,
  Info
} from "lucide-react";
import { Employee, LeaveRequest, LeaveType, LeaveDurationType, BUSINESSES, BusinessId } from "../types";
import { formatDateToDDMMYYYY } from "../utils";
import DigitalSignaturePad from "./DigitalSignaturePad";
import AppLogo from "./AppLogo";

interface LeaveRequestModalProps {
  employee: Employee;
  colleagues?: Employee[];
  systemDate?: string;
  userSession?: { username: string; role: "super_admin" | "admin" | "observer"; business: BusinessId | "all"; name: string } | null;
  onSubmit: (request: Omit<LeaveRequest, "id">) => Promise<void>;
  onClose: () => void;
  language?: "ku" | "en";
}

export default function LeaveRequestModal({
  employee,
  colleagues = [],
  systemDate,
  userSession,
  onSubmit,
  onClose,
  language = "ku"
}: LeaveRequestModalProps) {
  const today = systemDate || new Date().toISOString().split("T")[0];
  const biz = BUSINESSES[employee.business];

  // Auto generated Form Number
  const generatedFormNumber = useMemo(() => {
    const year = today.split("-")[0] || new Date().getFullYear().toString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `LR-${year}-${randomSuffix}`;
  }, [today]);

  // Form states with smart defaults pre-filled from employee
  const [formNumber] = useState(generatedFormNumber);
  const [requestDate, setRequestDate] = useState(today);
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [leaveTypeOtherText, setLeaveTypeOtherText] = useState("");
  const [hasMedicalReport, setHasMedicalReport] = useState(false);

  const [durationType, setDurationType] = useState<LeaveDurationType>("daily");
  
  // Daily leave dates
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Hourly leave
  const [hourlyDate, setHourlyDate] = useState(today);
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("13:00");

  // Reason & Contact (autofilled from employee phone)
  const [reason, setReason] = useState("");
  const [deputizedEmployee, setDeputizedEmployee] = useState("");
  const [contactPhone, setContactPhone] = useState(employee.phone || "");
  const [notes, setNotes] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto calculate total days and return date
  const { totalDays, returnDate } = useMemo(() => {
    if (!startDate || !endDate) return { totalDays: 1, returnDate: "" };
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Difference in milliseconds
    const diffTime = end.getTime() - start.getTime();
    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (days < 1) days = 1;

    // Return date is day after end date
    const returnD = new Date(end);
    returnD.setDate(returnD.getDate() + 1);
    const yyyy = returnD.getFullYear();
    const mm = String(returnD.getMonth() + 1).padStart(2, "0");
    const dd = String(returnD.getDate()).padStart(2, "0");
    const returnDateStr = `${yyyy}-${mm}-${dd}`;

    return { totalDays: days, returnDate: returnDateStr };
  }, [startDate, endDate]);

  // Auto calculate total hours
  const totalHours = useMemo(() => {
    if (!startHour || !endHour) return 0;
    const [startH, startM] = startHour.split(":").map(Number);
    const [endH, endM] = endHour.split(":").map(Number);
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight fallback
    const hours = Math.round((diffMinutes / 60) * 10) / 10;
    return hours > 0 ? hours : 1;
  }, [startHour, endHour]);

  // Filter colleagues strictly in same business / branch
  const normalizeBiz = (b?: string) => (b === "linia" ? "linia_karge" : (b || ""));

  const targetBusiness = (userSession && userSession.business !== "all")
    ? normalizeBiz(userSession.business)
    : normalizeBiz(employee.business);

  const sameBranchColleagues = useMemo(() => {
    return colleagues.filter(c => {
      if (c.id === employee.id) return false;
      if (c.isDeleted) return false;
      const isActive = !c.status || c.status === "active";
      if (!isActive) return false;
      return normalizeBiz(c.business) === targetBusiness;
    });
  }, [colleagues, employee.id, targetBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage(language === "ku" ? "تکایە هۆکاری مۆڵەت بنووسە." : "Please enter the reason for leave.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const newLeave: any = {
        formNumber,
        date: requestDate,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeBusiness: employee.business,
        employeeRole: employee.role,
        employeePhone: employee.phone,
        employeePhotoUrl: employee.photoUrl || "",
        leaveType,
        durationType,
        reason: reason.trim(),
        contactPhone: contactPhone.trim() || employee.phone,
        createdBy: userSession?.name || userSession?.username || "بەڕێوەبەری لق",
        createdAt: new Date().toISOString(),
        status: "approved"
      };

      if (employee.hireDate) newLeave.employeeHireDate = employee.hireDate;
      if (leaveType === "other" && leaveTypeOtherText) newLeave.leaveTypeOtherText = leaveTypeOtherText;
      if (leaveType === "sick" && hasMedicalReport) newLeave.hasMedicalReport = true;

      if (durationType === "daily") {
        newLeave.startDate = startDate;
        newLeave.endDate = endDate;
        newLeave.totalDays = totalDays;
        newLeave.returnDate = returnDate;
      } else {
        newLeave.hourlyDate = hourlyDate;
        newLeave.startDate = hourlyDate; // Set fallback range so date queries match
        newLeave.endDate = hourlyDate;
        newLeave.startHour = startHour;
        newLeave.endHour = endHour;
        newLeave.totalHours = totalHours;
      }

      if (deputizedEmployee && deputizedEmployee.trim()) newLeave.deputizedEmployee = deputizedEmployee.trim();
      if (notes && notes.trim()) newLeave.notes = notes.trim();
      if (signatureDataUrl) newLeave.signatureDataUrl = signatureDataUrl;

      await onSubmit(newLeave as Omit<LeaveRequest, "id">);
      onClose();
    } catch (err: any) {
      console.error("Failed to submit leave request:", err);
      setErrorMessage(language === "ku" ? "کێشەیەک ڕوویدا لە تۆمارکردنی مۆڵەت." : "Error submitting leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <FileText className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  {language === "ku" ? "فۆڕمی داواکاری مۆڵەت" : "Leave Request Form"}
                </h2>
                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full text-white font-bold">
                  {formNumber}
                </span>
              </div>
              <p className="text-xs text-teal-200 font-sans mt-0.5">
                LENYA INTERIORS KITCHEN • {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Pre-filled Employee Information Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <User className="w-3.5 h-3.5 text-teal-600" />
                ١. {language === "ku" ? "زانیاری کارمەند (ئۆتۆماتیکی پڕکراوەتەوە)" : "Employee Information (Auto-filled)"}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                {language === "ku" ? "زانیاریی تەواو" : "Ready"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              {/* Photo */}
              <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-200 flex items-center justify-center shrink-0">
                {employee.photoUrl ? (
                  <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>

              {/* Data fields in grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full text-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                    {language === "ku" ? "ناوی سیانی" : "Full Name"}
                  </span>
                  <span className="font-black text-slate-900 text-sm">{employee.name}</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                    {language === "ku" ? "پۆست / پیشە" : "Job Title"}
                  </span>
                  <span className="font-bold text-slate-800">{employee.role}</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                    {language === "ku" ? "بەش / کۆمپانیا" : "Department"}
                  </span>
                  <span className="font-bold text-slate-800">{biz ? biz.nameKu : employee.business}</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                    {language === "ku" ? "ژمارەی مۆبایل" : "Phone"}
                  </span>
                  <span className="font-mono font-bold text-slate-800">{employee.phone}</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                    {language === "ku" ? "کۆدی کارمەند" : "Employee ID"}
                  </span>
                  <span className="font-mono font-bold text-slate-700">{employee.id}</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                    {language === "ku" ? "بەرواری دەستبەکاربوون" : "Hire Date"}
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {employee.hireDate ? formatDateToDDMMYYYY(employee.hireDate) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Leave Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>٢. {language === "ku" ? "جۆری مۆڵەت (تەنها یەکێک هەڵبژێرە):" : "Leave Type (Select one):"}</span>
              <span className="text-[11px] font-normal text-slate-400">{language === "ku" ? "کرتە لەسەر جۆری مۆڵەتەکە بکە" : "Click to select"}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: "annual", labelKu: "مۆڵەتی ساڵانە", labelEn: "Annual", icon: "🏖️" },
                { id: "sick", labelKu: "مۆڵەتی نەخۆشی", labelEn: "Sick", icon: "🩺" },
                { id: "hourly", labelKu: "مۆڵەتی کاتژمێری", labelEn: "Hourly", icon: "⏱️" },
                { id: "emergency", labelKu: "مۆڵەتی بۆنە / کتوپڕ", labelEn: "Emergency", icon: "⚡" },
                { id: "unpaid", labelKu: "مۆڵەتی بێ مووچە", labelEn: "Unpaid", icon: "📑" },
                { id: "other", labelKu: "هی تر", labelEn: "Other", icon: "✨" }
              ].map((item) => {
                const isSelected = leaveType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLeaveType(item.id as LeaveType);
                      if (item.id === "hourly") {
                        setDurationType("hourly");
                      } else if (durationType === "hourly") {
                        setDurationType("daily");
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 text-right transition flex items-center justify-between ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/80 text-teal-900 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black leading-tight">
                          {language === "ku" ? item.labelKu : item.labelEn}
                        </span>
                        <span className="text-[10px] opacity-70 leading-none mt-0.5">
                          {language === "ku" ? item.labelEn : item.labelKu}
                        </span>
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? "bg-teal-600 text-white border-teal-600" : "border-slate-300"
                    }`}>
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            {leaveType === "other" && (
              <input
                type="text"
                placeholder={language === "ku" ? "تکایە جۆری مۆڵەتەکە بنووسە..." : "Specify other leave type..."}
                value={leaveTypeOtherText}
                onChange={(e) => setLeaveTypeOtherText(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-teal-50/30"
              />
            )}

            {leaveType === "sick" && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs font-bold text-amber-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasMedicalReport}
                  onChange={(e) => setHasMedicalReport(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>{language === "ku" ? "ڕاپۆرتی پزیشکی هەیە و هاوپێچ دەکرێت" : "Medical report is available and attached"}</span>
              </label>
            )}
          </div>

          {/* Section 3: Duration Selection (Daily vs Hourly) */}
          <div className="space-y-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-black text-slate-700">
                ٣. {language === "ku" ? "ماوەی مۆڵەت:" : "Leave Duration:"}
              </span>
              
              {/* Duration Switch Buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDurationType("daily")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    durationType === "daily" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {language === "ku" ? "مۆڵەتی ڕۆژانە" : "Daily Leave"}
                </button>
                <button
                  type="button"
                  onClick={() => setDurationType("hourly")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    durationType === "hourly" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {language === "ku" ? "مۆڵەتی کاتژمێری" : "Hourly Leave"}
                </button>
              </div>
            </div>

            {/* Daily Mode */}
            {durationType === "daily" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "لە بەرواری:" : "From Date:"}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "تا بەرواری:" : "To Date:"}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "کۆی ڕۆژەکان:" : "Total Days:"}
                  </label>
                  <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl text-xs font-mono font-black text-teal-850 flex items-center justify-between">
                    <span>{totalDays} {language === "ku" ? "ڕۆژ" : "Days"}</span>
                    <span className="text-[10px] text-teal-600 font-sans font-bold">ئۆتۆماتیک</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "گەڕانەوە بۆ کار:" : "Return to Work:"}
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800">
                    {formatDateToDDMMYYYY(returnDate)}
                  </div>
                </div>
              </div>
            )}

            {/* Hourly Mode */}
            {durationType === "hourly" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "بەرواری کاتژمێری:" : "Date:"}
                  </label>
                  <input
                    type="date"
                    value={hourlyDate}
                    onChange={(e) => setHourlyDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "لە کاتژمێر:" : "From Hour:"}
                  </label>
                  <input
                    type="time"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "تا کاتژمێر:" : "To Hour:"}
                  </label>
                  <input
                    type="time"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    {language === "ku" ? "کۆی کاتژمێرەکان:" : "Total Hours:"}
                  </label>
                  <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl text-xs font-mono font-black text-teal-850 flex items-center justify-between">
                    <span>{totalHours} {language === "ku" ? "کاتژمێر" : "Hours"}</span>
                    <span className="text-[10px] text-teal-600 font-sans font-bold">ئۆتۆماتیک</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Reason & Deputized Staff */}
          <div className="space-y-3">
            <span className="text-xs font-black text-slate-700 block">
              ٤. {language === "ku" ? "هۆکار و زانیاری لە کاتی مۆڵەتدا:" : "Reason & Information:"}
            </span>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                {language === "ku" ? "هۆکاری مۆڵەت (پێویستە):" : "Reason for Leave (Required):"}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={language === "ku" ? "هۆکاری داواکردنی مۆڵەتەکە بنووسە..." : "Enter reason for leave..."}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                  {language === "ku" 
                    ? `کارمەندی جێگر (تەنیا هاوکارانی ${biz?.nameKu || "هەمان بەش"}):` 
                    : `Deputized Replacement (${biz?.nameEn || "Same Branch"} Colleagues):`}
                </label>
                <div className="space-y-1.5">
                  <select
                    value={deputizedEmployee}
                    onChange={(e) => setDeputizedEmployee(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">
                      {language === "ku" 
                        ? `-- هاوکارێک لە ${biz?.nameKu || "بەشەکەت"} هەڵبژێرە --` 
                        : `-- Select colleague from ${biz?.nameEn || "this branch"} --`}
                    </option>
                    {sameBranchColleagues.map(col => (
                      <option key={col.id} value={col.name}>
                        {col.name} ({col.role})
                      </option>
                    ))}
                    {sameBranchColleagues.length === 0 && (
                      <option disabled value="">
                        {language === "ku" ? "هیچ هاوکارێکی تر لەم بەشە نییە" : "No other colleagues in this department"}
                      </option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={deputizedEmployee}
                    onChange={(e) => setDeputizedEmployee(e.target.value)}
                    placeholder={language === "ku" ? "یان ناوی کارمەندی جێگر بنووسە..." : "Or type replacement name..."}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                  {language === "ku" ? "ژمارەی پەیوەندی لە کاتی مۆڵەتدا:" : "Contact Number During Leave:"}
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold focus:ring-2 focus:ring-teal-500/20"
                  required
                />
                <span className="text-[9.5px] text-slate-400 mt-1 block">
                  {language === "ku" ? "بە شێوەی ئۆتۆماتیک ژمارەی کارمەند دانراوە، دەتوانیت بگۆڕیت." : "Auto-filled from employee profile."}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Digital Signature Pad */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <DigitalSignaturePad
              value={signatureDataUrl || undefined}
              onChange={(data) => setSignatureDataUrl(data)}
              language={language}
              height={140}
            />

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                {language === "ku" ? "تێبینی (ئەگەر هەبێت):" : "Notes (Optional):"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === "ku" ? "تێبینی یاخود ڕوونکردنەوەی زیاتر..." : "Any additional notes..."}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            {/* Instant Approval Badge */}
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-850 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === "ku" 
                  ? "ئەم فۆرمە لەلایەن بەڕێوەبەری لق تۆمار دەکرێت و دەستبەجێ بە پەسەندکراو لە سیستەم و ئەرشیفی کارمەندەکە تۆمار دەبێت."
                  : "Submitted directly by the showroom manager, instantly approved and archived."}
              </span>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              {language === "ku" ? "پاشگەزبوونەوە" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{language === "ku" ? "تۆمارکردن..." : "Submitting..."}</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{language === "ku" ? "تۆمارکردن و ئەرشیفکردنی مۆڵەت" : "Submit & Archive Leave"}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
