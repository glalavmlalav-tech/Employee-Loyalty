import React, { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  doc, 
  setDoc,
  getDocs,
  getDoc
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInAnonymously
} from "firebase/auth";
import { 
  Users, 
  Gift, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Languages, 
  TrendingUp, 
  Layers, 
  RefreshCw, 
  LogOut, 
  LogIn, 
  Laptop, 
  Award,
  Sliders,
  Database,
  Lock,
  UserCheck
} from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { Employee, LoyaltyActivity, GiftLog, AlertNotification, BusinessId, BUSINESSES, AppUser } from "./types";
import { getActiveAlerts } from "./utils";

// Sub-components
import AlertsPanel from "./components/AlertsPanel";
import EmployeeDirectory from "./components/EmployeeDirectory";
import SettingsPanel from "./components/SettingsPanel";
import StaffLoginForm from "./components/StaffLoginForm";
import MonthlyPlanner from "./components/MonthlyPlanner";
import MonthlyCelebrations from "./components/MonthlyCelebrations";
import WhatsAppComposerModal from "./components/WhatsAppComposerModal";

const INITIAL_FALLBACK_EMPLOYEES: Employee[] = [
  {
    id: "emp-qasim",
    name: "قاسم مستەفا",
    business: "linia_karge" as BusinessId,
    role: "سەرۆک وەستای دارتاشی و بنیادنانی مۆبێل",
    phone: "07701235566",
    birthDate: "1985-05-27", // Occurs in 2 days from May 25! (Alert birthday)
    maritalStatus: "married" as const,
    marriageAnniversary: "2012-04-10",
    hireDate: "2018-03-01",
    loyaltyPoints: 350,
    status: "active" as const
  },
  {
    id: "emp-lane",
    name: "لانە عومەر",
    business: "linia_shorish" as BusinessId,
    role: "ئەندازیاری دیزاینی ناوەوە (Interior Designer)",
    phone: "07509874411",
    birthDate: "1993-01-15",
    maritalStatus: "married" as const,
    marriageAnniversary: "2020-05-26", // Occurs in 1 day from May 25! (Alert Anniversary)
    hireDate: "2021-06-15",
    loyaltyPoints: 520,
    status: "active" as const
  },
  {
    id: "emp-aras",
    name: "ئاراس فەرەج",
    business: "linia_shasty" as BusinessId,
    role: "بەڕێوەبەری پێشانگای ناوندی دارتاشی",
    phone: "07718882233",
    birthDate: "1982-08-11",
    maritalStatus: "single" as const,
    hireDate: "2019-10-10",
    loyaltyPoints: 280,
    status: "active" as const
  },
  {
    id: "emp-diyari",
    name: "دیاری مەسعوود",
    business: "massimo" as BusinessId,
    role: "ڕاوێژکاری باڵای مەڕمەڕ و شوورووم",
    phone: "07513334400",
    birthDate: "1990-05-25", // TODAY (Alert birthday)
    maritalStatus: "married" as const,
    marriageAnniversary: "2017-09-12",
    hireDate: "2023-01-10",
    loyaltyPoints: 150,
    status: "active" as const
  },
  {
    id: "emp-sazgar",
    name: "سازگار سەعید",
    business: "massimo" as BusinessId,
    role: "دیزاینەری دەرەکی تابلۆ و پۆرسەلین",
    phone: "0772445588",
    birthDate: "1996-03-20",
    maritalStatus: "single" as const,
    hireDate: "2024-02-15",
    loyaltyPoints: 120,
    status: "active" as const
  },
  {
    id: "emp-baxtiyar",
    name: "بەختیار حەمە",
    business: "liston" as BusinessId,
    role: "تەکنیکاری سەرەکی بڕین و سافکردنی بەرد",
    phone: "07507771122",
    birthDate: "1988-12-05",
    maritalStatus: "single" as const,
    hireDate: "2020-11-15",
    loyaltyPoints: 390,
    status: "active" as const
  },
  {
    id: "emp-peshewa",
    name: "پێشەوا قادر",
    business: "liston" as BusinessId,
    role: "سەرپەرشتیاری گشتی هێڵی پیشەسازی",
    phone: "07702224488",
    birthDate: "1984-05-26", // Tomorrow (Alert Birthday)
    maritalStatus: "married" as const,
    marriageAnniversary: "2010-05-27", // 2 Days from now (Alert anniversary!)
    hireDate: "2017-04-01",
    loyaltyPoints: 600,
    status: "active" as const
  }
];

