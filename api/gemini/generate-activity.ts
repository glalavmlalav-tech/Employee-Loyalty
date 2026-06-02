import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { month, business, focusText } = req.body;

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is required",
        details: "Please add GEMINI_API_KEY in Vercel environment variables settings."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are an expert HR Consultant and Culture Coach specializing in Middle Eastern workplace engagement and corporate loyalty programs.
We need to generate a highly engaging, custom-tailored employee loyalty/morale-boosting activity recommendation for three local businesses in Kurdistan (Slemani/Erbil/Duhok):
1. 'Linia Furniture Factory / Interior' (کارگەی دارتاشی لینیا بۆ ئینتێریەر), which has a large factory and 3 showrooms, with around 50 employees (craftsmen, salespeople, designers).
2. 'Massimo Stone Gallery' (ماسیمۆ ستۆن گەلەری), a premium marble and decorative stone showroom with around 8 employees.
3. 'Liston Stone Factory' (کارگەی بەردی لیستۆن), a stone cutting and polishing factory with around 10 employees.

Target details for this recommendation:
- Designated Month: ${month || "Current Month"}
- Targeted Business Sector/Focus: ${business || "All three businesses combined"}
- Custom developer notes/focus: ${focusText || "Focus on building a family-like company connection (loyalty, dilsosi) and recognizing manual labor alongside office staff."}

Please generate an actionable activity plan. It must be professional, realistic, and contain clear titles and descriptions in both Kurdish Sorani and English. Ensure it reflects the month (seasonal aspect if applicable) and the specific nature of these jobs (manual woodwork and stone cutting workers require high physical effort, while showrooms involve customer relations).

Output MUST conform to this exact JSON schema structure. No Markdown wrapping, pure JSON output.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleKu: { type: Type.STRING, description: "Activity title in beautiful Kurdish Sorani" },
            titleEn: { type: Type.STRING, description: "Activity title in English" },
            descriptionKu: { type: Type.STRING, description: "Detailed summary and cultural benefits in Kurdish Sorani" },
            descriptionEn: { type: Type.STRING, description: "Detailed summary and cultural benefits in English" },
            stepsKu: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Action steps in Kurdish Sorani"
            },
            stepsEn: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Action steps in English"
            },
            budgetClass: { type: Type.STRING, description: "Budget scale: Low, Medium, High" },
            estimatedCostKu: { type: Type.STRING, description: "Cost estimate text in Kurdish e.g. 'کەم تێچوو'" },
            impactScore: { type: Type.INTEGER, description: "Estimated positive impact score on loyalty (1 to 5)" }
          },
          required: ["titleKu", "titleEn", "descriptionKu", "descriptionEn", "stepsKu", "stepsEn", "budgetClass", "estimatedCostKu", "impactScore"]
        }
      }
    });

    const responseText = response.text ? response.text.trim() : "{}";
    const data = JSON.parse(responseText);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: "شکست هێنا لە دروستکردنی چالاکی لە رێگەی ژیری دەستکرد",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
