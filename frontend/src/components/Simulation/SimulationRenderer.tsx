import { useRef, useEffect, useState } from 'react';
import { useThreeScene } from '@hooks/useThreeScene';
import { useSimulation } from '@hooks/useSimulation';
import { SimulationControls } from './SimulationControls';
import { SimulationStats } from './SimulationStats';
import { BaseSimulationConfig } from '@lib/simulation';

interface SimulationRendererProps {
  simulationId: string;
  config: BaseSimulationConfig;
  showControls?: boolean;
  showStats?: boolean;
  autoStart?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * Main component for rendering and controlling simulations
 */
export function SimulationRenderer({
  simulationId,
  config,
  showControls = true,
  showStats = true,
  autoStart = true,
  className = '',
  onError,
}: SimulationRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bodyCount, setBodyCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Initialize Three.js scene
  const {
    scene,
    camera,
    renderer,
    isReady: sceneReady,
    error: sceneError,
    startRenderLoop,
    stopRenderLoop,
  } = useThreeScene(canvasRef, {
    cameraPosition: config.scene.cameraPosition,
    cameraFov: 75,
    enableControls: true,
    backgroundColor: config.scene.background,
    enableShadows: config.performance?.enableShadows,
  });

  // Initialize simulation
  const {
    simulation,
    state,
    isLoading,
    error: simError,
    fps,
    timeScale,
    incrementFrame,
    start,
    pause,
    resume,
    stop,
    reset,
    setTimeScale,
    isRunning,
  } = useSimulation({
    simulationId,
    config,
    scene,
    camera,
    autoStart,
  });

  // Combined error
  const error = sceneError || simError;

  // Report error to parent
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Start render loop when scene is ready
  useEffect(() => {
    if (!sceneReady || !scene || !camera || !renderer) return;

    startRenderLoop((_deltaTime) => {
      incrementFrame();

      // Update simulation-specific data
      if (simulation) {
        const timeControl = simulation.getTimeControl();
        setTotalTime(timeControl.totalTime);
        setBodyCount(simulation.getBodies().length);
      }
    });

    return () => {
      stopRenderLoop();
    };
  }, [sceneReady, scene, camera, renderer, simulation, incrementFrame, startRenderLoop, stopRenderLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'spacebar':
          event.preventDefault();
          if (isRunning) {
            pause();
          } else {
            resume();
          }
          break;

        case 'r':
          event.preventDefault();
          reset();
          break;

        case 's':
          event.preventDefault();
          stop();
          break;

        case '1':
          event.preventDefault();
          setTimeScale(0.25);
          break;

        case '2':
          event.preventDefault();
          setTimeScale(0.5);
          break;

        case '3':
          event.preventDefault();
          setTimeScale(1);
          break;

        case '4':
          event.preventDefault();
          setTimeScale(2);
          break;

        case '5':
          event.preventDefault();
          setTimeScale(5);
          break;

        case '6':
          event.preventDefault();
          setTimeScale(10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, pause, resume, reset, stop, setTimeScale]);

  // Loading state
  if (isLoading || !sceneReady) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-center">
            <div className="spinner w-16 h-16 mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">
              Loading simulation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-center max-w-md p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-500 mb-2">
              Simulation Error
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        style={{ outline: 'none' }}
      />

      {/* Stats Overlay */}
      {showStats && (
        <SimulationStats
          fps={fps}
          bodyCount={bodyCount}
          totalTime={totalTime}
          timeScale={timeScale}
          showDetailed={false}
        />
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
          <SimulationControls
            state={state}
            timeScale={timeScale}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            onReset={reset}
            onTimeScaleChange={setTimeScale}
            disabled={!simulation}
          />
        </div>
      )}

      {/* Accessibility: Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isRunning ? 'Simulation running' : 'Simulation paused'}
        {`, ${bodyCount} bodies, ${fps} frames per second`}
      </div>

      {/* Keyboard controls hint */}
      <div className="absolute top-4 left-4 text-xs text-[var(--text-tertiary)] bg-black/40 backdrop-blur-sm px-3 py-2 rounded">
        <div className="font-semibold mb-1">Controls:</div>
        <div>• Mouse: Rotate view</div>
        <div>• Scroll: Zoom in/out</div>
        <div>• Space: Play/Pause</div>
        <div>• R: Reset • S: Stop</div>
        <div>• 1-6: Time scale</div>
      </div>
    </div>
  );
}
