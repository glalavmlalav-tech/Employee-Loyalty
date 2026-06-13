import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Building,
  UserCheck,
  X,
  Edit,
  Eye,
  EyeOff,
  User,
  Key,
  Zap,
  Check,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { AppUser, BusinessId, BUSINESSES, Employee } from "../types";
import { compressImageBase64, needsCompression } from "../utils/imageCompression";

interface SettingsPanelProps {
  appUsers: AppUser[];
  onAddUser: (user: Omit<AppUser, "id" | "createdAt">) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  language: "ku" | "en";
  currentUserEmail?: string;
  employees?: Employee[];
  onUpdateEmployee?: (id: string, empData: Partial<Employee>) => Promise<void>;
}

export default function SettingsPanel({
  appUsers,
  onAddUser,
  onDeleteUser,
  language,
  currentUserEmail,
  employees = [],
  onUpdateEmployee
}: SettingsPanelProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  
  // Image optimizer state
  const [optimizerStatus, setOptimizerStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentEmpName, setCurrentEmpName] = useState("");
  const [optimizedBytesSaved, setOptimizedBytesSaved] = useState(0);

  // Find employees needing compression
  const uncompressedEmployees = employees.filter(needsCompression);
  const totalEmployeesWithImages = employees.filter(emp => emp.photoUrl || emp.passportOrNationalCardUrl || emp.iqamaUrl).length;

  const handleOptimizeImages = async () => {
    if (!employees || !onUpdateEmployee) return;
    if (uncompressedEmployees.length === 0) {
      alert(language === "ku" ? "هیچ نوێکارییەک پێویست نییە، سەرجەم وێنەکان چالاک کراون." : "All images are already optimized!");
      return;
    }

    setOptimizerStatus("running");
    setProcessedCount(0);
    setTotalToProcess(uncompressedEmployees.length);
    let bytesSaved = 0;

    for (let i = 0; i < uncompressedEmployees.length; i++) {
      const emp = uncompressedEmployees[i];
      setCurrentEmpName(emp.name);
      
      const beforePhotoLen = emp.photoUrl?.length || 0;
      const beforePassportLen = emp.passportOrNationalCardUrl?.length || 0;
      const beforeIqamaLen = emp.iqamaUrl?.length || 0;
      const originalTotalRaw = beforePhotoLen + beforePassportLen + beforeIqamaLen;

      // Compress
      const updatedFields: Partial<Employee> = {};
      try {
        if (emp.photoUrl && emp.photoUrl.startsWith("data:image")) {
          updatedFields.photoUrl = await compressImageBase64(emp.photoUrl, 300, 300, 0.55);
        }
        if (emp.passportOrNationalCardUrl && emp.passportOrNationalCardUrl.startsWith("data:image")) {
          updatedFields.passportOrNationalCardUrl = await compressImageBase64(emp.passportOrNationalCardUrl, 800, 800, 0.6);
        }
        if (emp.iqamaUrl && emp.iqamaUrl.startsWith("data:image")) {
          updatedFields.iqamaUrl = await compressImageBase64(emp.iqamaUrl, 800, 800, 0.6);
        }

        const afterPhotoLen = updatedFields.photoUrl?.length || beforePhotoLen;
        const afterPassportLen = updatedFields.passportOrNationalCardUrl?.length || beforePassportLen;
        const afterIqamaLen = updatedFields.iqamaUrl?.length || beforeIqamaLen;
        const newTotalRaw = afterPhotoLen + afterPassportLen + afterIqamaLen;

        bytesSaved += Math.max(0, originalTotalRaw - newTotalRaw);

        await onUpdateEmployee(emp.id, updatedFields);
        setProcessedCount(i + 1);
        setOptimizedBytesSaved(bytesSaved);
      } catch (err) {
        console.warn("Optimization failed for employee:", emp.name, err);
      }
      
      // Artificial delay to prevent UI locks and respect browser rendering
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setOptimizerStatus("completed");
  };

  // Toggles for masking passwords
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "admin" as "super_admin" | "admin" | "observer",
    business: "massimo" as BusinessId | "all"
  });

  const t = {
    title: language === "ku" ? "بەڕێوەبردنی ئەکاونتەکانی سیستەم" : "System Admins & Credentials Manager",
    desc: language === "ku" 
      ? "تایبەت بە زیادکردن و ڕێکخستنی ئەکاونتەکانی ئەدمین. دەتوانیت بۆ هەر ئەدمینێک ناو (Username) و تێپەڕەوشە (Password) دابنێیت بە بێ ئەوەی پێویست بە ئیمەیڵ بکات و لەسەر هەموو ئامێرەکان هاوکات دەبێت." 
      : "Manage staff logins. Set up custom Username and Password credentials for showroom and factory admins with direct live multi-device synchronization.",
    addUserBtn: language === "ku" ? "درۆستکردنی ئەدمینی نوێ" : "Create New Admin",
    editUserBtn: language === "ku" ? "دەستکاریکردنی دەسەڵاتەکان" : "Edit Admin Roles",
    usernameLabel: language === "ku" ? "ناوی بەکارهێنەر (Username)" : "Username",
    passwordLabel: language === "ku" ? "وشەی تێپەڕ / پاسۆرد (Password)" : "Password",
    fullName: language === "ku" ? "ناوی تەواو" : "Full Name / Operator Name",
    role: language === "ku" ? "دەسەڵات / ڕۆڵ" : "System Access Role",
    business: language === "ku" ? "کۆمپانیا / شۆورووم" : "Assigned Branch Showroom",
    save: language === "ku" ? "دروستکردنی ئەکاونت" : "Create Account",
    editSave: language === "ku" ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "Save Changes",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel",
    confirmDelete: language === "ku" ? "ئایا دڵنیای لە سڕینەوەی ئەم هەژمارە؟" : "Are you sure you want to delete this user? They will lose access instantly.",
    emptyUsers: language === "ku" ? "هیچ یوزەرێکی لاوەکی دروست نەکراوە." : "No secondary accounts registered yet.",
    roleSuperAdmin: language === "ku" ? "سوپەر ئەدمین (هەموو بەشەکان)" : "Super Admin (Full Access)",
    roleAdmin: language === "ku" ? "ئەدمینی لقی دیاریکراو (تەنها بەشی خۆی)" : "Showroom/Factory Admin (Restricted)",
    roleObserver: language === "ku" ? "خاوەن بزنس/چاودێر (هەموو بەشەکان - تەنیا بینین)" : "Business Owner / Observer (All - View Only)",
    assignedAll: language === "ku" ? "سەرجەم لایەنەکان" : "All Businesses",
    creationDate: language === "ku" ? "ڕێکەوتی دروستکردن" : "Date Created"
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "admin",
      business: "massimo"
    });
    setShowAddUserModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password || "",
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

  const togglePasswordVisibility = (uid: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
      alert(language === "ku" ? "تکایە هەموو کێڵگەکان بە دروستی پڕبکەرەوە" : "Please fill in all required fields.");
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, "");

    if (!editingUser) {
      // Check if user already exists
      const exists = appUsers.some(
        u => (u.username || "").toLowerCase() === cleanUsername
      );
      if (exists) {
        alert(language === "ku" ? "ئەم ناوی بەکارهێنەرە پێشتر تۆمار کراوە! ناوی تر تاقی بکەرەوە." : "This username is already taken! Try another one.");
        return;
      }
    }

    try {
      await onAddUser({
        username: cleanUsername,
        password: formData.password.trim(),
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

  const isSuperAdmin = appUsers.some(
    u => ((u.username || "").toLowerCase() === (currentUserEmail || "").toLowerCase().trim() ||
          (u.email || "").toLowerCase() === (currentUserEmail || "").toLowerCase().trim()) &&
         u.role === "super_admin"
  ) || (currentUserEmail || "").toLowerCase().trim() === "glalavmlalav@gmail.com" ||
       (currentUserEmail || "").toLowerCase().trim() === "glalavmlalav" ||
       (currentUserEmail || "").toLowerCase().trim() === "admin";

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const docIdToDel = userToDelete.id || userToDelete.username;
    
    if (!isSuperAdmin) {
      alert(language === "ku" ? "تەنیا سوپەر ئەدمین دەسەڵاتی سڕینەوەی بەکارهێنەرانی هەیە!" : "Only super admins have permission to delete users!");
      setUserToDelete(null);
      return;
    }
    const cleanDocId = (docIdToDel || "").toLowerCase().trim();
    const cleanUsername = (userToDelete.username || "").toLowerCase().trim();
    const cleanEmail = (userToDelete.email || "").toLowerCase().trim();
    const cleanCurrent = (currentUserEmail || "").toLowerCase().trim();

    if (cleanDocId === cleanCurrent || cleanUsername === cleanCurrent || cleanEmail === cleanCurrent) {
      alert(language === "ku" ? "ناتوانی ئەکاونتە چالاکەکەی خۆت بسڕیتەوە!" : "You cannot delete your own active account!");
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
    <div className="space-y-8" id="settings_panel_root" dir={language === "ku" ? "rtl" : "ltr"}>
      {/* Header Info */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-700 font-extrabold px-3 py-1.5 rounded-full border border-indigo-500/10 uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <Shield className="w-3.5 h-3.5" /> {language === "ku" ? "بەرێوەبردنی دەسەڵاتەکان بە پاسۆرد" : "Credential-Based Access Panel"}
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 tracking-tight leading-tight">
              {t.title}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed">
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
        <h3 className="text-lg font-display font-black text-slate-800 mb-6 flex items-center gap-3 justify-start">
          <span className="p-2 bg-indigo-500/10 text-indigo-600 border border-indigo-500/10 rounded-2xl">
            <Users className="w-5 h-5" />
          </span>
          <span>{language === "ku" ? "لیستی ئەکاونتە ڕێگەپێدراوەکان" : "Registered Administrator Logins"}</span>
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

              const isUserPasswordVisible = !!showPasswords[user.username];

              return (
                <div 
                  key={user.id || user.username} 
                  className="bg-white/85 p-5 rounded-3xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition duration-200 relative overflow-hidden flex flex-col justify-between text-right"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg border uppercase ${
                        user.role === "super_admin"
                          ? "bg-rose-500/10 text-rose-600 border-rose-200"
                          : user.role === "observer"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                            : "bg-amber-500/10 text-amber-600 border-amber-200"
                      }`}>
                        {user.role === "super_admin" 
                          ? "Super Admin" 
                          : user.role === "observer"
                            ? (language === "ku" ? "چاودێر (خاوەن بزنس)" : "Observer")
                            : "Showroom Admin"
                        }
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && 
                         (user.username || "").toLowerCase().trim() !== (currentUserEmail || "").toLowerCase().trim() && 
                         (user.email || "").toLowerCase().trim() !== (currentUserEmail || "").toLowerCase().trim() && 
                         (user.id || "").toLowerCase().trim() !== (currentUserEmail || "").toLowerCase().trim() && (
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
                      <div className="mt-2.5 space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <p className="font-mono text-xs text-slate-600 flex items-center justify-between">
                          <span className="text-slate-400 uppercase tracking-wide text-[9px] font-sans font-bold">{language === "ku" ? "یوزەرنەیم:" : "Username:"}</span>
                          <span className="font-black">{user.username}</span>
                        </p>
                        <p className="font-mono text-xs text-slate-600 flex items-center justify-between gap-2.5">
                          <span className="text-slate-400 uppercase tracking-wide text-[9px] font-sans font-bold">{language === "ku" ? "تێپەڕەوشە:" : "Password:"}</span>
                          <span className="flex items-center gap-1 font-sans">
                            <span className="font-mono font-bold">
                              {isUserPasswordVisible ? (user.password || "••••••••") : "••••••••"}
                            </span>
                            <button 
                              type="button"
                              onClick={() => togglePasswordVisibility(user.username)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {isUserPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </span>
                        </p>
                      </div>
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

      {/* Retroactive Image Data Optimizer Panel */}
      <div className="glass-panel rounded-[36px] p-6 md:p-8 shadow-sm relative overflow-hidden text-right">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-teal-400" />
        
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] bg-amber-500/10 text-amber-700 font-extrabold px-3 py-1.5 rounded-full border border-amber-500/10 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              {language === "ku" ? "چارەسەری کێشەی هێز و قەبارەی فایەربەیس" : "Firestore Database Quota Saver & Tuner"}
            </span>
            <h3 className="text-xl md:text-2xl font-display font-black text-slate-800">
              {language === "ku" ? "ئۆپتیمایزکەر و بچووککەرەوەی وێنە کۆنەکان" : "Legacy Photo & Document Data Compressor"}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
              {language === "ku" 
                ? "هەر کارمەندێک ٣ وێنە باردەکات (وێنەی خۆی، کارتی نیشتیمانی / پاسپۆرت، و کارتی نیشتەجێبوون). ئەمەش توانای فایەربەیسی پڕ دەکردەوە و سیستەمەکەی خاو دەکردەوە. بە کلیکێک لێرە، سەرجەم وێنە کۆنە تۆمارکراوەکان بە زۆری %٩٠-٩٥ بەبێ لەدەستدانی ڕوونی بچووک دەبنەوە بۆ کەمتر لە ٧٠ کیلۆبایت بۆ ئەوەی تریاڵ و لایڤی فایەربەیسەکەت بەردەوام چالاک بمێنێت." 
                : "Each profile can link up to 3 attachments. Huge raw base64 data consumes Firestore read quotas rapidly. This tool loops through existing employees in the cloud database, compresses their bulk attachments down from multiple megabytes directly to ~60KB using modern web canvas algorithms, preserving exact crop specs."}
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center shrink-0 w-full lg:w-auto">
            {optimizerStatus === "idle" && uncompressedEmployees.length > 0 && (
              <button
                onClick={handleOptimizeImages}
                className="w-full lg:w-auto px-6 py-4 bg-gradient-to-l from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all text-center cursor-pointer"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span>
                  {language === "ku" 
                    ? `بچووککردنەوەی ${uncompressedEmployees.length} کارمەند` 
                    : `Optimize & Compress ${uncompressedEmployees.length} profiles`}
                </span>
              </button>
            )}

            {optimizerStatus === "idle" && uncompressedEmployees.length === 0 && (
              <div className="w-full lg:w-auto px-6 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold justify-center">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === "ku" 
                    ? "هەموو وێنەکان پەستێوراون و چاکترین خێراییان هەیە ✅" 
                    : "Database completely fine & fully compressed! ✅"}
                </span>
              </div>
            )}

            {optimizerStatus === "running" && (
              <div className="w-full lg:w-auto flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm text-right min-w-[280px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-black">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                    <span>{language === "ku" ? "بەردەوامە..." : "Compressing..."}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {processedCount} / {totalToProcess}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${(processedCount / totalToProcess) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold truncate">
                  {language === "ku" ? `دەپرۆسێسرێت: ${currentEmpName}` : `Processing: ${currentEmpName}`}
                </p>
              </div>
            )}

            {optimizerStatus === "completed" && (
              <div className="w-full lg:w-auto flex flex-col gap-2 p-4 bg-teal-50 border border-teal-100 rounded-2xl shadow-sm justify-center">
                <div className="flex items-center gap-2 text-teal-800 text-xs font-black">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{language === "ku" ? "ئۆپتیمایزکردنەکە تەواوبوو! 🎉" : "All cleared successfully! 🎉"}</span>
                </div>
                <p className="text-[10px] text-teal-600 font-semibold">
                  {language === "ku" 
                    ? `قەبارە کەمکراوە و پاشەکەوتکراو: ~${(optimizedBytesSaved / (1024 * 1024)).toFixed(2)} MB` 
                    : `Saved approximately: ~${(optimizedBytesSaved / (1024 * 1024)).toFixed(2)} MB of Firestore space.`}
                </p>
                <button
                  onClick={() => setOptimizerStatus("idle")}
                  className="mt-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition"
                >
                  {language === "ku" ? "بینینی ئەنجام" : "OK"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid for statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 border-t border-slate-100 pt-5 text-right font-sans">
          <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-500 font-bold block">{language === "ku" ? "کۆی گشتی کارمەندان" : "Total Employees"}</span>
            <span className="text-sm font-black text-slate-800 mt-1 block">{employees.length}</span>
          </div>
          <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-500 font-bold block">{language === "ku" ? "کارمەند بە هاوپێچی چالاک" : "Profiles with files"}</span>
            <span className="text-sm font-black text-slate-800 mt-1 block">{totalEmployeesWithImages}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-amber-50/25 p-3.5 rounded-2xl border border-amber-100/40">
            <span className="text-[10px] text-amber-700 font-bold block">{language === "ku" ? "پێویست بە کۆنترۆڵ و کەمکردنەوە" : "Uncompressed Profiles"}</span>
            <span className="text-sm font-black text-amber-600 mt-1 block flex items-center justify-end gap-1.5">
              <span>{uncompressedEmployees.length}</span>
              {uncompressedEmployees.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />}
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-[36px] max-w-md w-full border border-white shadow-2xl overflow-hidden animate-fade-in text-right">
            <div className="flex items-center justify-between bg-indigo-950 text-white p-6">
              <h3 className="font-display font-black text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>
                  {editingUser 
                    ? (language === "ku" ? "دەستکاریکردنی یوزەر و تێپەڕەوشە" : "Edit Admin Account")
                    : (language === "ku" ? "دروستکردنی ئەکاونتی نوێ" : t.addUserBtn)}
                </span>
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
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={language === "ku" ? "بۆ نموونە: قاسم یان کاروان" : "e.g. Karwan Ali"}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans text-right outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.usernameLabel}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="e.g. qasim or karwan"
                    className="w-full py-2.5 pr-9 pl-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans font-mono text-left outline-none disabled:opacity-55"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.passwordLabel}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456 or someSecureWord"
                    className="w-full py-2.5 pr-9 pl-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans font-mono text-left outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.role}</label>
                <select
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans"
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value as "super_admin" | "admin" | "observer";
                    setFormData({ 
                      ...formData, 
                      role: r,
                      business: (r === "super_admin" || r === "observer") ? "all" : "massimo"
                    });
                  }}
                >
                  <option value="admin">{t.roleAdmin}</option>
                  <option value="super_admin">{t.roleSuperAdmin}</option>
                  <option value="observer">{t.roleObserver}</option>
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
                  ? `ئایا دڵنیای لە سڕینەوەی ئەکاونتی "${userToDelete.name}" (${userToDelete.username})؟ ئەم کردارە ناگەڕێتەوە و دەستڕاگەیشتنی بە تەواوی دەبڕێت.`
                  : `Are you sure you want to permanently delete user "${userToDelete.name}" (${userToDelete.username})? Their active permission sessions will be closed instantly.`}
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
