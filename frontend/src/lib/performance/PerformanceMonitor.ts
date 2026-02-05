/**
 * Performance Monitoring Utilities
 * Tracks and reports performance metrics for the application
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  resourceLoadTime: number | null;
  jsHeapSize: number | null;
  apiResponseTimes: Record<string, number[]>;
  renderTimes: number[];
  fps: number;
}

export interface PerformanceEntry {
  timestamp: number;
  metrics: Partial<PerformanceMetrics>;
  page: string;
  userAgent: string;
}

type MetricCallback = (metrics: Partial<PerformanceMetrics>) => void;

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    pageLoadTime: null,
    domContentLoaded: null,
    resourceLoadTime: null,
    jsHeapSize: null,
    apiResponseTimes: {},
    renderTimes: [],
    fps: 0,
  };

  private observers: PerformanceObserver[] = [];
  private callbacks: MetricCallback[] = [];
  private fpsFrames: number[] = [];
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isMonitoring: boolean = false;

  /**
   * Start monitoring performance metrics
   */
  start(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    this.observeWebVitals();
    this.observeNavigationTiming();
    this.startFPSMonitoring();
    this.observeMemory();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: MetricCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Track API response time
   */
  trackApiCall(endpoint: string, duration: number): void {
    if (!this.metrics.apiResponseTimes[endpoint]) {
      this.metrics.apiResponseTimes[endpoint] = [];
    }
    this.metrics.apiResponseTimes[endpoint].push(duration);

    // Keep only last 100 entries per endpoint
    if (this.metrics.apiResponseTimes[endpoint].length > 100) {
      this.metrics.apiResponseTimes[endpoint].shift();
    }

    this.notifyCallbacks({ apiResponseTimes: this.metrics.apiResponseTimes });
  }

  /**
   * Track render time
   */
  trackRenderTime(duration: number): void {
    this.metrics.renderTimes.push(duration);

    // Keep only last 100 entries
    if (this.metrics.renderTimes.length > 100) {
      this.metrics.renderTimes.shift();
    }

    this.notifyCallbacks({ renderTimes: this.metrics.renderTimes });
  }

  /**
   * Get average API response time for an endpoint
   */
  getAverageApiTime(endpoint: string): number {
    const times = this.metrics.apiResponseTimes[endpoint];
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * Get overall average API response time
   */
  getOverallAverageApiTime(): number {
    const allTimes = Object.values(this.metrics.apiResponseTimes).flat();
    if (allTimes.length === 0) return 0;
    return allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
  }

  /**
   * Get average render time
   */
  getAverageRenderTime(): number {
    if (this.metrics.renderTimes.length === 0) return 0;
    return (
      this.metrics.renderTimes.reduce((a, b) => a + b, 0) /
      this.metrics.renderTimes.length
    );
  }

  /**
   * Create a performance entry for logging/analytics
   */
  createEntry(): PerformanceEntry {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    };
  }

  // Private methods

  private observeWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry?.startTime ?? null;
          this.notifyCallbacks({ lcp: this.metrics.lcp });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch {
        // LCP not supported
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0] as any;
          this.metrics.fid = firstEntry ? firstEntry.processingStart - firstEntry.startTime : null;
          this.notifyCallbacks({ fid: this.metrics.fid });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch {
        // FID not supported
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cls = clsValue;
          this.notifyCallbacks({ cls: this.metrics.cls });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch {
        // CLS not supported
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntriesByName('first-contentful-paint');
          if (entries.length > 0) {
            this.metrics.fcp = entries[0].startTime;
            this.notifyCallbacks({ fcp: this.metrics.fcp });
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        this.observers.push(fcpObserver);
      } catch {
        // FCP not supported
      }
    }
  }

  private observeNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Wait for page load to complete
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navEntries = performance.getEntriesByType(
            'navigation'
          ) as PerformanceNavigationTiming[];

          if (navEntries.length > 0) {
            const nav = navEntries[0];
            this.metrics.ttfb = nav.responseStart - nav.requestStart;
            this.metrics.domContentLoaded =
              nav.domContentLoadedEventEnd - nav.fetchStart;
            this.metrics.pageLoadTime = nav.loadEventEnd - nav.fetchStart;

            this.notifyCallbacks({
              ttfb: this.metrics.ttfb,
              domContentLoaded: this.metrics.domContentLoaded,
              pageLoadTime: this.metrics.pageLoadTime,
            });
          }

          // Resource timing
          const resourceEntries = performance.getEntriesByType('resource');
          if (resourceEntries.length > 0) {
            const totalResourceTime = resourceEntries.reduce(
              (total, entry) => total + entry.duration,
              0
            );
            this.metrics.resourceLoadTime = totalResourceTime;
            this.notifyCallbacks({ resourceLoadTime: this.metrics.resourceLoadTime });
          }
        }, 0);
      });
    }
  }

  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (!this.isMonitoring) return;

      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        this.fpsFrames.push(1000 / delta);

        // Calculate FPS every second
        if (this.fpsFrames.length >= 60) {
          this.metrics.fps = Math.round(
            this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length
          );
          this.fpsFrames = [];
          this.notifyCallbacks({ fps: this.metrics.fps });
        }
      }

      this.lastFrameTime = timestamp;
      this.animationFrameId = requestAnimationFrame(measureFPS);
    };

    this.animationFrameId = requestAnimationFrame(measureFPS);
  }

  private observeMemory(): void {
    // Check memory usage periodically (Chrome only)
    if ('memory' in performance) {
      const checkMemory = () => {
        if (!this.isMonitoring) return;

        const memory = (performance as any).memory;
        this.metrics.jsHeapSize = memory?.usedJSHeapSize ?? null;
        this.notifyCallbacks({ jsHeapSize: this.metrics.jsHeapSize });

        setTimeout(checkMemory, 5000);
      };
      checkMemory();
    }
  }

  private notifyCallbacks(metrics: Partial<PerformanceMetrics>): void {
    this.callbacks.forEach((callback) => callback(metrics));
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for tracking component render time
 */
export function useRenderTime(_componentName: string): void {
  const startTime = performance.now();

  // Use useEffect to measure after render
  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackRenderTime(duration);
    });
  }
}

/**
 * Higher-order function to track API call duration
 */
export function withPerformanceTracking<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  return apiCall().finally(() => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackApiCall(endpoint, duration);
  });
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get performance grade based on Core Web Vitals
 */
export function getPerformanceGrade(metrics: PerformanceMetrics): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
} {
  let score = 100;

  // LCP scoring (good < 2.5s, needs improvement < 4s, poor > 4s)
  if (metrics.lcp !== null) {
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= 10;
  }

  // FID scoring (good < 100ms, needs improvement < 300ms, poor > 300ms)
  if (metrics.fid !== null) {
    if (metrics.fid > 300) score -= 25;
    else if (metrics.fid > 100) score -= 10;
  }

  // CLS scoring (good < 0.1, needs improvement < 0.25, poor > 0.25)
  if (metrics.cls !== null) {
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 10;
  }

  // FPS scoring
  if (metrics.fps < 30) score -= 15;
  else if (metrics.fps < 50) score -= 5;

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { grade, score: Math.max(0, score) };
}
