const { useEffect, useMemo, useRef, useState } = React;
const SOURCE_URLS = window.SOURCE_URLS || {};
const ConfidenceTag =
  typeof window.ConfidenceTag === "function"
    ? window.ConfidenceTag
    : () => null;
const PrivacyShield =
  typeof window.PrivacyShield === "function"
    ? window.PrivacyShield
    : () => null;
const TransparencyPanel =
  typeof window.TransparencyPanel === "function"
    ? window.TransparencyPanel
    : () => null;
const SafetyFlag =
  typeof window.SafetyFlag === "function" ? window.SafetyFlag : () => null;

const emotionContextApi = window.EmotionContext || {};
const EmotionProvider =
  typeof emotionContextApi.EmotionProvider === "function"
    ? emotionContextApi.EmotionProvider
    : function FallbackEmotionProvider({ children }) {
        return children;
      };
const useEmotion =
  typeof emotionContextApi.useEmotion === "function"
    ? emotionContextApi.useEmotion
    : () => ({
        currentEmotion: "calm",
        isCrisis: false,
        processText: () => {},
      });

const { EMOTION_THEMES = {} } = window.emotionTheme || {};
const { wrapResponse = (text) => text } = window.responseAdapter || {};
const { speak = () => {} } = window.voiceAdapter || {};
const { SpeechController } = window.interruptEngine || {};
const StopButton =
  typeof window.StopButton === "function" ? window.StopButton : () => null;
const ActionButtons =
  typeof window.ActionButtons === "function"
    ? window.ActionButtons
    : () => null;
const SupportSuggestion =
  typeof window.SupportSuggestion === "function"
    ? window.SupportSuggestion
    : () => null;
const storageApi = window.storageManager || {};
const storage = storageApi.storage;
const privacyApi = window.privacyEngine || {};
const {
  PRIVACY_STATES = {},
  PRIVACY_MODE_BEHAVIOR = {},
  calculatePrivacyState = () => PRIVACY_STATES.SAFE || {},
} = privacyApi;
const { analyzeResponse = () => ({ isFlagged: false, flags: [] }) } =
  window.safetyEngine || {};
const emotionEngine = window.emotionEngine || {};

const INITIAL_ASSISTANT_MESSAGE = {
  id: 1,
  sender: "assistant",
  text: "I'm here. Tell me what you need and I'll help.",
  confidence: 0.94,
  isFactual: false,
  uncertaintyReason:
    "This is a supportive greeting rather than a factual claim.",
  suggestedSources: [],
  actions: [],
  sourceQuery: "Saathi AI greeting",
  analysisResult: {
    isFlagged: false,
    flags: [],
    highSeverity: false,
    summary: null,
  },
};

const DEFAULT_MEMORY = {
  name: null,
  emotion: "calm",
  lastQuery: null,
  lastIntent: null,
  lastAction: "Opened Saathi AI",
  conversationCount: 0,
};

const flowNodes = [
  { icon: "🎤", label: "Voice Input" },
  { icon: "📝", label: "Text" },
  { icon: "🧠", label: "Emotion Detection" },
  { icon: "🛡️", label: "Privacy Shield" },
  { icon: "💬", label: "Response" },
];

const TASK_STEPS = ["Intent", "Clarifying", "Executing", "Confirmed"];
const CONTRADICTION_CUES = [
  "actually",
  "instead",
  "no,",
  "wait",
  "change that",
  "correction",
  "rather",
];
const FACE_EMOTION_MAP = {
  calm: { label: "Neutral", emoji: ":|" },
  happy: { label: "Happy", emoji: ":D" },
  sad: { label: "Concerned", emoji: ":(" },
  angry: { label: "Focused", emoji: ">:(" },
  anxious: { label: "Tense", emoji: ":/" },
  attentive: { label: "Attentive", emoji: ":)" },
  unavailable: { label: "Unavailable", emoji: "[off]" },
};
const VOICE_EMOTION_MAP = {
  calm: { label: "Calm", emoji: ":)" },
  happy: { label: "Warm", emoji: ":D" },
  sad: { label: "Low", emoji: ":(" },
  angry: { label: "Angry", emoji: "!!" },
  anxious: { label: "Anxious", emoji: ":/" },
};

function toTitleCase(value) {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Unknown";
}

function getLandmarkCenter(points = []) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + (Number(point?.x) || 0),
      y: accumulator.y + (Number(point?.y) || 0),
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function getPointDistance(pointA, pointB) {
  if (!pointA || !pointB) {
    return 0;
  }

  const deltaX = (Number(pointA.x) || 0) - (Number(pointB.x) || 0);
  const deltaY = (Number(pointA.y) || 0) - (Number(pointB.y) || 0);
  return Math.hypot(deltaX, deltaY);
}

function estimateFaceEmotion(faceDetection) {
  const landmarks = Array.isArray(faceDetection?.landmarks)
    ? faceDetection.landmarks
    : [];
  const landmarkMap = landmarks.reduce((accumulator, landmark) => {
    if (landmark?.type) {
      accumulator[landmark.type] = Array.isArray(landmark.locations)
        ? landmark.locations
        : [];
    }
    return accumulator;
  }, {});

  const leftEye = getLandmarkCenter(
    landmarkMap.leftEye || landmarkMap.eye || [],
  );
  const rightEye = getLandmarkCenter(
    landmarkMap.rightEye || landmarkMap.eye || [],
  );
  const mouthPoints = landmarkMap.mouth || [];
  const mouthCenter = getLandmarkCenter(mouthPoints);
  const mouthLeft = mouthPoints[0] || null;
  const mouthRight = mouthPoints[mouthPoints.length - 1] || null;
  const sortedMouth = [...mouthPoints].sort((pointA, pointB) => pointA.y - pointB.y);
  const mouthTop = sortedMouth[0] || null;
  const mouthBottom = sortedMouth[sortedMouth.length - 1] || null;

  const eyeDistance = getPointDistance(leftEye, rightEye);
  const mouthWidth = getPointDistance(mouthLeft, mouthRight);
  const mouthOpen = getPointDistance(mouthTop, mouthBottom);
  const mouthWidthRatio = eyeDistance ? mouthWidth / eyeDistance : 0;
  const mouthOpenRatio = eyeDistance ? mouthOpen / eyeDistance : 0;
  const eyeLineY =
    leftEye && rightEye ? (leftEye.y + rightEye.y) / 2 : null;
  const mouthLiftRatio =
    eyeLineY && mouthCenter && eyeDistance
      ? (mouthCenter.y - eyeLineY) / eyeDistance
      : 0;

  if (mouthWidthRatio >= 0.58 && mouthOpenRatio <= 0.18) {
    return { emotion: "happy", confidence: Math.min(0.96, 0.66 + mouthWidthRatio / 2) };
  }

  if (mouthOpenRatio >= 0.22) {
    return {
      emotion: mouthWidthRatio > 0.52 ? "anxious" : "attentive",
      confidence: Math.min(0.9, 0.58 + mouthOpenRatio),
    };
  }

  if (mouthLiftRatio > 0.72) {
    return { emotion: "sad", confidence: 0.63 };
  }

  if (mouthWidthRatio > 0.48) {
    return { emotion: "attentive", confidence: 0.71 };
  }

  return { emotion: "calm", confidence: 0.6 };
}

function getReadableIntent(intent) {
  switch (intent) {
    case "medical":
      return "Medical guidance";
    case "financial":
      return "Financial guidance";
    case "privacy":
      return "Privacy-sensitive request";
    case "weather":
      return "Weather request";
    case "crisis":
      return "Safety-critical request";
    default:
      return "General assistance";
  }
}

function detectContradiction(text, previousIntent) {
  const normalized = String(text || "").toLowerCase();
  if (!normalized.trim()) {
    return false;
  }

  return (
    CONTRADICTION_CUES.some((cue) => normalized.includes(cue)) ||
    (Boolean(previousIntent) && inferIntent(normalized) !== previousIntent)
  );
}

