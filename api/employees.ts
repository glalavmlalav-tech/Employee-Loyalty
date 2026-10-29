import { 
  getEmployees, 
  saveEmployee, 
  updateEmployee, 
  deleteEmployee 
} from "./dataStore";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const urlParts = (req.url || "").split("?")[0].split("/").filter(Boolean);
    const idFromUrl = urlParts[urlParts.length - 1] !== "employees" ? urlParts[urlParts.length - 1] : null;
    const targetId = req.query?.id || req.body?.id || idFromUrl;

    if (req.method === "GET") {
      const all = getEmployees();
      if (targetId) {
        const cleanTarget = String(targetId).trim();
        const found = all.find((e: any) => String(e.id).trim() === cleanTarget);
        return res.status(found ? 200 : 404).json(found || { error: "Not found" });
      }
      return res.status(200).json(all);
    }

    if (req.method === "POST") {
      const saved = await saveEmployee(req.body);
      return res.status(200).json(saved);
    }

    if (req.method === "PUT") {
      const idToUpdate = targetId || req.body?.id;
      if (!idToUpdate) return res.status(400).json({ error: "Missing ID for update" });
      const updated = await updateEmployee(String(idToUpdate).trim(), req.body);
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      const idToDelete = targetId || req.body?.id;
      if (!idToDelete) return res.status(400).json({ error: "Missing ID for delete" });
      deleteEmployee(String(idToDelete).trim());
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Serverless error" });
  }
}
