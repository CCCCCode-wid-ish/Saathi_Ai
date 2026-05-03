const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const SYSTEM_PROMPT = `You are Saathi AI, an honest voice assistant.

STRICT RULES:
1. Never make up facts. If you are not sure, say so clearly.
2. Always return your response as a valid JSON object — nothing else.
3. JSON format must be exactly:
{
  "text": "your answer here",
  "confidence": 0.85,
  "isFactual": true,
  "uncertaintyReason": "This is based on general knowledge, not real-time data",
  "suggestedSources": ["google", "wikipedia"]
}

4. confidence is a number from 0.0 to 1.0:
   - Use 0.9+ only when you are certain (math, definitions, known facts)
   - Use 0.6–0.89 when you are mostly sure but not 100%
   - Use below 0.6 when you are guessing or the topic is time-sensitive
5. isFactual = true if the answer is a checkable fact. false if it is opinion or advice.
6. uncertaintyReason = short reason why confidence is not 100%. Always fill this.
7. suggestedSources = array, pick from: ["google", "wikipedia", "snopes", "factcheck", "wolframalpha", "pubmed"]
   - Use pubmed for health topics
   - Use snopes or factcheck for news/viral claims
   - Use wolframalpha for math or science
   - Use wikipedia or google for general knowledge`;

const uncertainWords = [
  "maybe",
  "might",
  "possibly",
  "perhaps",
  "could be",
  "not sure",
  "approximately",
];

const allowedSources = new Set(["google", "wikipedia", "snopes", "factcheck", "wolframalpha", "pubmed"]);
const provider = process.env.AI_PROVIDER || (process.env.GROQ_API_KEY ? "groq" : "openai");
const clientConfig =
  provider === "groq"
    ? {
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }
    : {
        apiKey: process.env.OPENAI_API_KEY,
      };
const openai = new OpenAI(clientConfig);
const model = process.env.AI_MODEL || (provider === "groq" ? "openai/gpt-oss-20b" : "gpt-4.1-mini");
const app = express();
const router = express.Router();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(__dirname));

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry) => entry && (entry.role === "user" || entry.role === "assistant") && typeof entry.content === "string")
    .map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
}

function clampConfidence(value, text = "") {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }

  const hasUncertainty = uncertainWords.some((word) => text.toLowerCase().includes(word));
  return hasUncertainty ? 0.55 : 0.8;
}

function normalizeSources(suggestedSources) {
  if (!Array.isArray(suggestedSources)) {
    return ["google"];
  }

  const filtered = suggestedSources.filter((source) => allowedSources.has(source)).slice(0, 3);
  return filtered.length > 0 ? filtered : ["google"];
}

function detectSourceCategory(userMessage) {
  const text = String(userMessage || "").toLowerCase();

  const medicalKeywords = [
    "health",
    "medical",
    "medicine",
    "medication",
    "medications",
    "safe to use",
    "is it safe",
    "side effect",
    "side effects",
    "dose",
    "dosage",
    "tablet",
    "capsule",
    "syrup",
    "antibiotic",
    "painkiller",
    "paracetamol",
    "acetaminophen",
    "ibuprofen",
    "aspirin",
    "crocin",
    "dolo",
    "prescription",
    "drug",
    "drugs",
    "doctor",
    "symptom",
    "symptoms",
    "disease",
    "treatment",
    "diagnosis",
    "infection",
    "fever",
    "pain",
    "hospital",
    "blood",
    "mental health",
  ];

  const viralClaimKeywords = [
    "fake news",
    "viral",
    "rumor",
    "rumour",
    "hoax",
    "fact check",
    "factcheck",
    "is this true",
    "did this happen",
    "breaking news",
    "claim",
  ];

  const mathScienceKeywords = [
    "math",
    "equation",
    "formula",
    "calculate",
    "solve",
    "physics",
    "chemistry",
    "science",
    "algebra",
    "geometry",
    "temperature",
    "velocity",
    "acceleration",
    "integral",
    "derivative",
  ];

  if (medicalKeywords.some((keyword) => text.includes(keyword))) {
    return "medical";
  }

  if (viralClaimKeywords.some((keyword) => text.includes(keyword))) {
    return "viral";
  }

  if (mathScienceKeywords.some((keyword) => text.includes(keyword)) || /\d+\s*[\+\-\*\/]\s*\d+/.test(text)) {
    return "mathScience";
  }

  return "general";
}

