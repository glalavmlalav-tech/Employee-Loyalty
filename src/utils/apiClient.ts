import { Employee, LeaveRequest, AppUser, LoyaltyActivity, GiftLog, SentMessageLog } from "../types";

export interface BootstrapResponse {
  employees: Employee[];
  leave_requests: LeaveRequest[];
  app_users: AppUser[];
  activities: LoyaltyActivity[];
  gifts: GiftLog[];
  messages: SentMessageLog[];
  system_settings: any[];
  version: number;
  timestamp: string;
}

export async function fetchBootstrapData(): Promise<BootstrapResponse> {
  const res = await fetch(`/api/data?t=${Date.now()}`, {
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch initial data: ${res.statusText}`);
  }
  return res.json();
}

export async function checkDataVersion(): Promise<number> {
  const res = await fetch(`/api/data/version?t=${Date.now()}`, {
    headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.version || 0;
}

export async function apiSaveEmployee(emp: Employee): Promise<Employee> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emp),
  });
  if (!res.ok) throw new Error("Failed to save employee");
  return res.json();
}

export async function apiUpdateEmployee(id: string, partial: Partial<Employee>): Promise<Employee> {
  const cleanId = (id || "").trim();
  const payload = { ...partial, id: cleanId };
  const res = await fetch(`/api/employees/${encodeURIComponent(cleanId)}?id=${encodeURIComponent(cleanId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update employee");
  return res.json();
}

export async function apiDeleteEmployee(id: string): Promise<boolean> {
  const cleanId = (id || "").trim();
  const res = await fetch(`/api/employees/${encodeURIComponent(cleanId)}?id=${encodeURIComponent(cleanId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: cleanId })
  });
  if (!res.ok) throw new Error("Failed to delete employee");
  return true;
}

export async function apiSaveLeave(leave: LeaveRequest): Promise<LeaveRequest> {
  const res = await fetch("/api/leave-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leave),
  });
  if (!res.ok) throw new Error("Failed to save leave request");
  return res.json();
}

export async function apiUpdateLeave(id: string, partial: Partial<LeaveRequest>): Promise<LeaveRequest> {
  const res = await fetch(`/api/leave-requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
  });
  if (!res.ok) throw new Error("Failed to update leave request");
  return res.json();
}

export async function apiDeleteLeave(id: string): Promise<boolean> {
  const res = await fetch(`/api/leave-requests/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete leave request");
  return true;
}

export async function apiSaveAppUser(user: AppUser): Promise<AppUser> {
  const res = await fetch("/api/app-users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to save app user");
  return res.json();
}

export async function apiDeleteAppUser(id: string): Promise<boolean> {
  const res = await fetch(`/api/app-users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete app user");
  return true;
}

export async function apiSaveActivity(act: LoyaltyActivity): Promise<LoyaltyActivity> {
  const res = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(act),
  });
  if (!res.ok) throw new Error("Failed to save activity");
  return res.json();
}

export async function apiDeleteActivity(id: string): Promise<boolean> {
  const res = await fetch(`/api/activities/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete activity");
  return true;
}

export async function apiSaveGift(gift: GiftLog): Promise<GiftLog> {
  const res = await fetch("/api/gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gift),
  });
  if (!res.ok) throw new Error("Failed to save gift");
  return res.json();
}

export async function apiSaveMessage(msg: SentMessageLog): Promise<SentMessageLog> {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error("Failed to save message log");
  return res.json();
}

export async function apiRestoreBackup(fullData: any): Promise<{ success: boolean; count: number }> {
  const res = await fetch("/api/backup/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fullData),
  });
  if (!res.ok) throw new Error("Failed to restore backup");
  return res.json();
}

export async function apiGetSqlStatus(): Promise<{ success: boolean; engine: string; tables: Record<string, number> }> {
  const res = await fetch("/api/sql/status");
  if (!res.ok) throw new Error("Failed to fetch SQL status");
  return res.json();
}

export async function apiSaveSettings(settings: any): Promise<any> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return res.json();
}
