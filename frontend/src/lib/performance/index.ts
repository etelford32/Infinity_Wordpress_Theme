// Performance Monitor
export {
  performanceMonitor,
  useRenderTime,
  withPerformanceTracking,
  formatBytes,
  formatDuration,
  getPerformanceGrade,
  type PerformanceMetrics,
  type PerformanceEntry,
} from './PerformanceMonitor';

// Configuration
export {
  initPerformanceConfig,
  getPerformanceConfig,
  getDeviceCapabilities,
  detectDeviceCapabilities,
  type PerformanceConfig,
  type DeviceCapabilities,
  type QualityLevel,
} from './config';

// Asset Preloader
export {
  assetPreloader,
  usePrefetchOnHover,
  preloadPageAssets,
} from './AssetPreloader';

// Service Worker
export {
  serviceWorkerManager,
  useServiceWorker,
  initServiceWorker,
} from './ServiceWorkerManager';

// Three.js Optimizations
export {
  LODManager,
  ObjectPool,
  AdaptiveQualityManager,
  FrustumCuller,
  TextureManager,
  lodManager,
  adaptiveQuality,
  frustumCuller,
  textureManager,
} from './ThreeOptimizer';

// Mobile Optimizations
export {
  TouchOptimizer,
  NetworkAwareLoader,
  BatteryOptimizer,
  ReducedMotionHandler,
  ViewportManager,
  touchOptimizer,
  networkLoader,
  batteryOptimizer,
  reducedMotionHandler,
  viewportManager,
  initMobileOptimizations,
  useResponsive,
  useNetworkAware,
} from './MobileOptimizer';

/**
 * Initialize all performance optimizations
 * Call this early in your app lifecycle (e.g., in main.tsx)
 */
export async function initPerformanceOptimizations(): Promise<void> {
  const { initPerformanceConfig } = await import('./config');
  const { assetPreloader } = await import('./AssetPreloader');
  const { initServiceWorker } = await import('./ServiceWorkerManager');
  const { initMobileOptimizations } = await import('./MobileOptimizer');
  const { performanceMonitor } = await import('./PerformanceMonitor');

  // Initialize config
  const config = initPerformanceConfig();

  // Start performance monitoring
  performanceMonitor.start();

  // Initialize asset preloader
  assetPreloader.init();

  // Register service worker
  if (config.serviceWorker.enabled) {
    await initServiceWorker();
  }

  // Initialize mobile optimizations
  await initMobileOptimizations();

  console.log('[Performance] All optimizations initialized');
}
