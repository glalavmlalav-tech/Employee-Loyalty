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
  Check,
  X,
  Sparkles,
  Heart,
  ChevronDown,
  Download,
  Camera,
  Upload,
  User,
  RefreshCw,
  Shield,
  Clock
} from "lucide-react";
import { Employee, BusinessId, BUSINESSES, MaritalStatus, EmployeeStatus } from "../types";
import ImageCropper from "./ImageCropper";

interface ExportField {
  id: string;
  labelKu: string;
  labelEn: string;
}

const EXPORT_FIELDS: ExportField[] = [
  { id: "name", labelKu: "ناوی سیانی کارمەند", labelEn: "Full Name" },
  { id: "business", labelKu: "کۆمپانیا/شۆورووم", labelEn: "Company" },
  { id: "role", labelKu: "پیشە/پۆست", labelEn: "Job Role" },
  { id: "phone", labelKu: "ژمارەی مۆبایل", labelEn: "Phone Number" },
  { id: "birthDate", labelKu: "ڕۆژی لەدایکبوون", labelEn: "Birth Date" },
  { id: "maritalStatus", labelKu: "بارودۆخی خێزانی", labelEn: "Marital Status" },
  { id: "marriageAnniversary", labelKu: "ساڵڕۆژی هاوسەرگیری", labelEn: "Marriage Anniversary" },
  { id: "hireDate", labelKu: "ڕۆژی دەستپێکردن", labelEn: "Hire Date" },
  { id: "status", labelKu: "دۆخی کارمەند", labelEn: "Employee Status" },
  { id: "ethnicity", labelKu: "نەتەوە", labelEn: "Ethnicity" },
  { id: "citizenship", labelKu: "ڕەگەزنامە", labelEn: "Citizenship" },
  { id: "residenceAddress", labelKu: "ناونیشانی نیشتەجێبوون", labelEn: "Residence Address" },
  { id: "emergencyContactPhone", labelKu: "ژمارەی کەسی نزیک", labelEn: "Emergency Contact Phone" },
  { id: "emergencyContactRelation", labelKu: "پەیوەندی لەگەڵ کەسی نزیک", labelEn: "Emergency Relation" }
];

