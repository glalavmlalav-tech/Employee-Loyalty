import fs from "fs";
import path from "path";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const storePath = path.join(process.cwd(), "data", "store.json");
    if (fs.existsSync(storePath)) {
      const stat = fs.statSync(storePath);
      return res.status(200).json({ version: Math.floor(stat.mtimeMs) });
    }
  } catch (e) {}

  return res.status(200).json({ version: 1 });
}
