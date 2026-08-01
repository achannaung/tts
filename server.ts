import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Google AI Studio TTS Engine" });
});

// Initialize Gemini Client
function getGeminiClient(req?: express.Request) {
  const headerKey = req?.headers?.["x-gemini-api-key"] as string | undefined;
  const bodyKey = req?.body?.customApiKey as string | undefined;
  const apiKey = (headerKey && headerKey.trim()) || (bodyKey && bodyKey.trim()) || process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "Missing Gemini API Key. Please click the 'API Key' button in the top bar to enter your Google Gemini API Key, or set GEMINI_API_KEY in your server environment variables."
    );
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
      timeout: 180000, // 3 minutes timeout to prevent HeadersTimeoutError
    },
  });
}

/**
 * Helper to execute Gemini API calls with automatic retry for network/timeout errors
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxAttempts = 2, delayMs = 1500): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);
      const isTimeoutOrFetchErr =
        err?.name === "TypeError" ||
        errMsg.includes("fetch failed") ||
        errMsg.includes("HeadersTimeoutError") ||
        errMsg.includes("timeout") ||
        errMsg.includes("503") ||
        errMsg.includes("504");

      console.warn(`Gemini API call attempt ${attempt}/${maxAttempts} failed: ${errMsg}`);
      if (attempt < maxAttempts && isTimeoutOrFetchErr) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      } else if (attempt >= maxAttempts) {
        throw err;
      }
    }
  }
  throw lastError;
}

/**
 * Single-speaker TTS Endpoint
 */
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      voiceName = "Kore",
      speakerName = "Algith",
      accent = "UK",
      style = "expressive",
      speed = 1.0,
      pitch = 0,
      emotionIntensity = 50,
      temperature = 0.7,
      systemStyleInstruction = "",
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    const ai = getGeminiClient(req);

    // Construct expressive prompt with tone/accent/style directives
    let styleDirections = [];
    if (accent && accent !== "Global") styleDirections.push(`${accent} accent`);
    if (style) styleDirections.push(`${style} narration style`);
    if (speed !== 1.0) styleDirections.push(speed > 1 ? "fast pace" : "measured slow pace");
    if (emotionIntensity > 70) styleDirections.push("intense emotion");
    if (systemStyleInstruction && systemStyleInstruction.trim()) {
      styleDirections.push(systemStyleInstruction.trim());
    }

    const directionPrefix = styleDirections.length > 0 ? `Say cheerfully in a ${styleDirections.join(", ")}: ` : "Say clearly: ";
    const formattedPrompt = `${directionPrefix}${text.trim()}`;

    // Supported voices in gemini-3.1-flash-tts-preview: 'Kore', 'Zephyr', 'Fenrir', 'Puck', 'Charon', 'Aoede', 'Calliope', 'Orpheus', 'Algenib'
    const validVoices = ["Kore", "Zephyr", "Fenrir", "Puck", "Charon", "Aoede", "Calliope", "Orpheus", "Algenib"];
    const targetVoice = validVoices.includes(voiceName) ? voiceName : "Kore";

    console.log(`Generating TTS with voice: ${targetVoice}, speaker: ${speakerName}, style: ${style}`);

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: formattedPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          temperature: Math.min(Math.max(temperature, 0), 1),
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: targetVoice,
              },
            },
          },
        },
      })
    );

    const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = candidatePart?.inlineData?.data;

    if (!base64Audio) {
      console.error("No audio data returned from Gemini TTS API", response);
      return res.status(500).json({ error: "Failed to generate audio output from Gemini TTS" });
    }

    return res.json({
      audioBase64: base64Audio,
      voiceName: targetVoice,
      speakerName,
      text,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/generate:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate audio",
    });
  }
});

/**
 * Multi-speaker Dialogue TTS Endpoint
 */
