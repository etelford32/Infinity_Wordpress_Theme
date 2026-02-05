import { useState, useEffect, memo } from 'react';
import {
  FaChartLine,
  FaTachometerAlt,
  FaClock,
  FaMemory,
  FaServer,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  performanceMonitor,
  PerformanceMetrics as Metrics,
  formatBytes,
  formatDuration,
  getPerformanceGrade,
} from '@lib/performance/PerformanceMonitor';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'bad';
}

const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon,
  status,
}: MetricCardProps) {
  const statusColors = {
    good: 'text-green-500',
    warning: 'text-yellow-500',
    bad: 'text-red-500',
  };

  return (
    <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--text-tertiary)] text-sm">{title}</span>
        <span className={status ? statusColors[status] : 'text-[var(--accent-primary)]'}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      {subtitle && (
        <div className="text-xs text-[var(--text-tertiary)] mt-1">{subtitle}</div>
      )}
    </div>
  );
});

interface PerformanceMetricsProps {
  refreshInterval?: number;
}

export function PerformanceMetrics({ refreshInterval = 2000 }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>(performanceMonitor.getMetrics());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Start monitoring if not already started
    performanceMonitor.start();

    // Subscribe to updates
    const unsubscribe = performanceMonitor.subscribe((updatedMetrics) => {
      setMetrics((prev) => ({ ...prev, ...updatedMetrics }));
    });

    // Periodic refresh
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, refreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const { grade, score } = getPerformanceGrade(metrics);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-500 bg-green-500/20';
      case 'B':
        return 'text-blue-500 bg-blue-500/20';
      case 'C':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'D':
        return 'text-orange-500 bg-orange-500/20';
      default:
        return 'text-red-500 bg-red-500/20';
    }
  };

  const getLcpStatus = (lcp: number | null): 'good' | 'warning' | 'bad' => {
    if (lcp === null) return 'good';
    if (lcp <= 2500) return 'good';
    if (lcp <= 4000) return 'warning';
    return 'bad';
  };

  const getFidStatus = (fid: number | null): 'good' | 'warning' | 'bad' => {
    if (fid === null) return 'good';
    if (fid <= 100) return 'good';
    if (fid <= 300) return 'warning';
    return 'bad';
  };

  const getClsStatus = (cls: number | null): 'good' | 'warning' | 'bad' => {
    if (cls === null) return 'good';
    if (cls <= 0.1) return 'good';
    if (cls <= 0.25) return 'warning';
    return 'bad';
  };

  const getFpsStatus = (fps: number): 'good' | 'warning' | 'bad' => {
    if (fps >= 55) return 'good';
    if (fps >= 30) return 'warning';
    return 'bad';
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <FaTachometerAlt className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Performance Metrics
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Grade:</span>
            <span
              className={`px-3 py-1 rounded-full font-bold text-lg ${getGradeColor(grade)}`}
            >
              {grade}
            </span>
          </div>
          <div className="text-sm text-[var(--text-tertiary)]">Score: {score}/100</div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[var(--bg-tertiary)]">
        <MetricCard
          title="FPS"
          value={metrics.fps}
          subtitle="Frames per second"
          icon={<FaChartLine className="w-4 h-4" />}
          status={getFpsStatus(metrics.fps)}
        />
        <MetricCard
          title="LCP"
          value={metrics.lcp !== null ? formatDuration(metrics.lcp) : 'N/A'}
          subtitle="Largest Contentful Paint"
          icon={<FaClock className="w-4 h-4" />}
          status={getLcpStatus(metrics.lcp)}
        />
        <MetricCard
          title="FID"
          value={metrics.fid !== null ? formatDuration(metrics.fid) : 'N/A'}
          subtitle="First Input Delay"
          icon={<FaClock className="w-4 h-4" />}
          status={getFidStatus(metrics.fid)}
        />
        <MetricCard
          title="CLS"
          value={metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'}
          subtitle="Cumulative Layout Shift"
          icon={<FaExclamationTriangle className="w-4 h-4" />}
          status={getClsStatus(metrics.cls)}
        />
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t border-[var(--bg-tertiary)] space-y-4">
          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="TTFB"
              value={metrics.ttfb !== null ? formatDuration(metrics.ttfb) : 'N/A'}
              subtitle="Time to First Byte"
              icon={<FaServer className="w-4 h-4" />}
            />
            <MetricCard
              title="FCP"
              value={metrics.fcp !== null ? formatDuration(metrics.fcp) : 'N/A'}
              subtitle="First Contentful Paint"
              icon={<FaClock className="w-4 h-4" />}
            />
            <MetricCard
              title="Page Load"
              value={
                metrics.pageLoadTime !== null
                  ? formatDuration(metrics.pageLoadTime)
                  : 'N/A'
              }
              subtitle="Total page load time"
              icon={<FaChartLine className="w-4 h-4" />}
            />
            <MetricCard
              title="Memory"
              value={
                metrics.jsHeapSize !== null ? formatBytes(metrics.jsHeapSize) : 'N/A'
              }
              subtitle="JS Heap Size"
              icon={<FaMemory className="w-4 h-4" />}
            />
          </div>

          {/* API Response Times */}
          {Object.keys(metrics.apiResponseTimes).length > 0 && (
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                API Response Times
              </h4>
              <div className="space-y-2">
                {Object.entries(metrics.apiResponseTimes).map(([endpoint, times]) => {
                  const avg = times.reduce((a, b) => a + b, 0) / times.length;
                  const status: 'good' | 'warning' | 'bad' =
                    avg < 200 ? 'good' : avg < 500 ? 'warning' : 'bad';
                  const statusIcon =
                    status === 'good' ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : status === 'warning' ? (
                      <FaExclamationTriangle className="text-yellow-500" />
                    ) : (
                      <FaExclamationTriangle className="text-red-500" />
                    );

                  return (
                    <div
                      key={endpoint}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[var(--text-secondary)] truncate max-w-[200px]">
                        {endpoint}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] font-mono">
                          {formatDuration(avg)}
                        </span>
                        {statusIcon}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Performance Tips
            </h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {metrics.lcp !== null && metrics.lcp > 2500 && (
                <li className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>
                    LCP is above 2.5s. Consider optimizing images and reducing render-blocking
                    resources.
                  </span>
                </li>
              )}
              {metrics.cls !== null && metrics.cls > 0.1 && (
                <li className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>
                    CLS is above 0.1. Add explicit dimensions to images and avoid inserting
                    content above existing content.
                  </span>
                </li>
              )}
              {metrics.fps < 50 && (
                <li className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>
                    FPS is below 50. Consider reducing DOM complexity or optimizing
                    animations.
                  </span>
                </li>
              )}
              {grade === 'A' && (
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Great performance! All metrics are within optimal ranges.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMetrics;