export default function App() {
  const [language, setLanguage] = useState<"ku" | "en">("ku");
  const [activeTab, setActiveTab] = useState<"alerts" | "employees" | "planner" | "months" | "settings">("alerts");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real-time states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<LoyaltyActivity[]>([]);
  const [giftLogs, setGiftLogs] = useState<GiftLog[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [appUsersLoaded, setAppUsersLoaded] = useState(false);
  
  const [userSession, setUserSession] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem("app_user_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sandboxGuest, setSandboxGuest] = useState<string | null>(() => {
    return localStorage.getItem("loyalty_guest_name");
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<any | null>(null);

  // Active calculated Alerts
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // WhatsApp Composer State
  const [whatsappComposer, setWhatsappComposer] = useState<{
    isOpen: boolean;
    employee: Employee;
    eventType: "birthday" | "marriage_anniversary";
  } | null>(null);

  const triggerWhatsAppComposer = useCallback((employee: Employee, eventType: "birthday" | "marriage_anniversary") => {
    setWhatsappComposer({
      isOpen: true,
      employee,
      eventType
    });
  }, []);

  // Listen to Firestore error events to display warning banner gracefully without crashing
  useEffect(() => {
    const handleError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDbError(customEvent.detail);
      }
    };
    window.addEventListener("firestore-error", handleError);
    return () => {
      window.removeEventListener("firestore-error", handleError);
    };
  }, []);

  // Monitor Authentication - auto sign in with Google or keep anonymous for guests
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Anonymous authentication failed:", e);
          setAuthLoading(false);
        }
      } else {
        setCurrentUser(user);
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Sync Google Account verified session state with corporate workspace roles
  useEffect(() => {
    if (currentUser && currentUser.email && !currentUser.isAnonymous) {
      const cleanEmail = currentUser.email.toLowerCase().trim();
      let matched = appUsers.find(
        (u) => 
          (u.email && u.email.toLowerCase() === cleanEmail) || 
          u.username.toLowerCase() === cleanEmail ||
          (u.id && u.id.toLowerCase() === cleanEmail)
      );
      
      if (!matched && cleanEmail === "glalavmlalav@gmail.com") {
        matched = {
          id: "glalavmlalav@gmail.com",
          username: "glalavmlalav@gmail.com",
          email: "glalavmlalav@gmail.com",
          name: "Super Admin (Owner)",
          role: "super_admin",
          business: "all",
          createdAt: new Date().toISOString()
        };
      }
      
      if (matched) {
        const matchedUser = matched;
        setUserSession((prev) => {
          if (!prev || prev.id !== matchedUser.id || prev.role !== matchedUser.role || prev.business !== matchedUser.business) {
            localStorage.setItem("app_user_session", JSON.stringify(matchedUser));
            return matchedUser;
          }
          return prev;
        });
      } else if (appUsersLoaded) {
        setUserSession((prev) => {
          if (prev !== null) {
            localStorage.removeItem("app_user_session");
            return null;
          }
          return prev;
        });
      }
    }
  }, [currentUser, appUsers, appUsersLoaded]);

  // Monitor real-time Firestore database synchronization (Multi-device synced!)
  useEffect(() => {
    const isUserAllowed = currentUser || sandboxGuest || userSession;
    if (!isUserAllowed) {
      setDbLoading(false);
      return;
    }

    setDbLoading(true);
    
    // 1. Snapshot for Employees
    const unsubscribeEmployees = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        const empList: Employee[] = [];
        snapshot.forEach((docSnap) => {
          empList.push({ id: docSnap.id, ...docSnap.data() } as Employee);
        });
        setEmployees(empList);
        setDbLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "employees");
        setDbLoading(false);
      }
    );

    // 2. Snapshot for Loyalty Activities
    const unsubscribeActivities = onSnapshot(
      collection(db, "activities"),
      (snapshot) => {
        const actList: LoyaltyActivity[] = [];
        snapshot.forEach((docSnap) => {
          actList.push({ id: docSnap.id, ...docSnap.data() } as LoyaltyActivity);
        });
        // Sort by creation or month
        setActivities(actList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "activities");
        setDbLoading(false);
      }
    );

    // 3. Snapshot for Gift preparation logs
    const unsubscribeGifts = onSnapshot(
      collection(db, "gifts"),
      (snapshot) => {
        const giftList: GiftLog[] = [];
        snapshot.forEach((docSnap) => {
          giftList.push({ id: docSnap.id, ...docSnap.data() } as GiftLog);
        });
        setGiftLogs(giftList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "gifts");
        setDbLoading(false);
      }
    );

    // 4. Snapshot for System User Credentials
    const unsubscribeAppUsers = onSnapshot(
      collection(db, "app_users"),
      (snapshot) => {
        const userList: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          userList.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
        });
        setAppUsers(userList);
        setAppUsersLoaded(true);

        // Seeding super-admin owner if not present once loaded
        const hasOwner = userList.some(
          (u) => (u.email || "").toLowerCase() === "glalavmlalav@gmail.com" || u.username === "glalavmlalav@gmail.com"
        );
        if (!hasOwner) {
          setDoc(doc(db, "app_users", "glalavmlalav@gmail.com"), {
            id: "glalavmlalav@gmail.com",
            username: "glalavmlalav@gmail.com",
            email: "glalavmlalav@gmail.com",
            name: "Super Admin (Owner)",
            role: "super_admin",
            business: "all",
            createdAt: new Date().toISOString()
          }).catch((err) => console.log("Owner seeding backup bypassed or failed:", err));
        }
      },
      (error) => {
        console.error("Error fetching admin users from Firestore:", error);
      }
    );

    return () => {
      unsubscribeEmployees();
      unsubscribeActivities();
      unsubscribeGifts();
      unsubscribeAppUsers();
    };
  }, [currentUser, sandboxGuest]);

  // Recalculate alerts if employees update
  useEffect(() => {
    const currentAlerts = getActiveAlerts(employees, "2026-05-25");
    setAlerts(currentAlerts);
  }, [employees]);

  // Firestore operations
  const registerEmployeeInFirestore = async (empData: Omit<Employee, "id">) => {
    const collRef = collection(db, "employees");
    try {
      const docRef = doc(collRef);
      await setDoc(docRef, {
        ...empData,
        createdBy: userSession?.username || "admin",
        id: docRef.id
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "employees");
    }
  };

  const updateEmployeeInFirestore = async (id: string, empData: Partial<Employee>) => {
    const docRef = doc(db, "employees", id);
    try {
      await updateDoc(docRef, empData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `employees/${id}`);
    }
  };

  const deleteEmployeeFromFirestore = async (id: string) => {
    const docRef = doc(db, "employees", id);
    try {
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `employees/${id}`);
    }
  };

  const addActivityInFirestore = async (actData: Omit<LoyaltyActivity, "id" | "createdAt">) => {
    try {
      const tempId = `act-${Date.now()}`;
      await setDoc(doc(db, "activities", tempId), {
        ...actData,
        id: tempId,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "activities");
    }
  };

  const updateActivityStatusInFirestore = async (id: string, status: LoyaltyActivity["status"]) => {
    const docRef = doc(db, "activities", id);
    try {
      await updateDoc(docRef, { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `activities/${id}`);
    }
  };

  const deleteActivityFromFirestore = async (id: string) => {
    const docRef = doc(db, "activities", id);
    try {
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `activities/${id}`);
    }
  };

  const addGiftLog = async (giftData: Omit<GiftLog, "id" | "updatedAt">) => {
    try {
      const tempId = `gift-${Date.now()}`;
      await setDoc(doc(db, "gifts", tempId), {
        ...giftData,
        id: tempId,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "gifts");
    }
  };

  const updateGiftStatus = async (giftId: string, status: GiftLog["status"]) => {
    const docRef = doc(db, "gifts", giftId);
    try {
      await updateDoc(docRef, { 
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `gifts/${giftId}`);
    }
  };

  // Google Email Security Verification Callback
  const handleGoogleLoginSuccess = async (emailInput: string): Promise<boolean> => {
    const cleanEmail = emailInput.toLowerCase().trim();
    let matched = appUsers.find(
      (u) => 
        (u.email && u.email.toLowerCase() === cleanEmail) || 
        u.username.toLowerCase() === cleanEmail ||
        (u.id && u.id.toLowerCase() === cleanEmail)
    );

    // Hard fallback backup for the owner
    if (!matched && cleanEmail === "glalavmlalav@gmail.com") {
      matched = {
        id: "glalavmlalav@gmail.com",
        username: "glalavmlalav@gmail.com",
        email: "glalavmlalav@gmail.com",
        name: "Super Admin (Owner)",
        role: "super_admin",
        business: "all",
        createdAt: new Date().toISOString()
      };
    }

    // Direct Firestore lookup as an instantaneous robust fallback 
    if (!matched) {
      try {
        const userDoc = await getDoc(doc(db, "app_users", cleanEmail));
        if (userDoc.exists()) {
          matched = { id: userDoc.id, ...userDoc.data() } as AppUser;
        }
      } catch (err) {
        console.error("Error doing direct Firestore check for user:", err);
      }
    }

    if (matched) {
      localStorage.setItem("app_user_session", JSON.stringify(matched));
      setUserSession(matched);
      if (matched.role === "admin") {
        setActiveTab("employees");
      } else {
        setActiveTab("alerts");
      }
      return true;
    }
    return false;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase Auth sign-out failed:", e);
    }
    localStorage.removeItem("app_user_session");
    setUserSession(null);
    localStorage.removeItem("loyalty_guest_name");
    setSandboxGuest(null);
  };

  const handleAddUser = async (userFields: Omit<AppUser, "id" | "createdAt">) => {
    try {
      const docId = userFields.email ? userFields.email.toLowerCase().trim() : userFields.username.toLowerCase().trim();
      await setDoc(doc(db, "app_users", docId), {
        id: docId,
        ...userFields,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
      alert(language === "ku" ? "کێشەیەک ڕوویدا لە کاتی پاشەکەوتکردنی بەکارهێنەر" : "Error saving user credentials");
    }
  };

  const handleDeleteUser = async (docId: string) => {
    try {
      await deleteDoc(doc(db, "app_users", docId));
    } catch (e) {
      console.error(e);
      alert(language === "ku" ? "کێشەیەک ڕوویدا لە کاتی سڕینەوەی بەکارهێنەر" : "Error deleting user");
    }
  };

  // Pre-populate Database with real Kurds/Kurdish examples matching the 3 Businesses
  const handlePrepopulateDatabase = async () => {
    if (employees.length > 0) {
      alert(language === "ku" ? "لیستەکە پێشتر تۆماری تێدایە!" : "The database already contains employees!");
      return;
    }

    try {
      for (const emp of INITIAL_FALLBACK_EMPLOYEES) {
        await registerEmployeeInFirestore(emp);
      }
      alert(language === "ku" ? "بە سەرکەوتوویی زانیاری نموونەیی گەرم بۆ ڕێکەوتی جەژنەکان ئامادەکرا و لە فایەربەیس پاشەکەوتکرا!" : "Demo employees generated with birthdays and anniversaries matching May 25, 2026. Review warnings!");
    } catch (e) {
      alert("Error initializing demo database");
    }
  };

  const t = {
    appName: language === "ku" ? "کۆنترۆڵی لۆیاڵیتی و دۆسیەی کارمەندان (سێ بزنس)" : "Employee Loyalty & Profiles Hub",
    welcomeTitle: language === "ku" ? "سیستەمی بەڕێوەبردنی لۆیاڵیتی کارمەندەکان" : "Multi-Device Staff Loyalty Portals",
    welcomeDesc: language === "ku" ? "تایبەت بە لینیا، ماسیمۆ، و لیستۆن." : "Synchronized HR and Corporate Morale Hub for Linia, Massimo, and Liston businesses.",
    loginBtn: language === "ku" ? "چوونە ژوورەوە بە هەژماری کۆمپانیا (Google)" : "Sign in securely with Google",
    guestBtn: language === "ku" ? "چوونە ژوورەوەی خێرا (کۆنتڕۆڵ کەر)" : "Sandbox Direct Access (Guest Developer)",
    employeesTab: language === "ku" ? "دۆسیەی کارمەندان 👤" : "Employee Profiles 👤",
    alertsTab: language === "ku" ? "ئاگەدارییەکان و بۆنەکان 🔔" : "Anniversary Warnings 🔔",
    plannerTab: language === "ku" ? "پێشنیاری لۆیاڵیتی مانگانە 💡" : "Loyalty suggestions 💡",
    monthsTab: language === "ku" ? "بۆنەی مانگەکان 📅" : "Monthly Celebrations 📅",
    activeStaffTitle: language === "ku" ? "کۆی گشتی کارمەندان" : "Total Corporate Staff",
    activeWarnings: language === "ku" ? "بۆنەی بەپەلە (٢ ڕۆژی تر)" : "Milestone Alerts (48h)",
    rewardPointsTotal: language === "ku" ? "کۆی مۆڕاڵ و خاڵە دڵسۆزەکان" : "Total Morale Points Generated",
    multiDeviceLogo: language === "ku" ? "فایەربەیس هاوبەشکراو لەسەر چەندین ئامێر" : "Cloud Firebase Sync Enabled (Live updates across tabs)",
    demoWarning: language === "ku" ? "دۆسیەی کارمەندان بەتاڵە! دەتەوێت زانیاری کارمەندانی ڕاستەقینەی هەر سێ کۆمپانیاکە زیادبکەین کە لەگەڵ ڕێکەوتەکانی پیرۆزباییدا بگونجێت تا کارکردنی سیستەمەکە ببینی؟" : "Database looks empty! Would you like to initialize Kurdish employee portfolios with pre-configured birthday and wedding anniversaries to witness the automated warnings?",
    demoWarningBtn: language === "ku" ? "دروستکردنی ستافی ئەزموونی دەستبەجێ" : "Seed Premium Employee Datasets",
    loadingText: language === "ku" ? "بارکردنی زانیارییەکان لە فایەربەیسەوە چاوەڕوان بە..." : "Communicating with Firebase Real-Time Cloud Databases...",
    signedAs: language === "ku" ? "چوونەژورەوە وەک" : "Active Operator"
  };

  // Filter lists based on the restricted admin's designated business and credentials
  const isRestrictedBusiness = !!(userSession && userSession.business !== "all");
  const restrictedBusinessId = userSession?.business;
  const isSuperAdmin = userSession?.role === "super_admin";

  const displayEmployees = employees.filter((e) => {
    // 1. Business boundary alignment
    if (isRestrictedBusiness && e.business !== restrictedBusinessId) {
      return false;
    }
    // 2. Creator restriction: If standard admin, they must have added the employee themselves
    if (!isSuperAdmin && userSession) {
      const userEmail = (userSession.email || "").toLowerCase().trim();
      const userUsername = (userSession.username || "").toLowerCase().trim();
      const userId = (userSession.id || "").toLowerCase().trim();
      
      const createdByClean = (e.createdBy || "").toLowerCase().trim();
      
      const matchesCreator = 
        createdByClean === userEmail || 
        createdByClean === userUsername || 
        createdByClean === userId;

      if (!matchesCreator) {
        return false;
      }
    }
    return true;
  });

  const displayAlerts = alerts.filter((a) => 
    displayEmployees.some((emp) => emp.id === a.employeeId)
  );

  const displayGiftLogs = giftLogs.filter((g) => 
    displayEmployees.some((emp) => emp.id === g.employeeId)
  );

  const displayActivities = isRestrictedBusiness
    ? activities.filter((act) => act.businessFocus === restrictedBusinessId || act.businessFocus === "all")
    : activities;

  const businessTotalEmployeesCount = (() => {
    if (!userSession || isSuperAdmin || userSession.business === "all") {
      return employees.length;
    }
    return employees.filter((e) => e.business === userSession.business).length;
  })();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3ece6] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Floating gradient backglows */}
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-gradient-to-tr from-amber-300 to-rose-300 rounded-full bg-glow-orb opacity-30 filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-gradient-to-tr from-teal-300 to-indigo-300 rounded-full bg-glow-orb opacity-25 filter blur-3xl animate-pulse-slow" />
        
        <div className="relative z-10 glass-panel max-w-sm w-full p-8 rounded-[32px] flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3.5px] border-slate-200 border-t-amber-500 rounded-full animate-spin mb-2" />
          <p className="text-slate-800 font-bold text-sm tracking-wide">سیستەمەکە دەستپێدەکات...</p>
          <p className="text-slate-400 text-xs font-medium">Initializing Secure Firewalls...</p>
        </div>
      </div>
    );
  }

  // Not logged in UI
  if (!userSession && !sandboxGuest) {
    return (
      <div 
        className="min-h-screen bg-[#f3ece6] flex flex-col justify-center items-center p-4 md:p-10 font-sans relative overflow-hidden"
        dir={language === "ku" ? "rtl" : "ltr"}
      >
        {/* Decorative Liquid Ambient Orbs */}
        <div className="absolute top-10 left-10 w-[350px] h-[350px] bg-gradient-to-tr from-indigo-300 via-purple-200 to-rose-200 rounded-full bg-glow-orb opacity-40 filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-tr from-teal-300 via-cyan-200 to-amber-200 rounded-full bg-glow-orb opacity-35 filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-md w-full glass-panel rounded-[36px] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(100,116,139,0.18)] relative overflow-hidden z-10 animate-fade-in" id="login_block">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400" />
          
          {/* Header language toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLanguage(language === "ku" ? "en" : "ku")}
              className="text-xs glass-btn-secondary px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900 shadow-sm transition"
            >
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              {language === "ku" ? "English" : "کوردی"}
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-md shadow-inner flex items-center justify-center mx-auto mb-4 border border-white/80">
              <Lock className="w-9 h-9 text-rose-500 animate-pulse-slow" />
            </div>
            <h2 className="text-2xl font-display font-black text-slate-800 leading-tight">
              {language === "ku" ? "چوونەژوورەوەی ستاف" : "Staff Google Sign-In"}
            </h2>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed font-sans">
              {language === "ku" 
                ? "تکایە بە هەژماری گووگڵەکەت داخڵ ببە بۆ دڵنیابوونەوە لە دەسەڵاتەکانت لێرەدا" 
                : "Secure permission-based sign-in using your verified corporate Google account."}
            </p>
          </div>

          {/* Render secure staff login form component */}
          <StaffLoginForm language={language} onLoginSuccess={handleGoogleLoginSuccess} />

          {/* Real-time sync hint banner */}
          <div className="mt-8 pt-6 border-t border-white/40 flex items-center gap-3 text-slate-500 text-[10px] font-medium">
            <Laptop className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <p className="text-right leading-normal">{t.multiDeviceLogo}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#f3ece6] font-sans text-slate-800 flex flex-col lg:flex-row overflow-hidden relative" 
      id="app_core_container"
      dir={language === "ku" ? "rtl" : "ltr"}
    >
      {/* Decorative Floating ambient blurs for the glass kit layout */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-gradient-to-tr from-purple-300 to-indigo-300 rounded-full bg-glow-orb opacity-25 filter blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-teal-300 to-cyan-300 rounded-full bg-glow-orb opacity-20 filter blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[35%] right-[20%] w-[400px] h-[400px] bg-gradient-to-tl from-pink-300 to-rose-300 rounded-full bg-glow-orb opacity-15 filter blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* 1. Desktop Sidebar (aside) & Mobile overlay drawer */}
      <aside className={`
        fixed inset-y-0 z-50 flex flex-col w-72 bg-slate-950/85 backdrop-blur-2xl text-white transition-transform duration-300 ease-in-out border-slate-800 lg:border-white/5 lg:static lg:relative lg:translate-x-0
        ${language === "ku" ? "right-0 border-l" : "left-0 border-r"}
        ${isMobileMenuOpen 
          ? "translate-x-0" 
          : (language === "ku" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      `} id="dashboard_sidebar_panel">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-black tracking-tight text-amber-400">
              {language === "ku" ? "دۆسیەی کارمەندان" : "Staff Profiles Hub"}
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 font-medium select-none">
              {language === "ku" ? "سیستەمی دڵسۆزی کارمەندان" : "Corporate Staff Loyalty System"}
            </p>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
          {/* TAB 1: Alerts (Hidden from showroom managers) */}
          {userSession?.role !== "admin" && (
            <button
              onClick={() => {
                setActiveTab("alerts");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-start group ${
                activeTab === "alerts"
                  ? "bg-gradient-to-r from-amber-400/20 to-rose-400/10 text-amber-300 border border-amber-400/30 shadow-[0_8px_20px_rgba(245,158,11,0.15)] font-bold"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${activeTab === "alerts" ? "bg-amber-400 scale-110" : "bg-transparent group-hover:bg-slate-600"}`} />
              <span className="flex-1 text-xs md:text-sm">{t.alertsTab}</span>
            </button>
          )}

          {/* TAB 2: Employees (Visible to all) */}
          <button
            onClick={() => {
              setActiveTab("employees");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-start group ${
              activeTab === "employees"
                ? "bg-gradient-to-r from-amber-400/20 to-rose-400/10 text-amber-300 border border-amber-400/30 shadow-[0_8px_20px_rgba(245,158,11,0.15)] font-bold"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${activeTab === "employees" ? "bg-amber-400 scale-110" : "bg-transparent group-hover:bg-slate-600"}`} />
            <span className="flex-1 text-xs md:text-sm">{t.employeesTab}</span>
          </button>

          {/* TAB 3: Planner (Hidden from showroom managers) */}
          {userSession?.role !== "admin" && (
            <button
              onClick={() => {
                setActiveTab("planner");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-start group ${
                activeTab === "planner"
                  ? "bg-gradient-to-r from-amber-400/20 to-rose-400/10 text-amber-300 border border-amber-400/30 shadow-[0_8px_20px_rgba(245,158,11,0.15)] font-bold"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${activeTab === "planner" ? "bg-amber-400 scale-110" : "bg-transparent group-hover:bg-slate-600"}`} />
              <span className="flex-1 text-xs md:text-sm">{t.plannerTab}</span>
            </button>
          )}

          {/* TAB 4: Months (Hidden from showroom managers) */}
          {userSession?.role !== "admin" && (
            <button
              onClick={() => {
                setActiveTab("months");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-start group ${
                activeTab === "months"
                  ? "bg-gradient-to-r from-amber-400/20 to-rose-400/10 text-amber-300 border border-amber-400/30 shadow-[0_8px_20px_rgba(245,158,11,0.15)] font-bold"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${activeTab === "months" ? "bg-amber-400 scale-110" : "bg-transparent group-hover:bg-slate-600"}`} />
              <span className="flex-1 text-xs md:text-sm">{t.monthsTab}</span>
            </button>
          )}

          {/* TAB 5: Settings⚙️ (Only for super admins) */}
          {userSession?.role === "super_admin" && (
            <button
              onClick={() => {
                setActiveTab("settings");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-start group ${
                activeTab === "settings"
                  ? "bg-gradient-to-r from-amber-400/20 to-rose-400/10 text-amber-300 border border-amber-400/30 shadow-[0_8px_20px_rgba(245,158,11,0.15)] font-bold"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${activeTab === "settings" ? "bg-amber-400 scale-110" : "bg-transparent group-hover:bg-slate-600"}`} />
              <span className="flex-1 text-xs md:text-sm">{language === "ku" ? "ڕێکخستنی ئەکاونتەکان ⚙️" : "Manage Accounts ⚙️"}</span>
            </button>
          )}
        </nav>

        {/* Sync Info Profile box in sidebar */}
        <div className="p-6 border-t border-white/10 flex flex-col gap-4 bg-black/35 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15 text-amber-400 border border-white/10 flex items-center justify-center text-xs font-mono font-bold uppercase flex-shrink-0">
              {userSession ? userSession.name.substring(0, 2).toUpperCase() : sandboxGuest?.substring(0, 2).toUpperCase() || "OP"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-100 truncate font-sans">
                {userSession ? userSession.name : sandboxGuest || "Operator"}
              </span>
              <span className="text-[9px] text-amber-400 font-bold font-mono uppercase tracking-wide">
                {userSession 
                  ? (userSession.role === "super_admin" 
                    ? (language === "ku" ? "بەڕێوەبەری سەرەکی" : "Super Admin") 
                    : (language === "ku" ? `ڕێکخەری پێشانگا (${userSession.business})` : `Showroom Admin (${userSession.business.toUpperCase()})`))
                  : "Guest Developer"}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.multiDeviceLogo.split(" ")[0]} Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-white/10">
            {/* Language Selection */}
            <button
              onClick={() => setLanguage(language === "ku" ? "en" : "ku")}
              className="px-3 py-2 text-[10px] uppercase font-bold bg-white/10 hover:bg-white/25 border border-white/10 text-white rounded-xl flex items-center gap-1.5 transition duration-200"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === "ku" ? "EN" : "KU"}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="px-3 py-2 text-[10px] uppercase font-bold bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl flex items-center gap-1 transition duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* 2. Main Content panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden" id="app_main_work_area">
        
        {/* Dynamic header heights / Geometric Balance navbar */}
        <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-white/40 px-6 lg:px-8 flex items-center justify-between flex-shrink-0 relative z-10">
          
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile screens */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 bg-white/60 hover:bg-white/80 border border-white/80 text-slate-800 rounded-xl transition shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-800 flex items-center gap-2">
                {activeTab === "alerts" && t.alertsTab.split(" ")[0]}
                {activeTab === "employees" && t.employeesTab.split(" ")[0]}
                {activeTab === "planner" && t.plannerTab.split(" ")[0]}
                {activeTab === "months" && t.monthsTab.split(" ")[0]}
              </h2>
              <p className="text-[11px] lg:text-xs text-slate-500 font-bold select-none">
                {language === "ku" 
                  ? `${employees.length} کارمەند لە ٣ دامەزراوەی جیاواز` 
                  : `${employees.length} Active employees in 3 corporations`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Realtime database status line */}
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-sans">Firebase Sync</span>
              <span className="text-[11px] text-green-600 font-bold flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                Live Sync Active
              </span>
            </div>

            {/* System clock bubble */}
            <span className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white/50 backdrop-blur-md border border-white/75 rounded-full text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 select-none font-sans shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              2026-05-25 (ڕێکەوتی سیستەم)
            </span>
          </div>

        </header>

        {/* Page Content viewport wrap and statistics grids */}
        <div className="p-6 lg:p-8 space-y-8 flex-1 bg-transparent overflow-y-auto relative z-10">

          {/* Active Firebase Cloud Database Warning Banner */}
          {dbError && (
            <div className="glass-panel bg-rose-500/10 backdrop-blur-lg rounded-[24px] border border-rose-500/35 p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm relative overflow-hidden animate-fade-in font-sans">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-rose-500" />
              <div className="flex items-start gap-3.5">
                <span className="p-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-600 rounded-2xl flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-slate-800 text-xs font-bold leading-relaxed">
                    {language === "ku" 
                      ? "⚠️ کێشەی فایەربەیس: تێپەڕبوونی ڕێژەی بێبەرامبەری خوێندنەوە (Quota Limit Exceeded)" 
                      : "⚠️ Firebase Cloud Quota Limit Receeded"}
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-1 font-sans leading-normal">
                    {language === "ku" 
                      ? "بەهۆی تێپەڕبوونی لیمیتی خوێندنەوەی ڕۆژانەی پڕۆژەی فایەربەیس، خوێندنەوە و نوسینی نوێ بە شێوەیەکی کاتی لە فایەربەیسەوە سنووردار کراوە. داتاکانی تۆمار کراو پشت بە لایڤ فایەربەیس دەبەستن و بە ڕیسێت بوونەوەی لیمیتەکە یاخود بەستنی باڵانس چاک دەبێتەوە." 
                      : "The daily free transaction read quota limits for this Firebase Firestore database project have been exceeded. Reads or real-time sync requests may fail until reset by Google. The system is still responsive and securely connected."}
                  </p>
                  <p className="text-[10px] text-rose-600/90 font-mono mt-2 bg-rose-500/5 p-2 rounded-lg break-all">
                    {dbError.error}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDbError(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 rounded-xl text-[10px] font-bold transition duration-150 cursor-pointer shadow-sm flex-shrink-0 font-sans"
              >
                {language === "ku" ? "🔄 تاقیکردنەوەی فایەربەیس" : "🔄 Reconnect Cloud"}
              </button>
            </div>
          )}

          {/* Real-time stats widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="stats_panel_widgets">
            {/* Total Corporate Staff widget */}
            <div className="glass-panel rounded-[24px] p-6 flex items-center justify-between glass-card-hover">
              <div>
                <div className="text-slate-400 text-xs font-bold uppercase mb-1.5 select-none">{t.activeStaffTitle}</div>
                <div className="text-3xl font-black text-slate-800 font-display">{businessTotalEmployeesCount}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-1.5">
                  {isRestrictedBusiness && restrictedBusinessId ? (
                    language === "ku" 
                      ? `بەڕێوەبردن لە کۆمپانیای ${BUSINESSES[restrictedBusinessId]?.nameKu || restrictedBusinessId}` 
                      : `Managing in ${BUSINESSES[restrictedBusinessId]?.nameEn || restrictedBusinessId}`
                  ) : (
                    language === "ku" ? "کۆی گشتی هەرسێ کۆمپانیا (لینیا، ماسیمۆ، لیستۆن)" : "Total of all 3 corporations"
                  )}
                </div>
              </div>
              <span className="p-3 bg-gradient-to-tr from-amber-400/25 to-amber-500/10 text-amber-600 border border-amber-400/20 rounded-2xl shadow-sm">
                <Users className="w-6 h-6" />
              </span>
            </div>

            {/* Milestone warnings within 48 hours code */}
            <div className="glass-panel rounded-[24px] p-6 flex items-center justify-between glass-card-hover">
              <div>
                <div className="text-slate-400 text-xs font-bold uppercase mb-1.5 select-none">{t.activeWarnings}</div>
                <span className={`text-3xl font-black ${displayAlerts.length > 0 ? "text-rose-500 animate-pulse" : "text-slate-800"}`}>
                  {displayAlerts.length}
                </span>
                <div className="text-[10px] text-amber-500 font-bold mt-1.5">
                  {language === "ku" ? "بۆنە هەستیارەکانی بەردەست" : "Occasions needing attention"}
                </div>
              </div>
              <span className={`p-3 border rounded-2xl shadow-sm ${displayAlerts.length > 0 ? "bg-rose-500/20 text-rose-600 border-rose-500/20 animate-pulse-slow font-sans" : "bg-white/40 text-slate-400 border-white/50"}`}>
                <Gift className="w-6 h-6" />
              </span>
            </div>
          </div>

          {/* Analytics Expand Button */}
          {employees.length > 0 && (
            <div className="flex justify-end -mt-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2.5 bg-white/60 hover:bg-white text-slate-700 hover:text-slate-900 border border-white/80 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Database className="w-4 h-4 text-indigo-500" />
                {showAnalytics 
                  ? (language === "ku" ? "داخستنی شیکاری ئاماری 📊" : "Close Analytics 📊")
                  : (language === "ku" ? "شیکاری ئاماری و دابەشبوونی کارمەندان 📊" : "Show Analytics & Distribution 📊")
                }
              </button>
            </div>
          )}

          {/* Interactive Analytics Dashboard */}
          {showAnalytics && displayEmployees.length > 0 && (
            <div className="glass-panel rounded-[32px] p-6 lg:p-8 border border-white/85 shadow-lg relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500" />
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/40">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    {language === "ku" ? "شیکارکەری زیرەکی دابەشبوون و پۆلینکردنی کارمەندان" : "Staff Distribution & Portfolio Analyzer"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === "ku" ? "ئاماری ڕاستەقینەی دابەشبوونی کارمەندان و دۆسیەکانیان" : "Real-time sync performance and profile segmentation of the active businesses."}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAnalytics(false)}
                  className="text-xs font-bold px-2.5 py-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric 1: Business breakdown */}
                <div className="bg-white/50 border border-white/95 rounded-[22px] p-5 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
                    {language === "ku" ? "دابەشبوونی کارمەندان بەپێی بزنسەکان" : "Staff Distribution by Business"}
                  </h4>
                  <div className="space-y-3">
                    {(Object.keys(BUSINESSES) as BusinessId[]).filter(id => id !== "linia").map((id) => {
                      const biz = BUSINESSES[id];
                      const count = displayEmployees.filter((e) => e.business === id).length;
                      const percentage = displayEmployees.length > 0 ? Math.round((count / displayEmployees.length) * 100) : 0;
                      return (
                        <div key={id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 font-sans">
                            <span>{language === "ku" ? biz.nameKu : biz.nameEn}</span>
                            <span className="font-mono text-slate-500">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                id.startsWith("linia") ? "bg-amber-400" : id === "massimo" ? "bg-indigo-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metric 2: Marital status breakdown */}
                <div className="bg-white/50 border border-white/95 rounded-[22px] p-5 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
                    {language === "ku" ? "بارودۆخی خێزانی و هاوسەرگیری" : "Marital Portfolio"}
                  </h4>
                  {(() => {
                    const marriedCount = displayEmployees.filter((e) => e.maritalStatus === "married").length;
                    const singleCount = displayEmployees.filter((e) => e.maritalStatus === "single").length;
                    const marriedPct = displayEmployees.length > 0 ? Math.round((marriedCount / displayEmployees.length) * 100) : 0;
                    const singlePct = displayEmployees.length > 0 ? Math.round((singleCount / displayEmployees.length) * 100) : 0;
                    return (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 font-sans">
                            <span className="flex items-center gap-1 font-sans">💍 {language === "ku" ? "هاوسەرگیریکردوو" : "Married"}</span>
                            <span className="font-mono text-slate-500">{marriedCount} ({marriedPct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${marriedPct}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 font-sans">
                            <span className="flex items-center gap-1 font-sans">👤 {language === "ku" ? "سەڵت" : "Single"}</span>
                            <span className="font-mono text-slate-500">{singleCount} ({singlePct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${singlePct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Metric 3: Employment Status Breakdown */}
                <div className="bg-white/50 border border-white/95 rounded-[22px] p-5 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
                    {language === "ku" ? "دۆخی کارمەندان لە سەر کار" : "Employment Status"}
                  </h4>
                  {(() => {
                    const activeCount = displayEmployees.filter((e) => e.status === "active").length;
                    const suspendedCount = displayEmployees.filter((e) => e.status === "suspended").length;
                    const retiredCount = displayEmployees.filter((e) => e.status === "retired").length;
                    return (
                      <div className="space-y-2 text-xs font-bold text-slate-700">
                        <div className="flex justify-between items-center py-1.5 border-b border-white/40">
                          <span className="flex items-center gap-1.5 font-sans">🟢 {language === "ku" ? "بەردەوام لە کار" : "Active"}</span>
                          <span className="font-mono text-emerald-600">{activeCount}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/40">
                          <span className="flex items-center gap-1.5 font-sans">🟡 {language === "ku" ? "کاتی ڕاگیراو" : "Suspended"}</span>
                          <span className="font-mono text-amber-600">{suspendedCount}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="flex items-center gap-1.5 font-sans">🔴 {language === "ku" ? "خانەنشین" : "Retired"}</span>
                          <span className="font-mono text-rose-500">{retiredCount}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Seed demo dataset fallback warning banner */}
          {employees.length === 0 && !dbLoading && (
            <div className="glass-panel bg-amber-500/10 backdrop-blur-lg rounded-[24px] border border-amber-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/20 border border-amber-500/30 text-amber-600 rounded-xl flex-shrink-0 animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </span>
                <p className="text-slate-800 text-sm font-bold pr-2 text-right md:text-left font-sans leading-relaxed">
                  {t.demoWarning}
                </p>
              </div>
              <button
                onClick={handlePrepopulateDatabase}
                className="px-5 py-3 glass-btn-amber text-xs font-extrabold rounded-2xl transition duration-150 flex items-center gap-2 flex-shrink-0 shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                {t.demoWarningBtn}
              </button>
            </div>
          )}

          {/* Active component view rendered strictly here */}
          <div className="transition-all duration-300">
            {dbLoading ? (
              <div className="text-center py-24 glass-panel rounded-[36px] shadow-sm">
                <RefreshCw className="w-9 h-9 mx-auto text-amber-500 animate-spin mb-4" />
                <p className="text-slate-700 text-sm font-bold">{t.loadingText}</p>
              </div>
            ) : (
              <div>
                {activeTab === "alerts" && (
                  <AlertsPanel
                    alerts={displayAlerts}
                    giftLogs={displayGiftLogs}
                    employees={displayEmployees}
                    onUpdateGiftStatus={updateGiftStatus}
                    onAddGiftIdea={addGiftLog}
                    onTriggerWhatsApp={triggerWhatsAppComposer}
                    language={language}
                  />
                )}

                {activeTab === "employees" && (
                  <EmployeeDirectory
                    employees={displayEmployees}
                    userSession={userSession || undefined}
                    onAddEmployee={registerEmployeeInFirestore}
                    onUpdateEmployee={updateEmployeeInFirestore}
                    onDeleteEmployee={deleteEmployeeFromFirestore}
                    language={language}
                  />
                )}

                {activeTab === "planner" && (
                  <MonthlyPlanner
                    activities={displayActivities}
                    onAddActivity={addActivityInFirestore}
                    onUpdateActivityStatus={updateActivityStatusInFirestore}
                    onDeleteActivity={deleteActivityFromFirestore}
                    language={language}
                  />
                )}

                {activeTab === "months" && (
                  <MonthlyCelebrations
                    employees={displayEmployees}
                    onTriggerWhatsApp={triggerWhatsAppComposer}
                    language={language}
                  />
                )}

                {activeTab === "settings" && userSession?.role === "super_admin" && (
                  <SettingsPanel
                    appUsers={appUsers}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    language={language}
                    currentUserEmail={userSession?.email || userSession?.username}
                  />
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {whatsappComposer && whatsappComposer.isOpen && whatsappComposer.employee && (
        <WhatsAppComposerModal
          isOpen={whatsappComposer.isOpen}
          onClose={() => setWhatsappComposer(null)}
          employee={whatsappComposer.employee}
          eventType={whatsappComposer.eventType}
          language={language}
        />
      )}

    </div>
  );
}
