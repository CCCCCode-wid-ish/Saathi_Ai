const SAFETY_CATEGORIES = {
  harmful: {
    label: "Potentially Harmful",
    severity: "high",
    keywords: [
      "kill",
      "murder",
      "suicide",
      "self-harm",
      "hurt yourself",
      "harm myself",
      "end your life",
      "dangerous drug",
      "poison",
      "weapon",
    ],
  },
  biased: {
    label: "Possibly Biased",
    severity: "medium",
    keywords: [
      "all women",
      "all men",
      "all muslims",
      "all hindus",
      "all christians",
      "those people",
      "you people",
      "your kind",
      "naturally inferior",
      "they always",
      "they never",
      "obviously stupid",
    ],
  },
  medical: {
    label: "Unverified Medical Advice",
    severity: "medium",
    keywords: [
      "you should take",
      "take this medicine",
      "this will cure",
      "guaranteed to heal",
      "no need for doctor",
      "doctors are wrong",
      "this drug will",
      "stop your medication",
      "stop taking your medicine",
    ],
  },
  financial: {
    label: "Unverified Financial Advice",
    severity: "medium",
    keywords: [
      "guaranteed returns",
      "definitely invest",
      "cannot lose money",
      "secret investment",
      "100% profit",
      "risk free money",
    ],
  },
  privacy: {
    label: "Privacy Risk",
    severity: "high",
    keywords: [
      "share your password",
      "give me your otp",
      "send your aadhaar",
      "share bank details",
      "enter your pin",
      "your credit card number",
    ],
  },
};

function analyzeResponse(text) {
  const lower = String(text || "").toLowerCase();
  const flags = [];

  Object.entries(SAFETY_CATEGORIES).forEach(([category, config]) => {
    const matchedTerms = config.keywords.filter((keyword) => lower.includes(keyword));
    if (matchedTerms.length > 0) {
      flags.push({
        category,
        label: config.label,
        severity: config.severity,
        matchedTerms,
      });
    }
  });

  const uncertainPhrases = [
    "i think",
    "i believe",
    "probably",
    "might be",
    "not sure",
  ];
  const isUncertain = uncertainPhrases.some((phrase) => lower.includes(phrase));

  return {
    isFlagged: flags.length > 0,
    isUncertain,
    flags,
    highSeverity: flags.some((flag) => flag.severity === "high"),
    summary: flags.map((flag) => flag.label).join(", ") || null,
  };
}

window.safetyEngine = {
  SAFETY_CATEGORIES,
  analyzeResponse,
};
