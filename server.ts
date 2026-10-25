import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// In-memory cache for developer uploaded custom PWA icons
let inMemoryCustomIconBuffer: Buffer | null = null;

// Read existing uploaded icon if saved
try {
  const pwa512Path = path.join(process.cwd(), "public", "pwa-512x512.png");
  if (fs.existsSync(pwa512Path)) {
    inMemoryCustomIconBuffer = fs.readFileSync(pwa512Path);
  }
} catch (e) {}

// Serve custom uploaded PWA icon if available
app.get(["/apple-touch-icon.png", "/pwa-192x192.png", "/pwa-512x512.png", "/pwa-maskable-512x512.png"], (req, res, next) => {
  if (inMemoryCustomIconBuffer) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache");
    return res.send(inMemoryCustomIconBuffer);
  }
  next();
});

// Endpoint to update PWA icons dynamically when developer uploads custom logo
app.post("/api/pwa/update-icons", (req, res) => {
  try {
    const { logoDataUrl } = req.body;
    if (!logoDataUrl || typeof logoDataUrl !== "string") {
      return res.status(400).json({ error: "Invalid logo data" });
    }

    const base64Data = logoDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");
    inMemoryCustomIconBuffer = imgBuffer;

    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), imgBuffer);
    fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), imgBuffer);
    fs.writeFileSync(path.join(publicDir, "pwa-maskable-512x512.png"), imgBuffer);
    fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), imgBuffer);

    // Also write to dist/ if dist exists
    const distDir = path.join(process.cwd(), "dist");
    if (fs.existsSync(distDir)) {
      try {
        fs.writeFileSync(path.join(distDir, "pwa-512x512.png"), imgBuffer);
        fs.writeFileSync(path.join(distDir, "pwa-192x192.png"), imgBuffer);
        fs.writeFileSync(path.join(distDir, "pwa-maskable-512x512.png"), imgBuffer);
        fs.writeFileSync(path.join(distDir, "apple-touch-icon.png"), imgBuffer);
      } catch (e) {}
    }

    console.log("Custom PWA icons updated on disk successfully.");
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating PWA icons:", err);
    res.status(500).json({ error: err.message });
  }
});

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
      server: { middlewareMode: true, hmr: false },
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
