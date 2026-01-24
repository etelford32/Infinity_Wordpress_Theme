import { CameraMode } from '@lib/camera';
import { FaEye, FaCircle, FaUserAlt, FaVideo } from 'react-icons/fa';

interface CameraModeSelectorProps {
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
  isPointerLocked?: boolean;
  onPointerLockToggle?: () => void;
  disabled?: boolean;
}

const modeConfig = {
  [CameraMode.FREE_FLY]: {
    icon: FaEye,
    label: 'Free Fly',
    description: 'Fly freely in any direction',
    color: 'text-blue-400',
  },
  [CameraMode.ORBIT]: {
    icon: FaCircle,
    label: 'Orbit',
    description: 'Orbit around target',
    color: 'text-purple-400',
  },
  [CameraMode.FOLLOW]: {
    icon: FaUserAlt,
    label: 'Follow',
    description: 'Follow target from behind',
    color: 'text-green-400',
  },
  [CameraMode.CINEMATIC]: {
    icon: FaVideo,
    label: 'Cinematic',
    description: 'Scripted camera path',
    color: 'text-orange-400',
  },
};

export function CameraModeSelector({
  currentMode,
  onModeChange,
  isPointerLocked = false,
  onPointerLockToggle,
  disabled = false,
}: CameraModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--bg-tertiary)]">
      {/* Camera Mode Label */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Camera Mode
        </label>

        {/* Pointer Lock Indicator (Free Fly mode only) */}
        {currentMode === CameraMode.FREE_FLY && onPointerLockToggle && (
          <button
            onClick={onPointerLockToggle}
            disabled={disabled}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isPointerLocked
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:opacity-80'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isPointerLocked ? 'Mouse locked (ESC to unlock)' : 'Click to lock mouse'}
          >
            {isPointerLocked ? '🔒 Locked' : '🔓 Unlocked'}
          </button>
        )}
      </div>

      {/* Mode Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(modeConfig).map(([mode, config]) => {
          const Icon = config.icon;
          const isActive = currentMode === mode;
          const isDisabled = disabled || mode === CameraMode.CINEMATIC; // Cinematic not implemented yet

          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode as CameraMode)}
              disabled={isDisabled}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-white shadow-glow-md'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:opacity-80'
              } ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
              title={config.description}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : config.color}`} />
              <span className="text-xs font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Description */}
      <div className="mt-2 p-2 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-tertiary)]">
        <div className="font-semibold mb-1">{modeConfig[currentMode].label}</div>
        <div>{modeConfig[currentMode].description}</div>

        {/* Mode-specific controls hint */}
        {currentMode === CameraMode.FREE_FLY && (
          <div className="mt-2 space-y-1">
            <div>• WASD / Arrows: Move</div>
            <div>• Q/E: Down/Up</div>
            <div>• Shift: Boost speed</div>
            <div>• Mouse: Look around</div>
            <div>• Scroll: Adjust speed</div>
          </div>
        )}

        {currentMode === CameraMode.ORBIT && (
          <div className="mt-2 space-y-1">
            <div>• Mouse drag: Rotate</div>
            <div>• Scroll: Zoom in/out</div>
          </div>
        )}
      </div>
    </div>
  );
}
