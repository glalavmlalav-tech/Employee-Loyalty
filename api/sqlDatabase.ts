import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.join(process.cwd(), "data");
const SQLITE_FILE = path.join(DATA_DIR, "app_database.sqlite");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const BACKUP_PATH = path.join(process.cwd(), "firestore-backup.json");

let sqliteDb: DatabaseSync | null = null;

// Initialize and ensure tables exist
export function getSqliteDb(): DatabaseSync {
  if (!sqliteDb) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    sqliteDb = new DatabaseSync(SQLITE_FILE);
    sqliteDb.exec("PRAGMA journal_mode = WAL;");
    sqliteDb.exec("PRAGMA synchronous = NORMAL;");

    // 1. Employees table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT,
        business TEXT,
        role TEXT,
        phone TEXT,
        birth_date TEXT,
        marital_status TEXT,
        marriage_anniversary TEXT,
        hire_date TEXT,
        status TEXT,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // 2. Leave Requests table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT
      );
    `);

    // 3. App Users table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        data_json TEXT NOT NULL,
        created_at TEXT
      );
    `);

    // 4. Activities table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        business TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT
      );
    `);

    // 5. Gifts table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS gifts (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        data_json TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // 6. Messages table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        data_json TEXT NOT NULL,
        sent_at TEXT
      );
    `);

    // 7. System Settings table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // 8. SQL Engine metadata
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS sql_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    console.log(`[SQL Database] Initialized SQLite schema at ${SQLITE_FILE}`);

    // Seed data into SQLite if table is empty
    seedSqlFromBackups();
  }
  return sqliteDb;
}

// Seed SQL from existing store.json or firestore-backup.json
function seedSqlFromBackups() {
  if (!sqliteDb) return;

  const countRow = sqliteDb.prepare("SELECT COUNT(*) as count FROM employees;").get() as { count: number };
  if (countRow && countRow.count > 0) {
    console.log(`[SQL Database] Already has ${countRow.count} employees in SQLite.`);
    return;
  }

  let sourceData: any = null;
  if (fs.existsSync(STORE_PATH)) {
    try {
      sourceData = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
      console.log(`[SQL Database] Seeding SQLite from ${STORE_PATH}`);
    } catch (e) {
      console.warn("Could not parse store.json for SQLite seed:", e);
    }
  }

  if (!sourceData && fs.existsSync(BACKUP_PATH)) {
    try {
      sourceData = JSON.parse(fs.readFileSync(BACKUP_PATH, "utf-8"));
      console.log(`[SQL Database] Seeding SQLite from ${BACKUP_PATH}`);
    } catch (e) {
      console.warn("Could not parse firestore-backup.json for SQLite seed:", e);
    }
  }

  if (sourceData) {
    sqlRestoreAllData(sourceData);
    console.log("[SQL Database] Seeding completed successfully.");
  }
}

// CRUD Operations in SQL

