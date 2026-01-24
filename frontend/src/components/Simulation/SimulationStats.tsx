import { useState, useEffect } from 'react';

interface SimulationStatsProps {
  fps: number;
  bodyCount?: number;
  totalTime?: number;
  timeScale?: number;
  showDetailed?: boolean;
}

export function SimulationStats({
  fps,
  bodyCount = 0,
  totalTime = 0,
  timeScale = 1,
  showDetailed = false,
}: SimulationStatsProps) {
  const [isExpanded, setIsExpanded] = useState(showDetailed);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // FPS color based on performance
  const getFpsColor = (fps: number): string => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
      {/* Compact View */}
      <div
        className="px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-mono font-bold ${getFpsColor(fps)}`}>
              {fps}
            </div>
            <div className="text-xs text-gray-400">FPS</div>
          </div>

          {!isExpanded && (
            <div className="text-xs text-gray-400">
              {bodyCount} bodies • {timeScale}x
            </div>
          )}
        </div>
      </div>

      {/* Detailed View */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {/* Body Count */}
            <div className="text-gray-400">Bodies:</div>
            <div className="text-white font-mono text-right">{bodyCount}</div>

            {/* Time Scale */}
            <div className="text-gray-400">Speed:</div>
            <div className="text-white font-mono text-right">{timeScale}x</div>

            {/* Total Time */}
            <div className="text-gray-400">Time:</div>
            <div className="text-white font-mono text-right">
              {formatTime(totalTime)}
            </div>

            {/* Frame Time */}
            <div className="text-gray-400">Frame:</div>
            <div className="text-white font-mono text-right">
              {fps > 0 ? `${(1000 / fps).toFixed(1)}ms` : '-'}
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Performance</span>
              <span className={getFpsColor(fps)}>
                {fps >= 55 ? 'Excellent' : fps >= 30 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  fps >= 55
                    ? 'bg-green-500'
                    : fps >= 30
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
