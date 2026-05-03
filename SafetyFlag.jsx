const { useState: useSafetyFlagState } = React;

function SafetyFlag({ analysisResult }) {
  const [dismissed, setDismissed] = useSafetyFlagState(false);

  if (!analysisResult || !analysisResult.isFlagged || dismissed) {
    return null;
  }
  //

  return (
    <div
      className={
        "mt-3 rounded-xl border px-4 py-3 text-xs leading-relaxed " +
        (analysisResult.highSeverity
          ? "border-red-800 bg-red-950 text-red-300"
          : "border-amber-800 bg-amber-950 text-amber-300")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-medium">
            {analysisResult.highSeverity ? "⚠️ Please Review" : "💡 Heads Up"}
          </span>
          <span className="ml-2 opacity-80">{analysisResult.summary}</span>
          <p className="mt-1 opacity-75">
            Saathi flagged this response. Please verify before acting on it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 opacity-60 transition hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

window.SafetyFlag = SafetyFlag;
