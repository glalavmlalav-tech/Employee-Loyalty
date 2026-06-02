import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  Building,
  UserCheck,
  X,
  Edit
} from "lucide-react";
import { AppUser, BusinessId, BUSINESSES } from "../types";

interface SettingsPanelProps {
  appUsers: AppUser[];
  onAddUser: (user: Omit<AppUser, "id" | "createdAt">) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  language: "ku" | "en";
  currentUserEmail?: string;
}

export default function SettingsPanel({
  appUsers,
  onAddUser,
  onDeleteUser,
  language,
  currentUserEmail
}: SettingsPanelProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "admin" as "super_admin" | "admin",
    business: "massimo" as BusinessId | "all"
  });

  const t = {
    title: language === "ku" ? "ڕێکخستنی ئەکاونتەکانی سیستەم" : "System User & Credentials Settings",
    desc: language === "ku" 
      ? "تایبەت بە بەڕێوەبردنی ئەکاونتەکان بە بێ پاسوۆرد، بە بەکارهێنانی ئیمەیڵی گووگڵ (Gmail) بەو شێوازەی لە بەشی شەیر زیادی دەکەیت" 
      : "Manage staff logins passwordlessly using verified Google accounts matching your shared users list.",
    addUserBtn: language === "ku" ? "تۆمارکردنی ئیمەیڵی نوێ" : "Register Google Account",
    editUserBtn: language === "ku" ? "دەستکاریکردنی دەسەڵاتەکان" : "Edit Account Roles",
    emailLabel: language === "ku" ? "ئیمەیڵی گووگڵ (Gmail)" : "Google Email (Gmail)",
    fullName: language === "ku" ? "ناوی تەواوی بەکارهێنەر" : "Full Name / Owner",
    role: language === "ku" ? "دەسەڵات / ڕۆڵ" : "System Role",
    business: language === "ku" ? "کۆمپانیا / شۆورووم" : "Assigned Branch Showroom",
    save: language === "ku" ? "پاشەکەوتکردن" : "Create Account",
    editSave: language === "ku" ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "Save Changes",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel",
    confirmDelete: language === "ku" ? "ئایا دڵنیای لە سڕینەوەی ئەم هەژمارە؟" : "Are you sure you want to delete this user? They will lose access instantly.",
    emptyUsers: language === "ku" ? "هیچ یوزەرێکی لاوەکی دروست نەکراوە." : "No secondary accounts registered yet.",
    roleSuperAdmin: language === "ku" ? "ئەدمینی گشتی (هەموو بەشەکان)" : "Super Admin (Full Access)",
    roleAdmin: language === "ku" ? "ئەدمینی شۆوروم (تەنها کارمەندانی خۆی)" : "Showroom Admin (Restricted)",
    assignedAll: language === "ku" ? "سەرجەم لایەنەکان" : "All Businesses",
    creationDate: language === "ku" ? "ڕێکەوتی دروستکردن" : "Date Created"
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      name: "",
      role: "admin",
      business: "massimo"
    });
    setShowAddUserModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email || user.username || "",
      name: user.name,
      role: user.role,
      business: user.business
    });
    setShowAddUserModal(true);
  };

  const handleCloseModal = () => {
    setShowAddUserModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) {
      alert(language === "ku" ? "تکایە هەموو کێڵگەکان پڕبکەرەوە" : "Please fill in all inputs.");
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase().replace(/\s+/g, "");

    if (!editingUser) {
      // Check if user already exists
      const exists = appUsers.some(
        u => (u.email || "").toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanEmail
      );
      if (exists) {
        alert(language === "ku" ? "ئەم ئیمەیڵە پێشتر تۆمار کراوە!" : "This email address is already taken!");
        return;
      }
    }

    try {
      await onAddUser({
        username: cleanEmail,
        email: cleanEmail,
        password: "google_passwordless", // backward compatibility synonym
        name: formData.name.trim(),
        role: formData.role,
        business: formData.business
      });
      setShowAddUserModal(false);
      setEditingUser(null);
    } catch (e) {
      alert("Error saving user info");
    }
  };

  const isOwner = (currentUserEmail || "").toLowerCase().trim() === "glalavmlalav@gmail.com";

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const docIdToDel = userToDelete.id || userToDelete.username;
    
    if (!isOwner) {
      alert(language === "ku" ? "تەنیا خاوەنی سەرەکی (Owner) دەسەڵاتی سڕینەوەی بەکارهێنەرانی هەیە!" : "Only the primary Owner has permission to delete users!");
      setUserToDelete(null);
      return;
    }
    const cleanDocId = (docIdToDel || "").toLowerCase().trim();
    if (cleanDocId === "glalavmlalav@gmail.com") {
      alert(language === "ku" ? "ناتوانی ئەکاونتی خاوەنی سەرەکی بسڕیتەوە!" : "You cannot delete the primary owner account!");
      setUserToDelete(null);
      return;
    }
    
    try {
      await onDeleteUser(docIdToDel);
    } catch (e) {
      console.error(e);
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-8" id="settings_panel_root">
      {/* Header Info */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-400 via-indigo-400 to-rose-400" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-700 font-black px-3 py-1.5 rounded-full border border-indigo-500/10 uppercase tracking-widest font-sans inline-flex items-center gap-1.5 mb-3">
              <Shield className="w-3.5 h-3.5" /> Passwordless Security
            </span>
            <h2 className="text-2xl md:text-3.5xl font-display font-black text-slate-800 tracking-tight leading-tight">
              {t.title}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1.5 max-w-2xl font-sans leading-relaxed">
              {t.desc}
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-all cursor-pointer self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addUserBtn}</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-display font-black text-slate-800 mb-6 flex items-center gap-3">
          <span className="p-2 bg-indigo-500/10 text-indigo-600 border border-indigo-500/10 rounded-2xl">
            <Users className="w-5 h-5" />
          </span>
          {language === "ku" ? "ڕێگەپێدراوەکانی چوونەژوورەوە" : "Allowed System Accounts"}
        </h3>

        {appUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-[28px] border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-500 text-xs">{t.emptyUsers}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {appUsers.map((user) => {
              const bInfo = user.business !== "all" ? BUSINESSES[user.business] : null;
              const bName = bInfo 
                ? (language === "ku" ? bInfo.nameKu : bInfo.nameEn)
                : (user.business !== "all" ? user.business : t.assignedAll);

              const displayEmail = user.email || user.username;

              return (
                <div 
                  key={user.id || user.username} 
                  className="bg-white/85 p-5 rounded-3xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition duration-200 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border uppercase ${
                        user.role === "super_admin"
                          ? "bg-rose-500/10 text-rose-600 border-rose-200"
                          : "bg-amber-500/10 text-amber-600 border-amber-200"
                      }`}>
                        {user.role === "super_admin" ? "Super Admin" : "Showroom Admin"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isOwner && (user.username || "").toLowerCase() !== "glalavmlalav@gmail.com" && (user.id || "").toLowerCase() !== "glalavmlalav@gmail.com" && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{user.name}</h4>
                      <p className="font-mono text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 inline" /> {displayEmail}
                      </p>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-500 border-t border-slate-50 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> {t.business}</span>
                        <span className="font-bold text-slate-800">{bName}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400">
                        <span>{t.creationDate}</span>
                        <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString(language === "ku" ? "ku-IQ" : "en-US") : "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-[36px] max-w-md w-full border border-white shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between bg-indigo-950 text-white p-6">
              <h3 className="font-display font-black text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                {editingUser 
                  ? (language === "ku" ? "دەستکاریکردنی ئەکاونت" : "Edit Account Roles")
                  : t.addUserBtn}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.fullName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karwan Ali"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.emailLabel}</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="e.g. karwan@gmail.com"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans font-mono disabled:opacity-55"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.role}</label>
                <select
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans"
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value as "super_admin" | "admin";
                    setFormData({ 
                      ...formData, 
                      role: r,
                      business: r === "super_admin" ? "all" : "massimo"
                    });
                  }}
                >
                  <option value="admin">{t.roleAdmin}</option>
                  <option value="super_admin">{t.roleSuperAdmin}</option>
                </select>
              </div>

              {formData.role === "admin" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.business}</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-xs font-sans"
                    value={formData.business}
                    onChange={(e) => setFormData({ ...formData, business: e.target.value as BusinessId | "all" })}
                  >
                    {(Object.keys(BUSINESSES) as BusinessId[]).filter(id => id !== "linia").map((id) => (
                      <option key={id} value={id}>
                        {language === "ku" ? BUSINESSES[id].nameKu : BUSINESSES[id].nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md"
                >
                  {editingUser ? t.editSave : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-[36px] max-w-md w-full border border-red-100 shadow-2xl overflow-hidden animate-fade-in text-center p-6 md:p-8 space-y-5">
            <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500">
              <Trash2 className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-slate-800">
                {language === "ku" ? "دڵنیابوونەوە لە سڕینەوە" : "Confirm Account Deletion"}
              </h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-sans">
                {language === "ku" 
                  ? `ئایا دڵنیای لە سڕینەوەی ئەکاونتی "${userToDelete.name}" (${userToDelete.email || userToDelete.username})؟ ئەم کردارە ناگەڕێتەوە و دەستڕاگەیشتنی بە تەواوی دەبڕێت.`
                  : `Are you sure you want to permanently delete user "${userToDelete.name}" (${userToDelete.email || userToDelete.username})? Their active permission sessions will be closed instantly.`}
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition shadow-md active:scale-95 cursor-pointer"
              >
                {language === "ku" ? "بەڵێ، بسڕەوە" : "Yes, Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