// Get all data from SQL tables
export function sqlFetchAllData() {
  const db = getSqliteDb();

  const empRows = db.prepare(`
    SELECT id, data_json, is_deleted, status, deleted_at, deleted_by 
    FROM employees 
    ORDER BY created_at DESC;
  `).all() as { id: string; data_json: string; is_deleted: number; status: string; deleted_at: string | null; deleted_by: string | null }[];

  const leaveRows = db.prepare("SELECT data_json FROM leave_requests ORDER BY created_at DESC;").all() as { data_json: string }[];
  const userRows = db.prepare("SELECT data_json FROM app_users;").all() as { data_json: string }[];
  const actRows = db.prepare("SELECT data_json FROM activities ORDER BY created_at DESC;").all() as { data_json: string }[];
  const giftRows = db.prepare("SELECT data_json FROM gifts ORDER BY updated_at DESC;").all() as { data_json: string }[];
  const msgRows = db.prepare("SELECT data_json FROM messages ORDER BY sent_at DESC;").all() as { data_json: string }[];
  const settingRows = db.prepare("SELECT data_json FROM system_settings;").all() as { data_json: string }[];

  const safeParseEmp = (row: { id: string; data_json: string; is_deleted: number; status: string; deleted_at: string | null; deleted_by: string | null }) => {
    try {
      const obj = JSON.parse(row.data_json);
      const cleanId = (row.id || obj.id || "").trim();
      obj.id = cleanId;
      // SQLite column row.is_deleted is the single authoritative source of truth
      const isDel = row.is_deleted === 1;
      obj.isDeleted = isDel;
      if (isDel) {
        obj.status = "deleted";
        obj.deletedAt = row.deleted_at || obj.deletedAt || new Date().toISOString();
        obj.deletedBy = row.deleted_by || obj.deletedBy || "admin";
      } else {
        obj.status = (row.status && row.status !== "deleted") ? row.status : (obj.status && obj.status !== "deleted" ? obj.status : "active");
        delete obj.deletedAt;
        delete obj.deletedBy;
      }
      return obj;
    } catch (e) {
      return null;
    }
  };

  const safeParse = (row: { data_json: string }) => {
    try {
      return JSON.parse(row.data_json);
    } catch (e) {
      return null;
    }
  };

  return {
    employees: empRows.map(safeParseEmp).filter(Boolean),
    leave_requests: leaveRows.map(safeParse).filter(Boolean),
    app_users: userRows.map(safeParse).filter(Boolean),
    activities: actRows.map(safeParse).filter(Boolean),
    gifts: giftRows.map(safeParse).filter(Boolean),
    messages: msgRows.map(safeParse).filter(Boolean),
    system_settings: settingRows.map(safeParse).filter(Boolean),
  };
}

