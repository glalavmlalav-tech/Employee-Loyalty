import fs from "fs";
import path from "path";
import {
  getSqliteDb,
  isSqliteSupported,
  sqlFetchAllData,
  sqlInsertOrUpdateEmployee,
  sqlUpdateEmployeeFields,
  sqlDeleteEmployeePermanently,
  sqlInsertOrUpdateLeave,
  sqlUpdateLeaveFields,
  sqlDeleteLeave,
  sqlInsertOrUpdateAppUser,
  sqlDeleteAppUser,
  sqlInsertOrUpdateActivity,
  sqlDeleteActivity,
  sqlInsertOrUpdateGift,
  sqlInsertOrUpdateMessage,
  sqlInsertOrUpdateSettings,
  sqlRestoreAllData,
  getSqlDiagnostics,
  sqlInspectTable
} from "./sqlDatabase";
import { compressEmployeeRecord } from "./serverImageCompression";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

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

// Load data into memory on module load from SQL
export function initStore(): void {
  if (isSqliteSupported()) {
    try {
      const db = getSqliteDb();
      if (db) {
        const sqlData = sqlFetchAllData();
        memoryState = {
          employees: sqlData.employees || [],
          leave_requests: sqlData.leave_requests || [],
          app_users: sqlData.app_users || [],
          activities: sqlData.activities || [],
          gifts: sqlData.gifts || [],
          messages: sqlData.messages || [],
          system_settings: sqlData.system_settings || []
        };
        persistStoreMirror();
        console.log(`[DataStore] Loaded ${memoryState.employees.length} employees from SQL database.`);
        return;
      }
    } catch (e) {
      // Fall through to store.json below
    }
  }

  // Fallback to store.json if SQLite had an issue or is not supported
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      memoryState = JSON.parse(raw);
    } catch (err) {}
  }
}

// Persist JSON mirror to disk for instant external backup compatibility
function persistStoreMirror(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryState, null, 2), "utf-8");
    dataVersion++;
  } catch (e) {
    console.error("Error saving store mirror:", e);
  }
}

// Get all data directly from SQL
export function getAllData() {
  if (isSqliteSupported()) {
    try {
      const sqlData = sqlFetchAllData();
      if (sqlData && sqlData.employees && sqlData.employees.length > 0) {
        memoryState = sqlData as DataStoreState;
      }
    } catch (e) {}
  }

  return {
    ...memoryState,
    databaseEngine: isSqliteSupported() ? "SQLite 3" : "JSON Store",
    version: dataVersion,
    timestamp: new Date().toISOString()
  };
}

export function getDataVersion(): number {
  return dataVersion;
}

// Employee Operations via SQL
export function getEmployees() {
  return memoryState.employees || [];
}

export async function saveEmployee(employee: any) {
  // Pre-compress images if present
  const compressedEmployee = await compressEmployeeRecord(employee);

  // 1. Save to SQL if supported
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateEmployee(compressedEmployee);
    } catch (e) {}
  }

  // 2. Update memory state
  if (!memoryState.employees) memoryState.employees = [];
  const idx = memoryState.employees.findIndex((e) => e.id === compressedEmployee.id);
  if (idx >= 0) {
    memoryState.employees[idx] = { ...memoryState.employees[idx], ...compressedEmployee };
  } else {
    memoryState.employees.push(compressedEmployee);
  }
  persistStoreMirror();
  return compressedEmployee;
}

export async function updateEmployee(id: string, partial: any) {
  const cleanId = (id || "").trim();
  // Pre-compress partial images if present
  const compressedPartial = await compressEmployeeRecord(partial);

  // 1. Save to SQL if supported
  let updatedInSql: any = { ...compressedPartial, id: cleanId };
  if (isSqliteSupported()) {
    try {
      updatedInSql = sqlUpdateEmployeeFields(cleanId, compressedPartial);
    } catch (e) {}
  }

  // 2. Update memory state
  if (!memoryState.employees) memoryState.employees = [];
  const idx = memoryState.employees.findIndex((e) => (e.id || "").trim() === cleanId);
  if (idx >= 0) {
    memoryState.employees[idx] = { ...memoryState.employees[idx], ...updatedInSql };
    persistStoreMirror();
    return { ...memoryState.employees[idx], version: dataVersion };
  } else {
    memoryState.employees.push(updatedInSql);
    persistStoreMirror();
    return { ...updatedInSql, version: dataVersion };
  }
}

export function deleteEmployee(id: string) {
  // 1. Delete from SQL if supported
  if (isSqliteSupported()) {
    try {
      sqlDeleteEmployeePermanently(id);
    } catch (e) {}
  }

  // 2. Update memory state
  if (!memoryState.employees) memoryState.employees = [];
  memoryState.employees = memoryState.employees.filter((e) => e.id !== id);
  persistStoreMirror();
  return true;
}

// Leave Request Operations via SQL
export function getLeaveRequests() {
  return memoryState.leave_requests || [];
}

export function saveLeaveRequest(leave: any) {
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateLeave(leave);
    } catch (e) {}
  }

  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  const idx = memoryState.leave_requests.findIndex((l) => l.id === leave.id);
  if (idx >= 0) {
    memoryState.leave_requests[idx] = { ...memoryState.leave_requests[idx], ...leave };
  } else {
    memoryState.leave_requests.push(leave);
  }
  persistStoreMirror();
  return leave;
}

export function updateLeaveRequest(id: string, partial: any) {
  let updated = { ...partial, id };
  if (isSqliteSupported()) {
    try {
      updated = sqlUpdateLeaveFields(id, partial);
    } catch (e) {}
  }

  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  const idx = memoryState.leave_requests.findIndex((l) => l.id === id);
  if (idx >= 0) {
    memoryState.leave_requests[idx] = { ...memoryState.leave_requests[idx], ...updated };
    persistStoreMirror();
    return memoryState.leave_requests[idx];
  } else {
    memoryState.leave_requests.push(updated);
    persistStoreMirror();
    return updated;
  }
}

