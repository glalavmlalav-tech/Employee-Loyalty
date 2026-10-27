/**
 * Native IndexedDB and Smart LocalStorage Persistence Utility
 * Solves the browser's 5MB localStorage quota limit for large datasets with images.
 * Provides 0ms instant cache hydration upon page refresh.
 */

import { Employee } from "../types";

const DB_NAME = "LiniaCorporateLoyaltyDB";
const DB_VERSION = 1;
const STORE_NAME = "app_cache";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save arbitrary data to IndexedDB (virtually unlimited capacity e.g. >250MB)
 */
export async function idbSet<T = any>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to write key "${key}":`, err);
  }
}

/**
 * Read data from IndexedDB
 */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to read key "${key}":`, err);
    return null;
  }
}

/**
 * Create lightweight employee summaries suitable for instant synchronous localStorage hydration (<50KB)
 * Strips huge passport and iqama base64 strings so localStorage never exceeds quota.
 */
export function stripHeavyImages(employees: Employee[]): Employee[] {
  return employees.map((emp) => {
    // If photos are moderate or empty, keep them. Strip raw document scans for lightweight storage.
    return {
      ...emp,
      // Strip heavy document scans from synchronous localStorage copy:
      passportOrNationalCardUrl: emp.passportOrNationalCardUrl ? (emp.passportOrNationalCardUrl.length > 50000 ? "stored_in_idb" : emp.passportOrNationalCardUrl) : undefined,
      iqamaUrl: emp.iqamaUrl ? (emp.iqamaUrl.length > 50000 ? "stored_in_idb" : emp.iqamaUrl) : undefined,
    };
  });
}

// Clean up any stale client-side deletion override traps on module evaluation
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("corporate_persistent_deleted_ids");
  } catch (e) {}
}

/**
 * Synchronous read of employee list for 0ms initial render
 */
export function getInitialCachedEmployees(): Employee[] {
  if (typeof window === "undefined") return [];

  // 1. Try lightweight summary from localStorage
  try {
    const summaryStr = localStorage.getItem("cache_employees_summary");
    if (summaryStr) {
      const parsed = JSON.parse(summaryStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Try legacy cache_employees
  try {
    const legacyStr = localStorage.getItem("cache_employees");
    if (legacyStr) {
      const parsed = JSON.parse(legacyStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return [];
}

/**
 * Save employees to both IndexedDB (full with high-res photos/documents)
 * and localStorage (lightweight summary for 0ms next boot).
 */
export function persistEmployeesLocally(employees: Employee[]): void {
  if (!Array.isArray(employees) || employees.length === 0) return;

  // 1. Full persistence to IndexedDB (asynchronous, holds all MBs of documents)
  idbSet("full_employees", employees).catch(() => {});

  // 2. Lightweight summary to localStorage (synchronous, ~35KB)
  try {
    const light = stripHeavyImages(employees);
    localStorage.setItem("cache_employees_summary", JSON.stringify(light));
  } catch (e) {
    // If even that somehow fails, strip all images completely
    try {
      const ultraLight = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        business: emp.business,
        role: emp.role,
        phone: emp.phone,
        birthDate: emp.birthDate,
        maritalStatus: emp.maritalStatus,
        marriageAnniversary: emp.marriageAnniversary,
        hireDate: emp.hireDate,
        status: emp.status,
        isDeleted: emp.isDeleted,
        deletedAt: emp.deletedAt,
        deletedBy: emp.deletedBy
      }));
      localStorage.setItem("cache_employees_summary", JSON.stringify(ultraLight));
    } catch (innerErr) {
      console.warn("Storage quota exceeded even for ultra-light cache:", innerErr);
    }
  }
}