function getDeterministicSources(userMessage, modelSources) {
  const normalizedModelSources = normalizeSources(modelSources);
  const category = detectSourceCategory(userMessage);

  if (category === "medical") {
    return ["pubmed", ...normalizedModelSources.filter((source) => source !== "pubmed")].slice(0, 3);
  }

  if (category === "viral") {
    const priority = ["snopes", "factcheck"];
    return [...priority, ...normalizedModelSources.filter((source) => !priority.includes(source))].slice(0, 3);
  }

  if (category === "mathScience") {
    return ["wolframalpha", ...normalizedModelSources.filter((source) => source !== "wolframalpha")].slice(0, 3);
  }

  const generalPriority = ["google", "wikipedia"];
  return [...normalizedModelSources, ...generalPriority.filter((source) => !normalizedModelSources.includes(source))].slice(0, 3);
}

function shouldForceFactual(userMessage) {
  const category = detectSourceCategory(userMessage);
  return category === "medical" || category === "viral" || category === "mathScience";
}

function isTimeSensitiveQuery(userMessage) {
  const text = String(userMessage || "").toLowerCase();
  const keywords = [
    "today",
    "tomorrow",
    "now",
    "current",
    "latest",
    "recent",
    "breaking",
    "this week",
    "this month",
    "weather",
    "price",
    "stock",
    "news",
    "score",
    "election",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function hasUncertaintyLanguage(text) {
  const value = String(text || "").toLowerCase();
  return uncertainWords.some((word) => value.includes(word));
}

function isMedicalRiskQuery(userMessage) {
  const text = String(userMessage || "").toLowerCase();
  const keywords = [
    "safe",
    "unsafe",
    "dose",
    "dosage",
    "side effect",
    "side effects",
    "can i take",
    "should i take",
    "is it okay",
    "is it ok",
    "pregnant",
    "pregnancy",
    "child",
    "baby",
    "kid",
    "allergy",
    "interaction",
    "overdose",
    "prescription",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function isWellEstablishedFactQuery(userMessage) {
  const text = String(userMessage || "").toLowerCase().trim();

  if (/\bwhat is the capital of\b/.test(text)) {
    return true;
  }

  if (/\bis .+\b the capital of\b/.test(text)) {
    return true;
  }

  if (/\bwho is the president of\b/.test(text) || /\bwho is the prime minister of\b/.test(text)) {
    return false;
  }

  const stableFactKeywords = [
    "capital of",
    "largest planet",
    "speed of light",
    "boiling point of water",
    "2+2",
    "2 + 2",
  ];

  return stableFactKeywords.some((keyword) => text.includes(keyword));
}

function isGeographyFactQuery(userMessage) {
  const text = String(userMessage || "").toLowerCase().trim();
  const geographyKeywords = [
    "capital of",
    "largest country",
    "smallest country",
    "continent",
    "ocean",
    "sea",
    "river",
    "mountain",
    "desert",
    "state of",
    "country of",
    "city of",
    "where is",
  ];

  if (timeSensitiveGeographyQuery(text)) {
    return false;
  }

  return geographyKeywords.some((keyword) => text.includes(keyword));
}

function timeSensitiveGeographyQuery(text) {
  const unstableKeywords = [
    "weather",
    "temperature",
    "today",
    "tomorrow",
    "now",
    "current",
    "latest",
    "recent",
  ];

  return unstableKeywords.some((keyword) => text.includes(keyword));
}

function getDeterministicConfidence(userMessage, answerText, isFactual) {
  const category = detectSourceCategory(userMessage);
  const timeSensitive = isTimeSensitiveQuery(userMessage);
  const uncertainAnswer = hasUncertaintyLanguage(answerText);
  const uncertainQuestion = hasUncertaintyLanguage(userMessage);
  const medicalRiskQuery = isMedicalRiskQuery(userMessage);
  const wellEstablishedFact = isWellEstablishedFactQuery(userMessage);
  const geographyFact = isGeographyFactQuery(userMessage);
  const parsedConfidence = clampConfidence(undefined, answerText);

  if (!isFactual) {
    return uncertainAnswer || uncertainQuestion ? 0.58 : 0.72;
  }

  if (timeSensitive) {
    return 0.52;
  }

  if (category === "viral") {
    return 0.42;
  }

  if (medicalRiskQuery) {
    return 0.55;
  }

  if (category === "medical") {
    return 0.66;
  }

  if (category === "mathScience") {
    return uncertainAnswer || uncertainQuestion ? 0.74 : 0.95;
  }

  if (geographyFact && !timeSensitive && !uncertainAnswer && !uncertainQuestion) {
    return 1.0;
  }

  if (wellEstablishedFact && !timeSensitive && !uncertainAnswer && !uncertainQuestion) {
    return 0.97;
  }

  if (uncertainAnswer || uncertainQuestion) {
    return 0.62;
  }

  return parsedConfidence > 0.85 ? 0.84 : 0.82;
}

function buildLocalAssistantResponse(userMessage) {
  const text = String(userMessage || "").trim();
  const lower = text.toLowerCase();

  if (!text) {
    return {
      text: "I need a question or message before I can help.",
      confidence: 0.98,
      isFactual: false,
      uncertaintyReason: "This is a direct response to an empty input, not a factual claim.",
      suggestedSources: ["google"],
    };
  }

  if (lower.includes("capital of france")) {
    return {
      text: "The capital of France is Paris.",
      confidence: 0.97,
      isFactual: true,
      uncertaintyReason: "This is a well-established geographical fact.",
      suggestedSources: ["wikipedia", "google"],
    };
  }

  if (lower.includes("rain") || lower.includes("weather") || lower.includes("today")) {
    return {
      text: "I can't reliably tell you today's weather from local fallback mode.",
      confidence: 0.32,
      isFactual: true,
      uncertaintyReason: "This requires real-time weather data, and local fallback mode does not have live internet data.",
      suggestedSources: ["google", "wikipedia", "wolframalpha"],
    };
  }

  if (lower.includes("virus") || lower.includes("fake news") || lower.includes("rumor") || lower.includes("viral")) {
    return {
      text: "I can't verify that claim confidently in local fallback mode.",
      confidence: 0.28,
      isFactual: true,
      uncertaintyReason: "News and viral claims need current verification from dedicated fact-checking sources.",
      suggestedSources: ["snopes", "factcheck", "google"],
    };
  }

  if (
    lower.includes("health") ||
    lower.includes("medicine") ||
    lower.includes("disease") ||
    lower.includes("symptom") ||
    lower.includes("doctor")
  ) {
    return {
      text: "I can offer general health information, but I can't verify medical details confidently in local fallback mode.",
      confidence: 0.41,
      isFactual: true,
      uncertaintyReason: "Health topics should be checked against medical literature or a clinician, especially without live model access.",
      suggestedSources: ["pubmed", "google", "wikipedia"],
    };
  }

  if (lower.includes("2+2") || lower.includes("2 + 2")) {
    return {
      text: "2 + 2 = 4.",
      confidence: 0.99,
      isFactual: true,
      uncertaintyReason: "This is a straightforward arithmetic fact.",
      suggestedSources: ["wolframalpha"],
    };
  }

  if (lower.includes("should i") || lower.includes("what should") || lower.includes("advice")) {
    return {
      text: "I can help you think through it, but this answer is advice rather than a guaranteed fact.",
      confidence: 0.72,
      isFactual: false,
      uncertaintyReason: "Advice depends on your goals and context, so there usually isn't one objectively correct answer.",
      suggestedSources: ["google"],
    };
  }

  return {
    text: "I'm in local fallback mode right now, so I may be limited. I can still help with simple known facts and I’ll be honest when I’m unsure.",
    confidence: 0.58,
    isFactual: false,
    uncertaintyReason: "The live AI provider is unavailable, so this answer comes from a constrained local fallback.",
    suggestedSources: ["google", "wikipedia"],
  };
}

function getApiErrorMessage(error) {
  if (error?.status === 429) {
    return provider === "groq" ? "Groq quota exceeded" : "OpenAI quota exceeded";
  }

  if (error?.status === 401) {
    return provider === "groq" ? "Invalid Groq API key" : "Invalid OpenAI API key";
  }

  return "AI service unavailable";
}

function buildResponsesInput(conversationHistory, userMessage) {
  const history = normalizeHistory(conversationHistory);
  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: SYSTEM_PROMPT,
        },
      ],
    },
    ...history.map((entry) => ({
      role: entry.role,
      content: [
        {
          type: "input_text",
          text: entry.content,
        },
      ],
    })),
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: userMessage,
        },
      ],
    },
  ];
}

