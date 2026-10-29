import React, { useState } from "react";
import { ExternalLink, Key, Lock, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import AppLogo from "./AppLogo";

interface SystemHaltedScreenProps {
  redirectUrl: string;
  onDeveloperUnlock?: (password: string) => Promise<boolean> | boolean;
  isDeveloperLoggedIn?: boolean;
  onGoToSettings?: () => void;
}

export default function SystemHaltedScreen({
  redirectUrl,
  onDeveloperUnlock,
  isDeveloperLoggedIn = false,
  onGoToSettings
}: SystemHaltedScreenProps) {
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanUrl = (redirectUrl || "").trim();

  const handleGo = () => {
    if (!cleanUrl) {
      alert("بەستەری وەشانی نوێ دانەنراوە!");
      return;
    }
    let target = cleanUrl;
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "https://" + target;
    }
    window.location.href = target;
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devPassword.trim()) {
      setUnlockError("تکایە تێپەڕەوشە بنووسە");
      return;
    }

    try {
      setIsSubmitting(true);
      setUnlockError(null);
      if (onDeveloperUnlock) {
        const success = await onDeveloperUnlock(devPassword.trim());
        if (success) {
          setShowDeveloperModal(false);
          setDevPassword("");
          if (onGoToSettings) onGoToSettings();
        } else {
          setUnlockError("تێپەڕەوشەی گەشەپێدەر هەڵەیە!");
        }
      }
    } catch (err: any) {
      setUnlockError("هەڵەیەک ڕوویدا لە پشتڕاستکردنەوەدا");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-white flex flex-col justify-between items-center p-6 md:p-12 font-sans relative select-none"
      dir="rtl"
    >
      {/* Top Brand Logo */}
      <header className="w-full max-w-4xl flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center p-2 shadow-xs">
            <AppLogo className="w-8 h-8" color="#0f172a" />
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-slate-800 tracking-tight block">ستاف | Staff Management</span>
            <span className="text-[10px] text-slate-400 font-semibold block">کۆمپانیاکانی لینیا • ماسیمۆ • لیستۆن</span>
          </div>
        </div>

        {/* If developer is already logged in, provide a direct shortcut to settings */}
        {isDeveloperLoggedIn && onGoToSettings && (
          <button
            onClick={onGoToSettings}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>چوون بۆ بەشی ڕێکخستنەکان (گەشەپێدەر)</span>
          </button>
        )}
      </header>

      {/* Main Central Notice & Action Button */}
      <main className="w-full max-w-2xl my-auto text-center px-4 py-12 flex flex-col items-center animate-fade-in">
        {/* Visual Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black mb-8 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>ئاگاداری گرنگی گواستنەوە بۆ وەشانی نوێ</span>
        </div>

        {/* Required User Message: Exact Kurdish phrasing */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-slate-900 leading-relaxed md:leading-normal mb-8 max-w-xl text-center">
          ئەم وەشانە راگیراوە ، بە هەمان ناو و وشەی تێپەر لەسەر ئەم بەستەرەی خوارەوە سەردانی وەشانی نوێ بکە
        </h1>

        {/* Show target URL display if available */}
        {cleanUrl && (
          <div className="mb-10 w-full max-w-lg bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">بەستەری وەشانی نوێی سیستەم:</span>
            <a 
              href={cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-mono font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-4 break-all inline-flex items-center gap-1.5 justify-center"
              dir="ltr"
            >
              <span>{cleanUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        {/* Required Big Button: 'بڕۆ Go' */}
        <button
          onClick={handleGo}
          className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] px-10 py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xl sm:text-2xl font-black rounded-3xl shadow-xl hover:shadow-2xl hover:scale-102 active:scale-98 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
        >
          <span>بڕۆ Go</span>
          <ArrowLeft className="w-6 h-6 stroke-[3] group-hover:-translate-x-1 transition-transform" />
        </button>

        <p className="text-slate-400 text-xs mt-6 font-medium">
          بە کرتەکردن لەسەر دوگمەکە، ڕاستەوخۆ دەگوێزرێیتەوە بۆ وەشانی نوێ
        </p>
      </main>

      {/* Footer with subtle Developer Bypass Option */}
      <footer className="w-full max-w-4xl flex items-center justify-between pt-6 border-t border-slate-100 text-[11px] text-slate-400">
        <span>سیستەمی بەڕێوەبردنی ستاف و مۆڵەت • هەموو مافەکان پارێزراون</span>

        {/* Discrete Developer Login Trigger */}
        <button
          onClick={() => setShowDeveloperModal(true)}
          className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer font-bold"
          title="چوونەژوورەوەی گەشەپێدەر"
        >
          <Key className="w-3.5 h-3.5 text-slate-400" />
          <span>گەشەپێدەر</span>
        </button>
      </footer>

      {/* Developer Unlock Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-right animate-fade-in relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">چوونەژوورەوەی گەشەپێدەر</h3>
                  <p className="text-[11px] text-slate-400">تایبەت بە بەڕێوەبەری سەرەکی و دەستکاریکردنی سیستەم</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeveloperModal(false);
                  setUnlockError(null);
                  setDevPassword("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  وشەی تێپەڕی گەشەپێدەر (Developer Password):
                </label>
                <input
                  type="password"
                  autoFocus
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  placeholder="تێپەڕەوشە بنووسە..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {unlockError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeveloperModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 rounded-xl"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "پشکنین..." : "چوونەژوورەوە"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
