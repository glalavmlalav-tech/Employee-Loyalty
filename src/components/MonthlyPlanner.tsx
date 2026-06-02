import React, { useState } from "react";
import { 
  Sparkles, 
  Calendar, 
  Flame, 
  MapPin, 
  DollarSign, 
  ThumbsUp, 
  CheckCircle, 
  Plus, 
  Play, 
  Clock, 
  ChevronRight, 
  Layers,
  Award,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { LoyaltyActivity, BUSINESSES, BusinessId } from "../types";
import { getFallbackActivity, PresetActivity } from "../utils";

interface MonthlyPlannerProps {
  activities: LoyaltyActivity[];
  onAddActivity: (activity: Omit<LoyaltyActivity, "id" | "createdAt">) => Promise<void>;
  onUpdateActivityStatus: (id: string, status: LoyaltyActivity["status"]) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
  language: "ku" | "en";
}

export default function MonthlyPlanner({
  activities,
  onAddActivity,
  onUpdateActivityStatus,
  onDeleteActivity,
  language
}: MonthlyPlannerProps) {
  const [selectedMonth, setSelectedMonth] = useState("05"); // Default to May
  const [targetBusiness, setTargetBusiness] = useState<BusinessId | "all">("all");
  const [customFocus, setCustomFocus] = useState("");
  
  // AI Generation status
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const monthsList = [
    { num: "01", nameKu: "کانونی دووەم (January)", nameEn: "January" },
    { num: "02", nameKu: "شوبات (February)", nameEn: "February" },
    { num: "03", nameKu: "ئادار (March)", nameEn: "March" },
    { num: "04", nameKu: "نیسان (April)", nameEn: "April" },
    { num: "05", nameKu: "ئایار (May)", nameEn: "May" },
    { num: "06", nameKu: "حوزەیران (June)", nameEn: "June" },
    { num: "07", nameKu: "تەممووز (July)", nameEn: "July" },
    { num: "08", nameKu: "ئاب (August)", nameEn: "August" },
    { num: "09", nameKu: "ئەیلوول (September)", nameEn: "September" },
    { num: "10", nameKu: "تشرینی یەکەم (October)", nameEn: "October" },
    { num: "11", nameKu: "تشرینی دووەم (November)", nameEn: "November" },
    { num: "12", nameKu: "کانونی یەکەم (December)", nameEn: "December" },
  ];

  const t = {
    headerTitle: language === "ku" ? "بەدواداچوون و پلانەڕێژی چالاکییەکانی دڵسۆزی (Loyalty)" : "Monthly Employee Loyalty Planner",
    headerDesc: language === "ku" ? "بەدەستهێنانی پێشنیاری ژیرانە بۆ دڵخۆشکردن و گرنگیپێدانی کارمەندان بەپێی مانگەکان" : "Get custom seasonal plans and high-morale team bonding guides for your workshops and showrooms.",
    quickPresTitle: language === "ku" ? "پێشنیاری دەستبەجێی مانگی هەڵبژێردراو" : "Instant Seasonal Suggestion (Preset Manual Plan)",
    aiPlannerTitle: language === "ku" ? "تولیدکردنی پلانی مۆڕاڵ لە لایەن ژیری دەستکردی Gemini 3.5" : "Gemini 3.5 AI Custom Morale Planner",
    aiPlannerDesc: language === "ku" ? "پێشنیارێکی نوێ و ناوازە دروست بکە تایبەت بە جۆری کار و کارمەندانی خۆت لە سلۆنی دارتاشین، مەڕمەڕ یان سنگ" : "Generate tailored engagement drives taking in wood and stone worker context with server-side AI.",
    monthLabel: language === "ku" ? "دیاریکردنی مانگی مەبەست" : "Target Calendar Month",
    businessLabel: language === "ku" ? "بزنس / پیشەی دیاریکراو" : "Focus Sector Branch",
    notesLabel: language === "ku" ? "تێبینی زیادە یان تیشکۆ (ئارەزوومەندانە)" : "Custom focal notes (Optional)",
    notesPlaceholder: language === "ku" ? "بۆ نموونە: تەنها جەخت بکەرەوە لە مۆڕاڵی ستافی کارگە غەیرە ئۆفیسییەکان..." : "e.g., Focus on recognizing heavy lifters and factory workers specifically...",
    generateButton: language === "ku" ? "دروستکردنی پلان لە رێگەی ژیری دەستکرد" : "Draft Plan with Gemini AI",
    generating: language === "ku" ? "ژیری دەستکرد سەرقاڵی دارشتنی باشترین پلانە..." : "Gemini is analyzing your business scales and drafting customized Kurdish plans...",
    impact: language === "ku" ? "رێژەی کاریگەری" : "Loyalty Impact Score",
    budget: language === "ku" ? "بودجە و تێچوو" : "Expected Budget Scale",
    actionSteps: language === "ku" ? "هەنگاوەکانی جێبەجێکردن" : "Execution Action Steps",
    scheduleButton: language === "ku" ? "پلاندانان بۆ ئەم چالاکییە" : "Schedule and Save into Firebase Timeline",
    scheduledTitle: language === "ku" ? "هێڵی کاتیی چالاکیە ڕێکخراوەکان (فایەربەیس)" : "My Scheduled Team Activities Timeline",
    noScheduled: language === "ku" ? "تا ئێستا هیچ چالاکییەک ڕێکنەخراوە. خۆت دانەیەک دروستبکە." : "No engagement drives scheduled yet. Generate and schedule one above!",
    createdAt: language === "ku" ? "ڕێکەوتی تۆمار" : "Created on",
    scheduledStatus: language === "ku" ? "پلانی بۆ دانراوە" : "Scheduled",
    completedStatus: language === "ku" ? "کۆتایی هاتووە" : "Completed",
    suggestedStatus: language === "ku" ? "پێشنیار" : "Suggested",
    markCompleted: language === "ku" ? "گۆڕین بۆ کۆتایی هاتووە" : "Mark as Completed",
    delete: language === "ku" ? "سڕینەوە" : "Delete",
    allBiz: language === "ku" ? "هەر سێ کۆمپانیا پێکەوە (All 3 Combined)" : "All 3 Businesses Combined",
    apiErrDetails: language === "ku" ? "شکست هێنا لە دروستکردنی پلان. دڵنیابەرەوە کێشەی هێڵ نییە." : "Could not draft plan via server-side Gemini. Check your internet or API credentials."
  };

  const currentPreset: PresetActivity = getFallbackActivity(selectedMonth);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setApiError(null);
    setAiResult(null);

    const bizLabel = targetBusiness === "all" ? "All three businesses together" : (BUSINESSES[targetBusiness]?.nameEn || targetBusiness);

    try {
      const response = await fetch("/api/gemini/generate-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthsList.find(m => m.num === selectedMonth)?.nameEn || selectedMonth,
          business: bizLabel,
          focusText: customFocus
        })
      });

      if (!response.ok) {
        throw new Error("Server returned error response");
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err) {
      console.error(err);
      setApiError(t.apiErrDetails);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveActivity = async (titleKu: string, titleEn: string, descKu: string, descEn: string, stepsKu: string[], stepsEn: string[], budget: string, costKu: string, impact: number) => {
    try {
      await onAddActivity({
        titleKu,
        titleEn,
        descriptionKu: descKu,
        descriptionEn: descEn,
        stepsKu,
        stepsEn,
        month: selectedMonth,
        year: "2026",
        businessFocus: targetBusiness,
        budgetClass: budget === "High" ? "High" : budget === "Medium" ? "Medium" : "Low",
        estimatedCostKu: costKu,
        impactScore: impact,
        status: "scheduled"
      });
      alert(language === "ku" ? "چالاکییەکە بە سەرکەوتوویی لە خشتەی کاتیی فایەربەیس پاشەکەوتکرا!" : "Activity successfully scheduled and synced in Firebase!");
      setAiResult(null);
    } catch (e) {
      alert("Error saving activity");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Introduction Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <span className="p-2.5 bg-amber-50 text-amber-500 rounded-2xl">
            <Lightbulb className="w-6 h-6" />
          </span>
          <div>
            <h3 className="text-xl md:text-2xl font-display font-bold text-slate-800">{t.headerTitle}</h3>
            <p className="text-slate-500 text-xs md:text-sm">{t.headerDesc}</p>
          </div>
        </div>
      </div>

      {/* Main planner generator workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Setup Forms for presets and AI generation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h4 className="text-md font-bold text-slate-800 pb-3 border-b border-slate-50 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {language === "ku" ? "کۆنترۆڵی مانگ و بزنس" : "Target Activity Settings"}
            </h4>

            {/* Target Month Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.monthLabel}</label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs font-sans"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setAiResult(null);
                }}
              >
                {monthsList.map((m) => (
                  <option key={m.num} value={m.num}>
                    {language === "ku" ? m.nameKu : m.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Businesses Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.businessLabel}</label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 text-xs font-sans"
                value={targetBusiness}
                onChange={(e) => {
                  setTargetBusiness(e.target.value as BusinessId | "all");
                  setAiResult(null);
                }}
              >
                <option value="all">{t.allBiz}</option>
                {(Object.keys(BUSINESSES) as BusinessId[]).filter(id => id !== "linia").map((id) => (
                  <option key={id} value={id}>
                    {language === "ku" ? BUSINESSES[id].nameKu : BUSINESSES[id].nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Custom focal comments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.notesLabel}</label>
              <textarea
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                placeholder={t.notesPlaceholder}
                rows={3}
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
              />
            </div>

            {/* Submit button to query server side Gemini */}
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 text-white hover:text-amber-300 text-xs font-bold rounded-xl transition duration-200 disabled:opacity-70 shadow"
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              {isGenerating ? t.generating : t.generateButton}
            </button>
          </div>
        </div>

        {/* Right Side: Render Suggestions (Preset or Gemini generated output) */}
        <div className="lg:col-span-7">
          
          {isGenerating ? (
            <div className="bg-slate-55 rounded-3xl border border-slate-100 p-10 h-full flex flex-col items-center justify-center text-center bg-white">
              <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-amber-500 animate-spin mb-4" />
              <p className="text-slate-700 font-medium text-sm">{t.generating}</p>
              <p className="text-xs text-slate-400 mt-2 font-kurdish">ژیری دەستکرد شیکردنەوە بۆ ئاستی کاریگەری دڵسۆزی دەکات</p>
            </div>
          ) : apiError ? (
            <div className="bg-rose-50 rounded-3xl border border-rose-100 p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-rose-800 text-sm font-semibold">{apiError}</p>
              <button
                onClick={handleGenerateAI}
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition"
              >
                دووبارە هەوڵبدەرەوە (Try Again)
              </button>
            </div>
          ) : aiResult ? (
            
            /* Render AI Generated Plan */
            <div className="bg-white rounded-3xl border border-amber-200 p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
              
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>ژیری دەستکردی دروستکراو (Gemini 3.5 Flash Suggested)</span>
              </div>

              {/* Bilingual Title */}
              <h3 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 leading-snug">
                {aiResult.titleKu}
              </h3>
              <p className="text-xs text-slate-400 italic mt-0.5">{aiResult.titleEn}</p>

              {/* Status and Points */}
              <div className="grid grid-cols-2 gap-4 my-5 py-4 border-y border-slate-100 text-xs">
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <span className="text-slate-500 block mb-0.5">{t.impact}</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800 font-sans">
                    <Award className="w-4 h-4 text-amber-500" />
                    {Array.from({ length: aiResult.impactScore || 5 }).map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                    <span className="text-slate-400 font-normal ml-1">({aiResult.impactScore}/5)</span>
                  </div>
                </div>

                <div className="bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-slate-500 block mb-0.5">{t.budget}</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <DollarSign className="w-4 h-4 text-indigo-500" />
                    <span>{aiResult.budgetClass} ({aiResult.estimatedCostKu})</span>
                  </div>
                </div>
              </div>

              {/* Bilingual Description */}
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-sans">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="font-semibold text-slate-800 mb-1 text-xs">سەرنجی کوردی (Kurdish Context)</p>
                  <p className="text-right font-kurdish text-slate-700 text-sm">{aiResult.descriptionKu}</p>
                </div>
                <div className="p-1 pl-4 border-l-2 border-slate-200">
                  <p className="font-semibold text-slate-800 mb-1 text-xs">English Context</p>
                  <p className="text-xs text-slate-500 leading-normal">{aiResult.descriptionEn}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                  {t.actionSteps}
                </h4>
                
                {/* Kurdish Steps */}
                <ul className="space-y-2 mb-4">
                  {aiResult.stepsKu?.map((step: string, index: number) => (
                    <li key={index} className="flex gap-2.5 text-xs text-slate-700 text-right justify-start font-kurdish">
                      <span className="font-bold text-amber-600 bg-amber-50 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] select-none font-sans mt-0.5">{index + 1}</span>
                      <span className="leading-normal">{step}</span>
                    </li>
                  ))}
                </ul>

                {/* English Steps */}
                <ul className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 text-[11px] text-slate-500">
                  {aiResult.stepsEn?.map((step: string, index: number) => (
                    <li key={index} className="flex gap-2 font-sans">
                      <span className="text-slate-400">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSaveActivity(
                  aiResult.titleKu,
                  aiResult.titleEn,
                  aiResult.descriptionKu,
                  aiResult.descriptionEn,
                  aiResult.stepsKu,
                  aiResult.stepsEn,
                  aiResult.budgetClass,
                  aiResult.estimatedCostKu,
                  aiResult.impactScore
                )}
                className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                {t.scheduleButton}
              </button>
            </div>
          ) : (
            
            /* Render Preset/Fallback suggestion first */
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
                {t.quickPresTitle}
              </h4>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-display font-black text-slate-800">
                {currentPreset.titleKu}
              </h3>
              <p className="text-xs text-slate-400 italic mt-0.5">{currentPreset.titleEn}</p>

              {/* Indicators */}
              <div className="flex gap-4 my-4 pb-4 border-b border-slate-50 text-xs">
                <span className="bg-amber-50 text-amber-700 px-3 py-1 font-semibold rounded-lg border border-amber-100">
                  🌟 {currentPreset.impactScore}/5 Impact
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 font-semibold rounded-lg border border-indigo-100">
                  💰 {currentPreset.estimatedCostKu}
                </span>
              </div>

              {/* Descriptions */}
              <p className="font-kurdish text-right text-slate-700 text-sm leading-relaxed mb-4">
                {currentPreset.descriptionKu}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed italic block pl-4 border-l-2 border-slate-200">
                {currentPreset.descriptionEn}
              </p>

              {/* Steps */}
              <div className="mt-5 border-t border-slate-50 pt-4 space-y-3">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase">{t.actionSteps}:</h5>
                {currentPreset.stepsKu.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs text-slate-700 text-right justify-start font-kurdish">
                    <span className="bg-amber-100/50 text-amber-800 w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 font-bold font-sans text-[10px] mt-0.5">{idx + 1}</span>
                    <p className="leading-normal">{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSaveActivity(
                  currentPreset.titleKu,
                  currentPreset.titleEn,
                  currentPreset.descriptionKu,
                  currentPreset.descriptionEn,
                  currentPreset.stepsKu,
                  currentPreset.stepsEn,
                  currentPreset.budgetClass,
                  currentPreset.estimatedCostKu,
                  currentPreset.impactScore
                )}
                className="w-full mt-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.scheduleButton}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Section / Scheduled activities */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-display font-bold text-slate-800 mb-6 flex items-center gap-3 pb-4 border-b border-slate-50">
          <Clock className="w-5 h-5 text-emerald-500" />
          {t.scheduledTitle}
        </h3>

        {activities.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-200 mb-2" />
            <p className="text-xs">{t.noScheduled}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((act) => {
              const bgClass = act.status === "completed" ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100";
              const isCompleted = act.status === "completed";
              
              // Find matching month details
              const mData = monthsList.find(m => m.num === act.month);
              const monthLabel = mData ? (language === "ku" ? mData.nameKu.split(" ")[0] : mData.nameEn) : act.month;

              return (
                <div 
                  key={act.id} 
                  className={`rounded-2xl border p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition duration-200 ${bgClass}`}
                  id={`act-item-${act.id}`}
                >
                  <div className="space-y-1 text-right md:text-left w-full md:w-auto">
                    <div className="flex gap-2 items-center justify-end md:justify-start">
                      <span className="bg-slate-900 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase">
                        {monthLabel} 📅
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        act.status === "completed" ? "bg-emerald-100/50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}>
                        {act.status === "completed" ? t.completedStatus : t.scheduledStatus}
                      </span>
                    </div>

                    <h4 className="text-slate-800 font-bold text-base leading-tight">
                      {act.titleKu}
                    </h4>
                    <p className="text-xs text-slate-400 italic pr-2 font-light">{act.titleEn}</p>
                    
                    <p className="text-slate-600 text-xs text-right md:text-left pr-4 mt-2 font-kurdish bg-white/50 p-2.5 rounded-xl border border-dashed border-slate-100 max-w-2xl">
                      {act.descriptionKu}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 w-full md:w-auto justify-end">
                    {!isCompleted && (
                      <button
                        onClick={() => onUpdateActivityStatus(act.id, "completed")}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition"
                      >
                        ✔ {t.markCompleted}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteActivity(act.id)}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[11px] rounded-lg transition"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
