const fs = require('fs');
const babel = require('@babel/standalone');
const path = require('path');

const files = [
  './constants/sourceUrls.js',
  './components/ConfidenceTag.jsx',
  './emotionEngine.js',
  './EmotionContext.jsx',
  './emotionTheme.js',
  './privacyEngine.js',
  './storageManager.js',
  './safetyEngine.js',
  './responseAdapter.js',
  './interruptEngine.js',
  './voiceAdapter.js',
  './SupportSuggestion.jsx',
  './PrivacyShield.jsx',
  './TransparencyPanel.jsx',
  './SafetyFlag.jsx',
  './personality.js',
  './responseLibrary.js',
  './responseSelector.js',
  './fillerSystem.js',
  './handoffEngine.js',
  './actionEngine.js',
  './components/ActionButtons.jsx',
  './components/HandoffPrompt.jsx',
  './voicePersonality.js',
  './StopButton.jsx',
  './app.jsx'
];

let hasError = false;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    babel.transform(code, {
      presets: ['react'],
      filename: file
    });
    console.log(`[OK] ${file}`);
  } catch (err) {
    console.error(`\n[ERROR] in ${file}:\n`);
    console.error(err.message);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All files parsed successfully!');
}