app.post("/api/tts/multi-generate", async (req, res) => {
  try {
    const { turns = [] } = req.body;

    if (!Array.isArray(turns) || turns.length === 0) {
      return res.status(400).json({ error: "Dialogue turns are required" });
    }

    const ai = getGeminiClient(req);

    // Map unique speakers
    const speakerMap = new Map<string, string>(); // speakerName -> voiceName
    turns.forEach((turn: any) => {
      if (turn.speakerName && !speakerMap.has(turn.speakerName)) {
        speakerMap.set(turn.speakerName, turn.voiceName || "Kore");
      }
    });

    // Format conversation script
    const scriptLines = turns.map((t: any) => `${t.speakerName}: ${t.text}`).join("\n");
    const prompt = `TTS the following conversation between ${Array.from(speakerMap.keys()).join(" and ")}:\n${scriptLines}`;

    // Prepare multi-speaker voice config (Gemini expects exactly 2 speakers for multiSpeakerVoiceConfig)
    const speakerNamesArray = Array.from(speakerMap.keys());
    const validVoices = ["Kore", "Zephyr", "Fenrir", "Puck", "Charon", "Aoede", "Calliope", "Orpheus", "Algenib"];

    let speakerVoiceConfigs: any[] = [];

    if (speakerNamesArray.length >= 2) {
      const s1 = speakerNamesArray[0];
      const s2 = speakerNamesArray[1];
      speakerVoiceConfigs = [
        {
          speaker: s1,
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoices.includes(speakerMap.get(s1)!) ? speakerMap.get(s1) : "Kore" },
          },
        },
        {
          speaker: s2,
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoices.includes(speakerMap.get(s2)!) ? speakerMap.get(s2) : "Puck" },
          },
        },
      ];
    } else {
      // Single speaker fallback
      const s1 = speakerNamesArray[0] || "Speaker";
      speakerVoiceConfigs = [
        {
          speaker: s1,
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
        {
          speaker: "Narrator",
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" },
          },
        },
      ];
    }

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs,
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to generate multi-speaker audio" });
    }

    return res.json({
      audioBase64: base64Audio,
      turnCount: turns.length,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/multi-generate:", error);
    return res.status(500).json({ error: error.message || "Failed to generate multi-speaker audio" });
  }
});

/**
 * AI Script Polish Endpoint
 */