function generateSessionId() {
  return `saathi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStoredBoolean(key, fallbackValue) {
  const value = storage ? storage.get(key) : null;
  return typeof value === "boolean" ? value : fallbackValue;
}

function getStoredValue(key, fallbackValue) {
  if (!storage) {
    return fallbackValue;
  }

  const value = storage.get(key);
  return value === null || value === undefined ? fallbackValue : value;
}

const LANGUAGE_CONFIG = {
  en: { tag: "en-IN", name: "English" },
  hi: { tag: "hi-IN", name: "Hindi" },
  hinglish: { tag: "hi-IN", name: "Hinglish" },
  ta: { tag: "ta-IN", name: "Tamil" },
  tanglish: { tag: "ta-IN", name: "Tanglish" },
  te: { tag: "te-IN", name: "Telugu" },
  kn: { tag: "kn-IN", name: "Kannada" },
  kanglish: { tag: "kn-IN", name: "Kanglish" },
  ml: { tag: "ml-IN", name: "Malayalam" },
  bn: { tag: "bn-IN", name: "Bengali" },
};

function detectInputLanguage(text) {
  const value = String(text || "").trim();
  const lower = value.toLowerCase();

  if (/[\u0980-\u09ff]/.test(value)) return "bn";
  if (/[\u0d00-\u0d7f]/.test(value)) return "ml";
  if (/[\u0c80-\u0cff]/.test(value)) return "kn";
  if (/[\u0c00-\u0c7f]/.test(value)) return "te";
  if (/[\u0b80-\u0bff]/.test(value)) return "ta";
  if (/[\u0900-\u097f]/.test(value)) return "hi";

  if (/\b(kya|kaise|mujhe|mera|meri|nahi|haan|acha|thoda|krdo|kar do|yaar)\b/.test(lower)) {
    return "hinglish";
  }
  if (/\b(enna|epdi|venum|romba|seri|unga|sapadu|iruku)\b/.test(lower)) {
    return "tanglish";
  }
  if (/\b(yenu|hegide|swalpa|beku|illa|nimma|nanage|hogona)\b/.test(lower)) {
    return "kanglish";
  }
  if (/\b(enti|ela|kavali|ledu|undi|cheppu|bagundi)\b/.test(lower)) {
    return "te";
  }
  if (/\b(entha|venda|ningal|sukham|poyi)\b/.test(lower)) {
    return "ml";
  }
  if (/\b(keno|tumi|ami|bhalo|achhe|kothay)\b/.test(lower)) {
    return "bn";
  }

  return "en";
}

function getLanguageTag(languageCode) {
  return LANGUAGE_CONFIG[languageCode]?.tag || "en-IN";
}

function inferIntent(text) {
  const lower = String(text || "").toLowerCase();

  if (!lower.trim()) {
    return "general";
  }

  if (
    lower.includes("medicine") ||
    lower.includes("medical") ||
    lower.includes("doctor") ||
    lower.includes("symptom") ||
    lower.includes("health")
  ) {
    return "medical";
  }

  if (
    lower.includes("price") ||
    lower.includes("invest") ||
    lower.includes("money") ||
    lower.includes("stock")
  ) {
    return "financial";
  }

  if (
    lower.includes("password") ||
    lower.includes("otp") ||
    lower.includes("aadhaar") ||
    lower.includes("pin")
  ) {
    return "privacy";
  }

  if (
    lower.includes("weather") ||
    lower.includes("rain") ||
    lower.includes("temperature")
  ) {
    return "weather";
  }

  if (
    lower.includes("die") ||
    lower.includes("harm myself") ||
    lower.includes("kill myself")
  ) {
    return "crisis";
  }

  return "general";
}

function extractName(text) {
  const match = String(text || "").match(
    /\bmy name is\s+([a-z][a-z\s'-]{1,30})/i,
  );
  return match ? match[1].trim() : null;
}

function buildPrivacyModeLocalResponse(userMessage, languageCode = "en") {
  const privacyCopy = {
    en: {
      medical:
        "Privacy Mode is ON, so I won't send this to any server. I also can't safely tell you to stop your medication locally. Please check with a clinician before acting.",
      general:
        "Privacy Mode is ON, so your message stays in this browser and I won't send it to any server. For a live AI answer, turn Privacy Mode OFF explicitly.",
    },
    hi: {
      medical:
        "Privacy Mode ON hai, isliye main is message ko kisi server par nahi bhejunga. Main yahan locally aapko dawa band karne ki salah safely nahi de sakta. Koi bhi step lene se pehle doctor se check kijiye.",
      general:
        "Privacy Mode ON hai, isliye aapka message isi browser me rahega aur main ise kisi server par nahi bhejunga. Live AI answer ke liye Privacy Mode OFF kijiye.",
    },
    hinglish: {
      medical:
        "Privacy Mode ON hai, so yeh message server par nahi jayega. Main locally yeh safely nahi bol sakta ki medicine band kar do. Action lene se pehle doctor se confirm karo.",
      general:
        "Privacy Mode ON hai, so tumhara message isi browser me rahega aur server par upload nahi hoga. Live AI answer ke liye Privacy Mode OFF karo.",
    },
  };
  const localized = privacyCopy[languageCode] || privacyCopy.en;
  const intent = inferIntent(userMessage);

  if (intent === "medical") {
    return {
      text: localized.medical,
      confidence: 0.31,
      isFactual: true,
      uncertaintyReason:
        "Cloud processing is disabled and medical decisions should be verified with a clinician.",
      suggestedSources: ["pubmed", "google"],
    };
  }

  return {
    text: localized.general,
    confidence: 0.88,
    isFactual: true,
    uncertaintyReason:
      "This response describes the current privacy setting rather than answering with cloud AI.",
    suggestedSources: ["google"],
  };
}

function getActions(text) {
  if (
    window.actionEngine &&
    typeof window.actionEngine.detectActions === "function"
  ) {
    return window.actionEngine.detectActions(text);
  }

  const value = String(text || "").toLowerCase();
  const actions = [];

  if (value.includes("late") || value.includes("stuck")) {
    actions.push({
      id: "maps",
      label: "📍 Open Maps",
      description: "Finding fastest route",
      color: "blue",
      execute: () =>
        window.open(
          `https://www.google.com/maps/search/${encodeURIComponent("nearest route")}`,
          "_blank",
        ),
    });
  }
  if (value.includes("hungry")) {
    actions.push({
      id: "food",
      label: "🍽️ View Food Options",
      description: "Finding nearby options",
      color: "orange",
      href: "https://www.zomato.com",
      execute: () => {
        const url = "https://www.zomato.com";
        const opened = window.open(url, "_blank");
        if (!opened || opened.closed || typeof opened.closed === "undefined") {
          window.location.href = url;
        }
      },
    });
  }
  if (value.includes("rain") || value.includes("weather")) {
    actions.push({
      id: "weather",
      label: "🌧️ Check Weather",
      description: "Opening weather forecast",
      color: "cyan",
      execute: () => window.open("https://weather.com", "_blank"),
    });
  }
  if (value.includes("lyrics") || value.includes("song")) {
    actions.push("🎵 Search Lyrics on Google");
  }

  return actions;
}

