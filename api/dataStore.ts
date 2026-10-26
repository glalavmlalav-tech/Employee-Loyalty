import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  Firestore
} from "firebase/firestore";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const BACKUP_PATH = path.join(process.cwd(), "firestore-backup.json");

export interface DataStoreState {
  employees: any[];
  leave_requests: any[];
  app_users: any[];
  activities: any[];
  gifts: any[];
  messages: any[];
  system_settings: any[];
}

let memoryState: DataStoreState = {
  employees: [],
  leave_requests: [],
  app_users: [],
  activities: [],
  gifts: [],
  messages: [],
  system_settings: []
};

let dataVersion = 1;

// Initialize Firebase for backend background syncing
let firestoreDb: Firestore | null = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const configRaw = fs.readFileSync(configPath, "utf-8");
    const firebaseConfig = JSON.parse(configRaw);
    const fbApp = initializeApp(firebaseConfig, "backend-sync-app");
    firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log("Backend Firestore background sync initialized successfully.");
  }
} catch (e: any) {
  console.warn("Notice: Firestore backend sync initialization skipped:", e?.message);
}

// Load data into memory on module load
export function initStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      memoryState = JSON.parse(raw);
      console.log(`Loaded ${memoryState.employees?.length || 0} employees from ${STORE_PATH}`);
    } catch (e) {
      console.error("Failed to parse store.json:", e);
    }
  } else if (fs.existsSync(BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(BACKUP_PATH, "utf-8");
      memoryState = JSON.parse(raw);
      persistStore();
      console.log(`Initialized store.json from backup with ${memoryState.employees?.length || 0} employees`);
    } catch (e) {
      console.error("Failed to initialize from backup:", e);
    }
  }
}

// Persist memory state to disk
export function persistStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryState, null, 2), "utf-8");
    dataVersion++;
  } catch (e) {
    console.error("Error saving store.json:", e);
  }
}

// Asynchronously sync a change to Firestore without blocking the client or burning read quota
async function asyncSyncToFirestore(col: string, docId: string, data: any, isDelete = false) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, col, docId);
    if (isDelete) {
      await deleteDoc(docRef);
      console.log(`Synced DELETE ${col}/${docId} to Firestore.`);
    } else {
      await setDoc(docRef, data, { merge: true });
      console.log(`Synced WRITE ${col}/${docId} to Firestore.`);
    }
  } catch (err: any) {
    console.warn(`Background Firestore sync warning for ${col}/${docId}:`, err?.message);
  }
}

// Get all data
export function getAllData() {
  return {
    ...memoryState,
    version: dataVersion,
    timestamp: new Date().toISOString()
  };
}

export function getDataVersion(): number {
  return dataVersion;
}

// Employee Operations
export function getEmployees() {
  return memoryState.employees || [];
}

export function saveEmployee(employee: any) {
  if (!memoryState.employees) memoryState.employees = [];
  const idx = memoryState.employees.findIndex((e) => e.id === employee.id);
  if (idx >= 0) {
    memoryState.employees[idx] = { ...memoryState.employees[idx], ...employee };
  } else {
    memoryState.employees.push(employee);
  }
  persistStore();
  asyncSyncToFirestore("employees", employee.id, employee);
  return employee;
}

export function updateEmployee(id: string, partial: any) {
  if (!memoryState.employees) memoryState.employees = [];
  const idx = memoryState.employees.findIndex((e) => e.id === id);
  if (idx >= 0) {
    memoryState.employees[idx] = { ...memoryState.employees[idx], ...partial };
    persistStore();
    asyncSyncToFirestore("employees", id, memoryState.employees[idx]);
    return memoryState.employees[idx];
  }
  return null;
}

export function deleteEmployee(id: string) {
  if (!memoryState.employees) memoryState.employees = [];
  memoryState.employees = memoryState.employees.filter((e) => e.id !== id);
  persistStore();
  asyncSyncToFirestore("employees", id, null, true);
  return true;
}

// Leave Request Operations
export function getLeaveRequests() {
  return memoryState.leave_requests || [];
}

export function saveLeaveRequest(leave: any) {
  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  const idx = memoryState.leave_requests.findIndex((l) => l.id === leave.id);
  if (idx >= 0) {
    memoryState.leave_requests[idx] = { ...memoryState.leave_requests[idx], ...leave };
  } else {
    memoryState.leave_requests.push(leave);
  }
  persistStore();
  asyncSyncToFirestore("leave_requests", leave.id, leave);
  return leave;
}

