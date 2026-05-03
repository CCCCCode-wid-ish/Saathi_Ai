function StopButton({ isSpeaking, onStop }) {
  if (!isSpeaking) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onStop}
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/50 transition-all duration-150 hover:bg-red-500 active:scale-95 animate-bounce"
    >
      ⏹ Stop Saathi
    </button>
  );
}

window.StopButton = StopButton;
