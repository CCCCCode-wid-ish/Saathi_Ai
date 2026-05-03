const { useEffect: useTransparencyEffect, useState: useTransparencyState } = React;

const FIELD_LABELS = {
  saathi_memory: {
    label: "Conversation Memory",
    fields: {
      name: "Your name",
      emotion: "Last detected emotion",
      lastQuery: "Last thing you said",
      lastIntent: "Last topic",
      lastAction: "Last action Saathi took",
      conversationCount: "Messages sent this session",
    },
  },
  saathi_session_id: { label: "Session ID", fields: null },
  saathi_privacy_mode: { label: "Privacy Mode setting", fields: null },
  saathi_cross_device: { label: "Cross-device sync", fields: null },
  saathi_messages: { label: "Conversation history", fields: null },
  saathi_decision_log: { label: "Decision log", fields: null },
  saathi_multimodal_state: { label: "Last multimodal snapshot", fields: null },
};

function formatSettingValue(key, value) {
  if (value === null || value === undefined) {
    return "not stored";
  }

  if (key === "saathi_privacy_mode") {
    return value ? "ON" : "OFF";
  }

  if (key === "saathi_cross_device") {
    return value ? "Enabled" : "Disabled";
  }

  if (key === "saathi_messages" && Array.isArray(value)) {
    return `${value.length} message${value.length === 1 ? "" : "s"} stored`;
  }

  if (key === "saathi_decision_log" && Array.isArray(value)) {
    return `${value.length} log entr${value.length === 1 ? "y" : "ies"} stored`;
  }

  if (key === "saathi_multimodal_state" && value && typeof value === "object") {
    const mode = value.activeInputMode === "mode1" ? "Mode 1" : "Mode 2";
    const face = value.faceEmotion || "unavailable";
    return `${mode} | ${face}`;
  }

  return String(value);
}

function TransparencyPanel({ isOpen, onClose, onClearAll }) {
  const [data, setData] = useTransparencyState({});
  const [cleared, setCleared] = useTransparencyState(false);
  const storageApi = window.storageManager || {};
  const storage = storageApi.storage;

  useTransparencyEffect(() => {
    if (isOpen && storage) {
      setData(storage.audit());
    }
  }, [isOpen, storage]);

  function handleClearAll() {
    if (!storage) {
      return;
    }

    storage.clearAll();
    setCleared(true);
    setData({});
    onClearAll();
    window.setTimeout(() => setCleared(false), 3000);
  }

  if (!isOpen) {
    return null;
  }

  const memory = data.saathi_memory;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              🔍 What Saathi Stores
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              All data lives in your browser unless you explicitly allow sync
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-slate-400 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="max-h-80 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Conversation Memory
            </p>
            {memory ? (
              Object.entries(FIELD_LABELS.saathi_memory.fields).map(([key, label]) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-right text-xs font-medium text-slate-100">
                    {memory[key] !== null && memory[key] !== undefined && memory[key] !== ""
                      ? String(memory[key])
                      : <span className="italic text-slate-500">not stored</span>}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-500">
                No data stored yet
              </p>
            )}
          </div>

          {[
            "saathi_session_id",
            "saathi_privacy_mode",
            "saathi_cross_device",
            "saathi_messages",
            "saathi_decision_log",
            "saathi_multimodal_state",
          ].map((key) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <span className="text-xs text-slate-400">
                {FIELD_LABELS[key].label}
              </span>
              <span className="text-right text-xs font-medium text-slate-100">
                {formatSettingValue(key, data[key])}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total storage used</span>
            <span>{storage ? storage.getStorageSize() : "0.00"} KB</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            No cookies · No analytics · No tracking pixels
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          {cleared ? (
            <div className="py-2 text-center text-sm font-medium text-emerald-400">
              ✓ All Saathi data cleared successfully
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full rounded-xl border border-red-800 bg-red-950 py-3 text-sm font-medium text-red-300 transition hover:bg-red-900"
            >
              🧹 Clear All My Data
            </button>
          )}
          <p className="mt-2 text-center text-xs text-slate-500">
            This only deletes Saathi&apos;s keys. Nothing else in your browser is touched.
          </p>
        </div>
      </div>
    </div>
  );
}

window.TransparencyPanel = TransparencyPanel;
