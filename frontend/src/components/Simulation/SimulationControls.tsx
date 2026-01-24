import { SimulationState } from '@lib/simulation';
import { FaPlay, FaPause, FaStop, FaRedo, FaFastForward, FaFastBackward } from 'react-icons/fa';

interface SimulationControlsProps {
  state: SimulationState;
  timeScale: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onTimeScaleChange: (scale: number) => void;
  disabled?: boolean;
}

export function SimulationControls({
  state,
  timeScale,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onTimeScaleChange,
  disabled = false,
}: SimulationControlsProps) {
  const isRunning = state === SimulationState.RUNNING;
  const isPaused = state === SimulationState.PAUSED;
  const isReady = state === SimulationState.READY;

  const timeScales = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--bg-tertiary)]">
      {/* Play/Pause/Stop Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        {!isRunning ? (
          <button
            onClick={isPaused ? onResume : onStart}
            disabled={disabled || (!isReady && !isPaused)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={isPaused ? 'Resume' : 'Start'}
          >
            <FaPlay className="w-4 h-4" />
            <span>{isPaused ? 'Resume' : 'Start'}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Pause"
          >
            <FaPause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        )}

        {/* Stop Button */}
        <button
          onClick={onStop}
          disabled={disabled || (!isRunning && !isPaused)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Stop"
        >
          <FaStop className="w-4 h-4" />
          <span>Stop</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Reset"
        >
          <FaRedo className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Time Scale Controls */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Time Scale: {timeScale}x
        </label>

        <div className="flex items-center gap-2">
          {/* Slower Button */}
          <button
            onClick={() => {
              const currentIndex = timeScales.findIndex((ts) => ts.value === timeScale);
              if (currentIndex > 0) {
                onTimeScaleChange(timeScales[currentIndex - 1].value);
              }
            }}
            disabled={disabled || timeScale <= timeScales[0].value}
            className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Decrease speed"
          >
            <FaFastBackward className="w-4 h-4" />
          </button>

          {/* Time Scale Buttons */}
          <div className="flex gap-1 flex-1">
            {timeScales.map((ts) => (
              <button
                key={ts.value}
                onClick={() => onTimeScaleChange(ts.value)}
                disabled={disabled}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  timeScale === ts.value
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:opacity-80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {ts.label}
              </button>
            ))}
          </div>

          {/* Faster Button */}
          <button
            onClick={() => {
              const currentIndex = timeScales.findIndex((ts) => ts.value === timeScale);
              if (currentIndex < timeScales.length - 1) {
                onTimeScaleChange(timeScales[currentIndex + 1].value);
              }
            }}
            disabled={disabled || timeScale >= timeScales[timeScales.length - 1].value}
            className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Increase speed"
          >
            <FaFastForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* State Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning
              ? 'bg-green-500 animate-pulse'
              : isPaused
              ? 'bg-yellow-500'
              : isReady
              ? 'bg-blue-500'
              : 'bg-gray-500'
          }`}
        />
        <span className="text-[var(--text-tertiary)]">
          {isRunning
            ? 'Running'
            : isPaused
            ? 'Paused'
            : isReady
            ? 'Ready'
            : state}
        </span>
      </div>
    </div>
  );
}
