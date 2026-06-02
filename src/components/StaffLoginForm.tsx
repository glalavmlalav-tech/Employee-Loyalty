import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { ShieldAlert, LogIn } from "lucide-react";

interface StaffLoginFormProps {
  language: "ku" | "en";
  onLoginSuccess: (email: string) => Promise<boolean>;
}

export default function StaffLoginForm({ language, onLoginSuccess }: StaffLoginFormProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg("");

    const provider = new GoogleAuthProvider();
    // Hint to prompt user to select account always
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
        // Sign out from firebase auth so they can try another account later
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
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-200 text-red-700 text-xs rounded-2xl font-bold font-sans text-right leading-relaxed animate-fade-in flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="w-full">{errorMsg}</span>
        </div>
      )}

      <div className="text-center py-2">
        <p className="text-slate-400 text-[11px] uppercase tracking-wider font-extrabold mb-4">
          {language === "ku" ? "چوونەژوورەوەی پارێزراو" : "Secure Passwordless Gateway"}
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoggingIn}
          className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 text-xs md:text-sm font-extrabold rounded-2xl flex items-center justify-center gap-3 shadow-md cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          )}
          <span>
            {isLoggingIn
              ? language === "ku"
                ? "هاوکات دەکرێت..."
                : "Authorizing with Google..."
              : language === "ku"
              ? "چوونەژوورەوە بە هەژماری Google"
              : "Continue with Google Sync"}
          </span>
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
        <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
          {language === "ku"
            ? "دڵنیابەرەوە لە هەمان سووچەوە داخڵ بیت کە ئیمەیڵەکەی لە لایەن سوپەر ئۆنەرەوە لە بەشی (Share) زیاد کراوە."
            : "Make sure you choose the Gmail address that has been pre-granted access under the project share workflow."}
        </p>
      </div>
    </div>
  );
}