// Employees
export function sqlInsertOrUpdateEmployee(emp: any) {
  const db = getSqliteDb();
  const id = emp.id || ("emp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5));
  // Strictly enforce integer 0 or 1 for SQLite parameter binding (SQLite throws on boolean)
  const isDeletedNum: number = (emp.isDeleted === true || emp.isDeleted === 1 || emp.status === "deleted") ? 1 : 0;
  const isDeletedBool: boolean = isDeletedNum === 1;
  const now = new Date().toISOString();
  const statusStr: string = isDeletedBool ? "deleted" : ((emp.status && emp.status !== "deleted") ? emp.status : "active");

  const fullEmp: any = {
    ...emp,
    id,
    isDeleted: isDeletedBool,
    status: statusStr
  };

  if (isDeletedBool) {
    fullEmp.deletedAt = emp.deletedAt || now;
    fullEmp.deletedBy = emp.deletedBy || "admin";
  } else {
    delete fullEmp.deletedAt;
    delete fullEmp.deletedBy;
  }

  const stmt = db.prepare(`
    INSERT INTO employees (
      id, name, business, role, phone, birth_date, marital_status,
      marriage_anniversary, hire_date, status, is_deleted, deleted_at,
      deleted_by, data_json, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      business = excluded.business,
      role = excluded.role,
      phone = excluded.phone,
      birth_date = excluded.birth_date,
      marital_status = excluded.marital_status,
      marriage_anniversary = excluded.marriage_anniversary,
      hire_date = excluded.hire_date,
      status = excluded.status,
      is_deleted = excluded.is_deleted,
      deleted_at = excluded.deleted_at,
      deleted_by = excluded.deleted_by,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at;
  `);

  stmt.run(
    id,
    fullEmp.name || "",
    fullEmp.business || "",
    fullEmp.role || "",
    fullEmp.phone || "",
    fullEmp.birthDate || "",
    fullEmp.maritalStatus || "",
    fullEmp.marriageAnniversary || "",
    fullEmp.hireDate || "",
    statusStr,
    isDeletedNum, // Integer 0 or 1 only
    fullEmp.deletedAt || null,
    fullEmp.deletedBy || null,
    JSON.stringify(fullEmp),
    fullEmp.createdAt || now,
    now
  );

  return fullEmp;
}

export function sqlUpdateEmployeeFields(id: string, partial: any) {
  const db = getSqliteDb();
  const cleanId = (id || "").trim();
  const existingRow = db.prepare("SELECT data_json FROM employees WHERE id = ? OR id = ?;").get(cleanId, id) as { data_json: string } | undefined;
  let fullEmp: any = {};
  if (existingRow) {
    try {
      fullEmp = JSON.parse(existingRow.data_json);
    } catch (e) {}
  }
  const merged = { ...fullEmp, ...partial, id: cleanId };
  if (partial.isDeleted === false || (partial.status && partial.status !== "deleted")) {
    merged.isDeleted = false;
    merged.status = partial.status || "active";
    delete merged.deletedAt;
    delete merged.deletedBy;
  } else if (partial.isDeleted === true || partial.status === "deleted") {
    merged.isDeleted = true;
    merged.status = "deleted";
    merged.deletedAt = partial.deletedAt || new Date().toISOString();
    merged.deletedBy = partial.deletedBy || "admin";
  }
  return sqlInsertOrUpdateEmployee(merged);
}

export function sqlDeleteEmployeePermanently(id: string) {
  const db = getSqliteDb();
  db.prepare("DELETE FROM employees WHERE id = ?;").run(id);
  return true;
}

// Leave Requests
export function sqlInsertOrUpdateLeave(leave: any) {
  const db = getSqliteDb();
  const id = leave.id;
  const empId = leave.employeeId || "";
  const createdAt = leave.createdAt || new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO leave_requests (id, employee_id, data_json, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      employee_id = excluded.employee_id,
      data_json = excluded.data_json,
      created_at = excluded.created_at;
  `);

  stmt.run(id, empId, JSON.stringify(leave), createdAt);
  return leave;
}

export function sqlUpdateLeaveFields(id: string, partial: any) {
  const db = getSqliteDb();
  const existingRow = db.prepare("SELECT data_json FROM leave_requests WHERE id = ?;").get(id) as { data_json: string } | undefined;
  let fullLeave: any = {};
  if (existingRow) {
    try {
      fullLeave = JSON.parse(existingRow.data_json);
    } catch (e) {}
  }
  const merged = { ...fullLeave, ...partial, id };
  return sqlInsertOrUpdateLeave(merged);
}

export function sqlDeleteLeave(id: string) {
  const db = getSqliteDb();
  db.prepare("DELETE FROM leave_requests WHERE id = ?;").run(id);
  return true;
}

// App Users
export function sqlInsertOrUpdateAppUser(user: any) {
  const db = getSqliteDb();
  const id = user.id || user.username;
  const username = (user.username || user.id || "").toLowerCase().trim();
  const createdAt = user.createdAt || new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO app_users (id, username, data_json, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      data_json = excluded.data_json;
  `);

  stmt.run(id, username, JSON.stringify(user), createdAt);
  return user;
}

export function sqlDeleteAppUser(id: string) {
  const db = getSqliteDb();
  db.prepare("DELETE FROM app_users WHERE id = ? OR username = ?;").run(id, id);
  return true;
}

// Activities
export function sqlInsertOrUpdateActivity(act: any) {
  const db = getSqliteDb();
  const id = act.id;
  const business = act.business || "all";
  const createdAt = act.createdAt || new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO activities (id, business, data_json, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      business = excluded.business,
      data_json = excluded.data_json;
  `);

  stmt.run(id, business, JSON.stringify(act), createdAt);
  return act;
}

export function sqlDeleteActivity(id: string) {
  const db = getSqliteDb();
  db.prepare("DELETE FROM activities WHERE id = ?;").run(id);
  return true;
}

// Gifts
export function sqlInsertOrUpdateGift(gift: any) {
  const db = getSqliteDb();
  const id = gift.id;
  const empId = gift.employeeId || "";
  const updatedAt = gift.updatedAt || new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO gifts (id, employee_id, data_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      employee_id = excluded.employee_id,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at;
  `);

  stmt.run(id, empId, JSON.stringify(gift), updatedAt);
  return gift;
}

// Messages
export function sqlInsertOrUpdateMessage(msg: any) {
  const db = getSqliteDb();
  const id = msg.id;
  const empId = msg.employeeId || "";
  const sentAt = msg.sentAt || new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO messages (id, employee_id, data_json, sent_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      employee_id = excluded.employee_id,
      data_json = excluded.data_json,
      sent_at = excluded.sent_at;
  `);

  stmt.run(id, empId, JSON.stringify(msg), sentAt);
  return msg;
}

// System Settings
export function sqlInsertOrUpdateSettings(settings: any) {
  const db = getSqliteDb();
  const id = "branding";
  const updatedAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO system_settings (id, data_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data_json = excluded.data_json,
      updated_at = excluded.updated_at;
  `);

  stmt.run(id, JSON.stringify(settings), updatedAt);
  return settings;
}

// Restore entire dataset into SQL database (Atomic transaction)
export function sqlRestoreAllData(fullData: any) {
  const db = getSqliteDb();

  db.exec("BEGIN TRANSACTION;");
  try {
    if (Array.isArray(fullData.employees)) {
      db.exec("DELETE FROM employees;");
      for (const emp of fullData.employees) {
        sqlInsertOrUpdateEmployee(emp);
      }
    }

    if (Array.isArray(fullData.leave_requests || fullData.leaveRequests)) {
      db.exec("DELETE FROM leave_requests;");
      const leaves = fullData.leave_requests || fullData.leaveRequests;
      for (const l of leaves) {
        sqlInsertOrUpdateLeave(l);
      }
    }

    if (Array.isArray(fullData.app_users || fullData.appUsers)) {
      db.exec("DELETE FROM app_users;");
      const users = fullData.app_users || fullData.appUsers;
      for (const u of users) {
        sqlInsertOrUpdateAppUser(u);
      }
    }

    if (Array.isArray(fullData.activities)) {
      db.exec("DELETE FROM activities;");
      for (const a of fullData.activities) {
        sqlInsertOrUpdateActivity(a);
      }
    }

    if (Array.isArray(fullData.gifts)) {
      db.exec("DELETE FROM gifts;");
      for (const g of fullData.gifts) {
        sqlInsertOrUpdateGift(g);
      }
    }

    if (Array.isArray(fullData.messages)) {
      db.exec("DELETE FROM messages;");
      for (const m of fullData.messages) {
        sqlInsertOrUpdateMessage(m);
      }
    }

    if (Array.isArray(fullData.system_settings)) {
      db.exec("DELETE FROM system_settings;");
      for (const s of fullData.system_settings) {
        sqlInsertOrUpdateSettings(s);
      }
    }

    db.exec("COMMIT;");
    console.log("[SQL Database] Full restore transaction committed successfully.");
    return sqlFetchAllData();
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("[SQL Database] Transaction failed, rolled back:", err);
    throw err;
  }
}

// Stats diagnostic
export function getSqlDiagnostics() {
  const db = getSqliteDb();
  return {
    engine: "SQLite 3 (node:sqlite native)",
    databaseFile: SQLITE_FILE,
    tables: {
      employees: (db.prepare("SELECT COUNT(*) as c FROM employees;").get() as any)?.c || 0,
      activeEmployees: (db.prepare("SELECT COUNT(*) as c FROM employees WHERE is_deleted = 0;").get() as any)?.c || 0,
      trashEmployees: (db.prepare("SELECT COUNT(*) as c FROM employees WHERE is_deleted = 1;").get() as any)?.c || 0,
      leaveRequests: (db.prepare("SELECT COUNT(*) as c FROM leave_requests;").get() as any)?.c || 0,
      appUsers: (db.prepare("SELECT COUNT(*) as c FROM app_users;").get() as any)?.c || 0,
      activities: (db.prepare("SELECT COUNT(*) as c FROM activities;").get() as any)?.c || 0,
      gifts: (db.prepare("SELECT COUNT(*) as c FROM gifts;").get() as any)?.c || 0,
      messages: (db.prepare("SELECT COUNT(*) as c FROM messages;").get() as any)?.c || 0,
      systemSettings: (db.prepare("SELECT COUNT(*) as c FROM system_settings;").get() as any)?.c || 0,
    }
  };
}

// Table inspection for developers / admin
export function sqlInspectTable(tableName: string, limit = 100) {
  const db = getSqliteDb();
  const allowed = ["employees", "leave_requests", "app_users", "activities", "gifts", "messages", "system_settings"];
  if (!allowed.includes(tableName)) {
    throw new Error(`Table ${tableName} is not permitted or does not exist`);
  }
  const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT ?;`).all(limit);
  return rows;
}
