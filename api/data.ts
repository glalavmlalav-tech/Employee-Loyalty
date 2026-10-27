import fs from "fs";
import path from "path";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const storePath = path.join(process.cwd(), "data", "store.json");
    const backupPath = path.join(process.cwd(), "firestore-backup.json");

    let dataRaw = "";
    let fileMtime = 1;
    if (fs.existsSync(storePath)) {
      dataRaw = fs.readFileSync(storePath, "utf-8");
      fileMtime = Math.floor(fs.statSync(storePath).mtimeMs);
    } else if (fs.existsSync(backupPath)) {
      dataRaw = fs.readFileSync(backupPath, "utf-8");
      fileMtime = Math.floor(fs.statSync(backupPath).mtimeMs);
    }

    if (dataRaw) {
      const parsed = JSON.parse(dataRaw);
      return res.status(200).json({
        ...parsed,
        version: fileMtime,
        timestamp: new Date(fileMtime).toISOString()
      });
    }

    return res.status(200).json({
      employees: [],
      leave_requests: [],
      app_users: [],
      activities: [],
      gifts: [],
      messages: [],
      system_settings: [],
      version: 1,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to load data" });
  }
}
