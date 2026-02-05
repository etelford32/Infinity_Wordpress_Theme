/**
 * Performance Optimization System - Core Configuration
 * Centralized configuration for all performance optimizations
 */

export interface PerformanceConfig {
  // Image optimization
  images: {
    enableWebP: boolean;
    enableLazyLoading: boolean;
    enableBlurUp: boolean;
    placeholderColor: string;
    lazyLoadThreshold: string; // IntersectionObserver rootMargin
    quality: number; // 1-100
    breakpoints: number[]; // responsive image breakpoints
  };

  // Asset preloading
  preload: {
    criticalFonts: string[];
    criticalScripts: string[];
    preconnectOrigins: string[];
    prefetchRoutes: string[];
  };

  // Service Worker
  serviceWorker: {
    enabled: boolean;
    cacheVersion: string;
    staticCacheMaxAge: number; // seconds
    apiCacheMaxAge: number;
    offlineFallbackPage: string;
  };

  // Three.js optimizations
  threeJs: {
    enableLOD: boolean;
    lodDistances: [number, number, number]; // high, medium, low detail distances
    enableFrustumCulling: boolean;
    enableObjectPooling: boolean;
    maxPoolSize: number;
    textureQuality: 'high' | 'medium' | 'low' | 'auto';
    shadowQuality: 'high' | 'medium' | 'low' | 'off';
    antialias: boolean | 'auto';
    pixelRatio: number | 'auto';
  };

  // Mobile optimizations
  mobile: {
    reducedMotion: boolean | 'auto';
    touchOptimizations: boolean;
    reducedParticles: boolean;
    lowPowerMode: boolean | 'auto';
    networkAwareLoading: boolean;
  };

  // Adaptive quality
  adaptive: {
    enabled: boolean;
    targetFPS: number;
    minFPS: number;
    checkInterval: number; // ms
    qualityLevels: QualityLevel[];
  };
}

export interface QualityLevel {
  name: string;
  pixelRatio: number;
  shadowMapSize: number;
  particleCount: number;
  lodBias: number; // multiplier for LOD distances
  postProcessing: boolean;
}

// Device capability detection
export interface DeviceCapabilities {
  tier: 'low' | 'medium' | 'high';
  gpu: string | null;
  cores: number;
  memory: number | null; // GB
  connection: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  saveData: boolean;
  reducedMotion: boolean;
  touchDevice: boolean;
  webGL2: boolean;
  webGPU: boolean;
}

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  // Detect GPU tier (rough estimation)
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';
  let gpuName: string | null = null;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuName = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        // Simple GPU tier detection
        const gpuLower = gpuName?.toLowerCase() || '';
        if (gpuLower.includes('intel') && !gpuLower.includes('iris')) {
          gpuTier = 'low';
        } else if (gpuLower.includes('nvidia') || gpuLower.includes('amd') || gpuLower.includes('radeon')) {
          gpuTier = 'high';
        } else if (gpuLower.includes('apple') || gpuLower.includes('iris')) {
          gpuTier = 'medium';
        }
      }
    }
  } catch {
    // WebGL not available
  }

  // Check for mobile/low-end indicators
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  if (isMobile) {
    gpuTier = gpuTier === 'high' ? 'medium' : 'low';
  }

  return {
    tier: gpuTier,
    gpu: gpuName,
    cores: navigator.hardwareConcurrency || 4,
    memory: (nav.deviceMemory as number) || null,
    connection: conn?.effectiveType || 'unknown',
    saveData: conn?.saveData || false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    webGL2: !!document.createElement('canvas').getContext('webgl2'),
    webGPU: 'gpu' in navigator,
  };
}

/**
 * Get default performance config based on device capabilities
 */
export function getDefaultConfig(capabilities?: DeviceCapabilities): PerformanceConfig {
  const caps = capabilities || detectDeviceCapabilities();

  const isLowEnd = caps.tier === 'low' || caps.saveData || caps.connection === 'slow-2g';
  const isMedium = caps.tier === 'medium' || caps.connection === '3g';

  return {
    images: {
      enableWebP: true,
      enableLazyLoading: true,
      enableBlurUp: !isLowEnd,
      placeholderColor: '#1e2330',
      lazyLoadThreshold: isLowEnd ? '50px' : '200px',
      quality: isLowEnd ? 60 : isMedium ? 75 : 85,
      breakpoints: [320, 640, 768, 1024, 1280, 1920],
    },

    preload: {
      criticalFonts: [
        '/fonts/inter-var.woff2',
      ],
      criticalScripts: [],
      preconnectOrigins: [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
      prefetchRoutes: ['/simulations', '/blueprints'],
    },

    serviceWorker: {
      enabled: true,
      cacheVersion: 'v1',
      staticCacheMaxAge: 60 * 60 * 24 * 30, // 30 days
      apiCacheMaxAge: 60 * 5, // 5 minutes
      offlineFallbackPage: '/offline.html',
    },

    threeJs: {
      enableLOD: true,
      lodDistances: isLowEnd ? [50, 100, 200] : [100, 300, 600],
      enableFrustumCulling: true,
      enableObjectPooling: true,
      maxPoolSize: isLowEnd ? 50 : 200,
      textureQuality: isLowEnd ? 'low' : isMedium ? 'medium' : 'auto',
      shadowQuality: isLowEnd ? 'off' : isMedium ? 'low' : 'medium',
      antialias: isLowEnd ? false : 'auto',
      pixelRatio: isLowEnd ? 1 : 'auto',
    },

    mobile: {
      reducedMotion: caps.reducedMotion ? true : 'auto',
      touchOptimizations: caps.touchDevice,
      reducedParticles: isLowEnd,
      lowPowerMode: 'auto',
      networkAwareLoading: true,
    },

    adaptive: {
      enabled: true,
      targetFPS: 60,
      minFPS: 30,
      checkInterval: 1000,
      qualityLevels: [
        {
          name: 'ultra',
          pixelRatio: 2,
          shadowMapSize: 2048,
          particleCount: 10000,
          lodBias: 0.5,
          postProcessing: true,
        },
        {
          name: 'high',
          pixelRatio: 1.5,
          shadowMapSize: 1024,
          particleCount: 5000,
          lodBias: 1,
          postProcessing: true,
        },
        {
          name: 'medium',
          pixelRatio: 1,
          shadowMapSize: 512,
          particleCount: 2000,
          lodBias: 1.5,
          postProcessing: false,
        },
        {
          name: 'low',
          pixelRatio: 0.75,
          shadowMapSize: 256,
          particleCount: 500,
          lodBias: 2,
          postProcessing: false,
        },
      ],
    },
  };
}

// Export singleton config
let globalConfig: PerformanceConfig | null = null;
let globalCapabilities: DeviceCapabilities | null = null;

export function initPerformanceConfig(customConfig?: Partial<PerformanceConfig>): PerformanceConfig {
  globalCapabilities = detectDeviceCapabilities();
  const defaultConfig = getDefaultConfig(globalCapabilities);

  globalConfig = customConfig
    ? { ...defaultConfig, ...customConfig }
    : defaultConfig;

  console.log('[Performance] Initialized with config:', {
    deviceTier: globalCapabilities.tier,
    gpu: globalCapabilities.gpu,
    connection: globalCapabilities.connection,
  });

  return globalConfig;
}

export function getPerformanceConfig(): PerformanceConfig {
  if (!globalConfig) {
    return initPerformanceConfig();
  }
  return globalConfig;
}

export function getDeviceCapabilities(): DeviceCapabilities {
  if (!globalCapabilities) {
    globalCapabilities = detectDeviceCapabilities();
  }
  return globalCapabilities;
}
