const FILLERS_BY_EMOTION = {
  stressed: [
    "On it —",
    "Got you —",
    "One sec —",
    "Right away —"
  ],
  sad: [
    "I hear you…",
    "Give me a moment…",
    "I'm here…",
    "Take your time…"
  ],
  calm: [
    "Hmm, let me think…",
    "Give me a second…",
    "Let me check that…",
    "Sure, one moment…"
  ],
  happy: [
    "Ooh, good one!",
    "On it!",
    "Let's go!",
    "Great, just a sec!"
  ]
};

function getFiller(emotion) {
  const list = FILLERS_BY_EMOTION[emotion] || FILLERS_BY_EMOTION.calm;
  return list[Math.floor(Math.random() * list.length)];
}

window.fillerSystem = { getFiller };
