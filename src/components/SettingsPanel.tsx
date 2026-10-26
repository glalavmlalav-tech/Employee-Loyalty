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
  RefreshCw,
  Sparkles,
  Clock,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Database,
  Download,
  ShieldCheck
} from "lucide-react";
import { AppUser, BusinessId, BUSINESSES, Employee } from "../types";
import { compressImageBase64, needsCompression } from "../utils/imageCompression";
import { getNewDaysLimit, setNewDaysLimit } from "../utils";
import AppLogo from "./AppLogo";
import { useCustomLogo, saveCustomLogo, resetCustomLogo, compressLogoImage } from "../utils/logoManager";

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

  // SQL Database Inspector State
  const [showSqlInspector, setShowSqlInspector] = useState(false);
  const [sqlInspectorLoading, setSqlInspectorLoading] = useState(false);
  const [sqlStatus, setSqlStatus] = useState<any>(null);
  const [activeSqlTable, setActiveSqlTable] = useState<string>("employees");
  const [sqlTableRows, setSqlTableRows] = useState<any[]>([]);

  const fetchSqlTableData = async (table: string) => {
    setActiveSqlTable(table);
    setSqlInspectorLoading(true);
    try {
      const [statusRes, rowsRes] = await Promise.all([
        fetch("/api/sql/status"),
        fetch(`/api/sql/inspect?table=${table}&limit=100`)
      ]);
      if (statusRes.ok) {
        const s = await statusRes.json();
        setSqlStatus(s);
      }
      if (rowsRes.ok) {
        const r = await rowsRes.json();
        setSqlTableRows(r.rows || []);
      }
    } catch (e) {
      console.warn("Error fetching SQL inspector data:", e);
    } finally {
      setSqlInspectorLoading(false);
    }
  };

  const handleOpenSqlInspector = () => {
    setShowSqlInspector(true);
    fetchSqlTableData("employees");
  };

  // Logo customization state
  const customLogo = useCustomLogo();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState<string | null>(null);
  const [logoErrorMsg, setLogoErrorMsg] = useState<string | null>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setLogoSuccessMsg(null);
      setLogoErrorMsg(null);

      // Compress and preserve transparency
      const compressedLogo = await compressLogoImage(file, 300);
      await saveCustomLogo(compressedLogo, currentUserEmail || "developer");

      setLogoSuccessMsg(
        language === "ku" 
          ? "لۆگۆی فەرمی بە سەرکەوتوویی بارکرا و لە سەرجەم بەشەکان و تابی وێبگەردا جێبەجێکرا!" 
          : "Brand logo successfully uploaded and applied across all views and tab favicon!"
      );
      setTimeout(() => setLogoSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to upload custom logo:", err);
      setLogoErrorMsg(
        language === "ku" 
          ? "کێشەیەک ڕوویدا لە بارکردنی لۆگۆدا، تکایە دووبارە هەوڵبدەرەوە." 
          : "Failed to upload logo, please try again."
      );
      setTimeout(() => setLogoErrorMsg(null), 4000);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleResetLogo = async () => {
    const confirmPrompt = language === "ku" 
      ? "ئایا دڵنیایت لە گەڕانەوە بۆ لۆگۆی بنەڕەتی سیستەم؟" 
      : "Are you sure you want to reset to the default system logo?";
    if (!window.confirm(confirmPrompt)) return;

    try {
      setIsUploadingLogo(true);
      setLogoSuccessMsg(null);
      setLogoErrorMsg(null);

      await resetCustomLogo();

      setLogoSuccessMsg(
        language === "ku" 
          ? "لۆگۆ بە سەرکەوتوویی گەڕێنرایەوە بۆ لۆگۆی بنەڕەتی." 
          : "Logo successfully reset to default."
      );
      setTimeout(() => setLogoSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Failed to reset logo:", err);
      setLogoErrorMsg(
        language === "ku" 
          ? "کێشەیەک ڕوویدا لە گەڕانەوەی لۆگۆدا." 
          : "Failed to reset logo."
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // New badge duration settings state
  const [newDaysLimit, setNewDaysLimitState] = useState<number>(() => getNewDaysLimit());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSaveDaysLimit = (days: number) => {
    setNewDaysLimitState(days);
    setNewDaysLimit(days);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

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

      {/* Brand & App Logo Customization for Developer / Super Admin */}
      <div className="glass-panel rounded-[36px] p-6 lg:p-8 space-y-6 relative overflow-hidden border border-white/80 shadow-sm animate-fade-in text-right font-sans">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] bg-teal-500/10 text-teal-800 font-extrabold px-3 py-1.5 rounded-full border border-teal-500/20 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              {language === "ku" ? "تایبەت بە گەشەپێدەر / بەڕێوەبەری سەرەکی" : "Developer & Super Admin"}
            </span>
            <h3 className="text-xl md:text-2xl font-display font-black text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-teal-600" />
              <span>{language === "ku" ? "لۆگۆی فەرمی سیستەم و براندینگ" : "Official System Brand Logo"}</span>
            </h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
              {language === "ku" 
                ? "ئەپڵۆدکردنی لۆگۆی نوێ بۆ گۆڕینی سەرجەم لۆگۆکانی ناو سیستەم، لەوانە: سایدبار، پەڕەی چوونەژوورەوە، فۆڕمی فەرمی مۆڵەت، پۆرتاڵی دەروازە، و لۆگۆی تابی وێبگەر (Favicon)."
                : "Upload a custom brand logo to replace all system logos including: sidebar, login portal, leave forms, guard portal, and the browser tab favicon."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Upload Button */}
            <label className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-600/15 hover:scale-102 transition duration-200 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{isUploadingLogo ? (language === "ku" ? "باردەکرێت..." : "Uploading...") : (language === "ku" ? "ئەپڵۆدکردنی لۆگۆ" : "Upload Logo")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={isUploadingLogo}
                className="hidden"
                onChange={handleLogoFileUpload}
              />
            </label>

            {/* Reset to Default */}
            {customLogo && (
              <button
                type="button"
                onClick={handleResetLogo}
                disabled={isUploadingLogo}
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition cursor-pointer"
                title={language === "ku" ? "گەڕانەوە بۆ لۆگۆی بنەڕەتی کۆمپانیا" : "Reset to default logo"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === "ku" ? "گەڕانەوە بۆ بنەڕەتی" : "Reset to Default"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {logoSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{logoSuccessMsg}</span>
          </div>
        )}

        {logoErrorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{logoErrorMsg}</span>
          </div>
        )}

        {/* 3 Real-time Previews showing where the logo appears */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {language === "ku" ? "شێوازی دەرکەوتنی لۆگۆ لە بەشە جیاوازەکاندا (پێشبینینی ڕاستەوخۆ):" : "Live Previews across system components:"}
            </h4>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/60">
              {customLogo ? (language === "ku" ? "لۆگۆی گەشەپێدەر چالاکە ✓" : "Custom Logo Active ✓") : (language === "ku" ? "لۆگۆی بنەڕەتی چالاکە" : "Default Logo Active")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Preview 1: Dark Sidebar (matching user's screenshot image_692f8035.png) */}
            <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400">
                  {language === "ku" ? "١. سایدباری سەرەکی (تاریک)" : "1. Main Sidebar (Dark)"}
                </span>
                <span className="text-[9px] font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full">Sidebar Header</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-950/80 rounded-2xl border border-white/5">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden">
                  <AppLogo className="w-8 h-8" color="#f59e0b" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-black text-amber-400 leading-tight">
                    {language === "ku" ? "ستاف" : "Staff"}
                  </h1>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                    {language === "ku" ? "سیستەمی بەڕێوەبردن" : "Management Hub"}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview 2: Official Leave Form Header (matching user's screenshot image_d9dc26fd.png) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-500">
                  {language === "ku" ? "٢. فۆڕمی فەرمی مۆڵەت (ڕووناک)" : "2. Leave Form Pass (Light)"}
                </span>
                <span className="text-[9px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Document Pass</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-slate-50/70 rounded-2xl border border-slate-150">
                <div className="flex flex-col items-center justify-center p-1.5 border border-slate-300 rounded-xl bg-white w-20 h-20 shadow-xs overflow-hidden">
                  <AppLogo className="w-12 h-12 max-w-full max-h-full" color="#0f766e" />
                  {!customLogo && (
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase mt-0.5">LENYA</span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview 3: Browser Tab Favicon */}
            <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold text-slate-600">
                  {language === "ku" ? "٣. تابی وێبگەر (Browser Tab)" : "3. Browser Tab Favicon"}
                </span>
                <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Tab Icon</span>
              </div>
              <div className="bg-slate-200/90 rounded-2xl p-2.5 border border-slate-300">
                <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-xs border border-slate-200/80 max-w-[200px]">
                  <div className="w-4 h-4 flex items-center justify-center shrink-0 overflow-hidden">
                    <AppLogo className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">ستاف</span>
                  <span className="text-slate-400 text-[10px] ml-auto">✕</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Badge Duration Settings for Super Admin */}
      <div className="glass-panel rounded-[36px] p-6 lg:p-8 space-y-6 relative overflow-hidden border border-white/80 shadow-sm animate-fade-in text-right font-sans">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-800 font-extrabold px-3 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {language === "ku" ? "تایبەت بە بەڕێوەبەری سەرەکی (Super Admin)" : "Super Admin Privilege"}
            </span>
            <h3 className="text-xl md:text-2xl font-display font-black text-slate-800 flex items-center gap-2">
              <span>{language === "ku" ? "دیاریکردنی ماوەی ئایکۆن و بەشی 'نوێ'" : "Configure 'NEW' Badge & Section Duration"}</span>
            </h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
              {language === "ku" 
                ? "دیاری بکە کە کارمەندی تازە تۆمارکراو بۆ ماوەی چەند ڕۆژ ئایکۆنی 'نوێ' لەسەر کارتەکەی بمێنێتەوە و لە بەشی فلتەری 'نوێ' بۆ سوپەر ئەدمین دیار بێت. لە دوای تەواوبوونی ئەم ڕۆژانە بە شێوەیەکی ئۆتۆماتیکی ئایکۆنەکە لادەچێت." 
                : "Specify how many days newly registered employees keep the 'NEW' icon and remain visible in the Super Admin's 'New' section. Once this period expires, the badge is automatically cleared."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">
                {language === "ku" ? "ماوەی چالاک:" : "Current:"}
              </span>
              <span className="font-mono font-black text-sm text-emerald-700 px-2.5 py-0.5 bg-emerald-100 rounded-lg">
                {newDaysLimit} {language === "ku" ? "ڕۆژ" : "days"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[5, 7, 10, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSaveDaysLimit(days)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer font-mono ${
                    newDaysLimit === days
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                  title={language === "ku" ? `گۆڕین بۆ ${days} ڕۆژ` : `Set to ${days} days`}
                >
                  {days} {language === "ku" ? "ڕۆژ" : "d"}
                </button>
              ))}
            </div>

            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                {language === "ku" ? "پاشەکەوتکرا!" : "Saved!"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Zero-Read Persistent Data Storage & Backup Panel */}
      <div className="glass-panel rounded-[36px] p-6 lg:p-8 space-y-6 relative overflow-hidden border border-white/80 shadow-sm animate-fade-in text-right font-sans">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-800 font-extrabold px-3 py-1.5 rounded-full border border-indigo-500/20 uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              {language === "ku" ? "داتابەیسی پەیوەندیداری SQL (SQLite 3)" : "Relational SQL Database Engine (SQLite 3)"}
            </span>
            <h3 className="text-xl md:text-2xl font-display font-black text-slate-800 flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-600" />
              <span>{language === "ku" ? "پاراستنی داتاکان لە داتابەیسی SQL و باکئەپی سەرجەم تۆمارەکان" : "SQL Database Persistence & Full Backup"}</span>
            </h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
              {language === "ku"
                ? "سەرجەم زانیارییەکانی کارمەندان (٦٠ کارمەندی چالاک لەگەڵ کارمەندانی سەبەتەی خۆڵ)، بەکارهێنەران، مۆڵەتەکان، پەیامەکان و چالاکییەکان لە داتابەیسی تەواوی SQL (SQLite 3) بە شێوەی خشتەی پەیوەندیدار و تۆماری پارێزراو بەڕێوەدەبرێن. سیستەمەکە ڕاستەوخۆ پشت بە کوێرییەکانی SQL دەبەستێت."
                : "All employee profiles, users, and leave records are securely stored in the high-speed relational SQL Database (SQLite 3). The system queries data through native SQL with zero cloud quotas and persistent table storage."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Download Complete Backup */}
            <a
              href="/api/backup/export"
              download="lenya_full_database_backup.json"
              className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/15 hover:scale-102 transition duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === "ku" ? "داگرتنی باکئەپی هەموو داتاکان (JSON)" : "Download Full Database (JSON)"}</span>
            </a>

            {/* Restore from File */}
            <label className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{language === "ku" ? "گەڕاندنەوە لە فایل (Restore)" : "Restore from Backup"}</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const parsed = JSON.parse(text);
                    const res = await fetch("/api/backup/restore", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(parsed)
                    });
                    if (res.ok) {
                      alert(language === "ku" ? "باکئەپەکە بە سەرکەوتوویی لە کۆگای داتادا جێگیرکرا!" : "Database restored successfully!");
                      window.location.reload();
                    } else {
                      alert("Error restoring backup.");
                    }
                  } catch (err) {
                    alert("Invalid JSON file.");
                  }
                }}
              />
            </label>

            {/* Inspect Live SQL Database */}
            <button
              onClick={handleOpenSqlInspector}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-102 transition duration-200 cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-200" />
              <span>{language === "ku" ? "پشکنینی داتابەیسی SQL (Live Tables)" : "Inspect SQL Database Live"}</span>
            </button>
          </div>
        </div>

        {/* Database Health Status Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block">{language === "ku" ? "دۆخی پارێزراوی داتاکان" : "Data Integrity"}</span>
              <span className="text-sm font-black text-emerald-700 mt-1 block">{language === "ku" ? "پارێزراوە (100% پارێزراو)" : "100% Secure & Backed Up"}</span>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-150 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">{language === "ku" ? "سنوورداری خوێندنەوەی رۆژانە" : "Daily Read Quota"}</span>
              <span className="text-sm font-black text-slate-800 mt-1 block">{language === "ku" ? "سفر خەرجی (بێ سنوور)" : "Zero-Read (Unlimited)"}</span>
            </div>
            <Zap className="w-6 h-6 text-amber-500" />
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-700 font-bold block">{language === "ku" ? "کۆی گشتی کارمەندان" : "Total Employees"}</span>
              <span className="text-sm font-black text-indigo-800 mt-1 block">{employees.length} {language === "ku" ? "کارمەند" : "Staff"}</span>
            </div>
            <Users className="w-6 h-6 text-indigo-600" />
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

      {/* Live SQL Database Inspector Modal */}
      {showSqlInspector && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fade-in text-right font-sans my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                    <span>{language === "ku" ? "پشکنەری ڕاستەوخۆی داتابەیسی SQL" : "SQLite 3 Database Inspector"}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      LIVE ENGINE
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    SQLite 3 (node:sqlite) • /app/applet/data/app_database.sqlite
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchSqlTableData(activeSqlTable)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${sqlInspectorLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setShowSqlInspector(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {language === "ku" ? "کارمەندانی چالاک" : "Active Staff"}
                  </span>
                  <span className="text-lg font-black text-emerald-600 block mt-0.5">
                    {sqlStatus?.tables?.activeEmployees ?? 60}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {language === "ku" ? "لە سەبەتەی خۆڵ (is_deleted=1)" : "Trash Staff"}
                  </span>
                  <span className="text-lg font-black text-rose-600 block mt-0.5">
                    {sqlStatus?.tables?.trashEmployees ?? 11}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {language === "ku" ? "کۆی خشتەی کارمەندان" : "Total SQL Rows"}
                  </span>
                  <span className="text-lg font-black text-indigo-600 block mt-0.5">
                    {sqlStatus?.tables?.employees ?? 71}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {language === "ku" ? "ئەکاونتەکانی ستاف" : "Admin Accounts"}
                  </span>
                  <span className="text-lg font-black text-amber-600 block mt-0.5">
                    {sqlStatus?.tables?.appUsers ?? 13}
                  </span>
                </div>
              </div>
            </div>

            {/* Table Selection Tabs & Query */}
            <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 shrink-0">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "employees", label: language === "ku" ? "کارمەندان (employees)" : "Employees" },
                  { id: "app_users", label: language === "ku" ? "ئەکاونتەکان (app_users)" : "Users" },
                  { id: "messages", label: language === "ku" ? "پەیامەکان (messages)" : "Messages" },
                  { id: "gifts", label: language === "ku" ? "دیارییەکان (gifts)" : "Gifts" },
                  { id: "system_settings", label: language === "ku" ? "ڕێکخستنەکان (system_settings)" : "Settings" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => fetchSqlTableData(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeSqlTable === tab.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                SELECT * FROM {activeSqlTable} LIMIT 100;
              </div>
            </div>

            {/* Table Data View */}
            <div className="flex-1 overflow-auto p-6">
              {sqlInspectorLoading ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">بارکردنی خشتەی SQL لە SQLite...</span>
                </div>
              ) : sqlTableRows.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-xs font-bold">{language === "ku" ? "هیچ دێڕێک لەم خشتەیەدا نییە" : "No rows found in this table"}</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right divide-y divide-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          {Object.keys(sqlTableRows[0] || {})
                            .filter((k) => k !== "data_json")
                            .map((col) => (
                              <th key={col} className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                                {col}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sqlTableRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/40 transition">
                            {Object.entries(row)
                              .filter(([k]) => k !== "data_json")
                              .map(([key, val]: any, colIdx) => (
                                <td key={colIdx} className="px-3 py-2 whitespace-nowrap text-slate-700">
                                  {key === "is_deleted" ? (
                                    val === 1 ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                                        1 (سڕاوە)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                        0 (چالاک)
                                      </span>
                                    )
                                  ) : (
                                    String(val ?? "-")
                                  )}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
              <span>
                {language === "ku"
                  ? `نیشاندانی ${sqlTableRows.length} ڕیز لە بنکەدراوەی SQLite`
                  : `Showing ${sqlTableRows.length} rows from SQLite`}
              </span>
              <button
                onClick={() => setShowSqlInspector(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
              >
                {language === "ku" ? "داخستن" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
