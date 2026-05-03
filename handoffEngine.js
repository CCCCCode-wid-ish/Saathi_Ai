class HandoffTracker {
  constructor() {
    this.intentHistory = [];      // last 10 intents
    this.repeatThreshold = 2;     // same intent 2 times = suggest handoff
    this.sadThreshold = 1;        // any sad detection = suggest handoff
  }

  track(intent, emotion) {
    this.intentHistory = [...this.intentHistory.slice(-9), intent];
    
    // Rule 1: User is sad
    if (emotion === 'sad') {
      return { suggest: true, reason: 'emotional' };
    }
    
    // Rule 2: Crisis detected
    if (emotion === 'crisis') {
      return { suggest: true, reason: 'crisis', urgent: true };
    }
    
    // Rule 3: Same intent repeated 2+ times in last 5 messages
    const recent = this.intentHistory.slice(-5);
    const repeatCount = recent.filter(i => i === intent).length;
    if (repeatCount >= this.repeatThreshold) {
      return { suggest: true, reason: 'repeated', intent };
    }
    
    return { suggest: false };
  }
}

window.handoffEngine = { HandoffTracker };