function extractResponseText(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  if (!Array.isArray(response?.output)) {
    return "";
  }

  for (const item of response.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  return "";
}

router.post("/chat", async (req, res) => {
  const { userMessage, conversationHistory } = req.body || {};

  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return res.status(400).json({ error: "userMessage is required" });
  }

  try {
    const response = await openai.responses.create({
      model,
      input: buildResponsesInput(conversationHistory, userMessage),
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const raw = extractResponseText(response);
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        text: raw,
        confidence: 0.5,
        isFactual: false,
        uncertaintyReason: "Response format was unexpected",
        suggestedSources: ["google"],
      };
    }

    const normalizedText =
      typeof parsed.text === "string" && parsed.text.trim() ? parsed.text.trim() : "I'm not sure enough to answer confidently.";
    const normalizedIsFactual =
      shouldForceFactual(userMessage) || (typeof parsed.isFactual === "boolean" ? parsed.isFactual : false);

    const normalized = {
      text: normalizedText,
      confidence: getDeterministicConfidence(
        userMessage,
        normalizedText,
        normalizedIsFactual
      ),
      isFactual: normalizedIsFactual,
      uncertaintyReason:
        typeof parsed.uncertaintyReason === "string" && parsed.uncertaintyReason.trim()
          ? parsed.uncertaintyReason.trim()
          : "This answer may be incomplete or based on non-real-time knowledge.",
      suggestedSources: getDeterministicSources(userMessage, parsed.suggestedSources),
    };

    return res.json(normalized);
  } catch (error) {
    console.error("OpenAI request failed:", error?.status || "", error?.message || error);
    if (error?.response?.data) {
      console.error("OpenAI response body:", error.response.data);
    }
    const apiErrorMessage = getApiErrorMessage(error);

    if (
      apiErrorMessage === "OpenAI quota exceeded" ||
      apiErrorMessage === "Invalid OpenAI API key" ||
      apiErrorMessage === "Groq quota exceeded" ||
      apiErrorMessage === "Invalid Groq API key"
    ) {
      res.set("X-Saathi-Mode", "fallback");
      return res.json(buildLocalAssistantResponse(userMessage));
    }

    return res.status(error?.status || 500).json({ error: apiErrorMessage });
  }
});

app.use("/api", router);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const host = "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Saathi AI server running on http://localhost:${port}`);
  console.log(`To access from mobile, use your computer's IP address (e.g., http://10.14.130.66:${port})`);
});
