const SpeechController = {
  currentUtterance: null,
  isSpeaking: false,
  listeners: new Set(),

  notify() {
    //Interupt
    this.listeners.forEach((listener) => {
      try {
        listener(this.isSpeaking);
      } catch (error) {
        console.error("SpeechController listener error:", error);
      }
    });
  },

  subscribe(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    this.listeners.add(listener);
    listener(this.isSpeaking);

    return () => {
      this.listeners.delete(listener);
    };
  },

  speak(text, emotion, onStart, onEnd) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return null;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    this.isSpeaking = true;
    this.notify();

    const settings = {
      stressed: { rate: 0.82, pitch: 0.95, volume: 0.95 },
      sad: { rate: 0.76, pitch: 0.88, volume: 0.85 },
      calm: { rate: 1.0, pitch: 1.02, volume: 1.0 },
      happy: { rate: 1.08, pitch: 1.08, volume: 1.0 },
    };
    const selectedSettings = settings[emotion] || settings.calm;
    utterance.rate = selectedSettings.rate;
    utterance.pitch = selectedSettings.pitch;
    utterance.volume = selectedSettings.volume;

    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      "Google UK English Female",
      "Samantha",
      "Microsoft Zira Desktop",
    ];

    for (const name of preferred) {
      const match = voices.find((voice) => voice.name === name);
      if (match) {
        utterance.voice = match;
        break;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notify();
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notify();
      onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notify();
    };

    this.speakTimeoutId = window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 80);
    
    return utterance;
  },

  stop() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    if (this.speakTimeoutId) {
      window.clearTimeout(this.speakTimeoutId);
      this.speakTimeoutId = null;
    }

    // Chrome bug: cancel() gets stuck sometimes. resume() un-sticks it before cancel.
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
    
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.notify();
  },
};

window.interruptEngine = { SpeechController };
