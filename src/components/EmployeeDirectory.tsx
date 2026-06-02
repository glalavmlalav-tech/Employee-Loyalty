import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  UserPlus, 
  Trash2, 
  Edit, 
  Phone, 
  Calendar, 
  Award, 
  Layers, 
  Info,
  CheckCircle,
  X,
  Sparkles,
  Heart,
  ChevronDown,
  Download,
  Camera,
  Upload,
  User,
  RefreshCw
} from "lucide-react";
import { Employee, BusinessId, BUSINESSES, MaritalStatus, EmployeeStatus } from "../types";
import ImageCropper from "./ImageCropper";

interface EmployeeDirectoryProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, "id">) => Promise<void>;
  onUpdateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  language: "ku" | "en";
  userSession?: { username: string; role: "super_admin" | "admin"; business: BusinessId | "all"; name: string } | null;
}

export default function EmployeeDirectory({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  language,
  userSession
}: EmployeeDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<BusinessId | "all">(
    userSession && userSession.business !== "all" ? userSession.business : "all"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    business: "linia_karge" as BusinessId,
    role: "",
    phone: "",
    birthDate: "",
    maritalStatus: "single" as MaritalStatus,
    marriageAnniversary: "",
    hireDate: new Date().toISOString().split("T")[0],
    loyaltyPoints: 100,
    status: "active" as EmployeeStatus,
    photoUrl: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    ethnicity: "",
    citizenship: "",
    residenceAddress: ""
  });

  const t = {
    title: language === "ku" ? "بەڕێوەبردنی ئەکاونت و دۆسیەی کارمەندان" : "Employee Profile Control Directory",
    desc: language === "ku" ? "تۆمارکردن، دەستکاریکردن و پێدانی خال بە دەستڕەنگینی کارمەندانی هەر سێ بزنسەکە" : "Manage complete accounts, portfolios, marital info, and reward points in real-time.",
    searchPlaceholder: language === "ku" ? "بگەڕێ بۆ ناو، ناونیشانی کار یان ژمارە مۆبایل..." : "Search by name, role, or phone number...",
    allJobs: language === "ku" ? "تەواوی کارەکان" : "All Businesses",
    addEmployee: language === "ku" ? "زیادکردنی کارمەندی نوێ" : "Register Employee",
    editEmployee: language === "ku" ? "دەستکاریکردنی زانیاری کارمەند" : "Edit Profile",
    name: language === "ku" ? "ناوی سیانی کارمەند" : "Full Name",
    business: language === "ku" ? "کۆمپانیا / شۆورووم" : "Company / Showroom Branch",
    role: language === "ku" ? "پیشە / پۆست" : "Job Role / Title",
    phone: language === "ku" ? "ژمارەی مۆبایل" : "Phone Number",
    birthDate: language === "ku" ? "رۆژی لەدایکبوون" : "Date of Birth",
    maritalStatus: language === "ku" ? "بارودۆخی خێزانی" : "Marital Status",
    marriageAnniversary: language === "ku" ? "رۆژی هاوسەرگیری" : "Wedding Anniversary Date",
    hireDate: language === "ku" ? "رۆژی دەستپێکردنی کار" : "Date of Hire",
    loyaltyPoints: language === "ku" ? "خاڵەکانی دڵسۆزی (Loyalty)" : "Employee Morale Points",
    status: language === "ku" ? "دۆخی کارمەند لە کار" : "Employment Status",
    single: language === "ku" ? "سەڵت" : "Single",
    married: language === "ku" ? "هاوسەرگیریکردوو" : "Married",
    active: language === "ku" ? "بەردەوامە لە کار" : "Active",
    suspended: language === "ku" ? "راگیراوە بە شێوەی کاتی" : "Suspended",
    retired: language === "ku" ? "خانەنشینکراو" : "Retired",
    save: language === "ku" ? "پاشەکەوتکردن" : "Save Profile",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel",
    confirmDelete: language === "ku" ? "ئایا دڵنیای لە سڕینەوەی ئەم کارمەندە؟ زانیاریەکان لە فایەربەیس دەسڕێنەوە." : "Are you sure you want to delete this employee? This will sync immediately to other devices.",
    addPointsKu: (pts: number) => `پێدانی +${pts} خاڵ`,
    addPointsEn: (pts: number) => `Award +${pts} Pts`,
    noEmployees: language === "ku" ? "هیچ کارمەندێک نەدۆزرایەوە بەم ناو نیشانانە." : "No employees match your search or filter requirements.",
    mandatoryFields: language === "ku" ? "* تکایە تەواوی کێڵگە ناچارییەکان پڕبکەرەوە." : "* Please fill in all required employee fields.",
  };

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      business: (userSession?.role === "admin" && userSession?.business !== "all" ? userSession.business : "linia_karge") as BusinessId,
      role: "",
      phone: "",
      birthDate: "",
      maritalStatus: "single" as MaritalStatus,
      marriageAnniversary: "",
      hireDate: new Date().toISOString().split("T")[0],
      loyaltyPoints: 100,
      status: "active" as EmployeeStatus,
      photoUrl: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      ethnicity: "",
      citizenship: "",
      residenceAddress: ""
    });
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      business: emp.business,
      role: emp.role,
      phone: emp.phone,
      birthDate: emp.birthDate,
      maritalStatus: emp.maritalStatus,
      marriageAnniversary: emp.marriageAnniversary || "",
      hireDate: emp.hireDate,
      loyaltyPoints: emp.loyaltyPoints,
      status: emp.status,
      photoUrl: emp.photoUrl || "",
      emergencyContactPhone: emp.emergencyContactPhone || "",
      emergencyContactRelation: emp.emergencyContactRelation || "",
      ethnicity: emp.ethnicity || "",
      citizenship: emp.citizenship || "",
      residenceAddress: emp.residenceAddress || ""
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.birthDate || !formData.phone || !formData.hireDate) {
      alert(t.mandatoryFields);
      return;
    }

    try {
      if (editingEmployee) {
        await onUpdateEmployee(editingEmployee.id, {
          name: formData.name,
          business: formData.business,
          role: formData.role,
          phone: formData.phone,
          birthDate: formData.birthDate,
          maritalStatus: formData.maritalStatus,
          marriageAnniversary: formData.maritalStatus === "married" ? formData.marriageAnniversary : "",
          hireDate: formData.hireDate,
          status: formData.status,
          photoUrl: formData.photoUrl,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation,
          ethnicity: formData.ethnicity,
          citizenship: formData.citizenship,
          residenceAddress: formData.residenceAddress
        });
      } else {
        await onAddEmployee({
          name: formData.name,
          business: formData.business,
          role: formData.role,
          phone: formData.phone,
          birthDate: formData.birthDate,
          maritalStatus: formData.maritalStatus,
          marriageAnniversary: formData.maritalStatus === "married" ? formData.marriageAnniversary : "",
          hireDate: formData.hireDate,
          loyaltyPoints: formData.loyaltyPoints,
          status: formData.status,
          photoUrl: formData.photoUrl,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation,
          ethnicity: formData.ethnicity,
          citizenship: formData.citizenship,
          residenceAddress: formData.residenceAddress
        });
      }
      stopCamera();
      setShowAddModal(false);
    } catch (e) {
      alert("Error saving employee details");
    }
  };

  const startCamera = async (mode?: "user" | "environment") => {
    const activeMode = mode || cameraFacingMode;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: activeMode, width: { ideal: 600 }, height: { ideal: 600 } } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        const videoElement = document.getElementById("camera-stream") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = mediaStream;
        }
      }, 150);
    } catch (e) {
      alert(language === "ku" ? "کێشەیەک ڕوویدا لە دەستپێکردنی کامێرا، تکایە دڵنیابەوە لە پێدانی مۆڵەتی پێویست بە وێبsite." : "Could not open camera, please make sure you have allowed camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCamera(false);
  };

  const toggleCamera = async () => {
    const nextMode = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(nextMode);
    if (showCamera) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      await startCamera(nextMode);
    }
  };

  const capturePhoto = () => {
    const videoElement = document.getElementById("camera-stream") as HTMLVideoElement;
    if (videoElement) {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 640;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // high quality raw
        setImageToCrop(dataUrl);
        stopCamera();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.confirmDelete)) {
      await onDeleteEmployee(id);
    }
  };

  const handleAddPoints = async (id: string, currentPoints: number, bonus: number) => {
    await onUpdateEmployee(id, {
      loyaltyPoints: currentPoints + bonus
    });
  };

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    if (userSession && userSession.business !== "all" && emp.business !== userSession.business) {
      return false;
    }
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    const matchesBusiness = selectedBusinessFilter === "all" || emp.business === selectedBusinessFilter;
    return matchesSearch && matchesBusiness;
  });

  const handleExportCSV = () => {
    const headers = language === "ku"
      ? ["ناو", "کۆمپانیا/شۆورووم", "پیشە/پۆست", "ژمارەی مۆبایل", "ڕۆژی لەدایکبوون", "بارودۆخی خێزانی", "ڕۆژی هاوسەرگیری", "ڕۆژی دەستپێکردن", "خاڵەکانی دڵسۆزی", "دۆخی کارمەند"]
      : ["Name", "Company", "Role", "Phone", "Birth Date", "Marital Status", "Marriage Anniversary", "Hire Date", "Loyalty Points", "Status"];

    const rows = filteredEmployees.map((emp) => {
      const bizName = BUSINESSES[emp.business]
        ? (language === "ku" ? BUSINESSES[emp.business].nameKu : BUSINESSES[emp.business].nameEn)
        : emp.business;
      const maritalText = emp.maritalStatus === "married"
        ? (language === "ku" ? "هاوسەرگیریکردوو" : "Married")
        : (language === "ku" ? "سەڵت" : "Single");
      const statusText = emp.status === "active"
        ? (language === "ku" ? "بەردەوام لە کار" : "Active")
        : emp.status === "suspended"
        ? (language === "ku" ? "کاتی ڕاگیراو" : "Suspended")
        : (language === "ku" ? "خانەنشین" : "Retired");

      return [
        emp.name,
        bizName,
        emp.role,
        emp.phone,
        emp.birthDate,
        maritalText,
        emp.marriageAnniversary || "",
        emp.hireDate,
        emp.loyaltyPoints,
        statusText
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Employee_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Statistics Filter Bar */}
      <div className="glass-panel rounded-[36px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 text-sm bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans focus:bg-white text-slate-800 transition"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Business Selector Toggles */}
        {(!userSession || userSession.business === "all") && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedBusinessFilter("all")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition duration-200 shadow-sm ${
                selectedBusinessFilter === "all"
                  ? "bg-slate-950/90 text-white border border-slate-900"
                  : "bg-white/60 backdrop-blur-sm text-slate-600 border border-white/85 hover:bg-white/90"
              }`}
            >
              {t.allJobs}
            </button>
            
            {(Object.keys(BUSINESSES) as BusinessId[]).filter(id => id !== "linia").map((bizId) => {
              const biz = BUSINESSES[bizId];
              const isSelected = selectedBusinessFilter === bizId;
              return (
                <button
                  key={bizId}
                  onClick={() => setSelectedBusinessFilter(bizId)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition duration-200 shadow-sm ${
                    isSelected
                      ? "bg-amber-500 text-white border border-amber-600/10"
                      : "bg-white/60 backdrop-blur-sm text-slate-600 border border-white/85 hover:bg-white/90"
                  }`}
                >
                  {language === "ku" ? biz.nameKu : biz.nameEn}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            onClick={handleExportCSV}
            className="md:ml-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition duration-200 cursor-pointer"
            title={language === "ku" ? "داونلۆدکردنی سەرجەم کارمەندانی بەردەست بە فایلی ئێکسڵ" : "Download filtered employees as CSV excel Sheet"}
          >
            <Download className="w-4 h-4" />
            {language === "ku" ? "داونلۆدی ئێکسڵ" : "Export Excel"}
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-950 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition duration-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {t.addEmployee}
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-[36px] border border-white/60 shadow-sm">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">{t.noEmployees}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const biz = BUSINESSES[emp.business];
            
            // Badge color scheme
            const statusConfig = {
              active: "bg-emerald-500/10 text-emerald-800 border-emerald-500/10",
              suspended: "bg-rose-500/10 text-rose-800 border-rose-500/10",
              retired: "bg-slate-500/10 text-slate-700 border-slate-500/10"
            };

            const pointsRank = emp.loyaltyPoints >= 500 ? "Gold Star 🌟" : emp.loyaltyPoints >= 250 ? "Silver Star ⭐" : "Standard";

            return (
              <div 
                key={emp.id}
                className="bg-white/45 backdrop-blur-md rounded-[32px] border border-white/70 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-white/70"
                id={`emp-card-${emp.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      {emp.photoUrl ? (
                        <img 
                          src={emp.photoUrl} 
                          alt={emp.name} 
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow bg-slate-100 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-slate-100/80 border border-slate-200/50 flex items-center justify-center shadow-inner text-slate-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800 font-display leading-tight">{emp.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold font-sans mt-0.5 leading-none">{emp.role}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border ${statusConfig[emp.status]} shadow-sm shrink-0`}>
                      {emp.status === "active" ? t.active : emp.status === "suspended" ? t.suspended : t.retired}
                    </span>
                  </div>

                  {/* Business Badge */}
                  <div className="bg-white/60 border border-white/90 p-3 rounded-[20px] mb-4 text-xs shadow-inner">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-0.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : emp.business}
                    </div>
                    <div className="text-slate-400 font-semibold text-[10px] pl-5 font-sans">
                      {biz ? (language === "ku" ? biz.typeKu : biz.typeEn) : ""}
                    </div>
                  </div>

                  {/* Complete Information items */}
                  <div className="space-y-2 border-t border-white/50 pt-3 text-xs text-slate-600 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {t.phone}
                      </span>
                      <span className="font-mono text-slate-800 font-bold">{emp.phone}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {t.birthDate}
                      </span>
                      <span className="font-mono text-slate-800 font-bold">{emp.birthDate}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {t.maritalStatus}
                      </span>
                      <span className="font-bold text-slate-800">
                        {emp.maritalStatus === "married" ? (
                          <span className="text-rose-600 flex items-center gap-1">
                            {t.married} 💍
                          </span>
                        ) : t.single}
                      </span>
                    </div>

                    {emp.maritalStatus === "married" && emp.marriageAnniversary && (
                      <div className="flex items-center justify-between bg-rose-500/5 p-2 rounded-xl border border-dashed border-rose-200/50 text-[11px]">
                        <span className="text-rose-700 font-extrabold">{t.marriageAnniversary}</span>
                        <span className="font-mono text-rose-800 font-black">{emp.marriageAnniversary}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t.hireDate}</span>
                      <span className="font-mono text-slate-700 font-semibold">{emp.hireDate}</span>
                    </div>

                    {emp.ethnicity && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <span className="text-xs">🌍</span>
                          {language === "ku" ? "نەتەوە" : "Ethnicity"}
                        </span>
                        <span className="font-bold text-slate-800 bg-slate-100/60 px-2 py-0.5 rounded-lg border border-slate-200/40 text-[11px]">{emp.ethnicity}</span>
                      </div>
                    )}

                    {emp.citizenship && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <span className="text-xs">🔖</span>
                          {language === "ku" ? "ڕەگەزنامە" : "Citizenship"}
                        </span>
                        <span className="font-bold text-slate-800 bg-slate-100/60 px-2 py-0.5 rounded-lg border border-slate-200/40 text-[11px]">{emp.citizenship}</span>
                      </div>
                    )}

                    {emp.residenceAddress && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <span className="text-xs">📍</span>
                          {language === "ku" ? "ناونیشانی نیشتەجێبوون" : "Residence Address"}
                        </span>
                        <span className="font-bold text-slate-800 bg-slate-100/60 px-2 py-0.5 rounded-lg border border-slate-200/40 text-[11px]">{emp.residenceAddress}</span>
                      </div>
                    )}

                    {emp.emergencyContactPhone && (
                      <div className="flex flex-col gap-1 bg-amber-500/5 border border-dashed border-amber-200/50 p-2.5 rounded-2xl mt-2 text-slate-700">
                        <div className="flex items-center justify-between font-bold text-[10px] text-amber-800">
                          <span>{language === "ku" ? "📞 کەسی نزیک (حاڵەتی پێویست)" : "📞 Emergency Contact"}</span>
                          <span className="text-amber-700 px-1.5 py-0.5 bg-amber-100 rounded text-[9px] font-sans font-extrabold uppercase">
                            {emp.emergencyContactRelation || (language === "ku" ? "دیارینەکراو" : "Unknown")}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-black text-slate-800 tracking-wider">
                          {emp.emergencyContactPhone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-2">
                  {/* Actions buttons */}
                  <div className="flex gap-2 justify-end items-center">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="transition active:scale-95"
                      title={userSession?.role === "admin" ? (language === "ku" ? "بینینی زانیاری" : "View Details") : (language === "ku" ? "دەستکاریکردنی فۆرم" : "Edit Profile")}
                    >
                      {userSession?.role === "admin" ? (
                        <span className="text-xs px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1.5 border border-slate-200 transition">
                          <Info className="w-3.5 h-3.5 text-indigo-600" />
                          {language === "ku" ? "بینینی زانیاری" : "View Details"}
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-white rounded-xl font-bold flex items-center gap-1.5 border border-slate-200 transition shadow-sm">
                          <Edit className="w-3.5 h-3.5 text-amber-500" />
                          {language === "ku" ? "دەستکاریکردن" : "Edit"}
                        </span>
                      )}
                    </button>
                    {userSession?.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {language === "ku" ? "سڕینەوە" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Profile Dialog Box */}
      {showAddModal && (() => {
        const isReadOnly = !!(userSession?.role === "admin" && editingEmployee);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] max-w-lg w-full max-h-[calc(100vh-2rem)] sm:max-h-[85vh] border border-white shadow-2xl flex flex-col overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between bg-slate-950 text-white p-5 sm:p-6">
                <h3 className="font-display font-black text-base sm:text-lg flex items-center gap-2">
                  <SmileIcon />
                  {editingEmployee 
                    ? (userSession?.role === "admin" 
                      ? (language === "ku" ? "بینینی زانیاری کارمەند" : "View Employee Profile") 
                      : t.editEmployee) 
                    : t.addEmployee}
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                
                {/* Employee Picture Upload/Capture Container */}
                <div className="flex flex-col items-center justify-center bg-slate-50/75 border border-slate-100 p-4 rounded-[24px]">
                  <span className="text-xs font-bold text-slate-700 mb-2">
                    {language === "ku" ? "وێنەی گرتوو یان ئەپڵۆدکراوی کارمەند" : "Employee Profile Photo"}
                  </span>
                  
                  <div className="relative mb-3">
                    {formData.photoUrl ? (
                      <img 
                        src={formData.photoUrl} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-white text-xs text-slate-400" 
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center shadow-inner text-slate-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    {formData.photoUrl && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: "" })}
                        className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md hover:scale-105 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      {/* Interactive Buttons */}
                      <div className="flex gap-2">
                        {/* Hidden File Input */}
                        <label className="flex-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-700 font-bold shadow-sm cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{language === "ku" ? "ئەپڵۆد" : "Upload"}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setImageToCrop(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {/* Camera Toggle Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (showCamera) {
                              stopCamera();
                            } else {
                              startCamera();
                            }
                          }}
                          className={`flex-1 px-3 py-1.5 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition ${
                            showCamera 
                              ? "bg-rose-50 border-rose-200 text-rose-700 font-black animate-pulse" 
                              : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{showCamera ? (language === "ku" ? "داخستن" : "Close") : (language === "ku" ? "کامێرا" : "Camera")}</span>
                        </button>
                      </div>

                      {/* Video Camera Live Stream Container */}
                      {showCamera && (
                        <div className="bg-slate-900 rounded-2xl p-2.5 relative overflow-hidden flex flex-col items-center gap-2 mt-2 border border-slate-800 animate-fade-in">
                          <div className="relative w-full overflow-hidden rounded-xl">
                            <video 
                              id="camera-stream"
                              autoPlay 
                              playsInline 
                              className="w-full max-h-[160px] object-cover rounded-xl"
                            />
                            {/* Switch Camera Overlay Button */}
                            <button
                              type="button"
                              onClick={toggleCamera}
                              className="absolute top-2.5 right-2.5 p-2 bg-slate-950/80 backdrop-blur-md hover:bg-slate-950 text-white rounded-xl border border-white/10 shadow-lg hover:scale-110 active:scale-95 transition flex items-center justify-center shrink-0"
                              title={language === "ku" ? "گۆڕینی کامێرا" : "Switch Camera (Front/Back)"}
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-500 hover:rotate-180 transition-transform duration-300" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-md transition"
                          >
                            <Camera className="w-3.5 h-3.5 shrink-0" />
                            {language === "ku" ? "وێنەکە بگرە" : "Take Photo"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.name}</label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 disabled:opacity-75"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.business}</label>
                    <select
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs font-sans disabled:opacity-75"
                      value={formData.business}
                      disabled={isReadOnly || userSession?.role === "admin"}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value as BusinessId })}
                    >
                      {(Object.keys(BUSINESSES) as BusinessId[]).filter(id => id !== "linia").map((id) => (
                        <option key={id} value={id}>
                          {language === "ku" ? BUSINESSES[id].nameKu : BUSINESSES[id].nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.role}</label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      placeholder="e.g. Master Carpenter / Sales Exec"
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 font-sans text-xs disabled:opacity-75"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.phone}</label>
                    <input
                      type="tel"
                      required
                      disabled={isReadOnly}
                      placeholder="e.g. 0770XXXXXXX"
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 font-mono text-xs disabled:opacity-75"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.birthDate}</label>
                    <input
                      type="date"
                      required
                      disabled={isReadOnly}
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 font-mono text-xs disabled:opacity-75"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.maritalStatus}</label>
                    <select
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs font-sans disabled:opacity-75"
                      value={formData.maritalStatus}
                      disabled={isReadOnly}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as MaritalStatus })}
                    >
                      <option value="single">{t.single}</option>
                      <option value="married">{t.married}</option>
                    </select>
                  </div>

                  {formData.maritalStatus === "married" ? (
                    <div>
                      <label className="block text-xs font-bold text-rose-600 mb-1">{t.marriageAnniversary}</label>
                      <input
                        type="date"
                        required={formData.maritalStatus === "married"}
                        disabled={isReadOnly}
                        className="w-full p-2.5 bg-rose-500/5 border border-rose-200 rounded-xl focus:ring-1 focus:ring-rose-500 font-mono text-xs text-rose-800 disabled:opacity-75"
                        value={formData.marriageAnniversary}
                        onChange={(e) => setFormData({ ...formData, marriageAnniversary: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center text-[10px] text-slate-400">
                      {language === "ku" ? "کێڵگەی ساڵیاد ناچالاکە کاتێک کە سەڵت بێت" : "Wedding anniversary is disabled for single profiles."}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.hireDate}</label>
                    <input
                      type="date"
                      required
                      disabled={isReadOnly}
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 font-mono text-xs disabled:opacity-75"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.status}</label>
                    <select
                      className="w-full p-2.5 bg-white/70 border border-white border-b-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs font-sans disabled:opacity-75"
                      value={formData.status}
                      disabled={isReadOnly}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                    >
                      <option value="active">{t.active}</option>
                      <option value="suspended">{t.suspended}</option>
                      <option value="retired">{t.retired}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-600 mb-1">
                      {language === "ku" ? "📞 ژمارەی کەسی نزیک لە کاتی پێویست" : "📞 Emergency Contact Phone"}
                    </label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      placeholder="e.g. 0750XXXXXXX"
                      className="w-full p-2.5 bg-amber-500/5 border border-amber-200 rounded-xl focus:ring-1 focus:ring-amber-500 font-mono text-xs disabled:opacity-75 text-amber-900"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-600 mb-1">
                      {language === "ku" ? "👥 پەیوەندی کەسەکە (کەسەکە چییەتی؟)" : "👥 Relation to Employee"}
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder={language === "ku" ? "کەسەکە چییە (برا، باوک، هاوسەر...)" : "e.g. Brother, Father, Wife"}
                      className="w-full p-2.5 bg-amber-500/5 border border-amber-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-75 text-amber-950"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ku" ? "🌍 نەتەوە" : "🇺🇳 Ethnicity / Nationality"}
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder={language === "ku" ? "بۆ نموونە: کورد، عەرەب، فارس..." : "e.g. Kurd, Arab, Persian..."}
                      className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-75"
                      value={formData.ethnicity}
                      onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ku" ? "🔖 ڕەگەزنامە" : "🔖 Citizenship Country"}
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder={language === "ku" ? "بۆ نموونە: عیراقی، ئێرانی، هیندستانی..." : "e.g. Iraqi, Iranian, Indian..."}
                      className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-75"
                      value={formData.citizenship}
                      onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ku" ? "📍 ناونیشانی نیشتەجێبوون" : "📍 Residence Address"}
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder={language === "ku" ? "بۆ نموونە: هەولێر - گەڕەکی نەورۆز" : "e.g. Erbil - Nawroz Quarter"}
                      className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-75"
                      value={formData.residenceAddress || ""}
                      onChange={(e) => setFormData({ ...formData, residenceAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end border-t border-slate-100 pt-5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                  >
                    {isReadOnly ? (language === "ku" ? "داخستن" : "Close") : t.cancel}
                  </button>
                  {!isReadOnly && (
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-slate-950/10"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t.save}
                    </button>
                  )}
                </div>

              </form>

              {imageToCrop && (
                <ImageCropper
                  imageSrc={imageToCrop}
                  language={language}
                  onCancel={() => setImageToCrop(null)}
                  onCrop={(croppedData) => {
                    setFormData((prev) => ({ ...prev, photoUrl: croppedData }));
                    setImageToCrop(null);
                  }}
                />
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
}

function SmileIcon() {
  return (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
