import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  Phone, 
  User, 
  Copy, 
  Check, 
  LogIn, 
  Eye, 
  CalendarDays,
  FileText,
  AlertTriangle,
  ChevronRight,
  Shield,
  Wifi,
  Radio
} from "lucide-react";
import { LeaveRequest, BUSINESSES, BusinessId } from "../types";
import { formatDateToDDMMYYYY } from "../utils";
import AppLogo from "./AppLogo";
import PrintableLeaveForm from "./PrintableLeaveForm";
import PWAInstallButton from "./PWAInstallButton";

interface SecurityGuardPortalProps {
  leaveRequests: LeaveRequest[];
  systemDate?: string;
  onRefresh?: () => Promise<void> | void;
  onGoToLogin?: () => void;
  language?: "ku" | "en";
}

/**
 * Checks whether a leave request is active on a given date (YYYY-MM-DD).
 * - Hourly: active if hourlyDate === targetDate (or fallback date === targetDate)
 * - Daily: active if targetDate is between startDate and endDate (inclusive)
 */
export function isLeaveActiveOnDate(leave: LeaveRequest, targetDate: string): boolean {
  if (leave.status === "cancelled") return false;

  if (leave.durationType === "hourly") {
    const leaveDate = leave.hourlyDate || leave.date;
    return leaveDate === targetDate;
  } else {
    const start = leave.startDate || leave.date;
    const end = leave.endDate || leave.startDate || leave.date;
    return targetDate >= start && targetDate <= end;
  }
}

