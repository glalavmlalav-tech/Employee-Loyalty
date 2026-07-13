import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  UserPlus, 
  Trash2, 
  Edit, 
  Crop,
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
  Clock,
  Printer,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Employee, BusinessId, BUSINESSES, MaritalStatus, EmployeeStatus } from "../types";
import { formatDateToDDMMYYYY, isNewEmployee } from "../utils";
import ImageCropper from "./ImageCropper";
import { compressImageBase64 } from "../utils/imageCompression";

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

export function formatServiceTenure(hireDateStr: string, language: "ku" | "en") {
  if (!hireDateStr) return "";
  const parts = hireDateStr.split("-");
  if (parts.length !== 3) return "";
  
  const hireYear = parseInt(parts[0]);
  const hireMonth = parseInt(parts[1]) - 1;
  const hireDay = parseInt(parts[2]);
  
  const now = new Date();
  
  let months = (now.getFullYear() - hireYear) * 12 + (now.getMonth() - hireMonth);
  if (now.getDate() < hireDay) {
    months--;
  }
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const extraMonths = months % 12;

  let valueStr = "";
  if (extraMonths === 0) {
    if (years === 0) {
      valueStr = `0.0`;
    } else {
      valueStr = years.toString();
    }
  } else {
    valueStr = `${years}.${extraMonths}`;
  }

  if (language === "ku") {
    return `${valueStr} ساڵ`;
  }

  const unit = years === 1 && extraMonths === 0 ? "year" : "years";
  return `${valueStr} ${unit}`;
}

interface EmployeeDirectoryProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, "id">) => Promise<void>;
  onUpdateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  language: "ku" | "en";
  userSession?: { username: string; role: "super_admin" | "admin" | "observer"; business: BusinessId | "all"; name: string } | null;
  systemDate?: string;
}

