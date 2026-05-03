const { RESPONSE_LIBRARY } = window.responseLibrary || {};

const usedIndices = {}; // tracks last used index per intent

function getResponse(intent, emotion) {
  if (!RESPONSE_LIBRARY) return "I'm here to help.";
  const emotionKey = emotion || 'calm';
  const intentData = RESPONSE_LIBRARY[intent] || RESPONSE_LIBRARY.general;
  const variants = intentData[emotionKey] || intentData.calm || RESPONSE_LIBRARY.general.calm;
  
  const key = `${intent}_${emotionKey}`;
  const lastIndex = usedIndices[key] ?? -1;
  
  // Generate all indices except the last used one
  const available = variants
    .map((_, i) => i)
    .filter(i => i !== lastIndex);
  
  // Pick randomly from available options
  const selectedIndex = available[Math.floor(Math.random() * available.length)];
  usedIndices[key] = selectedIndex;
  
  return variants[selectedIndex];
}

window.responseSelector = { getResponse };
