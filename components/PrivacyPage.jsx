const PrivacyPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white p-8 md:p-16 animate-riseFade">
      <button 
        onClick={onBack}
        className="mb-12 flex items-center space-x-2 text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-display font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-12 text-lg text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Data, Your Control</h2>
            <p>
              At Saathi AI, we believe privacy is a fundamental human right. Our privacy architecture is designed from the ground up to ensure your data stays local whenever possible.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Key Protections</h2>
            <ul className="list-disc pl-6 space-y-4">
              <li>
                <strong className="text-emerald-400">Local Processing:</strong> Emotion detection and basic voice commands are processed directly in your browser.
              </li>
              <li>
                <strong className="text-emerald-400">Privacy Shield:</strong> Our hard-coded privacy engine detects sensitive information (like passwords or IDs) and prevents them from being sent to any server.
              </li>
              <li>
                <strong className="text-emerald-400">No Tracking:</strong> We do not use cookies or tracking pixels to follow you across the web.
              </li>
              <li>
                <strong className="text-emerald-400">Encryption:</strong> Any data that must be sent for AI processing is encrypted with AES-256 standards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p>
              If you have questions about our privacy practices, you can contact our security team at privacy@saathi.ai.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

window.PrivacyPage = PrivacyPage;
