import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_KEY = "custom_app_logo";
const DEFAULT_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cg id='logo-arm'%3E%3Cpath d='M 40,0 L 58,0 L 58,40 C 58,52 64,56 75,48 L 86,39 L 98,52 L 78,70 C 60,85 40,70 40,46 Z' fill='%23330a1c'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23logo-arm'/%3E%3Cuse href='%23logo-arm' transform='rotate(120 50 50)'/%3E%3Cuse href='%23logo-arm' transform='rotate(240 50 50)'/%3E%3C/svg%3E";

// In-memory reactive state initialized synchronously from cache
let currentLogo: string | null = (() => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY) || null;
})();

const listeners = new Set<(logo: string | null) => void>();

export function getCustomLogo(): string | null {
  return currentLogo;
}

/**
 * Dynamically updates the browser tab's favicon (<link rel="icon">)
 */
export function updateAppFavicon(url: string | null) {
  if (typeof document === "undefined") return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url || DEFAULT_FAVICON;
    if (url && url.startsWith("data:image/png")) {
      link.type = "image/png";
    } else if (url && url.startsWith("data:image/svg")) {
      link.type = "image/svg+xml";
    } else if (url && (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg"))) {
      link.type = "image/jpeg";
    }
  } catch (err) {
    console.warn("Could not update tab favicon:", err);
  }
}

/**
 * Custom React hook to re-render whenever the app logo changes
 */
export function useCustomLogo(): string | null {
  const [logo, setLogo] = useState<string | null>(currentLogo);

  useEffect(() => {
    const handler = (newLogo: string | null) => {
      setLogo(newLogo);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return logo;
}

/**
 * Broadcasts the updated logo to all mounted React components & updates favicon and PWA icons
 */
function broadcastLogoChange(newLogo: string | null) {
  currentLogo = newLogo;
  if (typeof window !== "undefined") {
    if (newLogo) {
      localStorage.setItem(STORAGE_KEY, newLogo);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  updateAppFavicon(newLogo);
  updatePWAIconsAndManifest(newLogo);
  listeners.forEach((l) => l(newLogo));
}

const PWA_ICON_STORAGE_KEY = "custom_pwa_icon_512";
let dynamicManifestUrl: string | null = null;

export async function createPWAIconFromLogo(logoDataUrl: string, size = 512): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(logoDataUrl);
        return;
      }

      // Crisp clean white background with gentle padding for high-fidelity iOS & Android home screens
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Centered with safe maskable margins
      const maxLogoW = size * 0.74;
      const maxLogoH = size * 0.74;
      let drawW = img.width;
      let drawH = img.height;

      const scale = Math.min(maxLogoW / drawW, maxLogoH / drawH);
      drawW = drawW * scale;
      drawH = drawH * scale;

      const offsetX = (size - drawW) / 2;
      const offsetY = (size - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      const generatedDataUrl = canvas.toDataURL("image/png");
      resolve(generatedDataUrl);
    };
    img.onerror = () => {
      resolve(logoDataUrl);
    };
    img.src = logoDataUrl;
  });
}

/**
 * Dynamically updates <link rel="apple-touch-icon"> and <link rel="manifest">
 * so installed PWAs on iPad, iPhone, and Android use the developer's uploaded custom logo
 */
export function updatePWAIconsAndManifest(logoUrl: string | null) {
  if (typeof document === "undefined") return;

  try {
    let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }

    let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      document.head.appendChild(manifestLink);
    }

    if (!logoUrl) {
      appleLink.href = "/apple-touch-icon.png";
      manifestLink.href = "/manifest.webmanifest";
      try {
        localStorage.removeItem(PWA_ICON_STORAGE_KEY);
      } catch (e) {}
      return;
    }

    const applyPwaIcon = (iconDataUrl: string) => {
      if (appleLink) {
        appleLink.href = iconDataUrl;
      }
      // Manifest MUST remain a valid HTTP URL (/manifest.webmanifest) for W3C/Chromium PWA spec compliance
      manifestLink.href = "/manifest.webmanifest";
    };

    // If cached PWA icon exists, apply immediately
    const cachedPwaIcon = (() => {
      try {
        return localStorage.getItem(PWA_ICON_STORAGE_KEY);
      } catch {
        return null;
      }
    })();

    if (cachedPwaIcon) {
      applyPwaIcon(cachedPwaIcon);
    }

    // Generate fresh PWA icon from logo
    createPWAIconFromLogo(logoUrl, 512).then((iconDataUrl) => {
      try {
        localStorage.setItem(PWA_ICON_STORAGE_KEY, iconDataUrl);
      } catch (e) {}
      applyPwaIcon(iconDataUrl);
    }).catch(() => {
      applyPwaIcon(logoUrl);
    });
  } catch (err) {
    console.warn("Could not update PWA icons and manifest:", err);
  }
}

// Real-time Firestore sync listener
let isSyncInitialized = false;

export function initLogoSync() {
  if (isSyncInitialized || typeof window === "undefined") return;
  isSyncInitialized = true;

  // Immediately apply initial cached logo to browser favicon and PWA icons
  if (currentLogo) {
    updateAppFavicon(currentLogo);
    updatePWAIconsAndManifest(currentLogo);
  }

  try {
    const docRef = doc(db, "system_settings", "branding");
    onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const logoUrl = data.logoUrl || null;
        if (logoUrl !== currentLogo) {
          broadcastLogoChange(logoUrl);
        }
      } else {
        if (currentLogo !== null) {
          broadcastLogoChange(null);
        }
      }
    }, (err) => {
      console.warn("Real-time logo sync notice:", err);
    });
  } catch (err) {
    console.warn("Could not attach real-time branding listener:", err);
  }
}

/**
 * Saves a new custom logo to Firestore & local cache
 */
export async function saveCustomLogo(dataUrl: string, uploadedBy: string = "developer"): Promise<void> {
  broadcastLogoChange(dataUrl);

  // Sync with server PWA icon handler for disk persistence
  try {
    fetch("/api/pwa/update-icons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoDataUrl: dataUrl })
    }).catch(() => {});
  } catch (e) {}

  try {
    const docRef = doc(db, "system_settings", "branding");
    await setDoc(docRef, {
      logoUrl: dataUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: uploadedBy
    });
  } catch (err) {
    console.error("Error saving custom logo to Firestore:", err);
    throw err;
  }
}

/**
 * Resets the logo back to default Lenya SVG icon
 */
export async function resetCustomLogo(): Promise<void> {
  broadcastLogoChange(null);
  try {
    const docRef = doc(db, "system_settings", "branding");
    await setDoc(docRef, {
      logoUrl: null,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error resetting custom logo in Firestore:", err);
    throw err;
  }
}

/**
 * Helper to compress and format uploaded logo image to lightweight transparent PNG
 */
export function compressLogoImage(
  fileOrBase64: File | string,
  maxDimension: number = 320
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale while preserving aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        // Clean transparent canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG to preserve transparent background
        const compressedPng = canvas.toDataURL("image/png");
        resolve(compressedPng);
      };
      img.onerror = (err) => {
        console.warn("Logo compression error, returning source:", err);
        resolve(typeof fileOrBase64 === "string" ? fileOrBase64 : "");
      };
    };

    if (typeof fileOrBase64 === "string") {
      processImage(fileOrBase64);
    } else {
      const reader = new FileReader();
      reader.onload = () => processImage(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
