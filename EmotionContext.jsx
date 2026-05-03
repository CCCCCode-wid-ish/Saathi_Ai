const { useCallback, useState } = React;

const emotionEngine = window.emotionEngine || {};
const detectEmotionFromText =
  emotionEngine.detectEmotionFromText ||
  (() => ({ emotion: "calm", confidence: 0.6 }));
const detectEmotionFromTextEnhanced =
  emotionEngine.detectEmotionFromTextEnhanced ||
  (async () => ({ emotion: "calm", confidence: 0.6 }));
const resolveEmotion =
  emotionEngine.resolveEmotion ||
  ((detection, history) => ({
    emotion: detection.emotion || "calm",
    history: [...history.slice(-2), detection],
  }));

function EmotionProvider({ children }) {
  return <>{children}</>;
}

function useEmotion() {
  const [currentEmotion, setCurrentEmotion] = useState("calm");
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isCrisis, setIsCrisis] = useState(false);

  const processText = useCallback(
    async (text, useHuggingFace = false) => {
      let detection;

      if (useHuggingFace) {
        detection = await detectEmotionFromTextEnhanced(text, true);
      } else {
        detection = detectEmotionFromText(text);
      }

      if (detection.emotion === "crisis") {
        setIsCrisis(true);
        setCurrentEmotion("sad");
        return;
      }

      setIsCrisis(false);
      const resolved = resolveEmotion(detection, emotionHistory);
      setCurrentEmotion(resolved.emotion || "calm");
      setEmotionHistory(resolved.history || []);
    },
    [emotionHistory],
  );

  return { currentEmotion, isCrisis, processText };
}

window.EmotionContext = {
  EmotionProvider,
  useEmotion,
};
