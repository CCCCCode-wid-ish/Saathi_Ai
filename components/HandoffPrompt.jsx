function HandoffPrompt({ reason, onConnect, onContinue }) {
  const supportUrl =
    "https://api.whatsapp.com/send?phone=919152987821&text=Hi%2C%20I%20need%20help%20from%20a%20human%20support%20agent.";

  if (reason === "crisis") {
    return (
      <div className="handoff-prompt p-4 bg-red-100 rounded-lg shadow-md mt-2">
        <h3 className="text-red-800 font-semibold">
          You don't have to face this alone. 🤍
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          <a
            href="tel:9152987821"
            className="bg-white text-red-700 px-4 py-2 rounded text-center border border-red-200"
          >
            iCall: 9152987821
          </a>
          <a
            href="tel:18602662345"
            className="bg-white text-red-700 px-4 py-2 rounded text-center border border-red-200"
          >
            Vandrevala: 1860-2662-345
          </a>
          <button onClick={onContinue} className="text-sm text-gray-500 mt-2">
            I'm safe, continue
          </button>
        </div>
      </div>
    );
  }

  if (reason === "emotional") {
    return (
      <div className="handoff-prompt p-4 bg-blue-50 rounded-lg shadow-md mt-2">
        <h3 className="text-blue-800 font-semibold">
          Would you like to talk to a real person? 💙
        </h3>
        <p className="text-sm text-blue-600 mb-3">
          Sometimes a human touch helps more.
        </p>
        <div className="flex gap-2">
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onConnect?.()}
            className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Yes, connect me
          </a>
          <button
            onClick={onContinue}
            className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded text-sm"
          >
            I'm okay, continue
          </button>
        </div>
      </div>
    );
  }

  if (reason === "repeated") {
    return (
      <div className="handoff-prompt p-4 bg-gray-50 rounded-lg shadow-md mt-2">
        <h3 className="text-gray-800 font-semibold">
          I've tried a few times — want a human to take over? 👤
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          A real person might have a better answer for this.
        </p>
        <div className="flex gap-2">
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onConnect?.()}
            className="inline-flex items-center justify-center rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Connect me
          </a>
          <button
            onClick={onContinue}
            className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded text-sm"
          >
            Keep trying with Saathi
          </button>
        </div>
      </div>
    );
  }

  return null;
}

window.HandoffPrompt = HandoffPrompt;