export default function EmployeeDirectory({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  language,
  userSession,
  systemDate = "2026-05-25"
}: EmployeeDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isSuperAdmin = userSession?.role === "super_admin";
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

  // PDF Selection and Print Config State
  const [showPDFConfigModal, setShowPDFConfigModal] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    density: "1" as "1" | "2" | "4" | "9",
    showPhoto: true,
    showContactPhone: true,
    showEmergencyContact: true,
    showResidence: true,
    showStampArea: true,
    showPersonalDetails: true,
    showCorporateHeader: true,
    colorTheme: "default" as "default" | "monochrome" | "emerald" | "indigo",
  });

  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [activeDocCamera, setActiveDocCamera] = useState<"passport" | "iqama" | null>(null);
  const [docStream, setDocStream] = useState<MediaStream | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportValue, setReportValue] = useState("");
  const [reportingEmployee, setReportingEmployee] = useState<Employee | null>(null);
  const [showPhotoEditDropdown, setShowPhotoEditDropdown] = useState(false);

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
    residenceAddress: "",
    passportOrNationalCardUrl: "",
    iqamaUrl: "",
    isForeigner: false,
    notes: ""
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
      business: (userSession?.role === "admin" && userSession?.business !== "all" 
        ? (userSession.business === "linia" ? "linia_karge" : userSession.business) 
        : "linia_karge") as BusinessId,
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
      residenceAddress: "",
      passportOrNationalCardUrl: "",
      iqamaUrl: "",
      isForeigner: false,
      notes: ""
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
      residenceAddress: emp.residenceAddress || "",
      passportOrNationalCardUrl: emp.passportOrNationalCardUrl || "",
      iqamaUrl: emp.iqamaUrl || "",
      isForeigner: !!emp.iqamaUrl,
      notes: emp.notes || ""
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
          residenceAddress: formData.residenceAddress,
          passportOrNationalCardUrl: formData.passportOrNationalCardUrl,
          iqamaUrl: formData.iqamaUrl,
          notes: formData.notes
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
          residenceAddress: formData.residenceAddress,
          passportOrNationalCardUrl: formData.passportOrNationalCardUrl,
          iqamaUrl: formData.iqamaUrl,
          notes: formData.notes
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
    stopDocCamera();
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

  const startDocCamera = async (type: "passport" | "iqama", mode?: "user" | "environment") => {
    try {
      if (docStream) {
        docStream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode || "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setDocStream(mediaStream);
      setActiveDocCamera(type);
      setTimeout(() => {
        const videoElement = document.getElementById(`doc-camera-stream-${type}`) as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = mediaStream;
        }
      }, 150);
    } catch (e) {
      alert(language === "ku" ? "کێشەیەک ڕوویدا لە دەستپێکردنی کامێرا، تکایە دڵنیابەوە لە پێدانی مۆڵەتی پێویست." : "Could not open camera, please ensure permissions are granted.");
    }
  };

  const stopDocCamera = () => {
    if (docStream) {
      docStream.getTracks().forEach((track) => track.stop());
    }
    setDocStream(null);
    setActiveDocCamera(null);
  };

  const captureDocPhoto = async (type: "passport" | "iqama") => {
    const videoElement = document.getElementById(`doc-camera-stream-${type}`) as HTMLVideoElement;
    if (videoElement) {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 1280;
      canvas.height = videoElement.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const compressed = await compressImageBase64(dataUrl, 800, 800, 0.6);
        if (type === "passport") {
          setFormData((prev) => ({ ...prev, passportOrNationalCardUrl: compressed }));
        } else {
          setFormData((prev) => ({ ...prev, iqamaUrl: compressed }));
        }
        stopDocCamera();
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
    if (userSession && userSession.business !== "all") {
      const userBiz = userSession.business === "linia" ? "linia_karge" : userSession.business;
      const empBiz = emp.business === "linia" ? "linia_karge" : emp.business;
      if (empBiz !== userBiz) {
        return false;
      }
    }
    return !emp.status || emp.status === "active";
  }).length;

  const archivedCount = employees.filter(emp => {
    if (userSession && userSession.business !== "all") {
      const userBiz = userSession.business === "linia" ? "linia_karge" : userSession.business;
      const empBiz = emp.business === "linia" ? "linia_karge" : emp.business;
      if (empBiz !== userBiz) {
        return false;
      }
    }
    return emp.status === "retired" || emp.status === "suspended";
  }).length;

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    if (userSession && userSession.business !== "all") {
      const userBiz = userSession.business === "linia" ? "linia_karge" : userSession.business;
      const empBiz = emp.business === "linia" ? "linia_karge" : emp.business;
      if (empBiz !== userBiz) {
        return false;
      }
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
    
    const filterBiz = selectedBusinessFilter === "linia" ? "linia_karge" : selectedBusinessFilter;
    const empBiz = emp.business === "linia" ? "linia_karge" : emp.business;
    const matchesBusiness = selectedBusinessFilter === "all" || empBiz === filterBiz;
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

  const handleExportPDF = () => {
    if (selectedEmpIds.length === 0) {
      alert(
        language === "ku"
          ? "تکایە سەرەتا کارمەندێک سکێلت بکە بە دیاریکردنی چوارگۆشەی تەنیشت ناوی کارمەندەکە پێش داگرتنی فایلی PDF."
          : "Please select at least one employee by checking the box next to their name first."
      );
      return;
    }
    setShowPDFConfigModal(true);
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

  const renderPrintCard = (emp: Employee, densityMode: "1" | "2" | "4" | "9", isSimulatedPreview = false) => {
    const biz = BUSINESSES[emp.business];
    const isMarried = emp.maritalStatus === "married";
    
    let themeHex = "#f59e0b"; // amber-500
    let themeBg = "bg-amber-500/[0.04]";
    let themeText = "text-amber-800";
    let themeBorder = "border-amber-500/20";
    let themeBadge = "bg-amber-500 text-white";
    
    const empBiz = emp.business === "linia" ? "linia_karge" : emp.business;
    if (empBiz.startsWith("linia")) {
      themeHex = "#f59e0b";
      themeBg = isSimulatedPreview ? "bg-amber-50" : "bg-amber-500/[0.04]";
      themeText = "text-amber-800";
      themeBorder = "border-amber-500/20";
      themeBadge = "bg-amber-500 text-white";
    } else if (empBiz === "massimo") {
      themeHex = "#6366f1";
      themeBg = isSimulatedPreview ? "bg-indigo-50" : "bg-indigo-500/[0.04]";
      themeText = "text-indigo-800";
      themeBorder = "border-indigo-500/20";
      themeBadge = "bg-indigo-600 text-white";
    } else if (empBiz === "liston") {
      themeHex = "#10b981";
      themeBg = isSimulatedPreview ? "bg-emerald-50" : "bg-emerald-500/[0.04]";
      themeText = "text-emerald-800";
      themeBorder = "border-emerald-500/20";
      themeBadge = "bg-emerald-600 text-white";
    }

    if (densityMode === "1") {
      // FULL DOSSIER
      return (
        <div 
          className={`flex flex-col justify-between h-full w-full bg-white relative overflow-hidden select-none text-right md:text-left ${isSimulatedPreview ? 'p-3' : 'p-8 min-h-[265mm] border border-slate-200 rounded-[35px]'}`}
          style={{ 
            boxSizing: "border-box" 
          }}
        >
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 w-full h-[6px]" style={{ backgroundColor: themeHex }} />

          <div>
            {/* Top Brand Header */}
            {pdfConfig.showCorporateHeader && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5.5 h-5.5 text-slate-800" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-[10px] font-black text-slate-900 tracking-wider uppercase font-sans">
                      {language === "ku" ? "کۆمەڵەی لێنیا و هاوبەشەکانی" : "LENYA & AFFILIATES GROUP"}
                    </h2>
                    <span className="text-[8px] font-bold text-slate-400 font-sans tracking-wide block">
                      {language === "ku" ? "سیستەمی فەرمی ناوەندی سەرچاوە مرۆییەکان" : "Unified Corporate HR Management Dossier"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    {language === "ku" ? "کۆدی دۆسیە" : "DOSSIER REF ID"}
                  </div>
                  <div className="text-[10px] font-black text-slate-800 font-sans tracking-wider">
                    #HR-{emp.id.substring(0, 7).toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Block */}
            <div className="grid grid-cols-12 gap-6 mb-5 items-center bg-slate-50/50 border border-slate-100 p-4 rounded-[22px]">
              {pdfConfig.showPhoto && (
                <div className="col-span-4 flex justify-center">
                  {emp.photoUrl ? (
                    <div className="relative p-0.5 bg-white border border-slate-200 shadow-xs rounded-full">
                      <img 
                        src={emp.photoUrl} 
                        alt={emp.name} 
                        className="w-24 h-24 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 text-slate-400">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
              )}
              
              <div className={`${pdfConfig.showPhoto ? "col-span-8" : "col-span-12"} space-y-2.5 text-right md:text-left`}>
                <div>
                  <h1 className="text-base font-black text-slate-900 tracking-tight font-display mb-0.5">{emp.name}</h1>
                  <p className="text-[10px] font-bold text-slate-500 font-sans uppercase tracking-wider">{emp.role}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 justify-end md:justify-start">
                  <span className={`text-[8px] font-black uppercase tracking-wider leading-none px-2 py-0.5 rounded-full border ${themeBg} ${themeText} ${themeBorder}`}>
                    {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : emp.business}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-wider leading-none px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                    {emp.status === "active" ? (language === "ku" ? "چالاک" : "Active") : emp.status === "suspended" ? (language === "ku" ? "ڕاگیراو" : "Suspended") : (language === "ku" ? "خانەنشین" : "Retired")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] pt-2 border-t border-slate-100/80">
                  <div>
                    <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">{language === "ku" ? "بزنس / لقی دیاریکراو" : "Sector branch"}</div>
                    <div className="font-bold text-slate-700 truncate">{biz ? (language === "ku" ? biz.typeKu : biz.typeEn) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">{language === "ku" ? "ڕێکەوتی دامەزراندن" : "Onboarding"}</div>
                    <div className="font-bold text-slate-700 font-sans">{formatDateToDDMMYYYY(emp.hireDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informational blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core Personal Details Card */}
              {pdfConfig.showPersonalDetails && (
                <div className="border border-slate-150 p-4 rounded-[20px] bg-white">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    {language === "ku" ? "زانیاری کەسیی سەرەکی" : "Core Personal Profile"}
                  </h3>
                  
                  <div className="space-y-1.5 text-[10px] font-semibold">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100/50">
                      <span className="text-slate-400">{language === "ku" ? "ڕێکەوتی لەدایکبوون" : "Birth Date"}</span>
                      <span className="text-slate-800 font-sans">{formatDateToDDMMYYYY(emp.birthDate)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-1 border-b border-slate-100/50">
                      <span className="text-slate-400">{language === "ku" ? "بارودۆخی خێزانی" : "Marital Status"}</span>
                      <span className="text-slate-800">
                        {emp.maritalStatus === "married" ? (language === "ku" ? "هاوسەرگیریکردوو 💍" : "Married 💍") : (language === "ku" ? "سەڵت 👤" : "Single 👤")}
                      </span>
                    </div>

                    {isMarried && emp.marriageAnniversary && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-100/50 bg-amber-500/[0.02] px-2 rounded-md border border-amber-500/10">
                        <span className="text-amber-800 font-bold">{language === "ku" ? "ڕۆژی هاوسەرگیری" : "Wedding Anniv."}</span>
                        <span className="text-amber-900 font-sans font-bold">{formatDateToDDMMYYYY(emp.marriageAnniversary)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-1 border-b border-slate-100/50">
                      <span className="text-slate-400">{language === "ku" ? "ڕەگەزنامە" : "Citizenship"}</span>
                      <span className="text-slate-800">{emp.citizenship || "-"}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">{language === "ku" ? "نەتەوە" : "Ethnicity"}</span>
                      <span className="text-slate-800">{emp.ethnicity || "-"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Card */}
              {(pdfConfig.showContactPhone || pdfConfig.showEmergencyContact || pdfConfig.showResidence) && (
                <div className="border border-slate-150 p-4 rounded-[20px] bg-white">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {language === "ku" ? "پەیوەندی و ناونیشان" : "Contact & Geography"}
                  </h3>
                  
                  <div className="space-y-1.5 text-[10px] font-semibold">
                    {pdfConfig.showContactPhone && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">{language === "ku" ? "ژمارەی مۆبایل" : "Phone"}</span>
                        <span className="text-slate-800 font-sans tracking-wide">{emp.phone || "-"}</span>
                      </div>
                    )}

                    {pdfConfig.showEmergencyContact && (
                      <>
                        <div className="flex items-center justify-between py-1 border-b border-slate-100/50">
                          <span className="text-slate-400">{language === "ku" ? "فریاکەوتنی خێرا" : "Emerg. Phone"}</span>
                          <span className="text-slate-800 font-sans">{emp.emergencyContactPhone || "-"}</span>
                        </div>
                        {emp.emergencyContactRelation && (
                          <div className="flex items-center justify-between py-1 border-b border-slate-100/50">
                            <span className="text-slate-400">{language === "ku" ? "پەیوەندی فریاکەوتن" : "Emerg. Relation"}</span>
                            <span className="text-slate-800">{emp.emergencyContactRelation}</span>
                          </div>
                        )}
                      </>
                    )}

                    {pdfConfig.showResidence && (
                      <div className="flex items-start justify-between py-1">
                        <span className="text-slate-400 shrink-0">{language === "ku" ? "ناونیشان" : "Residence"}</span>
                        <span className="text-slate-850 text-right leading-tight max-w-[130px] font-medium block">
                          {emp.residenceAddress || "-"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Stamp and Authorization Info */}
          {pdfConfig.showStampArea && (
            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                <svg className="w-8 h-8 text-slate-700 shrink-0 border border-slate-200 p-0.5 bg-white rounded-md" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="10" y="10" width="20" height="20" />
                  <rect x="70" y="10" width="20" height="20" />
                  <rect x="10" y="70" width="20" height="20" />
                  <rect x="35" y="35" width="30" height="30" />
                  <rect x="40" y="10" width="10" height="15" />
                  <rect x="80" y="40" width="10" height="20" />
                </svg>
                <div className="text-[7px] font-bold text-slate-400 leading-snug font-sans">
                  {language === "ku" ? "چاپکراو لە ئەرشیفی" : "Printed from certified systems"}
                  <span className="text-slate-500 font-semibold block">{new Date().toLocaleDateString('ku-IQ')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {language === "ku" ? "مۆر و واژۆ" : "STAMP"}
                </div>
                <div className="inline-block w-24 border-b border-dashed border-slate-300 h-3"></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (densityMode === "2") {
      // 2 EMPLOYEES PER PAGE (HALF PAGE CARD)
      return (
        <div 
          className={`flex flex-col justify-between h-full w-full bg-white relative overflow-hidden text-right md:text-left ${isSimulatedPreview ? 'p-2' : 'p-5 border border-slate-200 rounded-[24px]'}`}
          style={{ boxSizing: "border-box" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-2xl opacity-10 pointer-events-none bg-slate-400" />
          <div className="absolute top-0 left-0 w-full h-[4px]" style={{ backgroundColor: themeHex }} />

          <div>
            {/* Minimal Header */}
            {pdfConfig.showCorporateHeader && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-[8px] font-black tracking-wider text-slate-800">
                  {language === "ku" ? "کۆمەڵەی لێنیا" : "LENYA GROUP"}
                </span>
                <span className="text-[8px] font-bold text-slate-400 font-mono">
                  #HR-{emp.id.substring(0, 5).toUpperCase()}
                </span>
              </div>
            )}

            {/* Profile split */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl mb-2.5">
              {pdfConfig.showPhoto && (
                <div className="shrink-0">
                  {emp.photoUrl ? (
                    <img 
                      src={emp.photoUrl} 
                      alt={emp.name} 
                      className="w-14 h-14 rounded-full object-cover border border-slate-200 bg-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-slate-900 truncate mb-0.5">{emp.name}</h3>
                <p className="text-[9px] font-extrabold text-slate-500 leading-none">{emp.role}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${themeBg} ${themeText}`}>
                    {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : emp.business}
                  </span>
                </div>
              </div>
            </div>

            {/* Combined compact details list */}
            <div className="grid grid-cols-2 gap-3 text-[9px] text-slate-700">
              {pdfConfig.showPersonalDetails && (
                <div className="space-y-1">
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-400">{language === "ku" ? "لەدایکبوون" : "Birth"}</span>
                    <span className="font-semibold font-sans">{formatDateToDDMMYYYY(emp.birthDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === "ku" ? "خێزانی" : "Marital"}</span>
                    <span className="font-semibold truncate">
                      {emp.maritalStatus === "married" ? (language === "ku" ? "هاوسەرگیر" : "Married") : (language === "ku" ? "سەڵت" : "Single")}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                {pdfConfig.showContactPhone && (
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-400">{language === "ku" ? "مۆبایل" : "Phone"}</span>
                    <span className="font-semibold font-sans truncate">{emp.phone || "-"}</span>
                  </div>
                )}
                {pdfConfig.showEmergencyContact && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === "ku" ? "فریاکەوتن" : "Emerg"}</span>
                    <span className="font-semibold font-sans truncate">{emp.emergencyContactPhone || "-"}</span>
                  </div>
                )}
              </div>
            </div>
            
            {pdfConfig.showResidence && emp.residenceAddress && (
              <div className="text-[8px] text-slate-500 mt-2 p-1.5 bg-slate-50 rounded border border-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                <span className="font-bold text-slate-400 mr-1">{language === "ku" ? "ناونیشان:" : "Address:"}</span>
                {emp.residenceAddress}
              </div>
            )}
          </div>

          {pdfConfig.showStampArea && (
            <div className="border-t border-slate-100 pt-1.5 mt-2 flex items-center justify-between text-[8px]">
              <span className="text-slate-400 font-mono">HR Verified {new Date().toLocaleDateString()}</span>
              <div className="inline-block w-16 border-b border-dashed border-slate-300 h-1"></div>
            </div>
          )}
        </div>
      );
    }

    if (densityMode === "4") {
      // 4 EMPLOYEES PER PAGE (QUARTER BADGE 2x2 GRID)
      return (
        <div 
          className={`flex flex-col justify-between h-full w-full bg-white relative overflow-hidden text-right md:text-left ${isSimulatedPreview ? 'p-1.5' : 'p-3.5 border border-slate-200 rounded-[16px]'}`}
          style={{ boxSizing: "border-box" }}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: themeHex }} />

          <div className="pl-2">
            {/* Card row header */}
            <div className="flex items-center justify-between border-b border-slate-100/60 pb-1 mb-1.5">
              <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 rounded ${themeBg} ${themeText}`}>
                {biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : emp.business}
              </span>
              <span className="text-[7.5px] font-bold text-slate-400 font-sans">#HR-{emp.id.substring(0, 4).toUpperCase()}</span>
            </div>

            {/* Profile minimal flex */}
            <div className="flex items-center gap-2 mb-2">
              {pdfConfig.showPhoto && (
                <div className="shrink-0">
                  {emp.photoUrl ? (
                    <img 
                      src={emp.photoUrl} 
                      alt={emp.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-150"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1 leading-normal">
                <h4 className="text-[10px] font-black text-slate-900 truncate leading-tight">{emp.name}</h4>
                <p className="text-[8px] font-semibold text-slate-500 truncate leading-tight">{emp.role}</p>
                {pdfConfig.showContactPhone && emp.phone && (
                  <span className="text-[7.5px] text-slate-600 font-sans tracking-wide block leading-tight">{emp.phone}</span>
                )}
              </div>
            </div>

            {/* Ultra minimal items list */}
            <div className="space-y-0.5 text-[8.5px] text-slate-700 bg-slate-50 p-1 rounded-lg border border-slate-100/50">
              {pdfConfig.showPersonalDetails && (
                <div className="flex justify-between leading-none py-0.5">
                  <span className="text-slate-455">{language === "ku" ? "لەدایکبوون" : "Birth"}</span>
                  <span className="font-bold text-slate-700 font-sans">{formatDateToDDMMYYYY(emp.birthDate)}</span>
                </div>
              )}
              {pdfConfig.showEmergencyContact && emp.emergencyContactPhone && (
                <div className="flex justify-between leading-none py-0.5">
                  <span className="text-slate-450">{language === "ku" ? "بۆنەی نزیک" : "Emergency"}</span>
                  <span className="font-semibold text-slate-700 font-sans">{emp.emergencyContactPhone}</span>
                </div>
              )}
              {pdfConfig.showResidence && emp.residenceAddress && (
                <div className="flex justify-between leading-none py-0.5 truncate gap-1">
                  <span className="text-slate-450 shrink-0">{language === "ku" ? "ناوچە" : "Location"}</span>
                  <span className="font-semibold text-slate-700 truncate">{emp.residenceAddress}</span>
                </div>
              )}
            </div>
          </div>

          {pdfConfig.showStampArea && (
            <div className="border-t border-slate-100 pt-1 flex items-center justify-between text-[7px] text-slate-450 leading-none pl-2">
              <span>{language === "ku" ? "پەسەندکراوە" : "HR Validated"}</span>
              <span className="font-mono">{new Date().toLocaleDateString(language === "ku" ? "ku-IQ" : "en-US")}</span>
            </div>
          )}
        </div>
      );
    }

    if (densityMode === "9") {
      // 9 EMPLOYEES PER PAGE (3x3 MICRO IDENTIFICATION LABELS)
      return (
        <div 
          className={`flex flex-col justify-between h-full w-full bg-white relative overflow-hidden text-right md:text-left ${isSimulatedPreview ? 'p-1' : 'p-2.5 border border-slate-150 rounded-[10px]'}`}
          style={{ boxSizing: "border-box" }}
        >
          {/* Accent thin top line */}
          <div className="absolute top-0 left-0 w-full h-[2.5px]" style={{ backgroundColor: themeHex }} />

          <div className="text-[7.5px] font-sans text-slate-400 font-extrabold pb-0.5 border-b border-slate-105 select-none flex justify-between leading-none">
            <span>#{emp.id.substring(0, 4).toUpperCase()}</span>
            <span>{biz ? (language === "ku" ? biz.nameKu : biz.nameEn) : emp.business}</span>
          </div>

          <div className="flex items-center gap-1.5 my-1 min-w-0">
            {pdfConfig.showPhoto && (
              <div className="shrink-0">
                {emp.photoUrl ? (
                  <img 
                    src={emp.photoUrl} 
                    alt={emp.name} 
                    className="w-7 h-7 rounded-full object-cover border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] bg-slate-50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-350 border border-slate-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1 leading-normal">
              <h5 className="text-[8px] font-black text-slate-900 truncate leading-none mb-0.5">{emp.name}</h5>
              <p className="text-[7px] font-bold text-slate-500 truncate leading-none">{emp.role}</p>
              {pdfConfig.showContactPhone && emp.phone && (
                <p className="text-[6.5px] text-slate-450 font-mono tracking-tighter truncate mt-0.5 leading-none">{emp.phone}</p>
              )}
            </div>
          </div>

          <div className="text-[6px] text-slate-400 leading-none pt-0.5 border-t border-slate-100 flex items-center justify-between font-mono">
            <span>OFFICIAL ID</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      );
    }
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

          {isSuperAdmin && (
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition duration-200 cursor-pointer"
              title={language === "ku" ? "داگرتنی دۆسیە بە فایلی PDF ڕوون" : "Export Selected Profiles as Beautiful Graphical PDF"}
            >
              <Printer className="w-4 h-4" />
              <span>
                {language === "ku"
                  ? (selectedEmpIds.length > 0 ? `داگرتنی PDF (${selectedEmpIds.length})` : "داگرتنی PDF")
                  : (selectedEmpIds.length > 0 ? `Export PDF (${selectedEmpIds.length})` : "Export PDF")
                }
              </span>
            </button>
          )}

          {userSession?.role !== "observer" && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-950 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition duration-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {t.addEmployee}
            </button>
          )}
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

            const isNew = isNewEmployee(emp, systemDate);

            return (
              <div 
                key={emp.id}
                className={`bg-white/45 backdrop-blur-md rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-white/70 border relative ${
                  selectedEmpIds.includes(emp.id)
                    ? "border-amber-500 ring-2 ring-amber-500/10 shadow bg-white/70"
                    : "border-white/70"
                }`}
                id={`emp-card-${emp.id}`}
              >
                {isNew && (
                  <span className={`absolute -top-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)] animate-pulse border border-emerald-400 select-none z-10 flex items-center gap-1 ${
                    language === "ku" ? "left-6" : "right-6"
                  }`}>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {language === "ku" ? "نوێ" : "NEW"}
                  </span>
                )}
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
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow bg-slate-100 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-100/80 border border-slate-200/50 flex items-center justify-center shadow-inner text-slate-400 shrink-0">
                          <User className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800 font-display leading-tight">{emp.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold font-sans mt-0.5 leading-none">
                          {emp.role}
                          {emp.hireDate && (
                            <span className="text-[10px] text-slate-400 font-mono font-medium ml-1.5 whitespace-nowrap">
                              ({formatDateToDDMMYYYY(emp.hireDate)}) ({formatServiceTenure(emp.hireDate, language)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSuperAdmin && emp.reportText && emp.reportStatus === "pending" && (
                        <div 
                          className="bg-rose-500 text-white p-1.5 rounded-full animate-bounce shrink-0 shadow-sm"
                          title={language === "ku" ? `ڕاپۆرتی زانیاری هەڵە هەیە: ${emp.reportText}` : `Has incorrect info report: ${emp.reportText}`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border ${statusConfig[emp.status]} shadow-sm shrink-0`}>
                        {emp.status === "active" ? t.active : emp.status === "suspended" ? t.suspended : t.retired}
                      </span>
                    </div>
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
                      <span className="font-mono text-slate-800 font-bold">{formatDateToDDMMYYYY(emp.birthDate)}</span>
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
                        <span className="font-mono text-rose-800 font-black">{formatDateToDDMMYYYY(emp.marriageAnniversary)}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 mt-1">
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="text-slate-500 font-bold">{t.hireDate}</span>
                        <span className="font-mono text-slate-700 font-black">{formatDateToDDMMYYYY(emp.hireDate)}</span>
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

                    {/* Attachments & Notes List for Employee */}
                    {(emp.passportOrNationalCardUrl || emp.iqamaUrl || emp.notes) && (
                      <div className="border-t border-slate-150 pt-3 mt-3.5 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          📂 {language === "ku" ? "بەڵگەنامەکان و تێبینییەکان" : "Documents & Notes"}
                        </span>

                        {emp.passportOrNationalCardUrl && (
                          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                              📄 {language === "ku" ? "پاسپۆرت / کارتی نیشتیمانی" : "Passport / National ID"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = emp.passportOrNationalCardUrl!;
                                link.download = `${emp.name.trim().replace(/\s+/g, "_")}_passport.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-lg border border-indigo-200/40 flex items-center gap-1 transition"
                            >
                              <Download className="w-3 h-3" />
                              {language === "ku" ? "داگرتن" : "Download"}
                            </button>
                          </div>
                        )}

                        {emp.iqamaUrl && (
                          <div className="flex items-center justify-between p-2 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                            <span className="text-[11px] font-extrabold text-emerald-850 flex items-center gap-1">
                              💳 {language === "ku" ? "کۆپی ئیقامە" : "Residency Copy (Iqama)"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = emp.iqamaUrl!;
                                link.download = `${emp.name.trim().replace(/\s+/g, "_")}_iqama.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-lg border border-emerald-200/40 flex items-center gap-1 transition"
                            >
                              <Download className="w-3 h-3" />
                              {language === "ku" ? "داگرتن" : "Download"}
                            </button>
                          </div>
                        )}

                        {emp.notes && (
                          <div className="p-2.5 bg-amber-500/5 border border-dashed border-amber-200/40 rounded-xl mt-1">
                            <span className="text-[10px] font-black text-amber-800 block mb-1">
                              📝 {language === "ku" ? "تێبینییەکان:" : "Notes / Remarks:"}
                            </span>
                            <p className="text-[11px] text-slate-700 leading-normal font-sans whitespace-pre-wrap">
                              {emp.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-2">
                  {isSuperAdmin && emp.reportText && emp.reportStatus === "pending" && (
                    <div className="p-3 bg-rose-50 border border-rose-150 rounded-2xl flex flex-col gap-2 text-rose-850 text-xs">
                      <div className="flex items-start gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <span className="text-rose-955 font-black">
                            {language === "ku" ? `ڕاپۆرتی زانیاری هەڵە لەلایەن: ${emp.reportUser || "ئەدمین"}` : `Incorrect Info reported by: ${emp.reportUser || "Admin"}`}
                          </span>
                          <p className="text-[10.5px] text-rose-800 mt-1 font-semibold font-sans bg-white/75 p-2 rounded-xl border border-red-500/10 leading-relaxed whitespace-pre-wrap">
                            {emp.reportText}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-0.5">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onUpdateEmployee(emp.id, { reportStatus: "resolved" });
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          {language === "ku" ? "ئۆکەی، خوێندمەوە" : "OK, Acknowledged"}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 justify-between items-center flex-wrap">
                    <div>
                      {isSuperAdmin && emp.createdBy && (
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 select-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>{language === "ku" ? "زیادکراوە لەلایەن: " : "Created by: "}</span>
                          <span className="font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md font-mono">{emp.createdBy}</span>
                        </div>
                      )}
                    </div>
                    {/* Actions buttons */}
                    <div className="flex gap-2 justify-end items-center">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="transition active:scale-95"
                      title={(userSession?.role === "admin" || userSession?.role === "observer") ? (language === "ku" ? "بینینی زانیاری" : "View Details") : (language === "ku" ? "دەستکاریکردنی فۆرم" : "Edit Profile")}
                    >
                      {(userSession?.role === "admin" || userSession?.role === "observer") ? (
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
                    {userSession?.role === "observer" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportingEmployee(emp);
                          setReportValue("");
                          setShowReportModal(true);
                        }}
                        className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        title={language === "ku" ? "ڕاپۆرتکردنی زانیاری نادروست" : "Report Incorrect Info"}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        {language === "ku" ? "ڕاپۆرتکردن" : "Report"}
                      </button>
                    )}
                    {userSession?.role !== "admin" && userSession?.role !== "observer" && (
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
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Profile Dialog Box */}
      {showAddModal && (() => {
        const isReadOnly = !!((userSession?.role === "admin" || userSession?.role === "observer") && editingEmployee);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] max-w-lg w-full max-h-[calc(100vh-2rem)] sm:max-h-[85vh] border border-white shadow-2xl flex flex-col overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between bg-slate-950 text-white p-5 sm:p-6">
                <h3 className="font-display font-black text-base sm:text-lg flex items-center gap-2">
                  <SmileIcon />
                  {editingEmployee 
                    ? ((userSession?.role === "admin" || userSession?.role === "observer") 
                      ? (language === "ku" ? "بینینی زانیاری کارمەند" : "View Employee Profile") 
                      : t.editEmployee) 
                    : t.addEmployee}
                </h3>
                <button 
                  onClick={() => { stopCamera(); setShowAddModal(false); }}
                  className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                
                {isSuperAdmin && editingEmployee?.reportText && editingEmployee?.reportStatus === "pending" && (
                  <div className="p-3 bg-rose-50 border border-rose-150 rounded-2xl flex flex-col gap-2 text-rose-850 text-xs shadow-sm">
                    <div className="flex items-start gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="text-rose-955 font-black">
                          {language === "ku" ? `ڕاپۆرتی زانیاری هەڵە لەلایەن: ${editingEmployee.reportUser || "ئەدمین"}` : `Incorrect Info reported by: ${editingEmployee.reportUser || "Admin"}`}
                        </span>
                        <p className="text-[10.5px] text-rose-800 mt-1 font-semibold font-sans bg-white/75 p-2 rounded-xl border border-red-500/10 leading-relaxed whitespace-pre-wrap">
                          {editingEmployee.reportText}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingEmployee) return;
                          await onUpdateEmployee(editingEmployee.id, { reportStatus: "resolved" });
                          setEditingEmployee({
                            ...editingEmployee,
                            reportStatus: "resolved"
                          });
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        {language === "ku" ? "ئۆکەی، خوێندمەوە (چاککراو)" : "OK, Acknowledged"}
                      </button>
                    </div>
                  </div>
                )}
                
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
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md bg-white text-xs text-slate-400" 
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center shadow-inner text-slate-400">
                        <User className="w-12 h-12" />
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
                      <div className="flex gap-2 relative">
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

                        {/* Super Admin Edit Photo Options */}
                        {isSuperAdmin && formData.photoUrl && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowPhotoEditDropdown(!showPhotoEditDropdown)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-indigo-950 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-indigo-650 shrink-0" />
                              <span>{language === "ku" ? "دەستکاری" : "Edit"}</span>
                            </button>

                            {showPhotoEditDropdown && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30" 
                                  onClick={() => setShowPhotoEditDropdown(false)} 
                                />
                                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-40 p-1.5 flex flex-col gap-1 transform origin-top-right transition-all scale-100 border border-slate-200 leading-normal">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setImageToCrop(formData.photoUrl);
                                      setShowPhotoEditDropdown(false);
                                    }}
                                    className="w-full text-right px-3 py-2 text-xs font-semibold text-slate-755 hover:bg-indigo-50 hover:text-indigo-900 rounded-xl flex items-center gap-2 transition cursor-pointer"
                                  >
                                    <Crop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>{language === "ku" ? "کرۆپکردنەوەی وێنە" : "Re-crop Image"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!formData.photoUrl) return;
                                      const link = document.createElement("a");
                                      link.href = formData.photoUrl;
                                      const safeName = formData.name.trim().replace(/\s+/g, "_") || "employee_photo";
                                      link.download = `${safeName}.png`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      setShowPhotoEditDropdown(false);
                                    }}
                                    className="w-full text-right px-3 py-2 text-xs font-semibold text-slate-755 hover:bg-indigo-50 hover:text-indigo-900 rounded-xl flex items-center gap-2 transition cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{language === "ku" ? "داونلۆدکردنی وێنە" : "Download Photo"}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
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
                      disabled={isReadOnly || userSession?.role === "admin" || userSession?.role === "observer"}
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

                  {/* Part 1: National Card or Passport Uploader */}
                  <div className="col-span-full border border-slate-100 bg-slate-50/50 rounded-2xl p-4 mt-2">
                    <div className="mb-3">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        📄 {language === "ku" ? "کارتی نیشتیمانی یان پاسپۆرت" : "National Card or Passport"} <span className="text-rose-500 font-bold">*</span>
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {language === "ku" ? "تکایە وێنەیەکی ڕوونی کارتی نیشتیمانی یان پاسپۆرتەکە بەرزبکەرەوە یان بگرە" : "Please upload or capture a clear photo of the national card or passport"}
                      </p>
                    </div>

                    {/* Passport preview and control */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="w-full md:w-1/2 flex flex-col gap-2">
                        {formData.passportOrNationalCardUrl ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[16/10] flex items-center justify-center">
                            <img
                              src={formData.passportOrNationalCardUrl}
                              alt="Passport"
                              className="w-full h-full object-contain max-h-[160px]"
                            />
                            {/* View/Download icon overlay for read-only or any mode */}
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = formData.passportOrNationalCardUrl!;
                                link.download = `${formData.name.trim().replace(/\s+/g, "_")}_passport.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="absolute bottom-2 right-2 bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded-full shadow-md transition"
                              title={language === "ku" ? "داونلۆدکردنی بەڵگەنامە" : "Download Document"}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, passportOrNationalCardUrl: "" })}
                                className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-300 bg-white w-full rounded-xl aspect-[16/10] flex flex-col items-center justify-center text-slate-400 p-4 text-center select-none max-h-[160px]">
                            <FileText className="w-8 h-8 text-slate-300 mb-1" />
                            <span className="text-[11px] font-bold">
                              {language === "ku" ? "هیچ بەڵگەنامەیەک بارنەکراوە" : "No document selected"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Controls for Passport Upload/Capture */}
                      {!isReadOnly && (
                        <div className="w-full md:w-1/2 flex flex-col gap-2">
                          <div className="flex gap-2">
                            {/* File Upload Button */}
                            <label className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-700 font-bold shadow-sm cursor-pointer transition">
                              <Upload className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{language === "ku" ? "بۆگەڕان / بارکردن" : "Upload File"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      const compressed = await compressImageBase64(reader.result as string, 800, 800, 0.6);
                                      setFormData((prev) => ({ ...prev, passportOrNationalCardUrl: compressed }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            {/* Camera Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (activeDocCamera === "passport") {
                                  stopDocCamera();
                                } else {
                                  startDocCamera("passport");
                                }
                              }}
                              className={`flex-1 px-3 py-2 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition ${
                                activeDocCamera === "passport"
                                  ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold animate-pulse"
                                  : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>
                                {activeDocCamera === "passport"
                                  ? (language === "ku" ? "پارسە" : "Close")
                                  : (language === "ku" ? "کردنەوەی کامێرا" : "Use Camera")}
                              </span>
                            </button>
                          </div>

                          {/* Live Doc Camera Frame */}
                          {activeDocCamera === "passport" && (
                            <div className="bg-slate-900 rounded-xl p-2 relative overflow-hidden flex flex-col items-center gap-2 border border-slate-800 animate-fade-in w-full">
                              <video
                                id="doc-camera-stream-passport"
                                autoPlay
                                playsInline
                                className="w-full max-h-[140px] object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => captureDocPhoto("passport")}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg flex items-center gap-1 shadow-md transition"
                              >
                                <Camera className="w-3.5 h-3.5 shrink-0" />
                                {language === "ku" ? "گرتنی وێنە" : "Capture Photo"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part 2: Information Card or Residency Card / Iqama Uploader */}
                  <div className="col-span-full border border-teal-100 bg-teal-50/20 rounded-2xl p-4 mt-2">
                    <div className="mb-3">
                      <span className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                        💳 {language === "ku" ? "کارتی زانیاری یان کارتی نشینگە (ئیقامە)" : "Information Card or Residency Card (Iqama)"} <span className="text-teal-600 font-bold">*</span>
                      </span>
                      <p className="text-[10px] text-teal-800 mt-0.5">
                        {language === "ku" ? "وێنەیەکی ڕوونی کارتی زانیاری یان کارتی نیشتەجێبوون (ئیقامە) باربکە یان بگرە" : "Please upload or capture a clear photo of the information card or residency permit card (iqama)"}
                      </p>
                    </div>

                    {/* Iqama preview and control */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="w-full md:w-1/2 flex flex-col gap-2">
                        {formData.iqamaUrl ? (
                          <div className="relative group rounded-xl overflow-hidden border border-teal-200 bg-white aspect-[16/10] flex items-center justify-center">
                            <img
                              src={formData.iqamaUrl}
                              alt="Residency Document"
                              className="w-full h-full object-contain max-h-[160px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = formData.iqamaUrl!;
                                link.download = `${formData.name.trim().replace(/\s+/g, "_")}_residency.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="absolute bottom-2 right-2 bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded-full shadow-md transition"
                              title={language === "ku" ? "داونلۆدکردنی بەڵگەنامە" : "Download Document"}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, iqamaUrl: "" })}
                                className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-teal-200 bg-white w-full rounded-xl aspect-[16/10] flex flex-col items-center justify-center text-teal-600/70 p-4 text-center select-none max-h-[160px]">
                            <FileText className="w-8 h-8 text-teal-400 mb-1" />
                            <span className="text-[11px] font-bold">
                              {language === "ku" ? "هیچ بەڵگەنامەیەک بارنەکراوە" : "No document selected"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Controls for Residency Upload/Capture */}
                      {!isReadOnly && (
                        <div className="w-full md:w-1/2 flex flex-col gap-2">
                          <div className="flex gap-2">
                            {/* File Upload Button */}
                            <label className="flex-1 px-3 py-2 bg-white hover:bg-teal-50 border border-teal-200 hover:border-teal-300 rounded-xl flex items-center justify-center gap-1.5 text-xs text-teal-800 font-bold shadow-sm cursor-pointer transition">
                              <Upload className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{language === "ku" ? "بۆگەڕان / بارکردن" : "Upload File"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      const compressed = await compressImageBase64(reader.result as string, 800, 800, 0.6);
                                      setFormData((prev) => ({ ...prev, iqamaUrl: compressed }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            {/* Camera Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (activeDocCamera === "iqama") {
                                  stopDocCamera();
                                } else {
                                  startDocCamera("iqama");
                                }
                              }}
                              className={`flex-1 px-3 py-2 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition ${
                                activeDocCamera === "iqama"
                                  ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold animate-pulse"
                                  : "bg-white hover:bg-teal-50 border-teal-200 hover:border-teal-300 text-teal-850"
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>
                                {activeDocCamera === "iqama"
                                  ? (language === "ku" ? "پارسە" : "Close")
                                  : (language === "ku" ? "کردنەوەی کامێرا" : "Use Camera")}
                              </span>
                            </button>
                          </div>

                          {/* Live Doc Camera Frame */}
                          {activeDocCamera === "iqama" && (
                            <div className="bg-slate-900 rounded-xl p-2 relative overflow-hidden flex flex-col items-center gap-2 border border-slate-800 animate-fade-in w-full">
                              <video
                                id="doc-camera-stream-iqama"
                                autoPlay
                                playsInline
                                className="w-full max-h-[140px] object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => captureDocPhoto("iqama")}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] rounded-lg flex items-center gap-1 shadow-md transition"
                              >
                                <Camera className="w-3.5 h-3.5 shrink-0" />
                                {language === "ku" ? "گرتنی وێنە" : "Capture Photo"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part 3: Custom Notes Field at the end of the form */}
                  <div className="col-span-full">
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      📝 {language === "ku" ? "تێبینییەکان" : "Notes / Remarks"}
                    </label>
                    <textarea
                      disabled={isReadOnly}
                      rows={2.5}
                      placeholder={language === "ku" ? "تێبینی کوورت یان زانیاری زیاتر بنووسە..." : "Enter additional notes, details, exceptions or comments..."}
                      className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-75 resize-none leading-normal"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end border-t border-slate-100 pt-5 mt-2">
                  {isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportingEmployee(editingEmployee);
                        setReportValue("");
                        setShowReportModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 hover:opacity-90 shadow-md shadow-red-600/10 cursor-pointer active:scale-95"
                    >
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      {language === "ku" ? "ناردنی ڕاپۆرت" : "Send Report"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { stopCamera(); setShowAddModal(false); }}
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
                  onCrop={async (croppedData) => {
                    const compressed = await compressImageBase64(croppedData, 300, 300, 0.55);
                    setFormData((prev) => ({ ...prev, photoUrl: compressed }));
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

      {showPDFConfigModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="pdf-configurer-modal">
          <div className="bg-white/95 backdrop-blur-xl border border-white/90 shadow-2xl rounded-[36px] w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col scale-in">
            {/* Header */}
            <div className="p-6 border-b border-rose-100/10 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-black text-slate-800">
                    {language === "ku" ? "کۆنتڕۆڵ و دیزاینکردنی فایلی چاپکراوی A4" : "Custom A4 Printing Layout & Design"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {language === "ku"
                      ? "پێش چاپکردن چڕی کارمەندان و شێوازی دەرکەوتنی زانیاڕییەکان ساز بکە"
                      : "Control and design how employee profiles sit dynamically within the A4 dimensions before printing."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPDFConfigModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition animate-hover-wave cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
              {/* Controls Column */}
              <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-6 overflow-y-auto">
                {/* 1. Grid Density Selector */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-550 mb-3">
                    {language === "ku" ? "چڕی لاپەڕە (کارمەند کە لەسەر زمانەیەکی A4 دەبێت)" : "Layout Density (Employees Per A4)"}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "1", labelKu: "١ کارمەند / فۆرمی گەورە", labelEn: "1 Employee (Full Dossier)", infoKu: "دۆسیەی زانیاری هەمەلایەنە بە تەواوی زانیاریەکان", infoEn: "Complete personnel file" },
                      { id: "2", labelKu: "٢ کارمەند / لاپەڕە", labelEn: "2 Employees / A4 Sheet", infoKu: "دۆسیەی بچووککراوەی نیو لاپەڕە", infoEn: "Compact dual layouts" },
                      { id: "4", labelKu: "٤ کارمەند / لاپەڕە", labelEn: "4 Employees / A4 Sheet", infoKu: "کارتی پشکنین و هەڵسەنگاندن", infoEn: "Quarter badge grid" },
                      { id: "9", labelKu: "٩ کارمەند / هێمای مۆڵەت", labelEn: "9 Employees / A4 Sheet", infoKu: "کارتی ناسنامەی بچووکی نۆخانەیی", infoEn: "ID labels matrix" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPdfConfig(prev => ({ ...prev, density: opt.id as "1" | "2" | "4" | "9" }))}
                        className={`p-3 rounded-xl border text-right lg:text-left transition-all ${
                          pdfConfig.density === opt.id
                            ? "bg-red-50 border-red-500 text-red-950 shadow-sm"
                            : "bg-white border-slate-200/60 hover:border-slate-350 text-slate-600"
                        }`}
                      >
                        <div className="font-extrabold text-xs block truncate">
                          {language === "ku" ? opt.labelKu : opt.labelEn}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold block leading-snug mt-1 max-w-[200px] overflow-hidden text-ellipsis">
                          {language === "ku" ? opt.infoKu : opt.infoEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Visual Layer Toggles */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-550 mb-3">
                    {language === "ku" ? "دەستکاری زانیاری دەرکەوتوو" : "Visible Layer Controls"}
                  </label>
                  <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                    {[
                      { key: "showPhoto", labelKu: "وێنەی فەرمی کارمەند", labelEn: "Employee Photo" },
                      { key: "showCorporateHeader", labelKu: "سەردێڕ و لۆگۆی کۆمپانیا", labelEn: "Company Branding Header" },
                      { key: "showPersonalDetails", labelKu: "زانیارییە کەسییەکان", labelEn: "Personal Profile Details" },
                      { key: "showContactPhone", labelKu: "مۆدێلی ژمارەی مۆبایلی فەرمی", labelEn: "Primary Contact Phone" },
                      { key: "showEmergencyContact", labelKu: "کەسی فریاکەوتنى خێرا", labelEn: "Emergency Contact Numbers" },
                      { key: "showResidence", labelKu: "ناونیشانی نیشتەجێبوون", labelEn: "Residence Address" },
                      { key: "showStampArea", labelKu: "شوێنی مۆر و واژۆ", labelEn: "Authorized HR Stamp Line" }
                    ].map((item) => {
                      const enabled = (pdfConfig as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => setPdfConfig(prev => ({ ...prev, [item.key]: !enabled }))}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200/50 hover:bg-slate-50 rounded-xl transition cursor-pointer select-none"
                        >
                          <span className="text-xs font-extrabold text-slate-700">
                            {language === "ku" ? item.labelKu : item.labelEn}
                          </span>
                          <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${enabled ? 'bg-red-600 justify-end' : 'bg-slate-200 justify-start'}`}>
                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl flex gap-3 text-amber-900 text-[10px] font-bold leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    {language === "ku" 
                      ? "ڕێژەی چاپی کۆتایی بەپێی قیاسی A4 دیزاین کراوە و لەکاتی ناردن بە تەواوی لەگەڵ کۆنترۆڵی چاپکەری ویندۆز ڕێک دەکەوێت."
                      : "Page margins, styles and headers auto-harmonize with A4 dimensions during native printer setup."}
                  </div>
                </div>
              </div>

              {/* Preview Column */}
              <div className="lg:col-span-7 bg-slate-100 p-6 flex flex-col items-center justify-center relative overflow-y-auto max-h-[66vh] lg:max-h-full">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-1.5 self-start">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {language === "ku" ? "پێشبینی ڕوکاری لاپەڕەی یەکەم" : "A4 Sheet Page 1 Live Preview"}
                </div>

                {/* Simulated A4 Container */}
                <div className="w-full max-w-[420px] aspect-[1/1.414] bg-white border border-slate-200 shadow-2xl p-4 flex flex-col justify-between overflow-hidden relative" style={{ size: "A4" }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-10 pointer-events-none bg-slate-900" />
                  
                  {/* Cards inside simulating the page-layout */}
                  <div 
                    className="w-full h-full"
                    style={{
                      display: "grid",
                      gridTemplateColumns: pdfConfig.density === "1" ? "1fr" 
                                         : pdfConfig.density === "2" ? "1fr" 
                                         : pdfConfig.density === "4" ? "1fr 1fr" 
                                         : "1fr 1fr 1fr",
                      gridTemplateRows: pdfConfig.density === "1" ? "1fr"
                                       : pdfConfig.density === "2" ? "1fr 1fr"
                                       : pdfConfig.density === "4" ? "1fr 1fr"
                                       : "1fr 1fr 1fr",
                      gap: pdfConfig.density === "1" ? "0"
                         : pdfConfig.density === "2" ? "0.75rem"
                         : pdfConfig.density === "4" ? "0.5rem"
                         : "0.25rem"
                    }}
                  >
                    {(() => {
                      const selectedEmployees = employees.filter((e) => selectedEmpIds.includes(e.id));
                      const densityNum = parseInt(pdfConfig.density);
                      // Fill previews with existing selections redundantly so layout density occupies fully
                      const previewItems = Array.from({ length: densityNum }, (_, index) => {
                        return selectedEmployees[index % selectedEmployees.length] || employees[0];
                      });

                      return previewItems.map((emp, i) => (
                        <div key={i} className="h-full w-full overflow-hidden">
                          {renderPrintCard(emp, pdfConfig.density, true)}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Count Indicator */}
                <span className="text-[11px] font-bold text-slate-500 mt-3 block text-center bg-white/65 px-3 py-1 rounded-full border border-slate-200">
                  {language === "ku" 
                    ? `کۆی گشتی فایلی کارمەندان: ${selectedEmpIds.length} دۆسیە • کارتی جیاکراو بەپێی چڕی`
                    : `Total selected employees for queue: ${selectedEmpIds.length} profiles`}
                </span>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 justify-between items-center">
              <div className="text-xs font-bold text-slate-500">
                {language === "ku" 
                  ? `چاپکردن بەپێی ${pdfConfig.density} کارمەند لە یەک لاپەڕەدا`
                  : `Formatted as ${pdfConfig.density} profile(s) per single printed A4 page.`}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPDFConfigModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {language === "ku" ? "پاشگەزبوونەوە" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPDFConfigModal(false);
                    setTimeout(() => {
                      window.print();
                    }, 250);
                  }}
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-red-500/10 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  {language === "ku" ? "دەستپێکردنی چاپکردنی فەرمی" : "Execute Document Printing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Gorgeous Printing Overlay for Selected Employees */}
      {isSuperAdmin && (
        <div id="print-section" className="hidden print:block w-full text-slate-800">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              html, body {
                background: white !important;
                color: #1e293b !important;
                font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              #print-section, #print-section * {
                visibility: visible !important;
              }
              #print-section {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
            }
          `}} />
          
          {(() => {
            const selectedEmployees = employees.filter((e) => selectedEmpIds.includes(e.id));
            const densityNum = parseInt(pdfConfig.density);
            const finalChunks = chunkArray(selectedEmployees, densityNum);

            return finalChunks.map((chunk, chunkIndex) => {
              return (
                <div 
                  key={chunkIndex}
                  className="print-page w-[210mm] h-[297mm] max-h-[297mm] overflow-hidden bg-white relative p-6 mb-8"
                  style={{
                    pageBreakAfter: chunkIndex < finalChunks.length - 1 ? "always" : "avoid",
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateColumns: pdfConfig.density === "1" ? "1fr" 
                                       : pdfConfig.density === "2" ? "1fr" 
                                       : pdfConfig.density === "4" ? "1fr 1fr" 
                                       : "1fr 1fr 1fr",
                    gridTemplateRows: pdfConfig.density === "1" ? "1fr"
                                     : pdfConfig.density === "2" ? "1fr 1fr"
                                     : pdfConfig.density === "4" ? "1fr 1fr"
                                     : "1fr 1fr 1fr",
                    gap: pdfConfig.density === "1" ? "0"
                       : pdfConfig.density === "2" ? "1.5rem"
                       : pdfConfig.density === "4" ? "1rem"
                       : "0.75rem"
                  }}
                >
                  {chunk.map((emp) => (
                    <div key={emp.id} className="h-full w-full overflow-hidden">
                      {renderPrintCard(emp, pdfConfig.density, false)}
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      )}

      {showReportModal && reportingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in" id="report-incorrect-modal">
          <div className="bg-white/95 backdrop-blur-xl border border-white/90 shadow-2xl rounded-[36px] w-full max-w-lg overflow-hidden flex flex-col scale-in">
            {/* Header */}
            <div className="p-6 border-b border-rose-100/10 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-650 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-black text-slate-800">
                    {language === "ku" ? "ناردنی ڕاپۆرتی زانیاری هەڵە" : "Report Incorrect Information"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {language === "ku"
                      ? `ڕاپۆرت بنێرە بۆ پاڵپشتیکردنی زانیاری دروستی کارمەند: ${reportingEmployee.name}`
                      : `Send report to super admin to correct details for: ${reportingEmployee.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportingEmployee(null);
                  setReportValue("");
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === "ku"
                  ? "تکایە لێرەدا بنووسە چ زانیارییەک هەڵەیە و چی نوێ بکرێتەوە:"
                  : "Please detail what information is incorrect and how it should be updated:"}
              </label>
              <textarea
                value={reportValue}
                onChange={(e) => setReportValue(e.target.value)}
                rows={4}
                className="w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-1 focus:ring-amber-500 font-sans text-xs"
                placeholder={
                  language === "ku"
                    ? "بۆ نموونە: ژمارەی تەلەفۆنەکەی یان ناونیشانەکەی هەڵەیە و پێویستە بکرێت بە..."
                    : "e.g., Phone number or residence address is wrong, should be..."
                }
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportingEmployee(null);
                  setReportValue("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                {language === "ku" ? "پاشگەزبوونەوە" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reportValue.trim()) return;
                  
                  await onUpdateEmployee(reportingEmployee.id, {
                    reportText: reportValue,
                    reportStatus: "pending",
                    reportUser: userSession?.name || userSession?.username || "Admin",
                    reportCreatedAt: new Date().toISOString()
                  });
                  
                  setShowReportModal(false);
                  setReportingEmployee(null);
                  setReportValue("");
                  setShowAddModal(false);
                }}
                disabled={!reportValue.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                {language === "ku" ? "ناردنی ڕاپۆرت" : "Send Report"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function SmileIcon() {
  return (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
