const RESPONSE_LIBRARY = {

  late: {
    stressed: [
      "Okay, breathe. What's your destination? I'll get you moving right now.",
      "Running late happens. Let's fix it — where do you need to be?",
      "Hey, you've got this. Tell me where you're headed and I'll sort the fastest route.",
      "Late start, no problem. Give me your destination and we'll make up the time."
    ],
    calm: [
      "Sure, let me help you plan your route so you're not cutting it close.",
      "No rush — well, maybe a little rush. Where are you headed?",
      "Let's get you there on time. What's the destination?",
      "I'll pull up the quickest route. Where to?"
    ]
  },

  hungry: {
    stressed: [
      "Food first, problems later. What are you in the mood for?",
      "Let's get you fed quickly. What's nearby that you like?",
      "Hungry and stressed? Not a good combo. Let me find you something fast.",
      "Quick fuel incoming — what cuisine works for you right now?"
    ],
    calm: [
      "Ooh, food time! What are you feeling — something quick or a proper meal?",
      "Let's find you something good. Any preference — delivery or pickup?",
      "Hungry? Great timing. What's calling your name today?",
      "I know a few good spots. What kind of food sounds right?"
    ],
    sad: [
      "Food always helps a little. Let's find you something comforting.",
      "How about something warm and filling? Tell me what you're craving.",
      "Let me find you something good — comfort food coming right up.",
      "You deserve a good meal right now. What sounds nice?"
    ]
  },

  weather: {
    stressed: [
      "Quick check — looks like rain today. Grab an umbrella before you leave.",
      "Weather update: rain likely. Take an umbrella, you'll thank yourself later.",
      "Heads up — it might get wet out there. Umbrella is a good call.",
      "Rain expected today. Pack light but don't forget the umbrella."
    ],
    calm: [
      "Let me check that for you. Looks like some rain is possible today — umbrella weather!",
      "Weather check done. There's a chance of rain, so maybe pack an umbrella just in case.",
      "Today might be a bit drizzly. An umbrella would be smart to carry.",
      "Rain's possible today. Not certain, but better safe than soggy!"
    ]
  },

  tired: {
    sad: [
      "Rest is not laziness. You've clearly been doing a lot — it's okay to pause.",
      "Your body is asking for a break. That's worth listening to.",
      "Being tired this deep means you've been carrying a lot. Is everything okay?",
      "Sometimes tired isn't just physical. Do you want to talk about what's been going on?"
    ],
    stressed: [
      "You need rest before you can fix anything else. Even 20 minutes helps.",
      "Tired and stressed is a tough place. Let's handle one thing at a time.",
      "Your brain needs a recharge. What can we push to tomorrow?",
      "Rest first. The problems will still be there but you'll handle them better rested."
    ],
    calm: [
      "Sounds like your body needs a break. Want me to set a rest reminder?",
      "A little tiredness is your body's way of asking for care. Rest when you can.",
      "How about a short break? Even 15 minutes of rest makes a difference.",
      "Rest is productive too. Want me to help you clear your schedule a bit?"
    ]
  },

  sad: {
    sad: [
      "I hear you. You don't have to explain anything — I'm just here.",
      "That sounds really hard. Do you want to talk about it, or just not be alone right now?",
      "Sometimes things just feel heavy. That's real, and it makes sense.",
      "I'm not going anywhere. Whatever you're feeling right now is okay."
    ]
  },

  general: {
    calm: [
      "I'm here — what do you need?",
      "Tell me more — I'm listening.",
      "Got it. How can I help you with that?",
      "I'm on it. What else do you need?"
    ],
    stressed: [
      "Okay, focus. What's the most important thing right now?",
      "One thing at a time. What do you need first?",
      "I'm here. What's most urgent?",
      "Let's handle this. What's the priority?"
    ]
  }
};

window.responseLibrary = { RESPONSE_LIBRARY };
