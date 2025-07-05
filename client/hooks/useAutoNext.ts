import { useEffect, useRef } from "react";

interface UseAutoNextOptions {
  enabled: boolean;
  delay: number; // in milliseconds
  onNext: () => void;
}

export const useAutoNext = ({ enabled, delay, onNext }: UseAutoNextOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (enabled && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        onNext();
        timeoutRef.current = null;
      }, delay);
    }
  };

  const stopTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    startTimer();
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return {
    startTimer,
    stopTimer,
    resetTimer,
    isRunning: timeoutRef.current !== null,
  };
};

export default useAutoNext;
