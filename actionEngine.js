const ACTION_MAP = [
  {
    intent: "late",
    keywords: ["late", "stuck", "traffic", "hurry", "rush", "delay", "missing"],
    actions: [
      {
        id: "maps",
        label: "📍 Open Maps",
        description: "Finding fastest route",
        color: "blue",
        execute: (context) => {
          const query = context?.location || "nearest route";
          const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
          const opened = window.open(url, "_blank");
          if (
            !opened ||
            opened.closed ||
            typeof opened.closed === "undefined"
          ) {
            window.location.href = url;
          }
        },
      },
    ],
  },
  {
    intent: "hungry",
    keywords: [
      "hungry",
      "eat",
      "food",
      "starving",
      "lunch",
      "dinner",
      "breakfast",
    ],
    actions: [
      {
        id: "food",
        label: "🍽️ Order Food",
        description: "Finding nearby options",
        color: "orange",
        href: "https://www.zomato.com",
        execute: () => {
          const url = "https://www.zomato.com";
          const opened = window.open(url, "_blank");
          if (
            !opened ||
            opened.closed ||
            typeof opened.closed === "undefined"
          ) {
            window.location.href = url;
          }
        },
      },
    ],
  },
  {
    intent: "weather",
    keywords: [
      "weather",
      "rain",
      "umbrella",
      "sunny",
      "cold",
      "hot",
      "forecast",
    ],
    actions: [
      {
        id: "weather",
        label: "🌦️ Check Weather",
        description: "Opening weather forecast",
        color: "cyan",
        href: "https://weather.com",
        execute: () => {
          const url = "https://weather.com";
          const opened = window.open(url, "_blank");
          if (
            !opened ||
            opened.closed ||
            typeof opened.closed === "undefined"
          ) {
            window.location.href = url;
          }
        },
      },
    ],
  },
  {
    intent: "tired",
    keywords: ["tired", "sleep", "rest", "exhausted", "sleepy"],
    actions: [
      {
        id: "music",
        label: "🎵 Play Calm Music",
        description: "Opening relaxing playlist",
        color: "purple",
        href: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY",
        execute: () => {
          const url =
            "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY";
          const opened = window.open(url, "_blank");
          if (
            !opened ||
            opened.closed ||
            typeof opened.closed === "undefined"
          ) {
            window.location.href = url;
          }
        },
      },
    ],
  },
];

function detectActions(text) {
  const lower = String(text || "").toLowerCase();
  const triggered = [];

  for (const mapping of ACTION_MAP) {
    if (mapping.keywords.some((keyword) => lower.includes(keyword))) {
      triggered.push(...mapping.actions);
    }
  }

  return triggered;
}

function autoExecuteActions(actions, delay = 1500) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return;
  }

  const primaryAction = actions.find(
    (action) =>
      typeof action === "object" &&
      action !== null &&
      typeof action.execute === "function",
  );
  if (!primaryAction) {
    return;
  }

  setTimeout(() => {
    try {
      primaryAction.execute({});
    } catch (error) {
      console.warn("Auto-execute action failed:", error);
    }
  }, delay);
}

window.actionEngine = {
  detectActions,
  autoExecuteActions,
};
