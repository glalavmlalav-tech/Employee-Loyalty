import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of GoogleGenAI SDK to prevent app crash if API key is missing
let aiInstance: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// API endpoint for generating employee engagement and loyalty suggestions using Gemini 3.5 Flash
app.post("/api/gemini/generate-activity", async (req, res) => {
  try {
    const { month, business, focusText } = req.body;

    const ai = getGenAI();
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
    res.json(data);
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "شکست هێنا لە دروستکردنی چالاکی لە رێگەی ژیری دەستکرد",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Configure Vite middleware or static files serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Express server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Since we're in Express 4, use app.get("*", ...)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
