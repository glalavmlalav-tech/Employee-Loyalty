import React from "react";
import { Download, Smartphone, Tablet, Share, PlusSquare, CheckCircle, X, Sparkles } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { useCustomLogo } from "../utils/logoManager";
import AppLogo from "./AppLogo";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "header" | "sidebar" | "banner" | "minimal";
  language?: "ku" | "en";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = "",
  variant = "header",
  language = "ku"
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isIPad,
    isAndroid,
    promptInstall,
    showIOSModal,
    setShowIOSModal
  } = usePWAInstall();

  const customLogo = useCustomLogo();

  // If already running in standalone mode (already installed), no need to clutter with install button
  if (isInstalled) {
    return null;
  }

  if (!isInstallable) {
    return null;
  }

  const buttonText = language === "ku" 
    ? (isIPad ? "دابەزاندن بۆ ئایپاد" : "دابەزاندنی ئەپ")
    : (isIPad ? "Install on iPad" : "Install App");

  return (
    <>
      {variant === "minimal" ? (
        <button
          onClick={promptInstall}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-400/40 text-amber-900 shadow-sm hover:scale-[1.02] ${className}`}
          title={language === "ku" ? "دابەزاندنی ئەپ بۆ سەر مۆبایل و ئایپاد" : "Install PWA on Mobile / iPad"}
        >
          {isIPad ? (
            <Tablet className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          )}
          <span className="font-sans text-[11px] font-black">{buttonText}</span>
        </button>
      ) : variant === "sidebar" ? (
        <div className={`p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-teal-500/15 border border-amber-400/30 text-start shadow-sm ${className}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                {isIPad ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </div>
              <div>
                <span className="block text-xs font-black text-amber-300">
                  {language === "ku" ? "ئەپی مۆبایل و ئایپاد" : "Mobile & iPad App"}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {language === "ku" ? "وەک ئەپێک دایبەزێنە" : "Install as PWA"}
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 uppercase">
              PWA
            </span>
          </div>

          <button
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition duration-150 shadow-md cursor-pointer hover:scale-[1.01]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === "ku" ? "داگرتنی ڕاستەوخۆ" : "Install Now"}</span>
          </button>
        </div>
      ) : (
        /* Default Header variant */
        <button
          onClick={promptInstall}
          className={`flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-black rounded-full text-xs shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 border border-amber-300/40 ${className}`}
          title={language === "ku" ? "دابەزاندنی ئەپ بۆ سەر مۆبایل و ئایپاد بە لۆگۆی تایبەت" : "Install App to Mobile/iPad"}
        >
          {isIPad ? (
            <Tablet className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          )}
          <span className="text-[11px] font-extrabold whitespace-nowrap">
            {buttonText}
          </span>
          <span className="hidden sm:inline-block px-1 py-0.2 text-[8px] bg-slate-950/20 text-slate-950 rounded uppercase font-bold">
            PWA
          </span>
        </button>
      )}

      {/* Guided Step-by-Step Modal for iPad / iPhone / Android manual installs */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
          dir={language === "ku" ? "rtl" : "ltr"}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient decorative top banner */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500" />
            
            {/* Close button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* App Icon preview showing the developer's uploaded custom logo */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-2.5 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {customLogo ? (
                    <img 
                      src={customLogo} 
                      alt="App Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <AppLogo className="w-14 h-14" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{language === "ku" ? "دابەزاندنی ستاف بۆ سەر شاشە" : "Install Staff on Home Screen"}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {language === "ku" 
                  ? (isIPad 
                      ? "ئەم ئەپە بە لۆگۆی تایبەت و تەواوی تواناکان لەسەر ئایپادەکەت دادەنرێت" 
                      : "ئەم ئەپە بە لۆگۆی تایبەت و بەبێ بەستەری وێبگەر وەک ئەپێک کاردەکات")
                  : "Enjoy the app with full-screen experience and your custom brand icon"}
              </p>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3.5 mb-6 text-slate-700 dark:text-slate-300 text-xs">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                      ١
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{language === "ku" ? "لە سەفاری پەنجە بنێ بە دوگمەی شەیر" : "Tap the Share button in Safari"}</span>
                        <Share className="w-3.5 h-3.5 text-blue-500 inline" />
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === "ku"
                          ? (isIPad ? "لە گۆشەی سەرەوەی سەفاری ئایپاد هێمای چوارگۆشە و تیرەکە ⎋ بدۆزەوە" : "لە بەشی خوارەوەی شاشەی مۆبایلەکەت هێمای تیرەکە ⎋ بدۆزەوە")
                          : "Find the square icon with an upward arrow at the bar."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                      ٢
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{language === "ku" ? "بۆ خوارەوە بڕۆ و پەنجە بنێ بە:" : "Scroll down and choose:"}</span>
                      </p>
                      <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                        <PlusSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>{language === "ku" ? "زیادکردن بۆ پەڕەی سەرەکی (Add to Home Screen)" : "Add to Home Screen"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                      ٣
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {language === "ku" ? "پەنجە بنێ بە «زیادکردن / Add»" : "Tap 'Add' at top right"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === "ku" 
                          ? "ئەپەکە بە لۆگۆ نوێیەکەت ڕاستەوخۆ دەچێتە سەر شاشەی سەرەکی و وەک بەرنامەیەکی فەرمی کاردەکات."
                          : "The app with your custom logo will appear on your Home Screen."}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Android / Chrome instructions */
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                      ١
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {language === "ku" ? "پەنجە بنێ بە سێ خاڵەکەی سەرەوە (⋮)" : "Tap the three dots menu (⋮)"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === "ku" ? "لە وێبگەڕی کرۆم یان براوسەری مۆبایلەکەت" : "In your Chrome browser menu"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                      ٢
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {language === "ku" ? "هەڵبژاردنی «داگرتنی ئەپ» یان «زیادکردن بۆ پەڕەی سەرەکی»" : "Select 'Install app' or 'Add to Home screen'"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs transition duration-150 cursor-pointer shadow-md"
            >
              {language === "ku" ? "تێگەیشتم، زۆر باشە" : "Got it, thanks"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
