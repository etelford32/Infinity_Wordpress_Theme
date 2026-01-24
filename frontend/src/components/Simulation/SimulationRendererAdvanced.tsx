import { useRef, useEffect, useState } from 'react';
import { useThreeScene } from '@hooks/useThreeScene';
import { useSimulation } from '@hooks/useSimulation';
import { useCameraControls } from '@hooks/useCameraControls';
import { SimulationControls } from './SimulationControls';
import { SimulationStats } from './SimulationStats';
import { CameraModeSelector } from './CameraModeSelector';
import { BaseSimulationConfig } from '@lib/simulation';
import { CameraMode, CameraControllerConfig } from '@lib/camera';

interface SimulationRendererAdvancedProps {
  simulationId: string;
  config: BaseSimulationConfig;
  cameraConfig?: CameraControllerConfig;
  showControls?: boolean;
  showStats?: boolean;
  showCameraModeSelector?: boolean;
  autoStart?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * Advanced simulation renderer with free-fly camera controls
 */
export function SimulationRendererAdvanced({
  simulationId,
  config,
  cameraConfig = {},
  showControls = true,
  showStats = true,
  showCameraModeSelector = true,
  autoStart = true,
  className = '',
  onError,
}: SimulationRendererAdvancedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bodyCount, setBodyCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Initialize Three.js scene (without OrbitControls)
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
    enableControls: false, // We'll use our custom controller
    backgroundColor: config.scene.background,
    enableShadows: config.performance?.enableShadows,
  });

  // Initialize camera controls
  const {
    mode: cameraMode,
    isPointerLocked,
    update: updateCamera,
    setMode: setCameraMode,
    requestPointerLock,
    exitPointerLock,
  } = useCameraControls({
    camera,
    domElement: canvasRef.current,
    initialConfig: {
      mode: CameraMode.FREE_FLY,
      moveSpeed: 50,
      lookSpeed: 0.002,
      boostMultiplier: 3,
      damping: 0.9,
      ...cameraConfig,
    },
    enabled: sceneReady,
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

    startRenderLoop((deltaTime) => {
      incrementFrame();

      // Update camera controls
      updateCamera(deltaTime);

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
  }, [sceneReady, scene, camera, renderer, simulation, incrementFrame, updateCamera, startRenderLoop, stopRenderLoop]);

  // Keyboard controls for simulation (not camera)
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

        case 'escape':
          // Exit pointer lock
          if (isPointerLocked) {
            exitPointerLock();
          }
          break;

        case 'c':
          // Toggle camera mode
          event.preventDefault();
          setCameraMode(
            cameraMode === CameraMode.FREE_FLY ? CameraMode.ORBIT : CameraMode.FREE_FLY
          );
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, pause, resume, reset, isPointerLocked, exitPointerLock, cameraMode, setCameraMode]);

  // Handle pointer lock toggle
  const handlePointerLockToggle = () => {
    if (isPointerLocked) {
      exitPointerLock();
    } else {
      requestPointerLock();
    }
  };

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

      {/* Camera Mode Selector */}
      {showCameraModeSelector && (
        <div className="absolute top-4 right-4 w-64">
          <CameraModeSelector
            currentMode={cameraMode}
            onModeChange={setCameraMode}
            isPointerLocked={isPointerLocked}
            onPointerLockToggle={handlePointerLockToggle}
            disabled={!simulation}
          />
        </div>
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
        {`, Camera mode: ${cameraMode}`}
      </div>

      {/* Keyboard controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-[var(--text-tertiary)] bg-black/40 backdrop-blur-sm px-3 py-2 rounded max-w-xs">
        <div className="font-semibold mb-1">Controls:</div>
        <div className="space-y-0.5">
          {cameraMode === CameraMode.FREE_FLY ? (
            <>
              <div>• WASD / Arrows: Move camera</div>
              <div>• Q/E: Down/Up</div>
              <div>• Shift: Boost speed</div>
              <div>• Mouse: Look around (click to lock)</div>
              <div>• Scroll: Adjust move speed</div>
            </>
          ) : (
            <>
              <div>• Mouse drag: Rotate view</div>
              <div>• Scroll: Zoom in/out</div>
            </>
          )}
          <div className="border-t border-white/20 my-1 pt-1">
            <div>• Space: Play/Pause</div>
            <div>• R: Reset • C: Toggle camera</div>
            <div>• ESC: Unlock mouse</div>
          </div>
        </div>
      </div>
    </div>
  );
}
