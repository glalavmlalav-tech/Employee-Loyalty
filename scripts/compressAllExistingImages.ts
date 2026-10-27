import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { compressServerImageBase64 } from "../api/serverImageCompression.ts";

async function run() {
  console.log("=== STARTING FULL DATABASE IMAGE COMPRESSION ===");
  const dbPath = path.join(process.cwd(), "data", "app_database.sqlite");
  const storePath = path.join(process.cwd(), "data", "store.json");
  const backupPath = path.join(process.cwd(), "firestore-backup.json");

  if (!fs.existsSync(dbPath)) {
    console.error("Database file not found at", dbPath);
    process.exit(1);
  }

  const db = new DatabaseSync(dbPath);
  const rows: any[] = db.prepare("SELECT id, name, data_json, is_deleted FROM employees").all();
  console.log(`Loaded ${rows.length} employee records from SQLite.`);

  let totalImagesCompressed = 0;
  let totalBytesSaved = 0;
  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;

  const updateStmt = db.prepare("UPDATE employees SET data_json = ? WHERE id = ?");

  const updatedEmployees: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let data: any = {};
    try {
      data = JSON.parse(row.data_json);
    } catch (e) {
      console.warn("Could not parse data_json for row", row.id);
      continue;
    }

    let modified = false;

    // 1. Photo avatar (max 260x260, webp, quality 60)
    if (data.photoUrl && typeof data.photoUrl === "string" && data.photoUrl.startsWith("data:image")) {
      const beforeLen = data.photoUrl.length;
      totalBeforeBytes += beforeLen;
      const comp = await compressServerImageBase64(data.photoUrl, 260, 260, 60, "webp");
      const afterLen = comp.length;
      totalAfterBytes += afterLen;
      if (afterLen < beforeLen) {
        totalBytesSaved += (beforeLen - afterLen);
        totalImagesCompressed++;
        data.photoUrl = comp;
        modified = true;
      }
    }

    // 2. Passport / ID card (max 800x800, webp, quality 58)
    if (data.passportOrNationalCardUrl && typeof data.passportOrNationalCardUrl === "string" && data.passportOrNationalCardUrl.startsWith("data:image")) {
      const beforeLen = data.passportOrNationalCardUrl.length;
      totalBeforeBytes += beforeLen;
      const comp = await compressServerImageBase64(data.passportOrNationalCardUrl, 800, 800, 58, "webp");
      const afterLen = comp.length;
      totalAfterBytes += afterLen;
      if (afterLen < beforeLen) {
        totalBytesSaved += (beforeLen - afterLen);
        totalImagesCompressed++;
        data.passportOrNationalCardUrl = comp;
        modified = true;
      }
    }

    // 3. Iqama / Residency (max 800x800, webp, quality 58)
    if (data.iqamaUrl && typeof data.iqamaUrl === "string" && data.iqamaUrl.startsWith("data:image")) {
      const beforeLen = data.iqamaUrl.length;
      totalBeforeBytes += beforeLen;
      const comp = await compressServerImageBase64(data.iqamaUrl, 800, 800, 58, "webp");
      const afterLen = comp.length;
      totalAfterBytes += afterLen;
      if (afterLen < beforeLen) {
        totalBytesSaved += (beforeLen - afterLen);
        totalImagesCompressed++;
        data.iqamaUrl = comp;
        modified = true;
      }
    }

    if (modified) {
      updateStmt.run(JSON.stringify(data), row.id);
    }
    updatedEmployees.push(data);
  }

  // Optimize and shrink SQLite database file
  console.log("Running SQLite VACUUM to reclaim free disk pages...");
  db.exec("VACUUM;");

  // Update store.json
  if (fs.existsSync(storePath)) {
    try {
      const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      store.employees = updatedEmployees;
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
      console.log("Updated data/store.json with compressed images.");
    } catch (e) {
      console.warn("Could not update store.json:", e);
    }
  }

  console.log("=== COMPRESSION FINISHED ===");
  console.log(`Compressed Images: ${totalImagesCompressed}`);
  console.log(`Original image data size: ${(totalBeforeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Compressed image data size: ${(totalAfterBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total saved: ${(totalBytesSaved / 1024 / 1024).toFixed(2)} MB (${((totalBytesSaved / totalBeforeBytes) * 100).toFixed(1)}% reduction!)`);
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
