function getConfidenceMeta(confidence) {
  const score = Math.round((confidence || 0) * 100);

  if (score >= 90) {
    return {
      label: "High Confidence",
      badgeClass: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
      disclaimerClass: "",
      sourceCount: 1,
    };
  }

  if (score >= 70) {
    return {
      label: "Mostly Sure",
      badgeClass: "border-amber-400/30 bg-amber-500/15 text-amber-200",
      disclaimerClass: "",
      sourceCount: 1,
    };
  }

  if (score >= 50) {
    return {
      label: "Not Fully Sure",
      badgeClass: "border-orange-400/30 bg-orange-500/15 text-orange-200",
      disclaimerClass: "text-orange-200/95",
      sourceCount: 1,
    };
  }

  return {
    label: "Please Verify This",
    badgeClass: "border-rose-400/30 bg-rose-500/15 text-rose-200",
    disclaimerClass: "text-rose-200",
    sourceCount: 3,
  };
}

function getSourceLabel(source) {
  const labels = {
    google: "🔍 Google",
    wikipedia: "📖 Wikipedia",
    snopes: "🕵️ Snopes",
    factcheck: "✅ FactCheck",
    wolframalpha: "🔬 Wolfram Alpha",
    pubmed: "🩺 PubMed",
  };

  return labels[source] || source;
}

window.ConfidenceTag = function ConfidenceTag({
  confidence = 0,
  uncertaintyReason = "",
  isFactual = false,
  suggestedSources = [],
  query = "",
  sourceUrls,
}) {
  const meta = getConfidenceMeta(confidence);
  const score = Math.round((confidence || 0) * 100);
  const shouldShowDisclaimer = score < 70;
  const visibleSources = isFactual ? suggestedSources.slice(0, meta.sourceCount || 0) : [];

  return (
    <div className="mt-4 space-y-3">
      <div
        className={
          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em] " +
          meta.badgeClass
        }
      >
        {meta.label} - {score}%
      </div>

      <p className="text-xs leading-5 text-slate-400">
        {uncertaintyReason || "This response includes some uncertainty and should be interpreted with care."}
      </p>

      {shouldShowDisclaimer && (
        <p className={"text-sm font-medium leading-5 " + meta.disclaimerClass}>
          ⚠️ I'm not fully sure about this. Please verify before acting on it.
        </p>
      )}

      {isFactual && visibleSources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleSources.map((source) => {
            const buildUrl = sourceUrls[source];
            if (!buildUrl) {
              return null;
            }

            return (
              <a
                key={source}
                href={buildUrl(query)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                {getSourceLabel(source)}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
