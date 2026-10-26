import fs from "fs";
import path from "path";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const storePath = path.join(process.cwd(), "data", "store.json");
  let store: any = { employees: [] };

  try {
    if (fs.existsSync(storePath)) {
      store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    }
    if (!Array.isArray(store.employees)) store.employees = [];

    const urlParts = (req.url || "").split("?")[0].split("/").filter(Boolean);
    const idFromUrl = urlParts[urlParts.length - 1] !== "employees" ? urlParts[urlParts.length - 1] : null;
    const targetId = req.query?.id || idFromUrl;

    if (req.method === "GET") {
      if (targetId) {
        const found = store.employees.find((e: any) => e.id === targetId);
        return res.status(found ? 200 : 404).json(found || { error: "Not found" });
      }
      return res.status(200).json(store.employees);
    }

    if (req.method === "POST") {
      const newEmp = req.body;
      const idx = store.employees.findIndex((e: any) => e.id === newEmp.id);
      if (idx >= 0) {
        store.employees[idx] = { ...store.employees[idx], ...newEmp };
      } else {
        store.employees.push(newEmp);
      }
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
      return res.status(200).json(newEmp);
    }

    if (req.method === "PUT") {
      const partial = req.body;
      const id = targetId || partial.id;
      const idx = store.employees.findIndex((e: any) => e.id === id);
      if (idx >= 0) {
        store.employees[idx] = { ...store.employees[idx], ...partial };
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
        return res.status(200).json(store.employees[idx]);
      }
      return res.status(404).json({ error: "Employee not found" });
    }

    if (req.method === "DELETE") {
      if (!targetId) return res.status(400).json({ error: "Missing ID" });
      store.employees = store.employees.filter((e: any) => e.id !== targetId);
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Serverless error" });
  }
}
