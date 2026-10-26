import fs from "fs";
import path from "path";
import {
  getSqliteDb,
  sqlFetchAllData,
  sqlInsertOrUpdateEmployee,
  sqlUpdateEmployeeFields,
  sqlDeleteEmployeePermanently,
  sqlInsertOrUpdateLeave,
  sqlUpdateLeaveFields,
  sqlDeleteLeave,
  sqlInsertOrUpdateAppUser,
  sqlInsertOrUpdateActivity,
  sqlInsertOrUpdateGift,
  sqlInsertOrUpdateMessage,
  sqlInsertOrUpdateSettings,
  sqlRestoreAllData,
  getSqlDiagnostics,
  sqlInspectTable
} from "./sqlDatabase.ts";

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
  try {
    getSqliteDb();
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
  } catch (e) {
    console.error("[DataStore] Failed to initialize from SQL database:", e);
    // Fallback to store.json if SQLite had an issue
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        memoryState = JSON.parse(raw);
      } catch (err) {}
    }
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
  try {
    const sqlData = sqlFetchAllData();
    if (sqlData && sqlData.employees && sqlData.employees.length > 0) {
      memoryState = sqlData as DataStoreState;
    }
  } catch (e) {
    console.warn("Notice: Fetching from memory cache fallback:", e);
  }

  return {
    ...memoryState,
    databaseEngine: "SQLite 3",
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

export function saveEmployee(employee: any) {
  // 1. Save to SQL
  sqlInsertOrUpdateEmployee(employee);

  // 2. Update memory state
  if (!memoryState.employees) memoryState.employees = [];
  const idx = memoryState.employees.findIndex((e) => e.id === employee.id);
  if (idx >= 0) {
    memoryState.employees[idx] = { ...memoryState.employees[idx], ...employee };
  } else {
    memoryState.employees.push(employee);
  }
  persistStoreMirror();
  return employee;
}

export function updateEmployee(id: string, partial: any) {
  // 1. Save to SQL
  const updatedInSql = sqlUpdateEmployeeFields(id, partial);

  // 2. Update memory state
  if (!memoryState.employees) memoryState.employees = [];
  const idx = memoryState.employees.findIndex((e) => e.id === id);
  if (idx >= 0) {
    memoryState.employees[idx] = { ...memoryState.employees[idx], ...updatedInSql };
    persistStoreMirror();
    return memoryState.employees[idx];
  } else {
    memoryState.employees.push(updatedInSql);
    persistStoreMirror();
    return updatedInSql;
  }
}

export function deleteEmployee(id: string) {
  // 1. Delete from SQL
  sqlDeleteEmployeePermanently(id);

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
  sqlInsertOrUpdateLeave(leave);

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
  const updated = sqlUpdateLeaveFields(id, partial);

  if (!memoryState.leave_requests) memoryState.leave_requests = [];
  const idx = memoryState.leave_requests.findIndex((l) => l.id === id);
  if (idx >= 0) {
    memoryState.leave_requests[idx] = { ...memoryState.leave_requests[idx], ...partial };
    persistStoreMirror();
    return memoryState.leave_requests[idx];
  } else {
    memoryState.leave_requests.push(updated);
    persistStoreMirror();
    return updated;
  }
}

export function deleteLeaveRequest(id: string) {
  sqlDeleteLeave(id);

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
  sqlInsertOrUpdateAppUser(user);

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

// Activities, Gifts, Messages, Settings via SQL
export function saveActivity(act: any) {
  sqlInsertOrUpdateActivity(act);

  if (!memoryState.activities) memoryState.activities = [];
  const idx = memoryState.activities.findIndex((a) => a.id === act.id);
  if (idx >= 0) memoryState.activities[idx] = { ...memoryState.activities[idx], ...act };
  else memoryState.activities.push(act);
  persistStoreMirror();
  return act;
}

export function saveGift(gift: any) {
  sqlInsertOrUpdateGift(gift);

  if (!memoryState.gifts) memoryState.gifts = [];
  const idx = memoryState.gifts.findIndex((g) => g.id === gift.id);
  if (idx >= 0) memoryState.gifts[idx] = { ...memoryState.gifts[idx], ...gift };
  else memoryState.gifts.push(gift);
  persistStoreMirror();
  return gift;
}

export function saveMessage(msg: any) {
  sqlInsertOrUpdateMessage(msg);

  if (!memoryState.messages) memoryState.messages = [];
  const idx = memoryState.messages.findIndex((m) => m.id === msg.id);
  if (idx >= 0) memoryState.messages[idx] = { ...memoryState.messages[idx], ...msg };
  else memoryState.messages.push(msg);
  persistStoreMirror();
  return msg;
}

export function saveSettings(settings: any) {
  sqlInsertOrUpdateSettings(settings);

  memoryState.system_settings = [settings];
  persistStoreMirror();
  return settings;
}

// Restore entire backup via SQL transaction
export function restoreStore(fullData: any) {
  if (!fullData || typeof fullData !== "object") {
    throw new Error("Invalid backup data format");
  }
  const restored = sqlRestoreAllData(fullData);
  memoryState = {
    employees: restored.employees || [],
    leave_requests: restored.leave_requests || [],
    app_users: restored.app_users || [],
    activities: restored.activities || [],
    gifts: restored.gifts || [],
    messages: restored.messages || [],
    system_settings: restored.system_settings || []
  };
  persistStoreMirror();
  return getAllData();
}

// Diagnostics
export function getDbDiagnostics() {
  return getSqlDiagnostics();
}

export function getDbTableRows(tableName: string, limit = 100) {
  return sqlInspectTable(tableName, limit);
}

// Initialize on boot
initStore();
