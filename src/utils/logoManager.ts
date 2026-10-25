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
 * Broadcasts the updated logo to all mounted React components & updates favicon
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
  listeners.forEach((l) => l(newLogo));
}

// Real-time Firestore sync listener
let isSyncInitialized = false;

export function initLogoSync() {
  if (isSyncInitialized || typeof window === "undefined") return;
  isSyncInitialized = true;

  // Immediately apply initial cached logo to browser favicon
  if (currentLogo) {
    updateAppFavicon(currentLogo);
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