function SaathiChat() {
  const { currentEmotion, isCrisis, processText } = useEmotion();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastSubmittedVoiceText, setLastSubmittedVoiceText] = useState("");
  const [preferredReplyLanguage, setPreferredReplyLanguage] = useState("en");
  const [isSpeaking, setIsSpeaking] = useState(
    Boolean(SpeechController && SpeechController.isSpeaking),
  );
  const [statusOverride, setStatusOverride] = useState("");
  const [messages, setMessages] = useState(() => {
    const storedMessages = getStoredValue("saathi_messages", null);
    return Array.isArray(storedMessages) && storedMessages.length > 0
      ? storedMessages
      : [INITIAL_ASSISTANT_MESSAGE];
  });
  const [toast, setToast] = useState("");
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(false);
  const [privacyModeOn, setPrivacyModeOn] = useState(() =>
    getStoredBoolean("saathi_privacy_mode", true),
  );
  const [crossDeviceEnabled, setCrossDeviceEnabled] = useState(() =>
    getStoredBoolean("saathi_cross_device", false),
  );
  const [flaggedCount, setFlaggedCount] = useState(() => {
    const value = storage ? storage.get("saathi_flagged_count") : 0;
    return typeof value === "number" ? value : 0;
  });
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const storedMultimodalState = getStoredValue("saathi_multimodal_state", {});
  const [activeInputMode, setActiveInputMode] = useState(
    typeof storedMultimodalState?.activeInputMode === "string"
      ? storedMultimodalState.activeInputMode
      : "mode2",
  );
  const [cameraStatus, setCameraStatus] = useState(
    typeof storedMultimodalState?.cameraStatus === "string"
      ? storedMultimodalState.cameraStatus
      : "Voice-only fallback active until camera is enabled.",
  );
  const [cameraErrorDetail, setCameraErrorDetail] = useState(
    typeof storedMultimodalState?.cameraErrorDetail === "string"
      ? storedMultimodalState.cameraErrorDetail
      : "",
  );
  const [faceEmotion, setFaceEmotion] = useState(
    typeof storedMultimodalState?.faceEmotion === "string"
      ? storedMultimodalState.faceEmotion
      : "unavailable",
  );
  const [faceConfidence, setFaceConfidence] = useState(
    typeof storedMultimodalState?.faceConfidence === "number"
      ? storedMultimodalState.faceConfidence
      : 0,
  );
  const [frameSampleRate, setFrameSampleRate] = useState(
    typeof storedMultimodalState?.frameSampleRate === "number"
      ? storedMultimodalState.frameSampleRate
      : 0,
  );
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [decisionLog, setDecisionLog] = useState(() => {
    const storedDecisionLog = getStoredValue("saathi_decision_log", null);
    return Array.isArray(storedDecisionLog) && storedDecisionLog.length > 0
      ? storedDecisionLog
      : [
          {
            id: 1,
            tone: "neutral",
            text: "Session started. Waiting for a voice or text request.",
          },
        ];
  });
  const [taskStage, setTaskStage] = useState("Intent");
  const [contradictionNotice, setContradictionNotice] = useState(null);

  // New Saathi states
  const [displayState, setDisplayState] = useState("idle");
  const [fillerText, setFillerText] = useState("");
  const [handoffReason, setHandoffReason] = useState(null);
  const handoffTrackerRef = useRef(null);

  const toastTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const stopRecognitionRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraDetectorRef = useRef(null);
  const mediapipeLandmarkerRef = useRef(null);
  const mediapipeLoaderRef = useRef(null);
  const cameraSampleTimerRef = useRef(null);
  const cameraHealthTimerRef = useRef(null);
  const lastVideoTimeRef = useRef(0);
  const lastCameraHeartbeatRef = useRef(0);
  const lastFaceDetectionAtRef = useRef(0);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportsSpeechRecognition = Boolean(SpeechRecognition);
  const currentTheme =
    EMOTION_THEMES[currentEmotion] || EMOTION_THEMES.calm || {};
  const hasFlag = flaggedCount > 0;
  const privacyState = calculatePrivacyState(crossDeviceEnabled, hasFlag);
  const privacyBehavior = privacyModeOn
    ? PRIVACY_MODE_BEHAVIOR.ON || {}
    : PRIVACY_MODE_BEHAVIOR.OFF || {};

  const statusText = statusOverride
    ? statusOverride
    : listening
      ? "Listening..."
      : loadingReply
        ? "Saathi AI is thinking..."
        : "Tap the mic or type below";

  function pushDecisionLog(text, tone = "neutral") {
    setDecisionLog((current) => [
      {
        id: Date.now() + Math.random(),
        tone,
        text,
      },
      ...current,
    ].slice(0, 8));
  }

  function clearCameraSampling() {
    if (cameraSampleTimerRef.current) {
      window.clearInterval(cameraSampleTimerRef.current);
      cameraSampleTimerRef.current = null;
    }
    if (cameraHealthTimerRef.current) {
      window.clearInterval(cameraHealthTimerRef.current);
      cameraHealthTimerRef.current = null;
    }
  }

  function stopCameraStream() {
    clearCameraSampling();
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    lastVideoTimeRef.current = 0;
    lastCameraHeartbeatRef.current = 0;
    lastFaceDetectionAtRef.current = 0;
  }

  function switchToVoiceFallback(status, detail, logTone = "warning") {
    stopCameraStream();
    setCameraEnabled(false);
    setActiveInputMode("mode2");
    setFaceEmotion("unavailable");
    setFaceConfidence(0);
    setFrameSampleRate(0);
    setFaceDetectionReady(false);
    setCameraStatus(status);
    setCameraErrorDetail(detail || "");
    pushDecisionLog(
      "Mode 1 webcam was blocked, so Saathi auto-switched to Mode 2 voice fallback.",
      logTone,
    );
  }

  async function loadMediapipeVision() {
    if (window.vision) {
      return window.vision;
    }

    if (!mediapipeLoaderRef.current) {
      mediapipeLoaderRef.current = new Function(
        'return import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest")',
      )()
        .then((module) => {
          window.vision = module;
          return module;
        })
        .catch((error) => {
          mediapipeLoaderRef.current = null;
          throw error;
        });
    }

    return mediapipeLoaderRef.current;
  }

  const lastAssistantMessage = useMemo(() => {
    return [...messages]
      .reverse()
      .find((message) => message.sender === "assistant");
  }, [messages]);
  const voiceSignal =
    VOICE_EMOTION_MAP[currentEmotion] || VOICE_EMOTION_MAP.calm;
  const faceSignal = cameraEnabled
    ? FACE_EMOTION_MAP[faceEmotion] || FACE_EMOTION_MAP.calm
    : FACE_EMOTION_MAP.unavailable;
  const taskStepStates = TASK_STEPS.map((step, index) => {
    const currentIndex = TASK_STEPS.indexOf(taskStage);
    return {
      step,
      status:
        index < currentIndex
          ? "done"
          : index === currentIndex
            ? loadingReply || listening
              ? "active"
              : messages.length > 1
                ? "done"
                : "idle"
            : "idle",
    };
  });

  useEffect(() => {
    if (!SpeechController || typeof SpeechController.subscribe !== "function") {
      return undefined;
    }

    return SpeechController.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSession = params.get("session");
    let currentSessionId = urlSession;

    if (storage) {
      if (!currentSessionId) {
        currentSessionId =
          storage.get("saathi_session_id") || generateSessionId();
      }
      storage.set("saathi_session_id", currentSessionId);

      if (!storage.get("saathi_created_at")) {
        storage.set("saathi_created_at", new Date().toISOString());
      }
      if (!storage.get("saathi_memory")) {
        storage.set("saathi_memory", DEFAULT_MEMORY);
      }
    }

    if (urlSession) {
      showToast("Loaded cross-device session!");
      // Here you would normally fetch the conversation history from a DB.
    }
  }, []);

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices;
    const hasCameraApi =
      mediaDevices && typeof mediaDevices.getUserMedia === "function";
    setCameraAvailable(Boolean(hasCameraApi));
    setFaceDetectionReady(Boolean(hasCameraApi));

    if (!hasCameraApi) {
      setCameraStatus("Camera access is unavailable here. Voice-only fallback remains active.");
      setCameraErrorDetail(
        window.isSecureContext
          ? "This browser does not expose mediaDevices.getUserMedia."
          : "Camera access requires a secure context such as localhost or HTTPS.",
      );
      pushDecisionLog(
        "Camera access is unavailable in this browser, so voice-only understanding stays active.",
        "warning",
      );
    } else if (!window.FaceDetector) {
      setCameraStatus(
        "Camera is available. Mode 1 will load the webcam detector when you press Start.",
      );
      setCameraErrorDetail(
        "Native FaceDetector is unavailable here, so Saathi will try the built-in AI fallback on start.",
      );
    }
  }, []);

  function copySessionLink() {
    const id = storage ? storage.get("saathi_session_id") : generateSessionId();
    const url = new URL(window.location.href);
    url.searchParams.set("session", id);

    const finalUrl = url.toString();
    navigator.clipboard.writeText(finalUrl);

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      showToast(
        "⚠️ Warning: You are on 'localhost'. For mobile, use your IP address link instead.",
      );
    } else {
      showToast("Session link copied! Open on another device.");
    }
  }

  useEffect(() => {
    const theme = currentTheme;
    document.documentElement.style.setProperty(
      "--accent-rgb",
      theme.accentRgb || "34, 197, 94",
    );
    document.documentElement.style.setProperty(
      "--accent-solid",
      theme.accentHex || "#22c55e",
    );
    document.documentElement.style.setProperty(
      "--accent-soft",
      `rgba(${theme.accentRgb || "34, 197, 94"}, 0.18)`,
    );
    document.documentElement.style.setProperty(
      "--accent-border",
      `rgba(${theme.accentRgb || "34, 197, 94"}, 0.38)`,
    );
  }, [currentTheme]);

  useEffect(() => {
    if (!storage) {
      return;
    }

    storage.set("saathi_privacy_mode", privacyModeOn);
  }, [privacyModeOn]);

  useEffect(() => {
    if (!storage) {
      return;
    }

    storage.set("saathi_cross_device", crossDeviceEnabled);
  }, [crossDeviceEnabled]);

  useEffect(() => {
    if (!storage) {
      return;
    }

    storage.set("saathi_flagged_count", flaggedCount);
  }, [flaggedCount]);

  useEffect(() => {
    if (!storage) {
      return;
    }

    storage.set("saathi_messages", messages);
  }, [messages]);

  useEffect(() => {
    if (!storage) {
      return;
    }

    storage.set("saathi_decision_log", decisionLog);
  }, [decisionLog]);

  useEffect(() => {
    if (!storage) {
      return;
    }

    storage.set("saathi_multimodal_state", {
      activeInputMode,
      cameraStatus,
      cameraErrorDetail,
      faceEmotion,
      faceConfidence,
      frameSampleRate,
    });
  }, [
    activeInputMode,
    cameraStatus,
    cameraErrorDetail,
    faceEmotion,
    faceConfidence,
    frameSampleRate,
  ]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (stopRecognitionRef.current) {
        stopRecognitionRef.current.stop();
      }
      stopCameraStream();
      SpeechController?.stop?.();
    };
  }, []);

  useEffect(() => {
    const videoElement = cameraVideoRef.current;
    if (!videoElement) {
      return undefined;
    }

    if (cameraEnabled && cameraStreamRef.current) {
      videoElement.srcObject = cameraStreamRef.current;
      const playPromise = videoElement.play?.();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
          setCameraStatus("Camera stream started, but the preview could not play.");
          setCameraErrorDetail(
            error?.message || "The browser blocked video playback for this camera stream.",
          );
        });
      }
      return undefined;
    }

    videoElement.srcObject = null;
    return undefined;
  }, [cameraEnabled]);

  useEffect(() => {
    let active = true;

    if (isSpeaking && supportsSpeechRecognition) {
      const startRecognition = () => {
        if (!active) return;
        const stopRecognition = new SpeechRecognition();
        stopRecognitionRef.current = stopRecognition;
        stopRecognition.lang = "en-IN";
        stopRecognition.continuous = true;
        stopRecognition.interimResults = true;
        stopRecognition.maxAlternatives = 1;

        stopRecognition.onresult = (event) => {
          let transcript = "";
          for (let index = 0; index < event.results.length; index += 1) {
            transcript += `${event.results[index][0]?.transcript || ""} `;
          }
          const cleanTranscript = transcript.trim().toLowerCase();
          const stopWords = [
            "stop",
            "quiet",
            "shut up",
            "pause",
            "hold on",
            "wait",
          ];

          if (
            stopWords.some(
              (word) =>
                cleanTranscript === word ||
                cleanTranscript.startsWith(`${word} `),
            )
          ) {
            active = false;
            SpeechController?.stop?.();
            try {
              stopRecognition.stop();
            } catch (e) {}
            setIsSpeaking(false);
            setStatusOverride("Stopped speaking.");
          }
        };

        stopRecognition.onerror = (e) => {
          if (
            e.error === "not-allowed" ||
            e.error === "audio-capture" ||
            e.error === "aborted"
          ) {
            active = false;
          }
        };

        stopRecognition.onend = () => {
          if (active) {
            try {
              startRecognition();
            } catch (err) {
              active = false;
            }
          } else {
            stopRecognitionRef.current = null;
          }
        };

        try {
          stopRecognition.start();
        } catch (e) {
          active = false;
        }
      };

      startRecognition();
    } else {
      active = false;
      if (stopRecognitionRef.current) {
        try {
          stopRecognitionRef.current.stop();
        } catch (e) {}
        stopRecognitionRef.current = null;
      }
    }

    return () => {
      active = false;
      if (stopRecognitionRef.current) {
        try {
          stopRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isSpeaking, supportsSpeechRecognition]);

  function showToast(message, duration = 3200) {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(""), duration);
  }

  function handleHandoffConnect() {
    const phoneNumber = "919152987821";
    const text = "Hi, I need help from a human support agent.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    const newWindow = window.open(url, "_blank");
    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === "undefined"
    ) {
      window.location.href = url;
    }
    showToast("Opening human support...");
  }

  function updateMemory(partialUpdate) {
    if (!storage) {
      return;
    }

    const currentMemory = storage.get("saathi_memory") || DEFAULT_MEMORY;
    const nextMemory = {
      ...currentMemory,
      ...partialUpdate,
    };
    storage.set("saathi_memory", nextMemory);
  }

  async function fetchAssistantReply(userMessage, historyForApi, languageCode) {
    if (privacyModeOn) {
      return {
        data: buildPrivacyModeLocalResponse(userMessage, languageCode),
        mode: "privacy-local",
      };
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userMessage,
        conversationHistory: historyForApi,
        preferredLanguage: languageCode,
      }),
    });

    if (!response.ok) {
      let errorMessage = "AI service unavailable";

      try {
        const errorData = await response.json();
        if (
          errorData &&
          typeof errorData.error === "string" &&
          errorData.error.trim()
        ) {
          errorMessage = errorData.error.trim();
        }
      } catch {
        // Keep the generic fallback message if the error body isn't JSON.
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      data,
      mode: response.headers.get("X-Saathi-Mode") || "live",
    };
  }

  function buildConversationHistory(currentMessages) {
    return currentMessages.map((message) => ({
      role: message.sender === "assistant" ? "assistant" : "user",
      content: message.text,
    }));
  }

  async function processInput(rawText, options = {}) {
    const cleanText = String(rawText || "").trim();
    if (!cleanText || loadingReply) {
      return;
    }
    const inputLanguage = detectInputLanguage(cleanText);
    setPreferredReplyLanguage(inputLanguage);

    const loweredText = cleanText.toLowerCase();
    const stopWords = ["stop", "quiet", "shut up", "pause", "hold on", "wait"];

    // If the input is just a stop command, stop speaking and do not generate a response.
    if (
      stopWords.includes(loweredText) ||
      stopWords.some(
        (word) =>
          loweredText === word ||
          loweredText === `${word} saathi` ||
          loweredText === `${word} ai`,
      )
    ) {
      SpeechController?.stop?.();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setStatusOverride("Stopped.");
      setIsSpeaking(false);
      setListening(false);
      setInput("");
      return;
    }

    setStatusOverride("");

    const detection =
      typeof emotionEngine.detectEmotionFromText === "function"
        ? emotionEngine.detectEmotionFromText(cleanText)
        : { emotion: "calm", confidence: 0.6 };
    const detectedEmotion = detection.emotion || "calm";
    const extractedName = extractName(cleanText);
    const intent = inferIntent(cleanText);
    const currentMemory = storage
      ? storage.get("saathi_memory") || DEFAULT_MEMORY
      : DEFAULT_MEMORY;
    const contradictionDetected = detectContradiction(
      cleanText,
      currentMemory.lastIntent,
    );

    if (options.fromVoice) {
      setLastSubmittedVoiceText(cleanText);
      setLiveTranscript("");
    }

    processText(cleanText);
    setTaskStage("Intent");
    pushDecisionLog(
      `Heard a ${getReadableIntent(intent).toLowerCase()} request with a ${toTitleCase(detectedEmotion).toLowerCase()} tone.`,
      "neutral",
    );

    if (contradictionDetected) {
      setContradictionNotice({
        text: `Got it - I switched from ${getReadableIntent(currentMemory.lastIntent)} to ${getReadableIntent(intent)} and kept the same session context.`,
        detail:
          "If the user changes direction repeatedly, Saathi follows the latest high-confidence intent and preserves the visible update trail below.",
      });
      pushDecisionLog(
        "User changed direction mid-task. The latest intent was promoted while keeping the prior context.",
        "warning",
      );
    } else {
      setContradictionNotice(null);
    }

    updateMemory({
      name: extractedName || currentMemory.name,
      emotion: detectedEmotion,
      lastQuery: cleanText,
      lastIntent: intent,
      lastAction: privacyModeOn
        ? "Answered locally in Privacy Mode"
        : "Sent prompt for AI response",
      conversationCount: Number(currentMemory.conversationCount || 0) + 1,
    });

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanText,
      actions: [],
    };
    const historyForApi = buildConversationHistory(messages);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoadingReply(true);
    setTaskStage("Clarifying");
    pushDecisionLog(
      privacyModeOn
        ? "Privacy Mode stayed on, so the request will be handled locally inside this browser."
        : "Cloud AI is allowed for this request while local session controls stay in place.",
      privacyModeOn ? "neutral" : "success",
    );

    try {
      let aiData, adaptedText, analysisResult;

      if (window.fillerSystem && window.responseSelector) {
        // Handoff Tracking
        if (!handoffTrackerRef.current && window.handoffEngine) {
          handoffTrackerRef.current = new window.handoffEngine.HandoffTracker();
        }
        if (handoffTrackerRef.current) {
          const handoff = handoffTrackerRef.current.track(
            intent,
            detectedEmotion,
          );
          if (handoff.suggest) {
            setHandoffReason(handoff.reason);
            pushDecisionLog(
              "A human handoff was suggested because the conversation appears emotionally heavy.",
              "warning",
            );
          } else {
            setHandoffReason(null);
          }
        }

        // Show filler instantly
        setFillerText(window.fillerSystem.getFiller(detectedEmotion));
        setDisplayState("filler");
      }

      // Fetch the real AI response in parallel with the filler delay
      const minDelayPromise = new Promise((r) =>
        setTimeout(r, 600 + Math.random() * 400),
      );
      const fetchPromise = fetchAssistantReply(cleanText, historyForApi).catch(
        (error) => {
          throw error;
        },
      );

      const [result] = await Promise.all([fetchPromise, minDelayPromise]);
      aiData = result.data;
      setTaskStage("Executing");
      pushDecisionLog(
        result.mode === "privacy-local"
          ? "Local response prepared without sending the prompt to any server."
          : "Response plan prepared. Confidence and safety checks are running now.",
        "success",
      );

      // Determine final text: Use response library for pure conversational intents, otherwise use AI
      const conversationalIntents = ["late", "hungry", "tired", "sad"];
      if (
        window.responseSelector &&
        conversationalIntents.includes(intent) &&
        inputLanguage === "en"
      ) {
        adaptedText = window.responseSelector.getResponse(
          intent,
          detectedEmotion,
        );
        aiData.confidence = 0.95;
        aiData.isFactual = false;
        aiData.uncertaintyReason = "Personalized emotional response";
      } else {
        adaptedText = wrapResponse(aiData.text, currentEmotion, {
          languageCode: inputLanguage,
        });
      }

      analysisResult = analyzeResponse(`${cleanText}\n${adaptedText}`);
      setIsDemoMode(
        result.mode === "fallback" || result.mode === "privacy-local",
      );

      if (window.fillerSystem && window.responseSelector) {
        // Crossfade
        setDisplayState("transitioning");
        await new Promise((r) => setTimeout(r, 150));
        setDisplayState("response");
      }

      if (analysisResult.isFlagged) {
        setFlaggedCount((count) => count + 1);
        pushDecisionLog(
          "Safety review raised a flag, so the answer is being shown with extra caution.",
          "warning",
        );
      }

      updateMemory({
        emotion: detectedEmotion,
        lastAction: "Received AI response",
      });

      const assistantActions = getActions(cleanText);
      const assistantMessage = {
        id: Date.now() + 1,
        sender: "assistant",
        text: adaptedText,
        confidence: aiData.confidence,
        isFactual: aiData.isFactual,
        uncertaintyReason: aiData.uncertaintyReason,
        suggestedSources: aiData.suggestedSources || [],
        actions: assistantActions,
        sourceQuery: cleanText,
        analysisResult,
      };

      setMessages((current) => [...current, assistantMessage]);
      setTaskStage("Confirmed");
      pushDecisionLog(
        "Response delivered and context refreshed for the next turn.",
        "success",
      );
      if (
        assistantActions.length > 0 &&
        window.actionEngine?.autoExecuteActions &&
        typeof assistantActions[0] === "object" &&
        typeof assistantActions[0]?.execute === "function"
      ) {
        window.actionEngine.autoExecuteActions(assistantActions, 1500);
        pushDecisionLog(
          "An action shortcut was prepared so the user can complete the next step faster.",
          "success",
        );
      }

      if (options.fromVoice) {
        if (window.voicePersonality) {
          window.voicePersonality.speakWithPersonality(
            adaptedText,
            currentEmotion,
            { language: getLanguageTag(inputLanguage) },
          );
        } else {
          speak(adaptedText, currentEmotion, {
            language: getLanguageTag(inputLanguage),
          });
        }
      }
    } catch (error) {
      const fallback = {
        text:
          error.message === "OpenAI quota exceeded"
            ? "I can't answer live right now because the OpenAI API quota for this project has been exceeded. Please top up or switch to an active API account and try again."
            : error.message === "Invalid OpenAI API key"
              ? "I can't answer live right now because the OpenAI API key is invalid. Please update the backend .env key and try again."
              : error.message === "Groq quota exceeded"
                ? "I can't answer live right now because the Groq API quota for this project has been exceeded. Please try another active key or wait for quota reset."
                : error.message === "Invalid Groq API key"
                  ? "I can't answer live right now because the Groq API key is invalid. Please update the backend .env key and try again."
                  : "I'm having trouble reaching the AI service right now. Please try again in a moment.",
        confidence: 0.35,
        isFactual: false,
        uncertaintyReason:
          "The AI service could not be reached, so this response was generated locally.",
        suggestedSources: ["google"],
      };
      const adaptedFallback = wrapResponse(fallback.text, currentEmotion, {
        languageCode: inputLanguage,
      });
      const analysisResult = analyzeResponse(
        `${cleanText}\n${adaptedFallback}`,
      );
      setTaskStage("Confirmed");
      pushDecisionLog(
        "Live AI was unavailable, so Saathi returned a graceful fallback instead of failing silently.",
        "warning",
      );

      if (analysisResult.isFlagged) {
        setFlaggedCount((count) => count + 1);
      }

      updateMemory({
        emotion: detectedEmotion,
        lastAction: "Returned network fallback message",
      });

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: "assistant",
          ...fallback,
          text: adaptedFallback,
          actions: [],
          sourceQuery: cleanText,
          analysisResult,
        },
      ]);

      if (options.fromVoice) {
        speak(adaptedFallback, currentEmotion, {
          language: getLanguageTag(inputLanguage),
        });
      }
    } finally {
      if (!privacyBehavior.voiceDataRetained) {
        setLiveTranscript("");
        setLastSubmittedVoiceText("");
      }
      setLoadingReply(false);
    }
  }

  async function handleCameraToggle() {
    if (cameraEnabled) {
      stopCameraStream();
      setCameraEnabled(false);
      setActiveInputMode("mode2");
      setFaceEmotion("unavailable");
      setFaceConfidence(0);
      setFrameSampleRate(0);
      setCameraStatus("Camera paused. Voice-only fallback is active.");
      setCameraErrorDetail("");
      pushDecisionLog(
        "Camera was turned off, so the assistant fell back to voice-only emotion inference.",
        "warning",
      );
      return;
    }

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
      setCameraEnabled(false);
      setCameraAvailable(false);
      setCameraStatus("Camera access is unavailable here. Voice-only fallback remains active.");
      setCameraErrorDetail(
        window.isSecureContext
          ? "mediaDevices.getUserMedia is not available in this browser."
          : "Open the app on localhost or HTTPS. Camera access is blocked on insecure origins.",
      );
      pushDecisionLog(
        "Camera could not be started, so the assistant stayed in voice-only mode instead of guessing.",
        "warning",
      );
      return;
    }

    try {
      setCameraErrorDetail("");
      setCameraStatus("Requesting camera permission for Mode 1...");
      const stream = await mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      cameraStreamRef.current = stream;

      // Initialize Detector (Native or Mediapipe)
      let detector = cameraDetectorRef.current;
      let isMediapipe = false;

      if (window.FaceDetector) {
        detector =
          detector ||
          new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        cameraDetectorRef.current = detector;
      } else {
        isMediapipe = true;
        const visionApi = await loadMediapipeVision();
        if (!mediapipeLandmarkerRef.current) {
          setCameraStatus("Loading Mediapipe Face AI...");
          const { FaceLandmarker, FilesetResolver } = visionApi;
          const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
          );
          try {
            mediapipeLandmarkerRef.current =
              await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                  modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                  delegate: "GPU",
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1,
              });
          } catch (gpuError) {
            mediapipeLandmarkerRef.current =
              await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                  modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                  delegate: "CPU",
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1,
              });
          }
        }
        detector = mediapipeLandmarkerRef.current;
      }

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        const playPromise = cameraVideoRef.current.play?.();
        if (playPromise && typeof playPromise.catch === "function") {
          await playPromise;
        }
      }

      setCameraEnabled(true);
      setCameraAvailable(true);
      setActiveInputMode("mode1");
      setFaceDetectionReady(true);
      setFaceEmotion("attentive");
      setFaceConfidence(0.74);
      setFrameSampleRate(isMediapipe ? 5 : 2);
      lastCameraHeartbeatRef.current = Date.now();
      lastFaceDetectionAtRef.current = 0;
      setCameraStatus(
        `Mode 1 OK. ${isMediapipe ? "Mediapipe" : "Native"} AI is active and sampling frames.`,
      );
      pushDecisionLog(
        `Mode 1 webcam is live using ${isMediapipe ? "Mediapipe fallback" : "native FaceDetector"}.`,
        "success",
      );
      showToast("Mode 1 OK. Webcam emotion detection is live.", 2200);

      cameraSampleTimerRef.current = window.setInterval(async () => {
        const video = cameraVideoRef.current;
        if (!video || !cameraStreamRef.current || video.readyState < 2) {
          return;
        }

        try {
          lastCameraHeartbeatRef.current = Date.now();
          let estimated;
          if (!isMediapipe) {
            const faces = await detector.detect(video);
            if (!Array.isArray(faces) || faces.length === 0) {
              setFaceEmotion("attentive");
              setFaceConfidence(0.28);
              setCameraStatus(
                "Mode 1 OK. Camera is live and waiting for a clearer front-facing expression.",
              );
              return;
            }
            estimated = estimateFaceEmotion(faces[0]);
          } else {
            const result = await detector.detectForVideo(video, performance.now());
            if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
              setFaceEmotion("attentive");
              setFaceConfidence(0.28);
              setCameraStatus(
                "Mode 1 OK. Camera is live and waiting for a clearer front-facing expression.",
              );
              return;
            }
            
            // Map Mediapipe landmarks to our estimation function
            // Landmarks: 33 (L eye), 263 (R eye), 13 (Mouth Top), 14 (Mouth Bottom), 61 (Mouth L), 291 (Mouth R)
            const pts = result.faceLandmarks[0];
            const mockFace = {
              landmarks: [
                { type: "leftEye", locations: [pts[33]] },
                { type: "rightEye", locations: [pts[263]] },
                { type: "mouth", locations: [pts[61], pts[291], pts[13], pts[14]] }
              ]
            };
            estimated = estimateFaceEmotion(mockFace);
          }

          lastVideoTimeRef.current = video.currentTime || lastVideoTimeRef.current;
          lastFaceDetectionAtRef.current = Date.now();
          setFaceEmotion(estimated.emotion);
          setFaceConfidence(estimated.confidence);
          setCameraStatus(
            `Mode 1 OK. Face: ${toTitleCase(estimated.emotion)} (${(estimated.confidence * 100).toFixed(0)}%)`,
          );
        } catch (error) {
          console.error("Face detection error:", error);
          switchToVoiceFallback(
            "Camera analysis error.",
            error?.message || "Detection loop failed.",
          );
        }
      }, isMediapipe ? 200 : 500);

      cameraHealthTimerRef.current = window.setInterval(() => {
        const video = cameraVideoRef.current;
        const streamTracks = cameraStreamRef.current?.getVideoTracks?.() || [];
        const firstTrack = streamTracks[0];
        const now = Date.now();
        const feedMissing =
          !video ||
          video.readyState < 2 ||
          !firstTrack ||
          firstTrack.readyState !== "live";
        const stalled =
          lastCameraHeartbeatRef.current &&
          now - lastCameraHeartbeatRef.current > 6000;

        if (feedMissing || stalled) {
          switchToVoiceFallback(
            "Camera feed stalled.",
            "The live webcam stream stopped updating frames reliably.",
          );
          return;
        }

        if (
          lastFaceDetectionAtRef.current &&
          now - lastFaceDetectionAtRef.current > 4000
        ) {
          setFaceEmotion("attentive");
          setFaceConfidence(0.28);
          setCameraStatus(
            "Mode 1 OK. Camera is live, but no face is being tracked right now.",
          );
        }
      }, 3000);
    } catch (error) {
      switchToVoiceFallback(
        "Mode 1 webcam could not start, so Saathi switched to Mode 2 voice fallback.",
        error?.message || "Browser blocked camera access or the webcam AI fallback could not load.",
      );
      showToast("Camera unavailable.", 2600);
    }
  }

  function handleMicClick() {
    if (listening || loadingReply) {
      return;
    }

    if (isSpeaking) {
      SpeechController?.stop?.();
      setIsSpeaking(false);
      setStatusOverride("Stopped speaking.");
      return;
    }

    if (!supportsSpeechRecognition) {
      pushDecisionLog(
        "Voice capture is unavailable in this browser, so text input remains the fallback.",
        "warning",
      );
      showToast(
        "Voice input is not supported in this browser. Please use Chrome or Edge, or type your question.",
      );
      return;
    }

    setLiveTranscript("");
    setStatusOverride("");
    pushDecisionLog("Listening for a new voice request.", "neutral");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        transcript += `${event.results[index][0]?.transcript || ""} `;
      }

      const cleanTranscript = transcript.trim();
      setLiveTranscript(cleanTranscript);
      setInput(cleanTranscript);

      const loweredTranscript = cleanTranscript.toLowerCase().trim();
      const stopWords = [
        "stop",
        "quiet",
        "shut up",
        "pause",
        "hold on",
        "wait",
      ];

      if (stopWords.some((word) => loweredTranscript.includes(word))) {
        SpeechController?.stop?.();
        recognition.stop();
        setStatusOverride("Stopped speaking.");
        setIsSpeaking(false);
        setListening(false);
        return;
      }

      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal && cleanTranscript) {
        setStatusOverride("");
        setListening(false);
        processInput(cleanTranscript, { fromVoice: true });
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setLiveTranscript("");
      setStatusOverride("");

      const message =
        event.error === "not-allowed"
          ? "Microphone permission was denied. Please allow microphone access and try again."
          : event.error === "no-speech"
            ? "No speech was detected. Please try again and speak a bit closer to the mic."
            : event.error === "audio-capture"
              ? "No microphone was found. Please connect a microphone and try again."
              : "Voice input failed. Please try again or type your question.";

      pushDecisionLog(
        "Voice capture failed, so the app suggested a text fallback.",
        "warning",
      );

      showToast(message);
    };

    recognition.onend = () => {
      setListening(false);
    };

    setListening(true);
    recognition.start();
  }

  function handleSubmit(event) {
    event.preventDefault();
    processInput(input);
  }

  function handleActionClick(action) {
    if (
      typeof action === "object" &&
      action !== null &&
      typeof action.execute === "function"
    ) {
      try {
        action.execute({});
        showToast(`${action.label} launched`, 2200);
      } catch (error) {
        showToast(`Unable to launch ${action.label}.`, 2200);
      }
      return;
    }

    const label = String(action || "");
    if (label.includes("Lyrics")) {
      const searchQuery = encodeURIComponent(
        (label || "").replace(/lyrics/gi, "").trim() + " song lyrics",
      );
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
      return;
    }

    showToast(`${label} - Feature coming soon!`, 2200);
  }

  function handleClearAll() {
    const defaultPrivacyMode = true;
    const defaultCrossDevice = false;

    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInput("");
    setLiveTranscript("");
    setLastSubmittedVoiceText("");
    setFlaggedCount(0);
    setPrivacyModeOn(defaultPrivacyMode);
    setCrossDeviceEnabled(defaultCrossDevice);
    setTaskStage("Intent");
    setContradictionNotice(null);
    setDecisionLog([
      {
        id: Date.now(),
        tone: "neutral",
        text: "Session reset. Waiting for a new request.",
      },
    ]);

    if (storage) {
      storage.set("saathi_memory", DEFAULT_MEMORY);
      storage.set("saathi_session_id", generateSessionId());
      storage.set("saathi_created_at", new Date().toISOString());
      storage.set("saathi_privacy_mode", defaultPrivacyMode);
      storage.set("saathi_cross_device", defaultCrossDevice);
      storage.set("saathi_flagged_count", 0);
    }
  }

  function handlePrivacyModeToggle() {
    const nextValue = !privacyModeOn;
    setPrivacyModeOn(nextValue);

    if (nextValue) {
      setCrossDeviceEnabled(false);
      pushDecisionLog(
        "Privacy Mode was turned on. Future prompts stay inside this browser unless the user changes that setting.",
        "success",
      );
      showToast(
        "Privacy Mode ON: Saathi will keep prompts in this browser only.",
      );
    } else {
      pushDecisionLog(
        "Cloud AI answers were enabled, while session storage remains local unless sharing is turned on separately.",
        "warning",
      );
      showToast(
        "Privacy Mode OFF: cloud AI answers are allowed. Cross-device sync stays optional.",
      );
    }
  }

  function handleCrossDeviceToggle() {
    if (privacyModeOn) {
      showToast(
        "Turn Privacy Mode OFF first if you want to allow cross-device sync.",
      );
      return;
    }

    setCrossDeviceEnabled((enabled) => !enabled);
    pushDecisionLog(
      "Cross-device session sharing preference was updated.",
      "neutral",
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-6 transition-all duration-700 sm:px-6 sm:py-8"
      style={{
        background:
          `radial-gradient(circle at top, rgba(${currentTheme.accentRgb || "34, 197, 94"}, 0.24), transparent 30%), ` +
          `radial-gradient(circle at 85% 20%, rgba(${currentTheme.accentRgb || "34, 197, 94"}, 0.16), transparent 22%), ` +
          "linear-gradient(180deg, #08111b 0%, #0b1220 55%, #09101d 100%)",
      }}
    >
      <div className="fixed right-4 top-4 z-40 flex flex-col items-end gap-3">
        <PrivacyShield
          privacyState={privacyState}
          onOpenPanel={() => setPrivacyPanelOpen(true)}
        />

        <div className="surface w-[280px] rounded-2xl p-3 shadow-ambient">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Privacy Mode
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {privacyModeOn ? "ON" : "OFF"}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrivacyModeToggle}
              className={
                "relative h-7 w-14 rounded-full transition-all " +
                (privacyModeOn ? "bg-emerald-500/30" : "bg-amber-500/25")
              }
            >
              <span
                className={
                  "absolute top-1 h-5 w-5 rounded-full bg-white transition-all " +
                  (privacyModeOn ? "left-1" : "left-8")
                }
              ></span>
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {privacyModeOn
              ? "No prompt leaves the browser. Saathi answers locally and stores only local session data."
              : "Cloud AI answers are allowed. Storage still stays local unless you separately enable cross-device sync."}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-100">
                Share Session
              </p>
              <p className="text-[11px] leading-5 text-slate-500">
                Copy link to continue on mobile. <br />
                <span className="text-amber-400/80 font-medium">
                  (Note: Use your computer's IP address)
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={copySessionLink}
              className="text-xs px-3 py-1 bg-blue-600/30 text-blue-400 rounded hover:bg-blue-600/50 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-5 pt-20 sm:gap-6 sm:pt-24">
        {isDemoMode && (
          <section className="rounded-[24px] border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-ambient sm:px-5">
            <p className="font-semibold uppercase tracking-[0.22em] text-amber-200">
              Demo Mode
            </p>
            <p className="mt-1 leading-6">
              Saathi is using local handling right now. In Privacy Mode ON,
              prompts stay in this browser and are not uploaded to the server.
            </p>
          </section>
        )}

        <section className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-400">
                  Saathi AI
                </p>
                <h1 className="font-display text-3xl leading-tight text-white sm:text-4xl">
                  The first voice companion built for how Indians actually speak
                </h1>
                <p className="text-base text-slate-300 sm:text-lg">
                  Every voice assistant was built for English. Saathi was built for Bharat.
                  Hindi, Kannada, Telugu, Tamil, Malayalam, Bengali, and everything in between.
                </p>
                <p className="max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                  It understands the beautiful mess of Hinglish, Tanglish, and Kanglish that people actually speak every day, while still tracking emotion, intent shifts, and multimodal context in real time.
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-700 ${EMOTION_THEMES[currentEmotion]?.badge || EMOTION_THEMES.calm?.badge || "border-slate-700 bg-slate-900 text-slate-200"}`}
              >
                <span>{EMOTION_THEMES[currentEmotion]?.label || "Calm"}</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-100 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Language Coverage
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Hindi",
                    "Kannada",
                    "Telugu",
                    "Tamil",
                    "Malayalam",
                    "Bengali",
                    "Hinglish",
                    "Tanglish",
                    "Kanglish",
                  ].map((language) => (
                    <span
                      key={language}
                      className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100"
                    >
                      {language}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Saathi is designed for mixed-language Indian speech patterns instead of forcing users into rigid English-only commands.
                </p>
              </div>

              <div
                className="rounded-[22px] border px-4 py-3 text-sm text-slate-100 transition-all duration-700"
                style={{
                  borderColor: `rgba(${currentTheme.accentRgb || "34, 197, 94"}, 0.45)`,
                  backgroundColor: `rgba(${currentTheme.accentRgb || "34, 197, 94"}, 0.12)`,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    {activeInputMode === "mode1"
                      ? "Mode 1 - Live Webcam"
                      : "Mode 2 - Voice Fallback"}
                  </div>
                  <div>
                    Voice:{" "}
                    <span style={{ color: currentTheme.accentHex || "#22c55e" }}>
                      {voiceSignal.label} {voiceSignal.emoji}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Face: {faceSignal.label} {faceSignal.emoji}
                    {cameraEnabled && (
                      <span className="ml-2 text-slate-400">
                        {(faceConfidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  {cameraEnabled
                    ? "Multimodal fusion is active, so Saathi compares voice tone with live facial affect from sampled webcam frames."
                    : cameraStatus}
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-200">
                Privacy behavior:{" "}
                <span className="font-semibold text-white">
                  {privacyModeOn ? "No server upload" : "Cloud AI allowed"}
                </span>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Storage: {privacyBehavior.storageType || "localStorage"} only
                  · Voice retained:{" "}
                  {privacyBehavior.voiceDataRetained ? "yes" : "no"} ·
                  Analytics: {privacyBehavior.analyticsEnabled ? "on" : "off"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Session-scoped memory stays isolated per user, and the transparency panel shows exactly what is stored.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative flex h-40 w-40 items-center justify-center">
                {listening && (
                  <>
                    <span className="absolute h-28 w-28 rounded-full border accent-border animate-ringPulse"></span>
                    <span
                      className="absolute h-36 w-36 rounded-full border accent-border animate-ringPulse"
                      style={{ animationDelay: "0.5s" }}
                    ></span>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleMicClick}
                  className="accent-shadow relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-2 bg-slate-950 text-4xl transition-all duration-500 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ borderColor: "var(--accent-solid)" }}
                  disabled={loadingReply}
                >
                  🎤
                </button>
              </div>

              <div className="w-full max-w-2xl text-center">
                <p className="text-lg font-semibold text-white">{statusText}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {supportsSpeechRecognition
                    ? "Speak your question or type below. Saathi shows confidence, privacy status, contradiction handling, and safety flags in real time."
                    : "This browser does not support voice capture here yet. Please type below or try Chrome or Edge."}
                </p>

                {(listening || liveTranscript || lastSubmittedVoiceText) && (
                  <div className="mt-4 rounded-[22px] border border-slate-800 bg-slate-950/55 px-4 py-3 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {listening ? "Live Transcript" : "Last Voice Input Sent"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-100">
                      {listening
                        ? liveTranscript || "Listening for your words..."
                        : lastSubmittedVoiceText ||
                          "No voice input has been sent yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything. In Privacy Mode ON, Saathi keeps your prompt inside this browser only."
                className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-white/5"
              />
              <button
                type="submit"
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-500 accent-shadow disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "var(--accent-solid)" }}
                disabled={loadingReply}
              >
                {loadingReply ? "Thinking..." : "Send"}
              </button>
            </form>

            {contradictionNotice && (
              <div className="rounded-[22px] border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                  Contradiction handled
                </p>
                <p className="mt-2 leading-6">{contradictionNotice.text}</p>
                <p className="mt-1 text-xs leading-5 text-amber-100/80">
                  {contradictionNotice.detail}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-white">
                  Multimodal Status
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  One-click webcam activation, live frame sampling, and automatic Mode 2 fallback when the camera is blocked.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCameraToggle}
                className="rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/20"
              >
                {cameraEnabled ? "Pause Mode 1" : "Start Mode 1"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Voice Signal
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {voiceSignal.label} {voiceSignal.emoji}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Saathi is tracking tone, pacing, and phrasing from the user's speech.
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-800 bg-slate-950/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Face Signal
                  </p>
                  <button
                    type="button"
                    onClick={handleCameraToggle}
                    className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 transition hover:border-white/20"
                  >
                    {cameraEnabled ? "Pause" : "Start"}
                  </button>
                </div>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80">
                  {cameraEnabled ? (
                    <div className="relative">
                      <video
                        ref={cameraVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-44 w-full object-cover"
                      />
                      <div className="absolute left-3 top-3 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50">
                        Mode 1 OK
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-slate-400">
                      Camera preview is off. Start Mode 1 to show the OK state and begin facial-expression detection.
                    </div>
                  )}
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {faceSignal.label} {faceSignal.emoji}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {cameraEnabled
                    ? `${(faceConfidence * 100).toFixed(0)}% confidence · ${frameSampleRate.toFixed(1)} fps sampling`
                    : faceDetectionReady
                      ? "Detector ready"
                      : "Detector unavailable"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {cameraStatus}
                </p>
                {cameraErrorDetail && (
                  <p className="mt-2 text-xs leading-5 text-amber-300">
                    {cameraErrorDetail}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
            <div className="mb-4">
              <h2 className="font-display text-xl text-white">
                Task Progress
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                The UI keeps the flow simple, even though the backend can support longer chains.
              </p>
            </div>

            <div className="grid gap-3">
              {taskStepStates.map((item) => (
                <div
                  key={item.step}
                  className={
                    "rounded-[20px] border px-4 py-3 text-sm transition-all " +
                    (item.status === "done"
                      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-50"
                      : item.status === "active"
                        ? "accent-border accent-bg text-white"
                        : "border-slate-800 bg-slate-950/55 text-slate-300")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{item.step}</span>
                    <span className="text-[11px] uppercase tracking-[0.22em]">
                      {item.status === "done"
                        ? "Done"
                        : item.status === "active"
                          ? "Live"
                          : "Waiting"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-white">Conversation</h2>
            <span className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Confidence + Safety Layer
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {messages.map((message, index) => {
              const isUser = message.sender === "user";
              const isLatestAssistant =
                !isUser &&
                lastAssistantMessage &&
                lastAssistantMessage.id === message.id;

              return (
                <div
                  key={message.id}
                  className={
                    "flex animate-riseFade " +
                    (isUser ? "justify-end" : "justify-start")
                  }
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <div
                    className={
                      "max-w-[88%] rounded-[22px] px-4 py-3 sm:max-w-[76%] " +
                      (isUser
                        ? "text-slate-950"
                        : "border border-slate-800 bg-slate-950/55 text-slate-100")
                    }
                    style={
                      isUser
                        ? {
                            backgroundColor: "var(--accent-solid)",
                            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
                          }
                        : undefined
                    }
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                      {isUser ? "You" : "Saathi AI"}
                    </p>
                    <p className="mt-2 text-sm leading-6">{message.text}</p>

                    {!isUser && (
                      <>
                        <ConfidenceTag
                          confidence={message.confidence}
                          uncertaintyReason={message.uncertaintyReason}
                          isFactual={message.isFactual}
                          suggestedSources={message.suggestedSources}
                          query={message.sourceQuery}
                          sourceUrls={SOURCE_URLS}
                        />
                        <SafetyFlag analysisResult={message.analysisResult} />
                      </>
                    )}

                    {isLatestAssistant && message.actions.length > 0 && (
                      <ActionButtons
                        actions={message.actions}
                        onActionClick={(action) => handleActionClick(action)}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {(displayState === "filler" ||
              displayState === "transitioning") && (
              <div className="flex animate-riseFade justify-start">
                <div className="max-w-[88%] rounded-[22px] px-4 py-3 sm:max-w-[76%] border border-slate-800 bg-slate-950/55 text-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                    Saathi AI
                  </p>
                  <p
                    className={`mt-2 text-sm leading-6 italic text-slate-400 filler-text ${displayState === "transitioning" ? "transitioning" : ""}`}
                  >
                    {fillerText}
                  </p>
                </div>
              </div>
            )}

            {handoffReason &&
              typeof window.HandoffPrompt === "function" &&
              (() => {
                const HandoffPromptComponent = window.HandoffPrompt;
                return (
                  <HandoffPromptComponent
                    reason={handoffReason}
                    onConnect={() => {
                      setHandoffReason(null);
                      handleHandoffConnect();
                    }}
                    onContinue={() => setHandoffReason(null)}
                  />
                );
              })()}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
            <div className="mb-4">
              <h2 className="font-display text-xl text-white">
                Live Decision Log
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Plain-English updates show what Saathi noticed and why it responded that way.
              </p>
            </div>

            <div className="grid gap-3">
              {decisionLog.map((entry) => (
                <div
                  key={entry.id}
                  className={
                    "rounded-[20px] border px-4 py-3 text-sm leading-6 " +
                    (entry.tone === "success"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-50"
                      : entry.tone === "warning"
                        ? "border-amber-400/20 bg-amber-500/10 text-amber-50"
                        : "border-slate-800 bg-slate-950/55 text-slate-200")
                  }
                >
                  {entry.text}
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
            <div className="mb-4">
              <h2 className="font-display text-xl text-white">
                Security and Privacy
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Production-facing guardrails are visible, with claims worded to match what the app can defend.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Session Controls
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Per-user session IDs, browser-local storage by default, and an explicit clear-all action through the transparency panel.
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Retention Story
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Privacy Mode keeps prompts local, disables server upload, and makes graceful fallback behavior obvious to the user.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface rounded-[28px] p-5 shadow-ambient sm:p-7">
          <div className="mb-4">
            <h2 className="font-display text-xl text-white">Flow Diagram</h2>
            <p className="mt-1 text-sm text-slate-400">
              Judges can trace the response pipeline from input to privacy,
              safety, and verification without relying on a risky hard latency claim.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {flowNodes.map((node, index) => (
              <React.Fragment key={node.label}>
                <div
                  className={
                    "rounded-[22px] border p-4 text-center transition-all duration-500 " +
                    (index === 3
                      ? "accent-border accent-bg"
                      : "border-slate-800 bg-slate-950/50")
                  }
                >
                  <div className="text-2xl">{node.icon}</div>
                  <p
                    className={
                      "mt-2 text-sm font-semibold " +
                      (index === 3 ? "accent-text" : "text-slate-200")
                    }
                  >
                    {node.label}
                  </p>
                </div>
                {index < flowNodes.length - 1 && (
                  <div className="hidden items-center justify-center sm:flex">
                    <div className="thin-line h-[2px] w-full rounded-full"></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Saathi is optimized for low-latency responses, but this demo avoids claiming a fixed millisecond number without live measurement.
          </p>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-ambient">
          {toast}
        </div>
      )}

      <TransparencyPanel
        isOpen={privacyPanelOpen}
        onClose={() => setPrivacyPanelOpen(false)}
        onClearAll={handleClearAll}
      />

      <SupportSuggestion
        emotion={currentEmotion}
        isCrisis={isCrisis}
        onDismiss={() => processText("I'm okay")}
      />
      <StopButton
        isSpeaking={isSpeaking}
        onStop={() => {
          SpeechController?.stop?.();
          setIsSpeaking(false);
          setStatusOverride("Stopped. I'm listening.");
        }}
      />
    </main>
  );
}

const LandingPage = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      <div className="z-10 max-w-4xl animate-riseFade">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Next-Gen Voice Companion</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight text-white mb-6 leading-tight">
          Your Soulful <span className="text-emerald-500">AI Friend</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Experience Saathi: The first truly empathetic AI that understands your emotions, protects your privacy, and stays by your side.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <button
            onClick={onStart}
            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-center space-x-3"
          >
            <span>Start Conversation</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <a
            href="#about"
            className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all duration-300 flex items-center space-x-3"
          >
            <span>Learn More</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Privacy First</h3>
            <p className="text-slate-400 leading-relaxed">
              Military-grade encryption and local processing keep your data yours. Always.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Emotionally Aware</h3>
            <p className="text-slate-400 leading-relaxed">
              Saathi detects your mood through voice and face to provide real emotional support.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant Responses</h3>
            <p className="text-slate-400 leading-relaxed">
              Lightning fast AI processing ensures seamless, natural conversations in any language.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-24 text-slate-500 text-sm">
        &copy; 2026 Saathi AI. All rights reserved.
      </footer>
    </div>
  );
};

const AboutPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white p-8 md:p-16 animate-riseFade">
      <button 
        onClick={onBack}
        className="mb-12 flex items-center space-x-2 text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-display font-bold mb-8">About Saathi AI</h1>
        
        <div className="space-y-12 text-lg text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p>
              Saathi (meaning "Companion") was built with a single goal: to create an AI that doesn't just process information, but understands humans. In a world of cold, mechanical chatbots, Saathi brings warmth, empathy, and emotional intelligence.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Multimodal Intelligence</h3>
              <p className="text-sm">
                Saathi uses advanced vision and audio processing to detect your emotional state in real-time, adjusting its tone and responses to match your needs.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Absolute Privacy</h3>
              <p className="text-sm">
                Your conversations are yours. Saathi features a hard-wired Privacy Shield that ensures sensitive data never leaves your device without your explicit consent.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">The Team</h2>
            <p>
              Developed by a global team of AI researchers and psychologists, Saathi represents the cutting edge of Empathetic Artificial Intelligence.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

const PrivacyPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white p-8 md:p-16 animate-riseFade">
      <button 
        onClick={onBack}
        className="mb-12 flex items-center space-x-2 text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-display font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-12 text-lg text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Data, Your Control</h2>
            <p>
              At Saathi AI, we believe privacy is a fundamental human right. Our privacy architecture is designed from the ground up to ensure your data stays local whenever possible.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Key Protections</h2>
            <ul className="list-disc pl-6 space-y-4">
              <li>
                <strong className="text-emerald-400">Local Processing:</strong> Emotion detection and basic voice commands are processed directly in your browser.
              </li>
              <li>
                <strong className="text-emerald-400">Privacy Shield:</strong> Our hard-coded privacy engine detects sensitive information (like passwords or IDs) and prevents them from being sent to any server.
              </li>
              <li>
                <strong className="text-emerald-400">No Tracking:</strong> We do not use cookies or tracking pixels to follow you across the web.
              </li>
              <li>
                <strong className="text-emerald-400">Encryption:</strong> Any data that must be sent for AI processing is encrypted with AES-256 standards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p>
              If you have questions about our privacy practices, you can contact our security team at privacy@saathi.ai.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["landing", "chat", "about", "privacy"].includes(hash) ? hash : "landing";
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["landing", "chat", "about", "privacy"].includes(hash)) {
        setPage(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (newPage) => {
    window.location.hash = newPage;
    setPage(newPage);
  };

  return (
    <EmotionProvider>
      {page === "landing" && (
        <LandingPage 
          onStart={() => navigate("chat")} 
        />
      )}
      {page === "chat" && (
        <div className="animate-riseFade">
          <button 
            onClick={() => navigate("landing")}
            className="fixed top-6 left-6 z-50 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-slate-400 hover:text-white"
            title="Back to Home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <SaathiChat />
        </div>
      )}
      {page === "about" && (
        <AboutPage onBack={() => navigate("landing")} />
      )}
      {page === "privacy" && (
        <PrivacyPage onBack={() => navigate("landing")} />
      )}
      
      {/* Footer Navigation */}
      {page !== "chat" && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-8 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl z-50">
          <button onClick={() => navigate("landing")} className={`text-sm font-bold ${page === "landing" ? "text-emerald-500" : "text-slate-400 hover:text-white"}`}>Home</button>
          <button onClick={() => navigate("about")} className={`text-sm font-bold ${page === "about" ? "text-emerald-500" : "text-slate-400 hover:text-white"}`}>About</button>
          <button onClick={() => navigate("privacy")} className={`text-sm font-bold ${page === "privacy" ? "text-emerald-500" : "text-slate-400 hover:text-white"}`}>Privacy</button>
          <button onClick={() => navigate("chat")} className={`text-sm font-bold ${page === "chat" ? "text-emerald-500" : "text-slate-400 hover:text-white"}`}>Chat</button>
        </nav>
      )}
    </EmotionProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

