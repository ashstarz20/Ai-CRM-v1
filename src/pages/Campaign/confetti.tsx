import { useEffect } from "react";
import confetti from "canvas-confetti";

const ConfettiAnimation = () => {
  useEffect(() => {
    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });

      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // ✅ Type-safe cleanup
    return () => {
      confetti.reset(); // just call, don't return
    };
  }, []);

  return null;
};

export default ConfettiAnimation;