export function getTenureInfo(hireDateStr: string, language: "ku" | "en") {
  if (!hireDateStr) return null;
  const parts = hireDateStr.split("-");
  if (parts.length !== 3) return null;
  
  const hireYear = parseInt(parts[0]);
  const hireMonth = parseInt(parts[1]) - 1;
  const hireDay = parseInt(parts[2]);
  
  const now = new Date();
  
  let months = (now.getFullYear() - hireYear) * 12 + (now.getMonth() - hireMonth);
  if (now.getDate() < hireDay) {
    months--;
  }
  if (months < 0) months = 0;
  
  if (months < 6) {
    return {
      type: "under_6m",
      icon: "Clock",
      bgColor: "bg-teal-500/10",
      textColor: "text-teal-800",
      borderColor: "border-teal-500/20",
      iconColor: "text-teal-600",
      label: language === "ku" ? "کەمتر لە ٦ مانگ" : "Less than 6 Months",
      emoji: "🌱",
      desc: language === "ku" ? "ستافی تازە دەستبەکاربوو" : "Recently joined team member"
    };
  } else if (months < 18) {
    return {
      type: "6m_to_1_5y",
      icon: "CheckCircle",
      bgColor: "bg-sky-500/10",
      textColor: "text-sky-800",
      borderColor: "border-sky-500/20",
      iconColor: "text-sky-600",
      label: language === "ku" ? "زیاتر لە ٦ مانگ" : "More than 6 Months",
      emoji: "⭐",
      desc: language === "ku" ? "جێگیربوو و دەستڕەنگین" : "Fully integrated team member"
    };
  } else if (months < 36) {
    return {
      type: "1_5y_to_3y",
      icon: "Calendar",
      bgColor: "bg-indigo-500/10",
      textColor: "text-indigo-800",
      borderColor: "border-indigo-500/20",
      iconColor: "text-indigo-600",
      label: language === "ku" ? "زیاتر لە ساڵێک و نیو" : "More than 1.5 Years",
      emoji: "🏆",
      desc: language === "ku" ? "بەئەزموون و پێگەیشتوو" : "Highly experienced teammate"
    };
  } else {
    return {
      type: "over_3y",
      icon: "Shield",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-800",
      borderColor: "border-amber-500/20",
      iconColor: "text-amber-600",
      label: language === "ku" ? "زیاتر لە ٣ ساڵ" : "More than 3 Years",
      emoji: "👑",
      desc: language === "ku" ? "دامەزرێنەری دێرین و دڵسۆز" : "Senior pillar of the company"
    };
  }
}

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
  const [archiveView, setArchiveView] = useState<"active" | "archived">("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Excel Selection and Export State
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_FIELDS.map(f => f.id)
  );

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
    desc: language === "ku" ? "تۆمارکردن، دەستکاریکردن و بەدواداچوونی چالاکانەی سەرجەم کارمەندانی هەر سێ بزنسەکە" : "Manage complete accounts, portfolios, marital info, and contact details in real-time.",
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
    status: language === "ku" ? "دۆخی کارمەند لە کار" : "Employment Status",
    single: language === "ku" ? "سەڵت" : "Single",
    married: language === "ku" ? "هاوسەرگیریکردوو" : "Married",
    active: language === "ku" ? "بەردەوامە لە کار" : "Active",
    suspended: language === "ku" ? "راگیراوە بە شێوەی کاتی" : "Suspended",
    retired: language === "ku" ? "خانەنشینکراو" : "Retired",
    save: language === "ku" ? "پاشەکەوتکردن" : "Save Profile",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel",
    confirmDelete: language === "ku" ? "ئایا دڵنیای لە سڕینەوەی ئەم کارمەندە؟ زانیاریەکان لە فایەربەیس دەسڕێنەوە." : "Are you sure you want to delete this employee? This will sync immediately to other devices.",
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

  // Counts for each view based on business restriction
  const activeCount = employees.filter(emp => {
    if (userSession && userSession.business !== "all" && emp.business !== userSession.business) {
      return false;
    }
    return !emp.status || emp.status === "active";
  }).length;

  const archivedCount = employees.filter(emp => {
    if (userSession && userSession.business !== "all" && emp.business !== userSession.business) {
      return false;
    }
    return emp.status === "retired" || emp.status === "suspended";
  }).length;

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    if (userSession && userSession.business !== "all" && emp.business !== userSession.business) {
      return false;
    }
    // Filter by Active vs Archived status
    const isEmpActive = !emp.status || emp.status === "active";
    if (archiveView === "active" && !isEmpActive) {
      return false;
    }
    if (archiveView === "archived" && isEmpActive) {
      return false;
    }

    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    const matchesBusiness = selectedBusinessFilter === "all" || emp.business === selectedBusinessFilter;
    return matchesSearch && matchesBusiness;
  });

  // Selection helpers
  const toggleSelectEmployee = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredEmployees.map((e) => e.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedEmpIds.includes(id));
    if (isAllSelected) {
      setSelectedEmpIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedEmpIds((prev) => {
        const unique = new Set([...prev, ...allFilteredIds]);
        return Array.from(unique);
      });
    }
  };

  const handleExportCSV = () => {
    setShowExportModal(true);
  };

  const performExportCSV = () => {
    // Determine target employees
    const employeesToExport = selectedEmpIds.length > 0
      ? filteredEmployees.filter((emp) => selectedEmpIds.includes(emp.id))
      : filteredEmployees;

    // Get selected fields configuration
    const selectedFields = EXPORT_FIELDS.filter((field) => selectedColumns.includes(field.id));
    const headers = selectedFields.map((field) => (language === "ku" ? field.labelKu : field.labelEn));

    const rows = employeesToExport.map((emp) => {
      return selectedFields.map((field) => {
        switch (field.id) {
          case "name":
            return emp.name;
          case "business":
            return BUSINESSES[emp.business]
              ? language === "ku"
                ? BUSINESSES[emp.business].nameKu
                : BUSINESSES[emp.business].nameEn
              : emp.business;
          case "role":
            return emp.role;
          case "phone":
            return emp.phone;
          case "birthDate":
            return emp.birthDate;
          case "maritalStatus":
            return emp.maritalStatus === "married"
              ? language === "ku"
                ? "هاوسەرگیریکردوو"
                : "Married"
              : language === "ku"
              ? "سەڵت"
              : "Single";
          case "marriageAnniversary":
            return emp.marriageAnniversary || "";
          case "hireDate":
            return emp.hireDate;
          case "status":
            return emp.status === "active"
              ? language === "ku"
                ? "بەردەوام لە کار"
                : "Active"
              : emp.status === "suspended"
              ? language === "ku"
                ? "کاتی ڕاگیراو"
                : "Suspended"
              : language === "ku"
              ? "خانەنشین"
              : "Retired";
          case "ethnicity":
            return emp.ethnicity || "";
          case "citizenship":
            return emp.citizenship || "";
          case "residenceAddress":
            return emp.residenceAddress || "";
          case "emergencyContactPhone":
            return emp.emergencyContactPhone || "";
          case "emergencyContactRelation":
            return emp.emergencyContactRelation || "";
          default:
            return "";
        }
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ZStaff_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Active Employees vs Archive Dossier Tab Switcher */}
      <div className="flex items-center justify-start gap-4 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/50 w-full sm:w-auto max-w-md shadow-sm">
        <button
          onClick={() => setArchiveView("active")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            archiveView === "active"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
          id="active_employees_tab"
        >
          <span>{language === "ku" ? "کارمەندە چالاکەکان" : "Active Employees"}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
            archiveView === "active" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setArchiveView("archived")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            archiveView === "archived"
              ? "bg-white text-rose-600 shadow-sm border border-rose-100"
              : "text-slate-400 hover:text-slate-600"
          }`}
          id="archived_employees_tab"
        >
          <span>{language === "ku" ? "دۆسیەی ئەرشیف" : "Archive Dossier"}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
            archiveView === "archived" ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-500"
          }`}>
            {archivedCount}
          </span>
        </button>
      </div>

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

        <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
          {/* Toggle Select All */}
          {filteredEmployees.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3.5 py-2.5 bg-white/60 hover:bg-white text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-white/85 shadow-sm transition duration-200 cursor-pointer"
              title={language === "ku" ? "دیاریکردنی هەمووان یان لادانی دیاریکردنی گشتی" : "Select or deselect all visible employees"}
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                {language === "ku"
                  ? (filteredEmployees.every((emp) => selectedEmpIds.includes(emp.id)) ? "لادانی گشتی" : "دیاریکردنی گشتی")
                  : (filteredEmployees.every((emp) => selectedEmpIds.includes(emp.id)) ? "Deselect All" : "Select All")
                }
              </span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition duration-200 cursor-pointer"
            title={language === "ku" ? "داونلۆدکردنی سەرجەم کارمەندانی بەردەست بە فایلی ئێکسڵ" : "Download filtered employees as CSV excel Sheet"}
          >
            <Download className="w-4 h-4" />
            <span>
              {language === "ku"
                ? (selectedEmpIds.length > 0 ? `داونلۆدی دیاریکراو (${selectedEmpIds.length})` : "ناوناردنی ئێکسڵ")
                : (selectedEmpIds.length > 0 ? `Export Selected (${selectedEmpIds.length})` : "Export Excel")
              }
            </span>
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

            return (
              <div 
                key={emp.id}
                className={`bg-white/45 backdrop-blur-md rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-white/70 border ${
                  selectedEmpIds.includes(emp.id)
                    ? "border-amber-500 ring-2 ring-amber-500/10 shadow bg-white/70"
                    : "border-white/70"
                }`}
                id={`emp-card-${emp.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Selection Checkbox */}
                      <button
                        onClick={(e) => toggleSelectEmployee(emp.id, e)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-150 shrink-0 ${
                          selectedEmpIds.includes(emp.id)
                            ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                            : "bg-white/50 border-slate-200/80 hover:border-amber-400 text-transparent"
                        }`}
                        title={language === "ku" ? "دیاریکردنی کارمەند" : "Select employee"}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </button>

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

                    <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 mt-1">
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="text-slate-500 font-bold">{t.hireDate}</span>
                        <span className="font-mono text-slate-700 font-black">{emp.hireDate}</span>
                      </div>
                      
                      {(() => {
                        const tenure = getTenureInfo(emp.hireDate, language);
                        if (!tenure) return null;
                        
                        let IconComponent = Clock;
                        if (tenure.icon === "CheckCircle") IconComponent = CheckCircle;
                        if (tenure.icon === "Calendar") IconComponent = Calendar;
                        if (tenure.icon === "Shield") IconComponent = Shield;
                        
                        return (
                          <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl border ${tenure.bgColor} ${tenure.textColor} ${tenure.borderColor} transition duration-250`}>
                            <div className="flex items-center gap-1.5">
                              <IconComponent className={`w-3.5 h-3.5 ${tenure.iconColor} shrink-0`} />
                              <div className="flex flex-col select-none">
                                <span className="font-black text-[11px] leading-tight">
                                  {tenure.label}
                                </span>
                                <span className="text-[10px] opacity-80 font-semibold mt-0.5 leading-none">
                                  {tenure.desc}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black px-1.5 py-0.5 bg-white/40 backdrop-blur-sm rounded-lg flex items-center gap-1 shrink-0">
                              {tenure.emoji}
                            </span>
                          </div>
                        );
                      })()}
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

      {/* 2. Custom Excel Export Configurator Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="export-columns-modal">
          <div className="bg-white/95 backdrop-blur-xl border border-white/90 shadow-2xl rounded-[36px] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col scale-in">
            {/* Header */}
            <div className="p-6 border-b border-rose-100/10 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <Download className="w-5 h-5 animate-bounce-slow" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-black text-slate-800">
                    {language === "ku" ? "کۆنتڕۆڵ و دیاریکردنی ستوونەکانی ئێکسڵ" : "Excel Export Columns Setup"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {language === "ku"
                      ? "ڕێکخستن و هەڵبژاردنی داتا پێویستەکان بۆ داگرتن"
                      : "Configure which data fields to reveal in the generated spreadsheet report."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Info Box */}
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/15 text-xs text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📁</span>
                  <div>
                    <p className="font-extrabold text-slate-800">
                      {language === "ku" ? "کارمەندە داونلۆدکراوەکان" : "Target Export Employees"}
                    </p>
                    <p className="text-slate-500 font-medium mt-0.5">
                      {selectedEmpIds.length > 0
                        ? (language === "ku" ? `تەنها کارمەندە دیاریکراوەکان (${selectedEmpIds.length}) دەنێردرێن` : `Only selected employees (${selectedEmpIds.length}) will be processed`)
                        : (language === "ku" ? `سەرجەم کارمەندە پۆلێنکراوەکانی گەڕان (${filteredEmployees.length}) دەنێردرێن` : `All currently matching search/filtered employees (${filteredEmployees.length}) will be exported`)
                      }
                    </p>
                  </div>
                </div>
                {selectedEmpIds.length > 0 && (
                  <button
                    onClick={() => setSelectedEmpIds([])}
                    className="px-2.5 py-1 bg-amber-500/10 text-amber-800 rounded-lg hover:bg-amber-500/20 text-[10px] font-black transition cursor-pointer"
                  >
                    {language === "ku" ? "گۆڕین بۆ گشتی" : "Export All Instead"}
                  </button>
                )}
              </div>

              {/* Column options grid */}
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-700">
                    {language === "ku" ? "لیستی ستوونەکان" : "Available Fields / Columns"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedColumns(EXPORT_FIELDS.map(f => f.id))}
                      className="text-emerald-600 hover:text-emerald-700 font-extrabold hover:underline"
                    >
                      {language === "ku" ? "دیاریکردنی هەموو" : "Select All"}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setSelectedColumns([])}
                      className="text-rose-600 hover:text-rose-700 font-extrabold hover:underline"
                    >
                      {language === "ku" ? "پاککردنەوە" : "Clear All"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl max-h-64 overflow-y-auto">
                  {EXPORT_FIELDS.map((field) => {
                    const isChecked = selectedColumns.includes(field.id);
                    return (
                      <div
                        key={field.id}
                        onClick={() => {
                          setSelectedColumns(prev =>
                            prev.includes(field.id)
                              ? prev.filter(c => c !== field.id)
                              : [...prev, field.id]
                          );
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-white border-emerald-500 shadow-sm text-emerald-950"
                            : "bg-white/40 border-slate-200/45 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">
                          {language === "ku" ? field.labelKu : field.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer containing CTA actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 justify-between items-center">
              <div className="text-[11px] text-slate-500 font-bold font-sans">
                {language === "ku"
                  ? `${selectedColumns.length} ستوون پێشاندەدرێت لە فایلی دەرچوودا`
                  : `${selectedColumns.length} out of ${EXPORT_FIELDS.length} columns will be active.`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {language === "ku" ? "پاشگەزبوونەوە" : "Cancel"}
                </button>
                <button
                  onClick={performExportCSV}
                  disabled={selectedColumns.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/15 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {language === "ku" ? "داگرتنی ئێکسڵ CSV" : "Generate CSV Excel Sheet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
