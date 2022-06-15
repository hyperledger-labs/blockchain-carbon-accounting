import { useCallback, useEffect, useState } from 'react';

const useTimer = (timerInSeconds: number): [number, boolean, ()=>void] => {

  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(timerInSeconds);

  useEffect(() => {
    if (started) {
      if (time <= 0) {
        setStarted(false);
      } else {
        const interval = setTimeout(() => {
          setTime((time)=>time - 1);
        }, 1000);

        return () => clearTimeout(interval);
      }
    }
  }, [started, time, timerInSeconds]);

  const start = useCallback(() => {
    setTime(timerInSeconds);
    setStarted(true);
  }, [timerInSeconds]);

  return [time, started, start];
};

export { useTimer };
