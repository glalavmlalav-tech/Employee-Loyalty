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
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { LeaveRequest, BUSINESSES, BusinessId, AppUser } from "../types";
import { formatDateToDDMMYYYY } from "../utils";
import AppLogo from "./AppLogo";
import PrintableLeaveForm from "./PrintableLeaveForm";
import PWAInstallButton from "./PWAInstallButton";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface SecurityGuardPortalProps {
  leaveRequests: LeaveRequest[];
  systemDate?: string;
  onRefresh?: () => Promise<void> | void;
  onGoToLogin?: () => void;
  language?: "ku" | "en";
  userSession?: AppUser | null;
  onDeleteLeaveRequest?: (id: string) => Promise<void>;
}

const cleanDateStr = (val?: string) => {
  if (!val) return "";
  const s = String(val).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (s.includes(" ")) return s.split(" ")[0];
  return s;
};

/**
 * Checks whether a leave request is active on a given date (YYYY-MM-DD).
 * - Hourly: active if hourlyDate === targetDate (or fallback date === targetDate)
 * - Daily: active if targetDate is between startDate and endDate (inclusive)
 */
export function isLeaveActiveOnDate(leave: LeaveRequest, targetDate: string): boolean {
  if (!leave) return false;
  if (leave.status === "cancelled") return false;

  const target = cleanDateStr(targetDate);
  if (!target) return true;

  if (leave.durationType === "hourly") {
    const leaveDate = cleanDateStr(leave.hourlyDate) || cleanDateStr(leave.startDate) || cleanDateStr(leave.date);
    return leaveDate === target;
  } else {
    const start = cleanDateStr(leave.startDate) || cleanDateStr(leave.date);
    const end = cleanDateStr(leave.endDate) || cleanDateStr(leave.startDate) || cleanDateStr(leave.date);
    if (!start && !end) return false;
    const s = start || end;
    const e = end || start;
    return target >= s && target <= e;
  }
}

