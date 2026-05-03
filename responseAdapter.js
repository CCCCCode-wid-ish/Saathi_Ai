const RESPONSE_TEMPLATES = {
  stressed: {
    prefix: "Hey, breathe. I've got you. ",
    style:
      "Keep sentences short. Maximum 2 sentences per response. Use reassuring words.",
    suffix: " One step at a time.",
    maxWords: 30,
  },
  sad: {
    prefix: "I hear you. ",
    style: "Be warm, gentle, and supportive. Never give advice unless asked.",
    suffix: " I'm here with you.",
    maxWords: 40,
  },
  angry: {
    prefix: "I understand. ",
    style:
      "Acknowledge frustration first. Don't be defensive. Offer practical help.",
    suffix: " Let me help fix this.",
    maxWords: 35,
  },
  happy: {
    prefix: "",
    style: "Match their energy. Be enthusiastic and informative.",
    suffix: "",
    maxWords: 60,
  },
  calm: {
    prefix: "",
    style: "Normal informative tone. Clear and helpful.",
    suffix: "",
    maxWords: 60,
  },
};

function buildSystemPrompt(emotion) {
  const template = RESPONSE_TEMPLATES[emotion] || RESPONSE_TEMPLATES.calm;
  return `You are Saathi AI, a caring voice companion.
Current user emotion: ${emotion.toUpperCase()}
Response style: ${template.style}
Keep response under ${template.maxWords} words.
If the user seems to be in crisis, always suggest professional help gently.
Never diagnose. Never give medical advice. Always be warm.`;
}

function wrapResponse(text, emotion) {
  let cleanedText = text;
  
  // Intercept generic AI refusals and copyright blocks
  const lowerText = text.toLowerCase();
  const genericPhrases = [
    "as an ai",
    "i cannot provide",
    "i'm sorry, but i can't",
    "i am sorry, but i cannot",
    "i am just a bot",
    "i don't have feelings",
    "i apologize for any confusion",
    "i am unable to",
    "copyright restrictions"
  ];

  if (genericPhrases.some(phrase => lowerText.includes(phrase))) {
    if (lowerText.includes("lyrics") || lowerText.includes("copyright")) {
      cleanedText = "I'd love to, but I'm actually not allowed to pull up full copyrighted lyrics. I can help you search for the meaning of the song though, if you'd like!";
    } else {
      cleanedText = "Ah, I actually can't do that right now. But let me know what else I can help you with!";
    }
  }

  const template = RESPONSE_TEMPLATES[emotion] || RESPONSE_TEMPLATES.calm;
  return `${template.prefix}${cleanedText}${template.suffix}`;
}

window.responseAdapter = {
  buildSystemPrompt,
  wrapResponse,
};
