import { useEffect, useRef } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';

export default function SimulationEngine() {
  const { isSimulating } = useWorldStore();
  const requestRef = useRef();
  const lastTimeRef = useRef();
  const secondTimerRef = useRef(0);

  useEffect(() => {
    if (!isSimulating) return;

    const animate = (time) => {
      if (lastTimeRef.current !== undefined) {
        const delta = time - lastTimeRef.current;

        // 1. Update NPC movement every frame
        worldStore.updateEntities();

        // 2. Decrement weather timer every second
        secondTimerRef.current += delta;
        if (secondTimerRef.current >= 1000) {
          secondTimerRef.current = 0;
          worldStore.decrementWeatherTimer();
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSimulating]);

  return null;
}
