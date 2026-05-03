const { useState: usePrivacyShieldState } = React;

function PrivacyShield({ privacyState, onOpenPanel }) {
  const [showTooltip, setShowTooltip] = usePrivacyShieldState(false);
  const storageApi = window.storageManager || {};
  const storage = storageApi.storage;
  const size = storage ? storage.getStorageSize() : "0.00";

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onClick={onOpenPanel}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg transition-all hover:border-white/20"
      >
        <span>{privacyState.icon}</span>
        <span>{privacyState.label}</span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-white/10 bg-slate-950/95 p-3 text-xs leading-relaxed text-slate-300 shadow-2xl">
          {privacyState.description}
          <div className="mt-2 border-t border-white/10 pt-2 text-slate-400">
            Stored: {size} KB in your browser
          </div>
        </div>
      )}
    </div>
  );
}

window.PrivacyShield = PrivacyShield;
