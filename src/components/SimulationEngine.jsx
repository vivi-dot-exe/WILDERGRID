import { useEffect } from 'react';
import { useWorldStore, worldStore } from '../store/useWorldStore';

export default function SimulationEngine() {
  const { isSimulating, simSpeed } = useWorldStore();

  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = Math.max(200, 1000 / simSpeed);
    const timer = setInterval(() => {
      worldStore.tickSimulation();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simSpeed]);

  return null;
}
