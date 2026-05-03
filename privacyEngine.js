const PRIVACY_STATES = {
  SAFE: {
    id: "safe",
    label: "Privacy Safe",
    icon: "🟢",
    color: "green",
    description: "All stored session data stays in your browser only. Nothing is cross-device synced.",
  },
  PARTIAL: {
    id: "partial",
    label: "Partial Sync",
    icon: "🟡",
    color: "yellow",
    description: "Cross-device sync permission is ON. Session data may be shared across devices when sync is configured.",
  },
  RISK: {
    id: "risk",
    label: "Review Needed",
    icon: "🔴",
    color: "red",
    description: "A response was flagged for safety review. Please verify it before acting on it.",
  },
};

const PRIVACY_MODE_BEHAVIOR = {
  ON: {
    storageType: "localStorage",
    crossDeviceSync: false,
    analyticsEnabled: false,
    voiceDataRetained: false,
    sessionPersist: true,
    cloudProcessingAllowed: false,
  },
  OFF: {
    storageType: "localStorage",
    crossDeviceSync: true,
    analyticsEnabled: false,
    voiceDataRetained: false,
    sessionPersist: true,
    cloudProcessingAllowed: true,
  },
};

function calculatePrivacyState(crossDeviceEnabled, hasFlag) {
  if (hasFlag) {
    return PRIVACY_STATES.RISK;
  }

  if (crossDeviceEnabled) {
    return PRIVACY_STATES.PARTIAL;
  }

  return PRIVACY_STATES.SAFE;
}

window.privacyEngine = {
  PRIVACY_STATES,
  PRIVACY_MODE_BEHAVIOR,
  calculatePrivacyState,
};
