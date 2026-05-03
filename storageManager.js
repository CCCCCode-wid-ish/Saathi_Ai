const SAATHI_KEYS = [
  "saathi_memory",
  "saathi_session_id",
  "saathi_privacy_mode",
  "saathi_cross_device",
  "saathi_flagged_count",
  "saathi_created_at",
  "saathi_messages",
  "saathi_decision_log",
  "saathi_multimodal_state",
];

function safeParse(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const storage = {
  get(key) {
    try {
      return safeParse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error && error.name === "QuotaExceededError") {
        this.clearAll();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }

      return false;
    }
  },

  clearAll() {
    SAATHI_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore browser storage errors.
      }
    });
  },

  clearField(field) {
    const memory = this.get("saathi_memory");
    if (memory && Object.prototype.hasOwnProperty.call(memory, field)) {
      memory[field] = null;
      this.set("saathi_memory", memory);
    }
  },

  audit() {
    return SAATHI_KEYS.reduce((accumulator, key) => {
      try {
        accumulator[key] = safeParse(localStorage.getItem(key));
      } catch {
        accumulator[key] = null;
      }
      return accumulator;
    }, {});
  },

  getStorageSize() {
    const totalKb = SAATHI_KEYS.reduce((total, key) => {
      try {
        const item = localStorage.getItem(key) || "";
        return total + new Blob([item]).size / 1024;
      } catch {
        return total;
      }
    }, 0);

    return totalKb.toFixed(2);
  },
};

window.storageManager = {
  SAATHI_KEYS,
  storage,
};
