import { useState, useEffect } from "react";

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isIPad: boolean;
  isAndroid: boolean;
  promptInstall: () => Promise<void>;
  showIOSModal: boolean;
  setShowIOSModal: (show: boolean) => void;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isIPad, setIsIPad] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone display mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Device detection
    const ua = window.navigator.userAgent || "";
    const platform = window.navigator.platform || "";
    const maxTouch = window.navigator.maxTouchPoints || 0;

    const isAppleTablet = /iPad/.test(ua) || (platform === "MacIntel" && maxTouch > 1 && !/iPhone/.test(ua));
    const isApplePhone = /iPhone|iPod/.test(ua);
    const appleDevice = isAppleTablet || isApplePhone;
    const androidDevice = /Android/.test(ua);

    setIsIPad(isAppleTablet);
    setIsIOS(appleDevice);
    setIsAndroid(androidDevice);

    // Chromium beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // App installed event listener
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIOSModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (isInstalled) return;

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("PWA install prompt error:", err);
        setShowIOSModal(true);
      }
    } else {
      // If browser doesn't provide prompt or manual help requested
      setShowIOSModal(true);
    }
  };

  // On mobile/tablets or when browser prompt fired, mark as installable
  const isInstallable = !isInstalled && (!!deferredPrompt || isIOS || isAndroid);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isIPad,
    isAndroid,
    promptInstall,
    showIOSModal,
    setShowIOSModal
  };
}
