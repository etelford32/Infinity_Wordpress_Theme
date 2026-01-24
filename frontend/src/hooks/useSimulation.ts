import { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  BaseSimulation,
  SimulationRegistry,
  SimulationState,
  SimulationEvent,
  BaseSimulationConfig,
} from '@lib/simulation';

interface UseSimulationOptions {
  simulationId: string;
  config: BaseSimulationConfig;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  autoStart?: boolean;
}

/**
 * Hook to manage simulation lifecycle
 */
export function useSimulation({
  simulationId,
  config,
  scene,
  camera,
  autoStart = true,
}: UseSimulationOptions) {
  const [simulation, setSimulation] = useState<BaseSimulation | null>(null);
  const [state, setState] = useState<SimulationState>(SimulationState.UNINITIALIZED);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeScale, setTimeScaleState] = useState(1);
  const [fps, setFps] = useState(0);

  // FPS tracking
  const [frameCount, setFrameCount] = useState(0);
  const [lastFpsUpdate, setLastFpsUpdate] = useState(performance.now());

  /**
   * Initialize simulation
   */
  useEffect(() => {
    if (!scene || !camera || !simulationId) return;

    let mounted = true;
    let sim: BaseSimulation | null = null;

    const initSimulation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(`[useSimulation] Initializing: ${simulationId}`);

        // Create simulation instance
        sim = await SimulationRegistry.create(
          simulationId,
          config,
          scene,
          camera
        );

        if (!mounted) {
          sim.dispose();
          return;
        }

        // Setup event listeners
        sim.on(SimulationEvent.INITIALIZED, () => {
          console.log(`[useSimulation] Initialized: ${simulationId}`);
          setState(sim!.getState());
        });

        sim.on(SimulationEvent.STARTED, () => {
          console.log(`[useSimulation] Started: ${simulationId}`);
          setState(sim!.getState());
        });

        sim.on(SimulationEvent.PAUSED, () => {
          console.log(`[useSimulation] Paused: ${simulationId}`);
          setState(sim!.getState());
        });

        sim.on(SimulationEvent.RESUMED, () => {
          console.log(`[useSimulation] Resumed: ${simulationId}`);
          setState(sim!.getState());
        });

        sim.on(SimulationEvent.STOPPED, () => {
          console.log(`[useSimulation] Stopped: ${simulationId}`);
          setState(sim!.getState());
        });

        sim.on(SimulationEvent.RESET, () => {
          console.log(`[useSimulation] Reset: ${simulationId}`);
          setState(sim!.getState());
        });

        sim.on(SimulationEvent.ERROR, (err) => {
          console.error(`[useSimulation] Error:`, err);
          setError(err);
        });

        setSimulation(sim);
        setState(sim.getState());

        // Auto-start if requested
        if (autoStart && sim.getState() === SimulationState.READY) {
          sim.start();
        }
      } catch (err) {
        console.error('[useSimulation] Initialization failed:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initSimulation();

    // Cleanup
    return () => {
      mounted = false;
      if (sim) {
        console.log(`[useSimulation] Disposing: ${simulationId}`);
        sim.dispose();
      }
    };
  }, [simulationId, scene, camera, autoStart]);

  /**
   * Update FPS counter
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastFpsUpdate;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        setFrameCount(0);
        setLastFpsUpdate(now);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [frameCount, lastFpsUpdate]);

  /**
   * Increment frame count
   */
  const incrementFrame = useCallback(() => {
    setFrameCount((prev) => prev + 1);
  }, []);

  /**
   * Start simulation
   */
  const start = useCallback(() => {
    if (simulation) {
      simulation.start();
    }
  }, [simulation]);

  /**
   * Pause simulation
   */
  const pause = useCallback(() => {
    if (simulation) {
      simulation.pause();
    }
  }, [simulation]);

  /**
   * Resume simulation
   */
  const resume = useCallback(() => {
    if (simulation) {
      simulation.resume();
    }
  }, [simulation]);

  /**
   * Stop simulation
   */
  const stop = useCallback(() => {
    if (simulation) {
      simulation.stop();
    }
  }, [simulation]);

  /**
   * Reset simulation
   */
  const reset = useCallback(() => {
    if (simulation) {
      simulation.reset();
    }
  }, [simulation]);

  /**
   * Set time scale
   */
  const setTimeScale = useCallback(
    (scale: number) => {
      if (simulation) {
        simulation.setTimeScale(scale);
        setTimeScaleState(scale);
      }
    },
    [simulation]
  );

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (!simulation) return;

    if (state === SimulationState.RUNNING) {
      pause();
    } else if (state === SimulationState.PAUSED) {
      resume();
    } else if (state === SimulationState.READY) {
      start();
    }
  }, [simulation, state, pause, resume, start]);

  return {
    simulation,
    state,
    isLoading,
    error,
    fps,
    timeScale,
    incrementFrame,
    start,
    pause,
    resume,
    stop,
    reset,
    setTimeScale,
    togglePlayPause,
    isRunning: state === SimulationState.RUNNING,
    isPaused: state === SimulationState.PAUSED,
    isReady: state === SimulationState.READY,
  };
}