export default function SecurityGuardPortal({
  leaveRequests,
  systemDate,
  onRefresh,
  onGoToLogin,
  language = "ku"
}: SecurityGuardPortalProps) {
  // Today's real local date string (YYYY-MM-DD)
  const realTodayString = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Selected date for guard (defaults strictly to today, but guard can pick another date if inspecting)
  const defaultDate = systemDate || realTodayString;
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  // Live real-time clock state for security gate
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // UI Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [selectedDurationType, setSelectedDurationType] = useState<"all" | "hourly" | "daily">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected leave to view full detailed form
  const [inspectingLeave, setInspectingLeave] = useState<LeaveRequest | null>(null);

  // Filter leaves that are strictly active on the selected date
  const todayLeaves = useMemo(() => {
    return leaveRequests.filter((l) => isLeaveActiveOnDate(l, selectedDate));
  }, [leaveRequests, selectedDate]);

  // Secondary search & branch filtering
  const filteredLeaves = useMemo(() => {
    return todayLeaves.filter((leave) => {
      // Branch filter
      if (selectedBusiness !== "all") {
        const empBiz = leave.employeeBusiness === "linia" ? "linia_karge" : leave.employeeBusiness;
        const filterBiz = selectedBusiness === "linia" ? "linia_karge" : selectedBusiness;
        if (empBiz !== filterBiz) return false;
      }

      // Duration type filter
      if (selectedDurationType !== "all" && leave.durationType !== selectedDurationType) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = leave.employeeName.toLowerCase().includes(q);
        const matchesRole = leave.employeeRole.toLowerCase().includes(q);
        const matchesPhone = leave.employeePhone.includes(q) || leave.contactPhone.includes(q);
        const matchesForm = leave.formNumber.toLowerCase().includes(q);
        const matchesDeputized = leave.deputizedEmployee?.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesPhone && !matchesForm && !matchesDeputized) {
          return false;
        }
      }

      return true;
    });
  }, [todayLeaves, selectedBusiness, selectedDurationType, searchTerm]);

  // Summary counts
  const totalTodayCount = todayLeaves.length;
  const hourlyTodayCount = todayLeaves.filter((l) => l.durationType === "hourly").length;
  const dailyTodayCount = todayLeaves.filter((l) => l.durationType === "daily").length;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleCopyPublicLink = () => {
    const origin = window.location.origin;
    const publicUrl = `${origin}/security`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const isToday = selectedDate === defaultDate;

  return (
    <div 
      className="min-h-screen bg-[#0f172a] text-slate-100 font-sans flex flex-col relative selection:bg-teal-500 selection:text-white"
      dir={language === "ku" ? "rtl" : "ltr"}
    >
      {/* Background ambient security glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Security Banner */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Gate Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-display font-black text-white tracking-wide">
                  {language === "ku" ? "پۆرتاڵی دەروازە و پاسەوانی" : "Gate & Security Guard Portal"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                  {language === "ku" ? "ڕاستەوخۆ (Live)" : "Live"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {language === "ku" ? "پشکنینی فەرمی مۆڵەتەکانی کارمەندان بۆ دەرچوون لە دەروازە" : "Official verification of employee leave passes at company gates"}
              </p>
            </div>
          </div>

          {/* Clock, Live Date & Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Clock Widget */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-inner">
              <Clock className="w-4 h-4 text-teal-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                {currentTime}
              </span>
            </div>

            {/* PWA Install Button for Security Tablets / iPad / Mobile */}
            <PWAInstallButton language={language} variant="header" />

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title={language === "ku" ? "نوێکردنەوەی داتا" : "Refresh data"}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
              <span className="hidden sm:inline">{language === "ku" ? "نوێکردنەوە" : "Sync"}</span>
            </button>

            {/* Copy Public Link Button */}
            <button
              onClick={handleCopyPublicLink}
              title={language === "ku" ? "کۆپیکردنی لینکی گشتی پاسەوان" : "Copy public link"}
              className="p-2 sm:px-3 sm:py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl text-xs font-bold text-teal-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {copiedLink ? (language === "ku" ? "لینک کۆپیکرا!" : "Copied!") : (language === "ku" ? "کۆپیکردنی بەستەر" : "Share Link")}
              </span>
            </button>

            {/* Go to Admin Login (if user wants admin panel) */}
            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="p-2 sm:px-3 sm:py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                title={language === "ku" ? "چوونەژوورەوەی ئەدمین و ستاف" : "Staff Login"}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === "ku" ? "ئەدمین" : "Login"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Date Selector & Primary Metric Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Date Indicator & Switcher */}
            <div className="lg:col-span-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-2xl p-2 px-3 shadow-inner">
                <CalendarDays className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">
                    {language === "ku" ? "بەرواری پشکنین:" : "Active Date:"}
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm font-mono font-black text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Reset to Today button if different date picked */}
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(defaultDate)}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {language === "ku" ? "گەڕانەوە بۆ ئەمڕۆ" : "Back to Today"}
                </button>
              )}

              {isToday && (
                <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === "ku" ? "مۆڵەتەکانی ئەمڕۆ" : "Today's Leaves"}
                </span>
              )}
            </div>

            {/* Quick Stat Badges */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-2.5 sm:gap-4">
              {/* Total Today */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-mono font-black text-white">
                  {totalTodayCount}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5">
                  {language === "ku" ? "کۆی مۆڵەتەکانی ئەمڕۆ" : "Total Today"}
                </span>
              </div>

              {/* Hourly Leaves */}
              <div className="bg-teal-950/40 border border-teal-800/40 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-mono font-black text-teal-300">
                  {hourlyTodayCount}
                </span>
                <span className="text-[10px] sm:text-xs text-teal-400 font-bold mt-0.5">
                  {language === "ku" ? "مۆڵەتی کاتژمێری" : "Hourly Leaves"}
                </span>
              </div>

              {/* Daily Leaves */}
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-mono font-black text-indigo-300">
                  {dailyTodayCount}
                </span>
                <span className="text-[10px] sm:text-xs text-indigo-400 font-bold mt-0.5">
                  {language === "ku" ? "مۆڵەتی ڕۆژانە" : "Daily Leaves"}
                </span>
              </div>
            </div>

          </div>

          {/* Quick Notice to Guard */}
          <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                {language === "ku"
                  ? "تەنیا ئەو کارمەندانە ڕێگەی دەرچوونیان پێدەدرێت کە فۆڕمەکەیان واژوو کراوە و کاتەکەیان دیاریکراوە."
                  : "Only employees with officially signed and valid leave passes for today are authorized to exit."}
              </span>
            </div>
            <span className="hidden md:inline font-mono text-[10px] text-slate-500">
              {formatDateToDDMMYYYY(selectedDate)}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === "ku" ? "گەڕان بەپێی ناوی کارمەند، ژمارەی مۆبایل، یان ژمارەی فۆڕم..." : "Search by name, phone, or form number..."}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 font-sans"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Branch Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedBusiness("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
                selectedBusiness === "all"
                  ? "bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {language === "ku" ? "هەموو لقەکان" : "All Branches"}
            </button>

            {Object.values(BUSINESSES).map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBusiness(b.id)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
                  selectedBusiness === b.id
                    ? "bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {b.nameKu}
              </button>
            ))}
          </div>

          {/* Duration Type selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-stretch md:self-auto justify-center">
            <button
              onClick={() => setSelectedDurationType("all")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedDurationType === "all" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {language === "ku" ? "هەمووی" : "All"}
            </button>
            <button
              onClick={() => setSelectedDurationType("hourly")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedDurationType === "hourly" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {language === "ku" ? "کاتژمێری" : "Hourly"}
            </button>
            <button
              onClick={() => setSelectedDurationType("daily")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedDurationType === "daily" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {language === "ku" ? "ڕۆژانە" : "Daily"}
            </button>
          </div>
        </div>

        {/* Results List or Empty State */}
        {filteredLeaves.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/60 flex items-center justify-center border border-slate-700">
              <CheckCircle2 className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-200">
                {language === "ku" 
                  ? "هیچ مۆڵەتێک بۆ ئەم ڕۆژە نییە" 
                  : "No active leave passes found for this date"}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {language === "ku"
                  ? `لە بەرواری (${formatDateToDDMMYYYY(selectedDate)}) هیچ کارمەندێک مۆڵەتی کاتژمێری یان ڕۆژانەی نییە. لەگەڵ هەر تۆمارکردنێکی نوێ لەلایەن بەڕێوەبەرەوە، ڕاستەوخۆ لێرە دەردەکەوێت.`
                  : "No employee has hourly or daily leave active on this date. As soon as a manager submits a leave pass, it will appear here in real time."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeaves.map((leave) => {
              const biz = BUSINESSES[leave.employeeBusiness];
              const isHourly = leave.durationType === "hourly";

              return (
                <div 
                  key={leave.id}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-3xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top status indicator strip */}
                  <div className={`absolute top-0 right-0 left-0 h-1.5 ${
                    isHourly ? "bg-gradient-to-r from-teal-400 to-emerald-400" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  }`} />

                  <div>
                    {/* Header: Branch & Form Number */}
                    <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80">
                        #{leave.formNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {biz?.nameKu || leave.employeeBusiness}
                      </span>
                    </div>

                    {/* Employee Profile Card */}
                    <div className="flex items-center gap-3.5 mb-4">
                      {/* Photo or Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                        {leave.employeePhotoUrl ? (
                          <img 
                            src={leave.employeePhotoUrl} 
                            alt={leave.employeeName} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-7 h-7 text-slate-400" />
                        )}
                      </div>

                      {/* Name & Role */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-white truncate">
                          {leave.employeeName}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {leave.employeeRole}
                        </p>
                        <a 
                          href={`tel:${leave.contactPhone || leave.employeePhone}`} 
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-400 hover:underline mt-1"
                        >
                          <Phone className="w-3 h-3" />
                          {leave.contactPhone || leave.employeePhone}
                        </a>
                      </div>
                    </div>

                    {/* Prominent Leave Time / Days Banner */}
                    <div className={`p-3 rounded-2xl border mb-3.5 ${
                      isHourly 
                        ? "bg-teal-950/30 border-teal-800/40 text-teal-200" 
                        : "bg-indigo-950/30 border-indigo-800/40 text-indigo-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {isHourly ? (language === "ku" ? "مۆڵەتی کاتژمێری:" : "Hourly Leave:") : (language === "ku" ? "مۆڵەتی ڕۆژانە:" : "Daily Leave:")}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10">
                          {isHourly ? `${leave.totalHours || 1} کاتژمێر` : `${leave.totalDays || 1} ڕۆژ`}
                        </span>
                      </div>

                      {/* Exact Hours or Dates */}
                      <div className="mt-2 text-xs font-mono font-bold text-white flex items-center justify-between">
                        {isHourly ? (
                          <>
                            <span>{language === "ku" ? "لە کاتژمێر:" : "From:"} {leave.startHour || "00:00"}</span>
                            <span>←</span>
                            <span>{language === "ku" ? "تا کاتژمێر:" : "To:"} {leave.endHour || "00:00"}</span>
                          </>
                        ) : (
                          <>
                            <span>{formatDateToDDMMYYYY(leave.startDate || leave.date)}</span>
                            <span>←</span>
                            <span>{formatDateToDDMMYYYY(leave.endDate || leave.startDate || leave.date)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Reason & Substitute info */}
                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800 mb-3.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-slate-400 font-bold shrink-0">{language === "ku" ? "هۆکار:" : "Reason:"}</span>
                        <span className="text-slate-200 line-clamp-2">{leave.reason}</span>
                      </div>
                      {leave.deputizedEmployee && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700/50 text-[11px]">
                          <span className="text-slate-400 font-bold shrink-0">{language === "ku" ? "کارمەندی جێگر:" : "Replacement:"}</span>
                          <span className="text-teal-300 font-semibold">{leave.deputizedEmployee}</span>
                        </div>
                      )}
                    </div>

                    {/* Manager Signature status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === "ku" ? "پەسەندکراوی فەرمی" : "Approved"}
                      </span>
                      {leave.signatureDataUrl && (
                        <span className="text-[10px] text-teal-400 font-semibold">
                          ✍️ {language === "ku" ? "واژووی ئەلیکترۆنی هەیە" : "Digitally Signed"}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Action: Open Full Official Printable Form */}
                  <button
                    onClick={() => setInspectingLeave(leave)}
                    className="w-full mt-2 py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-500/10 active:scale-[0.98] cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    {language === "ku" ? "بینینی تەواوی فۆڕمەکە (وردەکاری)" : "View Official Leave Form"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppLogo className="w-5 h-5" color="#14b8a6" />
            <span className="font-bold text-slate-300">LENYA GROUP</span>
            <span>—</span>
            <span>{language === "ku" ? "سیستەمی کۆنترۆڵکردنی دەروازە و مۆڵەت" : "Gate Pass & Leave Control System"}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {language === "ku" ? "بەستەرەکە ئۆتۆماتیک نوێ دەبێتەوە" : "Live auto-sync"}
            </span>
          </div>
        </div>
      </footer>

      {/* Full Modal Viewer: PrintableLeaveForm */}
      {inspectingLeave && (
        <PrintableLeaveForm
          leave={inspectingLeave}
          onClose={() => setInspectingLeave(null)}
          language={language}
        />
      )}
    </div>
  );
}
