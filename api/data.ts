import fs from "fs";
import path from "path";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const storePath = path.join(process.cwd(), "data", "store.json");
    const backupPath = path.join(process.cwd(), "firestore-backup.json");

    let dataRaw = "";
    if (fs.existsSync(storePath)) {
      dataRaw = fs.readFileSync(storePath, "utf-8");
    } else if (fs.existsSync(backupPath)) {
      dataRaw = fs.readFileSync(backupPath, "utf-8");
    }

    if (dataRaw) {
      const parsed = JSON.parse(dataRaw);
      return res.status(200).json({
        ...parsed,
        version: Date.now(),
        timestamp: new Date().toISOString()
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
