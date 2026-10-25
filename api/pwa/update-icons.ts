import fs from "fs";
import path from "path";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { logoDataUrl } = req.body;
    if (!logoDataUrl || typeof logoDataUrl !== "string") {
      return res.status(400).json({ error: "Invalid logo data" });
    }

    // In serverless environments, Firestore stores the dataUrl permanently
    return res.status(200).json({ success: true, message: "PWA icon payload received" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
