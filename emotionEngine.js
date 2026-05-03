// All keyword lists
const EMOTION_KEYWORDS = {
  stressed: [
    "late",
    "hurry",
    "urgent",
    "fast",
    "quick",
    "rush",
    "stuck",
    "deadline",
    "panic",
    "help",
    "emergency",
    "now",
    "immediately",
  ],
  sad: [
    "sad",
    "tired",
    "upset",
    "bad",
    "depressed",
    "lonely",
    "crying",
    "hopeless",
    "worthless",
    "miss",
    "lost",
    "broken",
    "empty",
    "hurt",
  ],
  angry: [
    "angry",
    "hate",
    "frustrated",
    "annoyed",
    "mad",
    "stupid",
    "useless",
    "terrible",
    "worst",
    "awful",
  ],
  happy: [
    "happy",
    "great",
    "amazing",
    "wonderful",
    "excited",
    "love",
    "fantastic",
    "good",
    "awesome",
    "thanks",
    "perfect",
  ],
};

// Crisis words — must be checked separately before anything else
const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "no reason to live",
  "self harm",
  "hurt myself",
];

// Layer 1: keyword scan
function detectEmotionFromText(text) {
  const lower = text.toLowerCase();

  // Crisis check FIRST — highest priority always
  if (CRISIS_KEYWORDS.some((word) => lower.includes(word))) {
    return { emotion: "crisis", confidence: 1.0, method: "keyword" };
  }

  const scores = { stressed: 0, sad: 0, angry: 0, happy: 0, calm: 0 };

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) scores[emotion] += 1;
    }
  }

  // Weight by exclamation marks and caps (basic intensity signal)
  const exclamations = (text.match(/!/g) || []).length;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;

  if (exclamations > 1 || capsRatio > 0.3) {
    scores.stressed += 1;
    scores.angry += 0.5;
  }

  const topEmotion = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  // If no keywords matched at all → calm
  if (topEmotion[1] === 0) {
    return { emotion: "calm", confidence: 0.6, method: "keyword" };
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(topEmotion[1] / totalScore, 0.95);

  return { emotion: topEmotion[0], confidence, method: "keyword" };
}

// Emotion Resolver — smooths transitions, prevents flickering
// Keep history of last 3 detections, use majority vote
function resolveEmotion(newDetection, emotionHistory) {
  const updatedHistory = [...emotionHistory.slice(-2), newDetection];

  const counts = {};
  for (const d of updatedHistory) {
    counts[d.emotion] = (counts[d.emotion] || 0) + (d.confidence || 1);
  }

  const resolved = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  return { emotion: resolved, history: updatedHistory };
}

// Layer 2: HuggingFace sentiment analysis (bonus)
async function getHuggingFaceSentiment(text) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_HF_TOKEN || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      },
    );

    if (!response.ok) {
      throw new Error("HuggingFace API error");
    }

    const data = await response.json();

    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      const sentiments = data[0];
      const topSentiment = sentiments.reduce((prev, current) =>
        prev.score > current.score ? prev : current,
      );

      return {
        sentiment: topSentiment.label.toUpperCase(),
        confidence: topSentiment.score,
      };
    }

    return null;
  } catch (error) {
    console.warn("HuggingFace sentiment analysis failed:", error);
    return null;
  }
}

// Enhanced emotion detection with optional Layer 2
async function detectEmotionFromTextEnhanced(
  text,
  useHuggingFace = false,
) {
  const lower = text.toLowerCase();

  // Crisis check FIRST — highest priority always
  if (CRISIS_KEYWORDS.some((word) => lower.includes(word))) {
    return { emotion: "crisis", confidence: 1.0, method: "keyword" };
  }

  const scores = { stressed: 0, sad: 0, angry: 0, happy: 0, calm: 0 };

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) scores[emotion] += 1;
    }
  }

  // Weight by exclamation marks and caps (basic intensity signal)
  const exclamations = (text.match(/!/g) || []).length;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;

  if (exclamations > 1 || capsRatio > 0.3) {
    scores.stressed += 1;
    scores.angry += 0.5;
  }

  let finalEmotion = "calm";
  let finalConfidence = 0.6;
  let method = "keyword";

  // If no keywords matched at all → calm
  if (Object.values(scores).every((score) => score === 0)) {
    finalEmotion = "calm";
    finalConfidence = 0.6;
  } else {
    const topEmotion = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    finalConfidence = Math.min(topEmotion[1] / totalScore, 0.95);
    finalEmotion = topEmotion[0];
  }

  // Layer 2: Enhance with HuggingFace if enabled
  if (useHuggingFace && text.length > 10) {
    const hfResult = await getHuggingFaceSentiment(text);
    if (hfResult) {
      method = "hybrid";

      // Map HuggingFace sentiments to our emotions
      if (hfResult.sentiment === "NEGATIVE" && hfResult.confidence > 0.7) {
        // For negative, check keywords to distinguish sad vs stressed vs angry
        if (scores.sad > scores.stressed && scores.sad > scores.angry) {
          finalEmotion = "sad";
        } else if (scores.angry > scores.stressed) {
          finalEmotion = "angry";
        } else {
          finalEmotion = "stressed";
        }
        finalConfidence = Math.max(finalConfidence, hfResult.confidence * 0.8);
      } else if (
        hfResult.sentiment === "POSITIVE" &&
        hfResult.confidence > 0.6
      ) {
        finalEmotion = scores.happy > 0 ? "happy" : "calm";
        finalConfidence = Math.max(finalConfidence, hfResult.confidence * 0.7);
      }
      // NEUTRAL keeps the keyword-based result
    }
  }

  return { emotion: finalEmotion, confidence: finalConfidence, method };
}

window.emotionEngine = {
  detectEmotionFromText,
  resolveEmotion,
  getHuggingFaceSentiment,
  detectEmotionFromTextEnhanced,
};