export function deleteLeaveRequest(id: string) {
  if (isSqliteSupported()) {
    try {
      sqlDeleteLeave(id);
    } catch (e) {}
  }

  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  memoryState.leave_requests = memoryState.leave_requests.filter((l) => l.id !== id);
  persistStoreMirror();
  return true;
}

// App Users Operations via SQL
export function getAppUsers() {
  return memoryState.app_users || [];
}

export function saveAppUser(user: any) {
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateAppUser(user);
    } catch (e) {}
  }

  if (!memoryState.app_users) memoryState.app_users = [];
  const idx = memoryState.app_users.findIndex((u) => u.id === user.id || u.username === user.username);
  if (idx >= 0) {
    memoryState.app_users[idx] = { ...memoryState.app_users[idx], ...user };
  } else {
    memoryState.app_users.push(user);
  }
  persistStoreMirror();
  return user;
}

export function deleteAppUser(id: string) {
  if (isSqliteSupported()) {
    try {
      sqlDeleteAppUser(id);
    } catch (e) {}
  }
  if (!memoryState.app_users) memoryState.app_users = [];
  memoryState.app_users = memoryState.app_users.filter((u) => u.id !== id && u.username !== id);
  persistStoreMirror();
  return true;
}

// Activities, Gifts, Messages, Settings via SQL
export function saveActivity(act: any) {
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateActivity(act);
    } catch (e) {}
  }

  if (!memoryState.activities) memoryState.activities = [];
  const idx = memoryState.activities.findIndex((a) => a.id === act.id);
  if (idx >= 0) memoryState.activities[idx] = { ...memoryState.activities[idx], ...act };
  else memoryState.activities.push(act);
  persistStoreMirror();
  return act;
}

export function deleteActivity(id: string) {
  if (isSqliteSupported()) {
    try {
      sqlDeleteActivity(id);
    } catch (e) {}
  }
  if (!memoryState.activities) memoryState.activities = [];
  memoryState.activities = memoryState.activities.filter((a) => a.id !== id);
  persistStoreMirror();
  return true;
}

export function saveGift(gift: any) {
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateGift(gift);
    } catch (e) {}
  }

  if (!memoryState.gifts) memoryState.gifts = [];
  const idx = memoryState.gifts.findIndex((g) => g.id === gift.id);
  if (idx >= 0) memoryState.gifts[idx] = { ...memoryState.gifts[idx], ...gift };
  else memoryState.gifts.push(gift);
  persistStoreMirror();
  return gift;
}

export function saveMessage(msg: any) {
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateMessage(msg);
    } catch (e) {}
  }

  if (!memoryState.messages) memoryState.messages = [];
  const idx = memoryState.messages.findIndex((m) => m.id === msg.id);
  if (idx >= 0) memoryState.messages[idx] = { ...memoryState.messages[idx], ...msg };
  else memoryState.messages.push(msg);
  persistStoreMirror();
  return msg;
}

export function saveSettings(settings: any) {
  if (isSqliteSupported()) {
    try {
      sqlInsertOrUpdateSettings(settings);
    } catch (e) {}
  }

  if (!memoryState.system_settings) memoryState.system_settings = [];
  const id = settings.id || "general";
  const idx = memoryState.system_settings.findIndex((s: any) => s.id === id);
  if (idx >= 0) {
    memoryState.system_settings[idx] = { ...memoryState.system_settings[idx], ...settings };
  } else {
    memoryState.system_settings.push(settings);
  }
  persistStoreMirror();
  return settings;
}

// Restore entire backup via SQL transaction
export function restoreStore(fullData: any) {
  if (!fullData || typeof fullData !== "object") {
    throw new Error("Invalid backup data format");
  }
  if (isSqliteSupported()) {
    try {
      sqlRestoreAllData(fullData);
    } catch (e) {}
  }
  memoryState = {
    employees: fullData.employees || [],
    leave_requests: fullData.leave_requests || fullData.leaveRequests || [],
    app_users: fullData.app_users || fullData.appUsers || [],
    activities: fullData.activities || [],
    gifts: fullData.gifts || [],
    messages: fullData.messages || [],
    system_settings: fullData.system_settings || []
  };
  persistStoreMirror();
  return getAllData();
}

// Diagnostics
export function getDbDiagnostics() {
  if (isSqliteSupported()) {
    try {
      return getSqlDiagnostics();
    } catch (e) {}
  }
  return {
    engine: "JSON Store",
    tables: {
      employees: memoryState.employees?.length || 0,
      activeEmployees: memoryState.employees?.filter((e) => !e.isDeleted && e.status !== "deleted").length || 0,
      trashEmployees: memoryState.employees?.filter((e) => e.isDeleted || e.status === "deleted").length || 0,
      leaveRequests: memoryState.leave_requests?.length || 0,
      appUsers: memoryState.app_users?.length || 0,
      activities: memoryState.activities?.length || 0,
      gifts: memoryState.gifts?.length || 0,
      messages: memoryState.messages?.length || 0,
      systemSettings: memoryState.system_settings?.length || 0,
    }
  };
}

export function getDbTableRows(tableName: string, limit = 100) {
  if (isSqliteSupported()) {
    try {
      return sqlInspectTable(tableName, limit);
    } catch (e) {}
  }
  const key = tableName === "leave_requests" ? "leave_requests" : tableName;
  const list = (memoryState as any)[key] || [];
  return list.slice(0, limit);
}

// Initialize on boot
initStore();
