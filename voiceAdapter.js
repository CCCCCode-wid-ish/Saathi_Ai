const VOICE_SETTINGS = {
  calm: { rate: 1.0, pitch: 1.0, volume: 1.0 },
  stressed: { rate: 0.82, pitch: 0.95, volume: 0.95 },
  sad: { rate: 0.78, pitch: 0.9, volume: 0.85 },
  angry: { rate: 0.9, pitch: 1.05, volume: 1.0 },
  happy: { rate: 1.1, pitch: 1.1, volume: 1.0 },
  crisis: { rate: 0.75, pitch: 0.88, volume: 0.85 },
};

// Pick best available voice — prefer female, natural-sounding
function getBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    "Google UK English Female",
    "Microsoft Zira",
    "Samantha",
    "Google US English",
  ];
  for (const name of preferred) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  // Fallback: first female voice available
  return (
    voices.find((v) => v.name.toLowerCase().includes("female")) || voices[0]
  );
}

function speak(text, emotion) {
  const controller = window.interruptEngine?.SpeechController;
  if (controller) {
    return controller.speak(text, emotion);
  }

  window.speechSynthesis.cancel(); // stop any current speech instantly

  const utterance = new SpeechSynthesisUtterance(text);
  const settings = VOICE_SETTINGS[emotion] || VOICE_SETTINGS.calm;

  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  utterance.voice = getBestVoice();

  // Small delay fixes voice not loading on first call
  setTimeout(() => window.speechSynthesis.speak(utterance), 100);

  return utterance;
}

window.voiceAdapter = { speak };
