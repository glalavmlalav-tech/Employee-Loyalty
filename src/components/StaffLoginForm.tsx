import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { ShieldAlert, LogIn, Key, User } from "lucide-react";

interface StaffLoginFormProps {
  language: "ku" | "en";
  onLoginSuccess: (email: string) => Promise<boolean>;
  onLoginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function StaffLoginForm({ language, onLoginSuccess, onLoginWithCredentials }: StaffLoginFormProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Username & Password state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(
        language === "ku"
          ? "⚠️ تکایە ناوی بەکارهێنەر و پاسۆرد بنووسە."
          : "⚠️ Please enter both username and password."
      );
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      const response = await onLoginWithCredentials(username.trim().toLowerCase(), password.trim());
      if (!response.success) {
        setErrorMsg(
          language === "ku"
            ? `⚠️ ${response.error || "ناوی بەکارهێنەر یان پاسۆرد هەڵەیە!"}`
            : `⚠️ ${response.error || "Invalid username or password!"}`
        );
      }
    } catch (err: any) {
      console.error("Credentials Login Error:", err);
      setErrorMsg(
        language === "ku"
          ? "⚠️ کێشەیەک لە چوونەژوورەوەدا ڕوویدا."
          : "⚠️ An error occurred during credentials login."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg("");

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        throw new Error("Could not retrieve email from Google Account.");
      }

      const isRegistered = await onLoginSuccess(email.toLowerCase().trim());
      
      if (!isRegistered) {
        setErrorMsg(
          language === "ku"
            ? `⚠️ ئیمەیڵی "${email}" لە سیستەمەکەدا ڕێگەپێنەدراوە! تکایە داوا لە سوپەر ئەدمین بکە لە بەشی ڕێکخستن زیادی بکات.`
            : `⚠️ The email "${email}" is not registered on this system. Ask a Super Admin to register you in Settings.`
        );
        await auth.signOut();
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error?.code !== "auth/popup-closed-by-user") {
        setErrorMsg(
          language === "ku"
            ? "⚠️ کێشەیەک لە چوونەژوورەوەی گووگڵ ڕوویدا. دووبارە تاقی بکەرەوە."
            : "⚠️ Google credentials authorization failed. Please try again."
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="space-y-6" dir={language === "ku" ? "rtl" : "ltr"}>
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-200 text-red-700 text-xs rounded-2xl font-bold font-sans text-right leading-relaxed animate-fade-in flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="w-full text-right">{errorMsg}</span>
        </div>
      )}

      {/* Traditional Username/Password Form */}
      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-700 mb-1.5 text-right">
            {language === "ku" ? "ناوی بەکارهێنەر (Username)" : "Username"}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoggingIn}
              placeholder={language === "ku" ? "بۆ نموونە: rawaz یان qasim" : "e.g. rawaz or qasim"}
              className="w-full py-3.5 pr-11 pl-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-xs font-sans outline-none text-right transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-1.5 text-right">
            {language === "ku" ? "تێپەڕەوشە / پاسۆرد" : "Password"}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
              placeholder="••••••••"
              className="w-full py-3.5 pr-11 pl-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-xs font-mono outline-none text-right transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          <span>
            {isLoggingIn
              ? language === "ku"
                ? "چوونەژوورەوە..."
                : "Signing in..."
              : language === "ku"
              ? "چوونەژوورەوە بە یوزەرنەیم"
              : "Sign In with Credentials"}
          </span>
        </button>
      </form>

      {/* Alternative divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{language === "ku" ? "یان" : "OR"}</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      <div className="text-center">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoggingIn}
          className="w-full py-3 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-sm cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="ml-2">
            {language === "ku"
              ? "چوونەژوورەوە بە Google"
              : "Continue with Google Sync"}
          </span>
        </button>
      </div>

      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-center">
        <p className="text-[10px] text-slate-500 leading-normal font-medium">
          {language === "ku"
            ? "دەتوانیت یوزەرنەیم و تێپەڕەوشەی تەرخانکراو بەکاربهێنیت بۆ چوونەژوورەوەی خێرا لەسەر هەر وێبگەر و دیڤایسێک."
            : "You can use your dedicated username & password to instantly sign in across any browser or device."}
        </p>
      </div>
    </div>
  );
}
