const { useState } = React;

function SupportSuggestion({ emotion, isCrisis, onDismiss }) {
  const [selectedSupport, setSelectedSupport] = useState("breathe");

  if (emotion !== "sad" && emotion !== "crisis" && !isCrisis) {
    return null;
  }

  const handleTalkToPerson = (
    phoneNumber,
    message = "Hi, I need support right now.",
  ) => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
    onDismiss();
  };

  const handleSafe = () => {
    onDismiss();
  };

  const supportOptions = [
    {
      id: "breathe",
      label: "Breathe with me",
      title: "Stay with me for one minute",
      text: "Breathe in for 4 seconds, hold for 4, and breathe out for 6. Repeat that gently three times.",
    },
    {
      id: "ground",
      label: "Ground me",
      title: "Come back to the room",
      text: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
    },
    {
      id: "reachout",
      label: "Help me reach out",
      title: "Contact someone safe right now",
      text: "Call or text one trusted person and send: 'I am not safe being alone right now. Please stay with me.'",
    },
  ];

  const activeSupport =
    supportOptions.find((option) => option.id === selectedSupport) ||
    supportOptions[0];

  if (isCrisis) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-2xl rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-4 text-center text-4xl">[Support]</div>
          <h3 className="mb-2 text-center text-lg font-semibold text-white">
            You do not have to face this alone.
          </h3>
          <p className="mb-6 text-center text-sm text-slate-300">
            Pick one comforting step right now, or connect to a real human immediately.
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            {supportOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedSupport(option.id)}
                className={
                  "rounded-2xl border px-4 py-4 text-left transition " +
                  (selectedSupport === option.id
                    ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                    : "border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-500")
                }
              >
                <p className="text-sm font-semibold">{option.label}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
            <p className="text-sm font-semibold text-white">
              {activeSupport.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {activeSupport.text}
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() =>
                handleTalkToPerson(
                  "919152987821",
                  "Hi, I am in crisis and need support from a real human right now.",
                )
              }
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Connect me to a real human now
            </button>
            <button
              type="button"
              onClick={() =>
                handleTalkToPerson(
                  "919152987821",
                  "Hi, I need urgent mental health support.",
                )
              }
              className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Open urgent support chat
            </button>
            <a
              href="tel:9152987821"
              className="w-full rounded-xl border border-slate-600 bg-transparent px-4 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Call iCall India: 9152987821
            </a>
            <button
              type="button"
              onClick={handleSafe}
              className="w-full rounded-xl border border-slate-600 bg-transparent px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              I just needed to vent - I'm safe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm">
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/90 p-4 text-center shadow-lg backdrop-blur-sm">
        <div className="mb-2 text-2xl">[Care]</div>
        <p className="mb-4 text-sm text-purple-200">
          Would you like to talk to someone?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTalkToPerson("919152987821")}
            className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
          >
            Talk to a Real Person
          </button>
          <button
            type="button"
            onClick={handleSafe}
            className="flex-1 rounded-lg border border-purple-500 bg-transparent px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900"
          >
            I'm okay, continue
          </button>
        </div>
      </div>
    </div>
  );
}

window.SupportSuggestion = SupportSuggestion;