export function updateLeaveRequest(id: string, partial: any) {
  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  const idx = memoryState.leave_requests.findIndex((l) => l.id === id);
  if (idx >= 0) {
    memoryState.leave_requests[idx] = { ...memoryState.leave_requests[idx], ...partial };
    persistStore();
    asyncSyncToFirestore("leave_requests", id, memoryState.leave_requests[idx]);
    return memoryState.leave_requests[idx];
  }
  return null;
}

export function deleteLeaveRequest(id: string) {
  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  memoryState.leave_requests = memoryState.leave_requests.filter((l) => l.id !== id);
  persistStore();
  asyncSyncToFirestore("leave_requests", id, null, true);
  return true;
}

// App Users Operations
export function getAppUsers() {
  return memoryState.app_users || [];
}

export function saveAppUser(user: any) {
  if (!memoryState.app_users) memoryState.app_users = [];
  const idx = memoryState.app_users.findIndex((u) => u.id === user.id || u.username === user.username);
  if (idx >= 0) {
    memoryState.app_users[idx] = { ...memoryState.app_users[idx], ...user };
  } else {
    memoryState.app_users.push(user);
  }
  persistStore();
  asyncSyncToFirestore("app_users", user.username || user.id, user);
  return user;
}

// Activities, Gifts, Messages, Settings
export function saveActivity(act: any) {
  if (!memoryState.activities) memoryState.activities = [];
  const idx = memoryState.activities.findIndex((a) => a.id === act.id);
  if (idx >= 0) memoryState.activities[idx] = { ...memoryState.activities[idx], ...act };
  else memoryState.activities.push(act);
  persistStore();
  asyncSyncToFirestore("activities", act.id, act);
  return act;
}

export function saveGift(gift: any) {
  if (!memoryState.gifts) memoryState.gifts = [];
  const idx = memoryState.gifts.findIndex((g) => g.id === gift.id);
  if (idx >= 0) memoryState.gifts[idx] = { ...memoryState.gifts[idx], ...gift };
  else memoryState.gifts.push(gift);
  persistStore();
  asyncSyncToFirestore("gifts", gift.id, gift);
  return gift;
}

export function saveMessage(msg: any) {
  if (!memoryState.messages) memoryState.messages = [];
  const idx = memoryState.messages.findIndex((m) => m.id === msg.id);
  if (idx >= 0) memoryState.messages[idx] = { ...memoryState.messages[idx], ...msg };
  else memoryState.messages.push(msg);
  persistStore();
  asyncSyncToFirestore("messages", msg.id, msg);
  return msg;
}

export function saveSettings(settings: any) {
  memoryState.system_settings = [settings];
  persistStore();
  asyncSyncToFirestore("system_settings", "branding", settings);
  return settings;
}

// Restore entire backup
export function restoreStore(fullData: any) {
  if (!fullData || typeof fullData !== "object") {
    throw new Error("Invalid backup data format");
  }
  memoryState = {
    employees: Array.isArray(fullData.employees) ? fullData.employees : memoryState.employees,
    leave_requests: Array.isArray(fullData.leave_requests) ? fullData.leave_requests : memoryState.leave_requests,
    app_users: Array.isArray(fullData.app_users) ? fullData.app_users : memoryState.app_users,
    activities: Array.isArray(fullData.activities) ? fullData.activities : memoryState.activities,
    gifts: Array.isArray(fullData.gifts) ? fullData.gifts : memoryState.gifts,
    messages: Array.isArray(fullData.messages) ? fullData.messages : memoryState.messages,
    system_settings: Array.isArray(fullData.system_settings) ? fullData.system_settings : memoryState.system_settings
  };
  persistStore();
  return getAllData();
}

// Pull fresh state from Firestore
export async function pullFromFirestore(): Promise<{ success: boolean; stats: Record<string, number> }> {
  if (!firestoreDb) throw new Error("Firestore not initialized on server");
  const stats: Record<string, number> = {};
  const collections = ["employees", "leave_requests", "app_users", "activities", "gifts", "messages", "system_settings"];
  
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(firestoreDb, col));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      (memoryState as any)[col] = docs;
      stats[col] = docs.length;
    } catch (e: any) {
      console.warn(`Pull collection ${col} warning:`, e?.message);
    }
  }
  persistStore();
  return { success: true, stats };
}

// Initialize on boot
initStore();
