import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  FileText, 
  MessageSquare,
  AlertCircle,
  Copy
} from "lucide-react";
import { Employee, WhatsAppTemplate, BUSINESSES } from "../types";

interface WhatsAppComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  eventType: "birthday" | "marriage_anniversary" | "work_anniversary";
  language: "ku" | "en";
}

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "default-bday-ku",
    title: "لەدایکبوون - فەرمی (کوردی)",
    message: "سڵاو بەڕێز {name}، ڕۆژی لەدایکبوونت پیرۆز بێت! بەناوی کۆمپانیاوە هیوای تەمەندرێژی و هەمیشە سەرکەوتنت بۆ دەخوازین. 🎂🎉",
    type: "birthday",
    isDefault: true
  },
  {
    id: "default-bday-en",
    title: "Birthday - Corporate (English)",
    message: "Hello Dear {name}, Happy Birthday! Corporate greetings on your special day. Wishing you a long life and endless success! 🎂🎉",
    type: "birthday",
    isDefault: true
  },
  {
    id: "default-bday-casual-ku",
    title: "لەدایکبوون - گەرم و دۆستانە",
    message: "ڕۆژبوونت شاد و پڕ پێکەنین بێت {name}ی ئازیز! گەورەترین شانازی بۆ کارەکەمان لە کۆمپانیای {business}، دلسۆزی و نیەتە باشەکەی تۆیە. تەمەندرێژ بیت و هەمیشە دلخۆش بیت! 🎈🍰",
    type: "birthday",
    isDefault: true
  },
  {
    id: "default-anni-ku",
    title: "هاوسەرگیری - فەرمی (کوردی)",
    message: "سڵاو بەڕێز {name}، ساڵیادی هاوسەرگیریتان پیرۆز بێت! بەناوی کۆمپانیاوە هیوای بەختەوەری و چرکە بە چرکە خۆشبەختیتان بۆ دەخوازین. 💍✨",
    type: "marriage_anniversary",
    isDefault: true
  },
  {
    id: "default-anni-en",
    title: "Anniversary - Corporate (English)",
    message: "Hello Dear {name}, Happy Wedding Anniversary! Corporate congratulations on your marriage milestone. Wishing you a life of happiness together! 💍✨",
    type: "marriage_anniversary",
    isDefault: true
  },
  {
    id: "default-anni-warm-ku",
    title: "هاوسەرگیری - خێزانی و جوان",
    message: "کارمەندی هێژا و خۆشەویست {name}، ساڵڕۆژی هاوسەرگیریتان پیرۆزبێت. هیوادارین ژیانی هاوسەریتان چرکە بە چرکە ئارام، ئاسوودە و پڕ بەرەکەت بێت. 🥂💖",
    type: "marriage_anniversary",
    isDefault: true
  },
  {
    id: "default-work-ku",
    title: "دامەزراندن - فەرمی (کوردی)",
    message: "سڵاو هێژا بەڕێز {name}، ساڵیادی دامەزراندنت لە کۆمپانیا پیرۆز بێت! سوپاسگوزاری ستاف و دڵسۆزیتین بۆ تەواوی کارە ناوازەکانت لەم ساڵانەدا. 🏆✨",
    type: "work_anniversary",
    isDefault: true
  },
  {
    id: "default-work-en",
    title: "Work Anniversary - Corporate (English)",
    message: "Hello Dear {name}, Happy Work Anniversary! We are deeply grateful for your loyalty, dedication, and wonderful contributions over these years. 🏆✨",
    type: "work_anniversary",
    isDefault: true
  }
];