app.post("/api/ai/polish-script", async (req, res) => {
  try {
    const { text, targetStyle = "expressive", mode = "enhance", customPrompt = "" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getGeminiClient(req);

    let styleGuide = "";
    if (mode === "expressive") {
      styleGuide = "Focus heavily on inserting expressive speech tags like [pause], [sighs], [excitedly], [whispering], [dramatically], [clears throat] to maximize vocal emotion and performance dynamics.";
    } else if (mode === "storytelling") {
      styleGuide = "Refine for captivating audio storytelling and audiobooks. Enhance narrative pacing, dramatic pauses, atmospheric rhythm, and suspenseful beats.";
    } else if (mode === "corporate") {
      styleGuide = "Polish for professional corporate presentations, product announcements, and e-learning. Maintain a clear, concise, authoritative, and confident tone.";
    } else if (mode === "broadcast") {
      styleGuide = "Polish for podcast and newsroom broadcast delivery. Use punchy sentences, clear emphasis, and crisp cadence.";
    } else if (mode === "dialogue") {
      styleGuide = "Format and polish into a natural multi-character dialogue script using 'Narrator:', 'Speaker A:', 'Speaker B:' line markers with speech pauses.";
    } else {
      styleGuide = `Optimize sentence cadence, natural speech pauses, rhythm, and punctuation for high-fidelity Text-to-Speech synthesis in a '${targetStyle}' voice style. Use expressive tags where helpful.`;
    }

    if (customPrompt && customPrompt.trim()) {
      styleGuide += `\nAdditional user instructions: ${customPrompt.trim()}`;
    }

    const systemInstruction = `You are an expert Voice Director and Text-to-Speech Script Editor powered by Gemini 3.6 Flash.
Your job is to polish raw text for speech synthesis.
${styleGuide}
- Maintain the core message, facts, and key details.
- Do NOT wrap response in markdown or explanation.
- Return ONLY the final polished script text ready for speech synthesis.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: text,
        config: { systemInstruction },
      })
    );

    const polishedText = response.text ? response.text.trim() : text;
    return res.json({ polishedText, mode, targetStyle });
  } catch (error: any) {
    console.error("Error in /api/ai/polish-script:", error);
    return res.status(500).json({ error: error.message || "Failed to polish script" });
  }
});

/**
 * Voice Clone Acoustic Analysis Endpoint
 */
app.post("/api/voice-clone/analyze", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/wav", name = "Cloned Voice", description = "" } = req.body;

    const ai = getGeminiClient(req);
    const parts: any[] = [];

    // Clean base64 string if data URI header is present
    const cleanBase64 = audioBase64 ? audioBase64.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, "") : null;

    if (cleanBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "audio/wav",
          data: cleanBase64,
        },
      });
    }

    parts.push({
      text: `You are an expert acoustic audio engineer and speech synthesis designer.
Analyze this voice recording for Text-to-Speech cloning and replication.
Evaluate vocal traits including timbre, pitch, cadence, breathiness, resonance, and accent.

Choose the closest base prebuilt voice from this exact list: ["Kore", "Zephyr", "Fenrir", "Puck", "Charon", "Aoede", "Calliope", "Orpheus", "Algenib"].
Choose the closest accent from: ["US", "UK", "AU", "IN", "CA", "Global"].
Choose the closest style from: ["expressive", "emotional", "robotic", "dramatic", "corporate", "news", "whisper", "energetic", "calm"].

Return strictly a raw JSON object (WITHOUT markdown formatting, no \`\`\`json blocks) matching this exact schema:
{
  "voiceName": "Kore",
  "accent": "US",
  "gender": "Female",
  "style": "expressive",
  "speed": 1.0,
  "pitch": 0,
  "systemStyleInstruction": "Speak in a warm, articulate voice with smooth cadence and gentle pitch inflection.",
  "analysisSummary": "Extracted a clear, mid-pitch voice with balanced resonance and natural pacing."
}`
    });

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ parts }],
      })
    );

    const responseText = response.text || "";
    console.log("Gemini Voice Analysis Response:", responseText);

    let parsedResult: any = {};
    try {
      // Strip markdown code fences if present
      const jsonString = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedResult = JSON.parse(jsonString);
    } catch (parseErr) {
      console.warn("Failed to parse JSON from Gemini analysis, using intelligent fallback", parseErr);
      parsedResult = {
        voiceName: "Kore",
        accent: "US",
        gender: "Neutral",
        style: "expressive",
        speed: 1.0,
        pitch: 0,
        systemStyleInstruction: "Speak naturally with clear articulation and balanced tone.",
        analysisSummary: "Extracted vocal traits from uploaded sample.",
      };
    }

    const validVoices = ["Kore", "Zephyr", "Fenrir", "Puck", "Charon", "Aoede", "Calliope"];
    const validAccents = ["US", "UK", "AU", "IN", "CA", "Global"];
    const validStyles = ["expressive", "emotional", "robotic", "dramatic", "corporate", "news", "whisper", "energetic", "calm"];

    const clonedVoice = {
      id: `clone_${Date.now()}`,
      name: name.trim() || "Custom Cloned Voice",
      description: description.trim() || "Custom cloned voice created from user sample.",
      createdAt: Date.now(),
      audioSampleBase64: cleanBase64 ? `data:${mimeType};base64,${cleanBase64}` : undefined,
      voiceName: validVoices.includes(parsedResult.voiceName) ? parsedResult.voiceName : "Kore",
      accent: validAccents.includes(parsedResult.accent) ? parsedResult.accent : "US",
      gender: parsedResult.gender || "Neutral",
      style: validStyles.includes(parsedResult.style) ? parsedResult.style : "expressive",
      speed: typeof parsedResult.speed === "number" ? Math.min(Math.max(parsedResult.speed, 0.5), 2.0) : 1.0,
      pitch: typeof parsedResult.pitch === "number" ? Math.min(Math.max(parsedResult.pitch, -50), 50) : 0,
      systemStyleInstruction: parsedResult.systemStyleInstruction || "Speak with smooth articulation.",
      analysisSummary: parsedResult.analysisSummary || "Acoustic features analyzed and mapped to voice profile.",
      avatarColor: "from-purple-500 to-pink-500",
    };

    return res.json({ clonedVoice });
  } catch (error: any) {
    console.error("Error in /api/voice-clone/analyze:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze voice audio sample" });
  }
});

/**
 * Vite & Server Startup Setup
 */
async function startServer() {
  // API routes first
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Google AI Studio TTS Engine" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
