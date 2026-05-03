const AboutPage = ({ onBack }) => {
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
        <h1 className="text-5xl font-display font-bold mb-8">About Saathi AI</h1>
        
        <div className="space-y-12 text-lg text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p>
              Saathi (meaning "Companion") was built with a single goal: to create an AI that doesn't just process information, but understands humans. In a world of cold, mechanical chatbots, Saathi brings warmth, empathy, and emotional intelligence.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Multimodal Intelligence</h3>
              <p className="text-sm">
                Saathi uses advanced vision and audio processing to detect your emotional state in real-time, adjusting its tone and responses to match your needs.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Absolute Privacy</h3>
              <p className="text-sm">
                Your conversations are yours. Saathi features a hard-wired Privacy Shield that ensures sensitive data never leaves your device without your explicit consent.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">The Team</h2>
            <p>
              Developed by a global team of AI researchers and psychologists, Saathi represents the cutting edge of Empathetic Artificial Intelligence.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

window.AboutPage = AboutPage;
