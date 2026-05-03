function ActionButtons({ actions, onActionClick }) {
  if (!actions || actions.length === 0) {
    return null;
  }

  const colorMap = {
    blue: "bg-blue-900/50 border-blue-700 text-blue-300 hover:bg-blue-900",
    orange:
      "bg-orange-900/50 border-orange-700 text-orange-300 hover:bg-orange-900",
    cyan: "bg-cyan-900/50 border-cyan-700 text-cyan-300 hover:bg-cyan-900",
    purple:
      "bg-purple-900/50 border-purple-700 text-purple-300 hover:bg-purple-900",
    green: "bg-green-900/50 border-green-700 text-green-300 hover:bg-green-900",
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-fadeIn">
      {actions.map((action, index) => {
        const label = typeof action === "string" ? action : action.label;
        const colorClass =
          typeof action === "object" && action.color
            ? colorMap[action.color]
            : colorMap.blue;

        const key = typeof action === "object" ? action.id : `${label}-${index}`;
        const content = (
          <>
            {label}
            {typeof action === "object" && action.description && (
              <span className="text-xs opacity-60 font-normal">
                {action.description}
              </span>
            )}
          </>
        );

        if (typeof action === "object" && action.href) {
          return (
            <a
              key={key}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.preventDefault();
                const url = action.href;
                const opened = window.open(url, "_blank");
                if (!opened || opened.closed || typeof opened.closed === "undefined") {
                  window.location.href = url;
                }
                onActionClick?.({ ...action, execute: undefined });
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${colorClass}`}
            >
              {content}
            </a>
          );
        }

        return (
          <button
            key={key}
            type="button"
            onClick={() => onActionClick?.(action)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${colorClass}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

window.ActionButtons = ActionButtons;
