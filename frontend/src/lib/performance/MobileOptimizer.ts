/**
 * Mobile & Responsive Optimizations
 * Handles touch interactions, network-aware loading, and mobile-specific performance
 */

import { getDeviceCapabilities, getPerformanceConfig } from './config';

/**
 * Touch Gesture Optimizer
 * Improves touch responsiveness and prevents common issues
 */
export class TouchOptimizer {
  private config = getPerformanceConfig();
  private isInitialized = false;

  /**
   * Initialize touch optimizations
   */
  init(): void {
    if (this.isInitialized || !this.config.mobile.touchOptimizations) return;

    // Prevent double-tap zoom on interactive elements
    this.preventDoubleTapZoom();

    // Optimize scroll performance
    this.optimizeScrolling();

    // Add touch-action hints
    this.addTouchActionHints();

    // Handle orientation changes
    this.handleOrientationChange();

    this.isInitialized = true;
    console.log('[TouchOptimizer] Initialized');
  }

  /**
   * Prevent double-tap zoom while maintaining accessibility
   */
  private preventDoubleTapZoom(): void {
    // Add touch-action: manipulation to interactive elements
    const style = document.createElement('style');
    style.textContent = `
      button, a, input, select, textarea, [role="button"], .interactive {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize scrolling performance
   */
  private optimizeScrolling(): void {
    // Use passive event listeners for scroll events
    document.addEventListener(
      'touchstart',
      () => {},
      { passive: true }
    );

    document.addEventListener(
      'touchmove',
      () => {},
      { passive: true }
    );

    // Add momentum scrolling for iOS
    const style = document.createElement('style');
    style.textContent = `
      .scroll-container, [data-scroll] {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add touch-action hints for common interaction patterns
   */
  private addTouchActionHints(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Horizontal scrollers */
      .horizontal-scroll {
        touch-action: pan-x;
      }

      /* Vertical scrollers */
      .vertical-scroll {
        touch-action: pan-y;
      }

      /* Pinch-zoom areas (like simulation canvas) */
      .pinch-zoom {
        touch-action: pinch-zoom pan-x pan-y;
      }

      /* No touch actions (for canvas interactions) */
      .no-touch {
        touch-action: none;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle orientation changes
   */
  private handleOrientationChange(): void {
    const handleChange = () => {
      // Dispatch custom event for components to handle
      window.dispatchEvent(new CustomEvent('orientation-change', {
        detail: {
          orientation: window.screen.orientation?.type ||
            (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
        },
      }));

      // Force recalculation of vh units
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`
      );
    };

    window.addEventListener('orientationchange', handleChange);
    window.addEventListener('resize', handleChange);

    // Initial set
    handleChange();
  }
}

/**
 * Network-Aware Loader
 * Adjusts loading behavior based on network conditions
 */
export class NetworkAwareLoader {
  private connection: any;
  private callbacks: ((info: NetworkInfo) => void)[] = [];

  constructor() {
    const nav = navigator as any;
    this.connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  }

  /**
   * Get current network information
   */
  getNetworkInfo(): NetworkInfo {
    if (!this.connection) {
      return {
        type: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };
    }

    return {
      type: this.connection.type || 'unknown',
      effectiveType: this.connection.effectiveType || '4g',
      downlink: this.connection.downlink || 10,
      rtt: this.connection.rtt || 50,
      saveData: this.connection.saveData || false,
    };
  }

  /**
   * Check if network is slow
   */
  isSlowNetwork(): boolean {
    const info = this.getNetworkInfo();
    return (
      info.saveData ||
      info.effectiveType === 'slow-2g' ||
      info.effectiveType === '2g' ||
      info.rtt > 500
    );
  }

  /**
   * Check if we should load heavy assets
   */
  shouldLoadHeavyAssets(): boolean {
    const info = this.getNetworkInfo();
    return !info.saveData && (
      info.effectiveType === '4g' ||
      (info.effectiveType === '3g' && info.downlink > 1)
    );
  }

  /**
   * Get recommended image quality based on network
   */
  getRecommendedImageQuality(): 'high' | 'medium' | 'low' {
    const info = this.getNetworkInfo();

    if (info.saveData || info.effectiveType === 'slow-2g') {
      return 'low';
    }
    if (info.effectiveType === '2g' || info.effectiveType === '3g') {
      return 'medium';
    }
    return 'high';
  }

  /**
   * Subscribe to network changes
   */
  subscribe(callback: (info: NetworkInfo) => void): () => void {
    this.callbacks.push(callback);

    if (this.connection) {
      const handler = () => callback(this.getNetworkInfo());
      this.connection.addEventListener('change', handler);

      return () => {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
        this.connection.removeEventListener('change', handler);
      };
    }

    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

interface NetworkInfo {
  type: string;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Battery-Aware Optimizer
 * Reduces resource usage when battery is low
 */
export class BatteryOptimizer {
  private battery: any = null;
  private isLowPower = false;
  private callbacks: ((isLowPower: boolean) => void)[] = [];

  async init(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        this.battery = await (navigator as any).getBattery();
        this.setupListeners();
        this.checkBatteryStatus();
      } catch (err) {
        console.warn('[BatteryOptimizer] Battery API not available');
      }
    }
  }

  private setupListeners(): void {
    if (!this.battery) return;

    this.battery.addEventListener('levelchange', () => this.checkBatteryStatus());
    this.battery.addEventListener('chargingchange', () => this.checkBatteryStatus());
  }

  private checkBatteryStatus(): void {
    if (!this.battery) return;

    const wasLowPower = this.isLowPower;

    // Consider low power if:
    // - Battery below 20% and not charging
    // - Battery below 10% regardless of charging
    this.isLowPower =
      (this.battery.level < 0.2 && !this.battery.charging) ||
      this.battery.level < 0.1;

    if (wasLowPower !== this.isLowPower) {
      console.log(`[BatteryOptimizer] Low power mode: ${this.isLowPower}`);
      this.callbacks.forEach(cb => cb(this.isLowPower));
    }
  }

  /**
   * Check if low power mode is active
   */
  isLowPowerMode(): boolean {
    return this.isLowPower;
  }

  /**
   * Subscribe to low power mode changes
   */
  subscribe(callback: (isLowPower: boolean) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get battery info
   */
  getBatteryInfo(): { level: number; charging: boolean } | null {
    if (!this.battery) return null;

    return {
      level: this.battery.level,
      charging: this.battery.charging,
    };
  }
}

/**
 * Reduced Motion Handler
 * Respects user preferences for reduced motion
 */
export class ReducedMotionHandler {
  private prefersReducedMotion = false;
  private mediaQuery: MediaQueryList;
  private callbacks: ((reduced: boolean) => void)[] = [];

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.mediaQuery.matches;

    this.mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.callbacks.forEach(cb => cb(this.prefersReducedMotion));
    });
  }

  /**
   * Check if reduced motion is preferred
   */
  shouldReduceMotion(): boolean {
    const config = getPerformanceConfig();

    if (config.mobile.reducedMotion === true) return true;
    if (config.mobile.reducedMotion === false) return false;

    return this.prefersReducedMotion;
  }

  /**
   * Get animation duration multiplier
   */
  getAnimationMultiplier(): number {
    return this.shouldReduceMotion() ? 0 : 1;
  }

  /**
   * Subscribe to reduced motion changes
   */
  subscribe(callback: (reduced: boolean) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

/**
 * Viewport Manager
 * Handles responsive breakpoints and safe areas
 */
export class ViewportManager {
  private breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  private currentBreakpoint: keyof typeof this.breakpoints = 'lg';
  private callbacks: ((bp: string) => void)[] = [];

  constructor() {
    this.updateBreakpoint();
    window.addEventListener('resize', () => this.updateBreakpoint());
  }

  private updateBreakpoint(): void {
    const width = window.innerWidth;
    let newBreakpoint: keyof typeof this.breakpoints = 'xs';

    for (const [key, value] of Object.entries(this.breakpoints)) {
      if (width >= value) {
        newBreakpoint = key as keyof typeof this.breakpoints;
      }
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.callbacks.forEach(cb => cb(newBreakpoint));
    }

    // Update CSS custom properties
    this.updateCSSVariables();
  }

  private updateCSSVariables(): void {
    const root = document.documentElement;

    // Viewport dimensions
    root.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
    root.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

    // Safe areas (for notched devices)
    root.style.setProperty(
      '--safe-area-top',
      'env(safe-area-inset-top, 0px)'
    );
    root.style.setProperty(
      '--safe-area-bottom',
      'env(safe-area-inset-bottom, 0px)'
    );
    root.style.setProperty(
      '--safe-area-left',
      'env(safe-area-inset-left, 0px)'
    );
    root.style.setProperty(
      '--safe-area-right',
      'env(safe-area-inset-right, 0px)'
    );
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): string {
    return this.currentBreakpoint;
  }

  /**
   * Check if current viewport matches or exceeds breakpoint
   */
  isAtLeast(breakpoint: keyof typeof this.breakpoints): boolean {
    return window.innerWidth >= this.breakpoints[breakpoint];
  }

  /**
   * Check if on mobile
   */
  isMobile(): boolean {
    return !this.isAtLeast('md');
  }

  /**
   * Check if on tablet
   */
  isTablet(): boolean {
    return this.isAtLeast('md') && !this.isAtLeast('lg');
  }

  /**
   * Check if on desktop
   */
  isDesktop(): boolean {
    return this.isAtLeast('lg');
  }

  /**
   * Subscribe to breakpoint changes
   */
  subscribe(callback: (bp: string) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

// Export singleton instances
export const touchOptimizer = new TouchOptimizer();
export const networkLoader = new NetworkAwareLoader();
export const batteryOptimizer = new BatteryOptimizer();
export const reducedMotionHandler = new ReducedMotionHandler();
export const viewportManager = new ViewportManager();

/**
 * Initialize all mobile optimizations
 */
export async function initMobileOptimizations(): Promise<void> {
  const capabilities = getDeviceCapabilities();

  // Touch optimizations
  if (capabilities.touchDevice) {
    touchOptimizer.init();
  }

  // Battery monitoring
  await batteryOptimizer.init();

  console.log('[MobileOptimizer] Initialized', {
    touch: capabilities.touchDevice,
    network: networkLoader.getNetworkInfo().effectiveType,
    reducedMotion: reducedMotionHandler.shouldReduceMotion(),
    viewport: viewportManager.getCurrentBreakpoint(),
  });
}

/**
 * React hook for responsive design
 */
export function useResponsive() {
  return {
    isMobile: viewportManager.isMobile(),
    isTablet: viewportManager.isTablet(),
    isDesktop: viewportManager.isDesktop(),
    breakpoint: viewportManager.getCurrentBreakpoint(),
    isAtLeast: viewportManager.isAtLeast.bind(viewportManager),
  };
}

/**
 * React hook for network-aware loading
 */
export function useNetworkAware() {
  return {
    isSlowNetwork: networkLoader.isSlowNetwork(),
    shouldLoadHeavyAssets: networkLoader.shouldLoadHeavyAssets(),
    imageQuality: networkLoader.getRecommendedImageQuality(),
    networkInfo: networkLoader.getNetworkInfo(),
  };
}
