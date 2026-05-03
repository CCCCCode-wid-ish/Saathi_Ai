function speakWithPersonality(text, emotion) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const controller = window.interruptEngine?.SpeechController;
  if (controller) {
    return controller.speak(text, emotion);
  }
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Personality voice settings
  const settings = {
    stressed: { rate: 0.82, pitch: 0.95, volume: 0.95 },
    sad:      { rate: 0.76, pitch: 0.88, volume: 0.85 },
    calm:     { rate: 1.0,  pitch: 1.02, volume: 1.0  },
    happy:    { rate: 1.08, pitch: 1.08, volume: 1.0  }
  };
  
  const s = settings[emotion] || settings.calm;
  utterance.rate = s.rate;
  utterance.pitch = s.pitch;
  utterance.volume = s.volume;
  
  // Pick best voice — critical for personality
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    'Google UK English Female',
    'Microsoft Zira Desktop',
    'Samantha',
    'Karen',
    'Google US English'
  ];
  
  for (const name of preferred) {
    const match = voices.find(v => v.name === name);
    if (match) { utterance.voice = match; break; }
  }
  
  // Add natural pause before speaking — feels more human
  setTimeout(() => window.speechSynthesis.speak(utterance), 80);
}

window.voicePersonality = { speakWithPersonality };