export default function WhatsAppComposerModal({
  isOpen,
  onClose,
  employee,
  eventType,
  language
}: WhatsAppComposerModalProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [isManaging, setIsManaging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"compose" | "manage">("compose");

  // State for creating/editing a template
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [newType, setNewType] = useState<"birthday" | "marriage_anniversary" | "work_anniversary" | "general">("general");

  // Textarea references for cursor selection insertion
  const composeTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const templateTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Available placeholders configuration
  const TAGS_CONFIG = [
    { tag: "{name}", ku: "ناوی یەکەم", en: "First Name" },
    { tag: "{fullname}", ku: "ناوی تەواو", en: "Full Name" },
    { tag: "{business}", ku: "ناوی بزنس", en: "Business Name" },
    { tag: "{role}", ku: "پۆست / ڕۆڵ", en: "Position / Role" },
    { tag: "{phone}", ku: "ژمارەی مۆبایل", en: "Phone Number" }
  ];

  const t = {
    title: language === "ku" ? "نامە نێری واتسئەپ و نووسینەوە" : "WhatsApp Composer & Greetings",
    employeeLabel: language === "ku" ? "کارمەند:" : "Employee:",
    phoneLabel: language === "ku" ? "ژمارەی مۆبایل:" : "Phone Number:",
    typeLabel: language === "ku" ? "جۆری بۆنە:" : "Occasion Type:",
    selectTemplate: language === "ku" ? "هەڵبژاردنی نامەی ئامادەکراو:" : "Choose Pre-made Template:",
    customText: language === "ku" ? "نامەی کۆتایی بۆ دەستکاریکردن:" : "Final Message (Editable):",
    sendButton: language === "ku" ? "ناردن بە واتسئەپ" : "Open in WhatsApp",
    manageTemplates: language === "ku" ? "بەڕێوەبردنی نامەی ئامادە" : "Manage Templates",
    composerTab: language === "ku" ? "نووسین و ناردن" : "Compose & Send",
    addTemplate: language === "ku" ? "زیادکردنی نامەی ئامادەکراوی نوێ" : "Add New Template",
    saveTemplate: language === "ku" ? "پاشەکەوتکردن" : "Save Template",
    editTemplate: language === "ku" ? "دەستکاریکردن" : "Edit Template",
    deleteTemplate: language === "ku" ? "سڕینەوە" : "Delete Template",
    titleInput: language === "ku" ? "ناونیشانی نامەکە (بۆ ناسینەوە)" : "Template Name (for identification)",
    messageInput: language === "ku" ? "ناوەڕۆکی نامە" : "Message Content",
    typeInput: language === "ku" ? "جۆری نامە" : "Template For",
    placeholderHelp: language === "ku" 
      ? "تێبینی: مۆتیڤەکان (وەک ناوی یەکەم، ناوی بزنس، هتد) پێش ناردن خۆکار جێگیر دەکرێن."
      : "Tip: Tags will be auto-replaced before opening WhatsApp.",
    noPhone: language === "ku" ? "مۆبایل تۆمار نەکراوە!" : "No phone number configured!",
    copied: language === "ku" ? "کۆپی کرا" : "Copied Text",
    birthday: language === "ku" ? "ڕۆژی لەدایکبوون" : "Birthday",
    anniversary: language === "ku" ? "ساڵیادی هاوسەرگیری" : "Wedding Anniversary",
    workAnniversary: language === "ku" ? "ساڵیادی دامەزراندن" : "Work Anniversary",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel",
    update: language === "ku" ? "نوێکردنەوە" : "Update"
  };

  // Load templates from localStorage or preset values
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("whatsapp_templates");
      let allTemplates = stored ? JSON.parse(stored) : [...DEFAULT_TEMPLATES];
      
      // Ensure default values exist if not in storage
      if (!stored) {
        localStorage.setItem("whatsapp_templates", JSON.stringify(DEFAULT_TEMPLATES));
      }
      setTemplates(allTemplates);

      // Select relevant template by default
      const relevant = allTemplates.find((temp: WhatsAppTemplate) => temp.type === eventType);
      if (relevant) {
        setSelectedTemplateId(relevant.id);
        setMessageText(replacePlaceholders(relevant.message));
      } else {
        const first = allTemplates[0];
        if (first) {
          setSelectedTemplateId(first.id);
          setMessageText(replacePlaceholders(first.message));
        }
      }
    }
  }, [isOpen, eventType, employee]);

  if (!isOpen) return null;

  // Insert tag helper at cursor for Compose textarea
  const insertTagAtComposeCursor = (tag: string) => {
    const textarea = composeTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = messageText.substring(0, start);
      const after = messageText.substring(end, messageText.length);
      const newText = before + tag + after;
      setMessageText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
      }, 0);
    } else {
      setMessageText((prev) => prev + tag);
    }
  };

  // Insert tag helper at cursor for Template textarea
  const insertTagAtTemplateCursor = (tag: string) => {
    const textarea = templateTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = newMessage.substring(0, start);
      const after = newMessage.substring(end, newMessage.length);
      const newText = before + tag + after;
      setNewMessage(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
      }, 0);
    } else {
      setNewMessage((prev) => prev + tag);
    }
  };

  // Helper function to replace placeholder tags {name} {fullname} {business} {role} {phone}
  const replacePlaceholders = (text: string) => {
    if (!text) return "";
    const bLabel = BUSINESSES[employee.business] 
      ? (language === "ku" ? BUSINESSES[employee.business].nameKu : BUSINESSES[employee.business].nameEn)
      : employee.business;

    // Use only the first name for {name}
    const firstName = employee.name ? employee.name.trim().split(/\s+/)[0] : "";

    return text
      .replace(/{name}/g, firstName)
      .replace(/{fullname}/g, employee.name || "")
      .replace(/{business}/g, bLabel)
      .replace(/{role}/g, employee.role || "")
      .replace(/{phone}/g, employee.phone || "");
  };

  // Handle template selection change
  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const temp = templates.find((t) => t.id === id);
    if (temp) {
      setMessageText(replacePlaceholders(temp.message));
    }
  };

  // Trigger link on WhatsApp
  const handleSend = () => {
    let cleanedPhone = employee.phone ? employee.phone.replace(/[^0-9+]/g, "") : "";
    if (cleanedPhone.startsWith("0")) {
      cleanedPhone = "964" + cleanedPhone.substring(1);
    } else if (cleanedPhone && !cleanedPhone.startsWith("+") && !cleanedPhone.startsWith("964")) {
      cleanedPhone = "964" + cleanedPhone;
    }

    if (!cleanedPhone) {
      alert(t.noPhone);
      return;
    }

    const waLink = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(messageText)}`;
    window.open(waLink, "_blank");
    onClose();
  };

  // Create or update template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    let updatedList: WhatsAppTemplate[] = [];

    if (editingTemplateId) {
      // Modify
      updatedList = templates.map((temp) => {
        if (temp.id === editingTemplateId) {
          return {
            ...temp,
            title: newTitle,
            message: newMessage,
            type: newType
          };
        }
        return temp;
      });
    } else {
      // Create new
      const nextId = "custom-" + Date.now();
      const newItem: WhatsAppTemplate = {
        id: nextId,
        title: newTitle,
        message: newMessage,
        type: newType,
        isDefault: false
      };
      updatedList = [...templates, newItem];
    }

    setTemplates(updatedList);
    localStorage.setItem("whatsapp_templates", JSON.stringify(updatedList));

    // Reset inputs
    setNewTitle("");
    setNewMessage("");
    setEditingTemplateId(null);
    setNewType("general");

    // Switch back to relevant template if newly added
    if (updatedList.length > 0) {
      const lastItem = updatedList[updatedList.length - 1];
      setSelectedTemplateId(lastItem.id);
      setMessageText(replacePlaceholders(lastItem.message));
    }
  };

  const handleEditClick = (temp: WhatsAppTemplate) => {
    setEditingTemplateId(temp.id);
    setNewTitle(temp.title);
    setNewMessage(temp.message);
    setNewType(temp.type);
  };

  const handleDeleteTemplate = (id: string, isDefault?: boolean) => {
    if (isDefault) return; // cannot delete default preset
    if (!confirm(language === "ku" ? "دڵنیایت لە سڕینەوەی ئەم نامە ئامادەکراوە؟" : "Are you sure you want to delete this template?")) return;

    const list = templates.filter((t) => t.id !== id);
    setTemplates(list);
    localStorage.setItem("whatsapp_templates", JSON.stringify(list));

    if (selectedTemplateId === id && list.length > 0) {
      setSelectedTemplateId(list[0].id);
      setMessageText(replacePlaceholders(list[0].message));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageText);
  };

  const bLabel = BUSINESSES[employee.business] 
    ? (language === "ku" ? BUSINESSES[employee.business].nameKu : BUSINESSES[employee.business].nameEn)
    : employee.business;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" id="whatsapp_compose_modal_overlay">
      <div 
        className="bg-white/80 backdrop-blur-2xl w-full max-w-2xl rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[640px] animate-fade-in"
        dir={language === "ku" ? "rtl" : "ltr"}
        id="whatsapp_compose_modal_card"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-sm shadow-emerald-500/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.325 1.451 5.405.002 9.801-4.394 9.804-9.801.002-2.617-1.013-5.08-2.862-6.93C16.035 2.014 13.57 1 11.999 1c-5.41 0-9.802 4.392-9.806 9.8a9.771 9.771 0 001.492 5.101l-.979 3.575 3.67-.962zm10.748-5.34c-.29-.145-1.72-.848-1.986-.944-.266-.096-.46-.145-.653.145-.194.291-.749.944-.919 1.138-.17.194-.34.218-.63.073-.29-.145-1.229-.453-2.34-1.445-.864-.772-1.448-1.724-1.618-2.015-.17-.29-.018-.448.127-.592.131-.13.29-.34.436-.509.145-.17.194-.291.291-.485.097-.194.049-.364-.025-.509-.073-.145-.653-1.573-.894-2.155-.235-.567-.474-.49-.653-.498-.17-.008-.364-.01-.557-.01s-.508.073-.774.364c-.266.291-1.016.994-1.016 2.425s1.04 2.812 1.185 3.006c.145.194 2.046 3.125 4.957 4.382.693.3 1.233.479 1.654.613.697.221 1.332.19 1.833.115.558-.081 1.72-.703 1.962-1.382.242-.678.242-1.26.17-1.381-.073-.122-.266-.195-.557-.34z"/>
              </svg>
            </span>
            <div>
              <h3 className="font-display font-black text-slate-800 text-base">{t.title}</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {t.employeeLabel} <span className="font-extrabold text-slate-800">{employee.name}</span> | {bLabel}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white border border-slate-200/60 text-slate-400 rounded-full hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs inside the Modal */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "compose" 
                ? "border-emerald-600 text-emerald-700" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.composerTab}
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "manage" 
                ? "border-emerald-600 text-emerald-700" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            {t.manageTemplates}
          </button>
        </div>

        {/* Modal Main Content Box (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6" id="whatsapp_modal_content_scrollarea">
          {activeTab === "compose" && (
            <div className="space-y-5">
              {/* Employee brief Info bar */}
              <div className="flex flex-wrap gap-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">{t.phoneLabel}</span>
                  <span className="font-mono font-bold text-slate-800 text-[13px]">{employee.phone || "-"}</span>
                </div>
                <div className="border-l border-slate-200 px-3.5">
                  <span className="text-slate-400 block">{t.typeLabel}</span>
                  <span className="font-extrabold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/10 inline-block mt-0.5">
                    {eventType === "birthday" ? t.birthday : t.anniversary}
                  </span>
                </div>
              </div>

              {/* Choose template */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">{t.selectTemplate}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[140px] overflow-y-auto p-1 bg-slate-50/30 rounded-2xl border border-slate-100">
                  {templates
                    .filter((temp) => temp.type === eventType || temp.type === "general")
                    .map((temp) => {
                      const isSelected = selectedTemplateId === temp.id;
                      return (
                        <button
                          key={temp.id}
                          onClick={() => handleTemplateChange(temp.id)}
                          className={`p-3 rounded-xl border text-right transition-all text-xs flex flex-col justify-start gap-1 relative ${
                            isSelected 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 ring-1 ring-emerald-500/20" 
                              : "bg-white border-slate-200/60 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="font-black flex items-center justify-between w-full">
                            {temp.title}
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 block leading-normal mt-0.5">
                            {temp.message}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* final message editable box */}
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-700">{t.customText}</label>
                  <button 
                    onClick={copyToClipboard}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-500/5 px-2 py-1 rounded-lg"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{t.copied}</span>
                  </button>
                </div>

                {/* Clickable Tag Buttons */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-450 self-center px-1">
                    {language === "ku" ? "کلیك بکە بۆ نووسینی مۆتیڤ (تاگ):" : "Click to insert tag:"}
                  </span>
                  {TAGS_CONFIG.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertTagAtComposeCursor(item.tag)}
                      className="px-2.5 py-1 text-[11px] font-black font-sans bg-white border border-slate-250 hover:bg-emerald-500 hover:text-white rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1"
                    >
                      <span className="text-emerald-600 font-mono text-[9px]">{item.tag}</span>
                      <span className="text-[9px] text-slate-450 font-medium">{language === "ku" ? item.ku : item.en}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  ref={composeTextareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full h-36 p-4 rounded-2xl border border-slate-200/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans text-[13px] leading-relaxed text-slate-800 bg-white"
                />
                <p className="text-[10px] text-slate-400 font-sans italic leading-relaxed">
                  {t.placeholderHelp}
                </p>
              </div>
            </div>
          )}

          {activeTab === "manage" && (
            <div className="space-y-6">
              {/* Add / Edit Form */}
              <form onSubmit={handleSaveTemplate} className="bg-slate-50 border border-slate-100 p-4 md:p-5 rounded-2xl space-y-3.5">
                <span className="text-xs font-black text-slate-700 block border-b border-slate-200 pb-1.5">
                  {editingTemplateId ? `${t.update} / ${t.editTemplate}` : t.addTemplate}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{t.titleInput}</label>
                    <input
                      type="text"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200/80 bg-white focus:border-emerald-500"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="ناونیشان بۆ نموونە: بیرۆزبا بەیانیان"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{t.typeInput}</label>
                    <select
                      className="w-full p-2 text-xs rounded-xl border border-slate-200/80 bg-white focus:border-emerald-500"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                    >
                      <option value="birthday">{t.birthday}</option>
                      <option value="marriage_anniversary">{t.anniversary}</option>
                      <option value="work_anniversary">{t.workAnniversary}</option>
                      <option value="general">گشتی / General</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">{t.messageInput}</label>

                  {/* Clickable Tag Buttons for Template editing too */}
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200/60 rounded-xl mb-1.5">
                    <span className="text-[9px] font-bold text-slate-450 self-center px-1">
                      {language === "ku" ? "کۆدی تاگ:" : "Tags:"}
                    </span>
                    {TAGS_CONFIG.map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => insertTagAtTemplateCursor(item.tag)}
                        className="px-2 py-0.5 text-[10px] font-black font-sans bg-slate-50 border border-slate-200 hover:bg-emerald-500 hover:text-white rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
                      >
                        <span className="text-emerald-600 font-mono text-[8px]">{item.tag}</span>
                        <span className="text-[8px] text-slate-450 font-medium">{language === "ku" ? item.ku : item.en}</span>
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={templateTextareaRef}
                    rows={3}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200/80 bg-white focus:border-emerald-500 leading-relaxed font-sans"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="سڵاو هێژا {name}، تەمەندرێژ بیت..."
                    required
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">{t.placeholderHelp}</span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setNewTitle("");
                        setNewMessage("");
                        setNewType("general");
                      }}
                      className="px-4 py-2 text-[11px] font-bold rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-[11px] font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingTemplateId ? t.saveTemplate : t.addTemplate}</span>
                  </button>
                </div>
              </form>

              {/* Template Items List */}
              <div className="space-y-2.5">
                <span className="text-xs font-black text-slate-700 block">نامە تۆمارکراوەکان:</span>
                <div className="space-y-2" id="whatsapp_templates_list_items">
                  {templates.map((temp) => (
                    <div 
                      key={temp.id} 
                      className="p-3.5 bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800">{temp.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold border ${
                            temp.type === "birthday" 
                              ? "bg-amber-500/15 border-amber-500/10 text-amber-800" 
                              : temp.type === "marriage_anniversary"
                              ? "bg-purple-500/15 border-purple-500/10 text-purple-800"
                              : temp.type === "work_anniversary"
                              ? "bg-teal-500/15 border-teal-500/10 text-teal-800"
                              : "bg-slate-100 border-slate-250 text-slate-600"
                          }`}>
                            {temp.type === "birthday" 
                              ? t.birthday 
                              : temp.type === "marriage_anniversary" 
                              ? t.anniversary 
                              : temp.type === "work_anniversary"
                              ? t.workAnniversary
                              : "گشتی"
                            }
                          </span>
                          {temp.isDefault && (
                            <span className="bg-slate-50 border border-slate-200/60 text-slate-400 text-[8px] px-1 py-0.5 rounded-md font-sans">
                              Preset
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 font-sans text-xs leading-relaxed max-w-lg mt-1 whitespace-pre-line">
                          {temp.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleEditClick(temp)}
                          className="p-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title={t.editTemplate}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!temp.isDefault && (
                          <button
                            onClick={() => handleDeleteTemplate(temp.id, temp.isDefault)}
                            className="p-1.5 bg-rose-50 border border-rose-200/40 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                            title={t.deleteTemplate}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
          <p className="text-[10px] text-slate-400 font-sans">
            لینیا دیزاین • WhatsApp Automated Greeting Tools
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4.5 py-2 rounded-xl text-xs font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            >
              {t.cancel}
            </button>
            {activeTab === "compose" && (
              <button
                onClick={handleSend}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/10 hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
                <span>{t.sendButton}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