export default function SecurityGuardPortal({
  leaveRequests,
  systemDate,
  onRefresh,
  onGoToLogin,
  language = "ku",
  userSession,
  onDeleteLeaveRequest
}: SecurityGuardPortalProps) {
  // Super Admin / Developer authority
  const [developerUnlocked, setDeveloperUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("dev_auth_unlocked") === "true";
    }
    return false;
  });
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [developerPasswordInput, setDeveloperPasswordInput] = useState("");
  const [developerAuthError, setDeveloperAuthError] = useState("");

  const isSuperAdmin = useMemo(() => {
    return userSession?.role === "super_admin" || developerUnlocked;
  }, [userSession, developerUnlocked]);

  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeveloperUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pass = developerPasswordInput.trim();
    if (pass === "admin" || pass === "glalavmlalav" || pass === "123456") {
      setDeveloperUnlocked(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dev_auth_unlocked", "true");
      }
      setShowDeveloperModal(false);
      setDeveloperPasswordInput("");
      setDeveloperAuthError("");
    } else {
      setDeveloperAuthError(language === "ku" ? "تێپەڕەوشەی سوپەر ئەدمین هەڵەیە." : "Incorrect super admin password.");
    }
  };

  const handleLockDeveloper = () => {
    setDeveloperUnlocked(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("dev_auth_unlocked");
    }
  };

  // Direct real-time deletion
  const handleDirectDelete = async (id?: string) => {
    const targetId = id || leaveToDelete?.id;
    if (!targetId) return;
    try {
      setIsDeleting(true);
      if (onDeleteLeaveRequest) {
        await onDeleteLeaveRequest(targetId);
      } else {
        await deleteDoc(doc(db, "leave_requests", targetId));
      }
      setLiveLeaves(prev => prev.filter(l => l.id !== targetId));
      setLeaveToDelete(null);
      if (inspectingLeave && inspectingLeave.id === targetId) {
        setInspectingLeave(null);
      }
    } catch (err) {
      console.error("Failed to delete leave request:", err);
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Direct real-time listener for leave requests to guarantee 100% instant sync on any device
  const [liveLeaves, setLiveLeaves] = useState<LeaveRequest[]>(leaveRequests || []);

  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "leave_requests"), (snapshot) => {
        const list: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as LeaveRequest);
        });
        const sorted = list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        setLiveLeaves(sorted);
      }, (err) => {
        console.warn("SecurityGuardPortal live sync notice:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not attach SecurityGuardPortal listener:", e);
    }
  }, []);

  // Update liveLeaves if prop leaveRequests arrives or updates
  useEffect(() => {
    if (leaveRequests && leaveRequests.length > 0 && liveLeaves.length === 0) {
      setLiveLeaves(leaveRequests);
    }
  }, [leaveRequests]);

  // Use live data if populated, otherwise fallback to props
  const effectiveLeaves = useMemo(() => {
    if (liveLeaves && liveLeaves.length > 0) return liveLeaves;
    if (leaveRequests && leaveRequests.length > 0) return leaveRequests;
    return [];
  }, [liveLeaves, leaveRequests]);

  // UI Filters: "today" (selected date) vs "all" (all leaves)
  const [viewScope, setViewScope] = useState<"today" | "all">("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [selectedDurationType, setSelectedDurationType] = useState<"all" | "hourly" | "daily">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected leave to view full detailed form
  const [inspectingLeave, setInspectingLeave] = useState<LeaveRequest | null>(null);

  // Filter leaves that are active on the selected date (or all if scope is "all")
  const activeDateLeaves = useMemo(() => {
    if (viewScope === "all") {
      return effectiveLeaves.filter(l => l.status !== "cancelled");
    }
    return effectiveLeaves.filter((l) => isLeaveActiveOnDate(l, selectedDate));
  }, [effectiveLeaves, selectedDate, viewScope]);

  // Count leaves on other dates (to guide guard if a leave was recorded for another day)
  const otherDatesLeaves = useMemo(() => {
    return effectiveLeaves.filter(l => l.status !== "cancelled" && !isLeaveActiveOnDate(l, selectedDate));
  }, [effectiveLeaves, selectedDate]);

  // Secondary search & branch filtering
  const filteredLeaves = useMemo(() => {
    return activeDateLeaves.filter((leave) => {
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
        const matchesName = (leave.employeeName || "").toLowerCase().includes(q);
        const matchesRole = (leave.employeeRole || "").toLowerCase().includes(q);
        const matchesPhone = (leave.employeePhone || "").includes(q) || (leave.contactPhone || "").includes(q);
        const matchesForm = (leave.formNumber || "").toLowerCase().includes(q);
        const matchesDeputized = (leave.deputizedEmployee || "").toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesPhone && !matchesForm && !matchesDeputized) {
          return false;
        }
      }

      return true;
    });
  }, [activeDateLeaves, selectedBusiness, selectedDurationType, searchTerm]);

  // Summary counts
  const totalActiveDateCount = activeDateLeaves.length;
  const hourlyActiveDateCount = activeDateLeaves.filter((l) => l.durationType === "hourly").length;
  const dailyActiveDateCount = activeDateLeaves.filter((l) => l.durationType === "daily").length;
  const totalAllLeavesCount = effectiveLeaves.filter(l => l.status !== "cancelled").length;

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
    const publicUrl = `${origin}/?view=security`;
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

            {/* Super Admin Status or Unlock Trigger */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{language === "ku" ? "سوپەر ئەدمین" : "Super Admin"}</span>
                {developerUnlocked && (
                  <button
                    onClick={handleLockDeveloper}
                    title={language === "ku" ? "داخستنی دەسەڵات" : "Lock"}
                    className="p-0.5 hover:text-white transition ml-0.5 cursor-pointer text-amber-400"
                  >
                    <Lock className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowDeveloperModal(true)}
                title={language === "ku" ? "دەسەڵاتی گەشەپێدەر / سوپەر ئەدمین (بۆ سڕینەوە)" : "Developer / Super Admin Access"}
                className="p-2 sm:px-2.5 sm:py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">{language === "ku" ? "گەشەپێدەر" : "Dev"}</span>
              </button>
            )}

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
          {/* Top Bar: View Scope Switcher ("مۆڵەتەکانی ئەمڕۆ / بەروار" vs "هەموو مۆڵەتەکان") */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {language === "ku" ? "پیشاندانی مۆڵەتەکان:" : "View Scope:"}
              </span>
              <div className="inline-flex p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-inner">
                <button
                  onClick={() => setViewScope("today")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewScope === "today"
                      ? "bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {isToday 
                    ? (language === "ku" ? `مۆڵەتەکانی ئەمڕۆ (${totalActiveDateCount})` : `Today's Passes (${totalActiveDateCount})`)
                    : (language === "ku" ? `مۆڵەتەکانی بەروار (${totalActiveDateCount})` : `Selected Date (${totalActiveDateCount})`)}
                </button>
                <button
                  onClick={() => setViewScope("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewScope === "all"
                      ? "bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {language === "ku" ? `هەموو مۆڵەتەکان (${totalAllLeavesCount})` : `All Passes (${totalAllLeavesCount})`}
                </button>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{language === "ku" ? "ڕاستەوخۆ دەگات (Firestore Live Sync)" : "Firestore Live Connected"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Date Indicator & Switcher (active when in today view, or can be used to filter) */}
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
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setViewScope("today");
                    }}
                    className="bg-transparent text-sm font-mono font-black text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Reset to Today button if different date picked */}
              {!isToday && (
                <button
                  onClick={() => {
                    setSelectedDate(defaultDate);
                    setViewScope("today");
                  }}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {language === "ku" ? "گەڕانەوە بۆ ئەمڕۆ" : "Back to Today"}
                </button>
              )}

              {isToday && viewScope === "today" && (
                <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === "ku" ? "مۆڵەتەکانی ئەمڕۆ" : "Today's Leaves"}
                </span>
              )}

              {viewScope === "all" && (
                <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {language === "ku" ? "پیشاندانی هەموو بەروارەکان" : "All Dates Active"}
                </span>
              )}
            </div>

            {/* Quick Stat Badges */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-2.5 sm:gap-4">
              {/* Total Today / Selected */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-mono font-black text-white">
                  {viewScope === "all" ? totalAllLeavesCount : totalActiveDateCount}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5">
                  {viewScope === "all" 
                    ? (language === "ku" ? "کۆی هەموو مۆڵەتەکان" : "All Leaves") 
                    : (language === "ku" ? "کۆی مۆڵەتەکانی بەروار" : "Total Active")}
                </span>
              </div>

              {/* Hourly Leaves */}
              <div className="bg-teal-950/40 border border-teal-800/40 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-mono font-black text-teal-300">
                  {hourlyActiveDateCount}
                </span>
                <span className="text-[10px] sm:text-xs text-teal-400 font-bold mt-0.5">
                  {language === "ku" ? "مۆڵەتی کاتژمێری" : "Hourly Leaves"}
                </span>
              </div>

              {/* Daily Leaves */}
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-mono font-black text-indigo-300">
                  {dailyActiveDateCount}
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
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/60 flex items-center justify-center border border-slate-700">
              <CheckCircle2 className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-200">
                {language === "ku" 
                  ? (viewScope === "all" ? "هیچ مۆڵەتێک لە سیستمدا تۆمار نەکراوە" : "هیچ مۆڵەتێک بۆ ئەم ڕۆژە نییە")
                  : (viewScope === "all" ? "No leave passes recorded in the system" : "No active leave passes found for this date")}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {language === "ku"
                  ? (viewScope === "all"
                      ? "هەر مۆڵەتێک لەلایەن بەڕێوەبەرەوە تۆمار بکرێت، ڕاستەوخۆ لێرە دەردەکەوێت بەبێ پێویستی بە نوێکردنەوەی پەڕە."
                      : `لە بەرواری (${formatDateToDDMMYYYY(selectedDate)}) هیچ کارمەندێک مۆڵەتی کاتژمێری یان ڕۆژانەی نییە. دەتوانیت بەروارەکە بگۆڕیت یان هەموو مۆڵەتەکان پیشان بدەیت.`)
                  : "No employee has active leave. Any newly created leave request appears here in real time without refreshing."}
              </p>

              {/* Guiding Alert: If leaves exist on other dates, offer 1-click switch */}
              {otherDatesLeaves.length > 0 && viewScope === "today" && (
                <div className="mt-5 p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-start">
                  <div className="text-xs text-teal-300 font-medium">
                    <span className="font-bold text-white block mb-0.5">
                      {language === "ku" 
                        ? `💡 تێبینی: (${otherDatesLeaves.length}) مۆڵەت لە بەروارەکانی تردا هەیە` 
                        : `💡 Notice: (${otherDatesLeaves.length}) passes exist on other dates`}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {language === "ku"
                        ? "ئەگەر مۆڵەتە تێستەکە لەسەر بەروارێکی تر تۆمار کراوە، دەتوانیت کرتە لێرە بکەیت:"
                        : "If the test leave was recorded on another date, click below to see all:"}
                    </span>
                  </div>
                  <button
                    onClick={() => setViewScope("all")}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition whitespace-nowrap cursor-pointer shadow-md shadow-teal-500/20 shrink-0"
                  >
                    {language === "ku" ? `پیشاندانی هەمووی (${totalAllLeavesCount})` : `Show All (${totalAllLeavesCount})`}
                  </button>
                </div>
              )}
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

                  {/* Action: Open Full Official Printable Form & Super Admin Delete */}
                  {isSuperAdmin ? (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setInspectingLeave(leave)}
                        className="flex-1 py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 active:scale-[0.98] cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="truncate">{language === "ku" ? "بینینی فۆڕم (وردەکاری)" : "View Official Form"}</span>
                      </button>
                      <button
                        onClick={() => setLeaveToDelete(leave)}
                        className="py-2.5 px-3.5 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm active:scale-95 cursor-pointer shrink-0"
                        title={language === "ku" ? "سڕینەوەی ئەم مۆڵەتە (تەنیا دەسەڵاتی سوپەر ئەدمین)" : "Delete Leave (Super Admin Only)"}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{language === "ku" ? "سڕینەوە" : "Delete"}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInspectingLeave(leave)}
                      className="w-full mt-2 py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-500/10 active:scale-[0.98] cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      {language === "ku" ? "بینینی تەواوی فۆڕمەکە (وردەکاری)" : "View Official Leave Form"}
                    </button>
                  )}
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
          isSuperAdmin={isSuperAdmin}
          onDelete={handleDirectDelete}
        />
      )}

      {/* Super Admin Delete Confirmation Modal */}
      {leaveToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 text-start font-sans">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                  {language === "ku" ? "تەنیا دەسەڵاتی سوپەر ئەدمین" : "Super Admin Privilege"}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  #{leaveToDelete.formNumber}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                {language === "ku" ? "سڕینەوەی هەمیشەیی ئەم مۆڵەتە" : "Permanently Delete Leave Pass?"}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {language === "ku" 
                  ? `ئایا دڵنیایت لە سڕینەوەی مۆڵەتی فۆڕمی (#${leaveToDelete.formNumber}) بۆ کارمەند (${leaveToDelete.employeeName})؟ ئەم مۆڵەتە بە تەواوی لە داتابەیسی Firestore دەسڕدرێتەوە و لەسەر هەموو مۆبایل و دەروازەکان نامێنێت.`
                  : `Are you sure you want to permanently delete leave pass #${leaveToDelete.formNumber} for ${leaveToDelete.employeeName}? It will be removed from Firestore and all devices.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLeaveToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                {language === "ku" ? "پەشیمانبوونەوە" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleDirectDelete(leaveToDelete.id)}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-500/30 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? (language === "ku" ? "دەسڕدرێتەوە..." : "Deleting...") : (language === "ku" ? "بەڵێ، بسڕەوە" : "Yes, Delete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Unlock Modal for Super Admin */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleDeveloperUnlockSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 text-start font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {language === "ku" ? "دەسەڵاتی سوپەر ئەدمین / گەشەپێدەر" : "Super Admin / Developer Access"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === "ku" ? "بۆ سڕینەوەی مۆڵەت و کۆنترۆڵی فەرمی" : "For leave deletion and override control"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {language === "ku" ? "تێپەڕەوشەی سوپەر ئەدمین بنووسە:" : "Enter Super Admin Password:"}
              </label>
              <input
                type="password"
                value={developerPasswordInput}
                onChange={(e) => {
                  setDeveloperPasswordInput(e.target.value);
                  setDeveloperAuthError("");
                }}
                placeholder="••••••"
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              {developerAuthError && (
                <p className="text-[11px] text-rose-400 font-semibold mt-1">
                  {developerAuthError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDeveloperModal(false);
                  setDeveloperPasswordInput("");
                  setDeveloperAuthError("");
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                {language === "ku" ? "داخستن" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{language === "ku" ? "چالاککردن" : "Unlock"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
