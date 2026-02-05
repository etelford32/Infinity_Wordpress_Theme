/**
 * Asset Preloader
 * Manages preloading of critical assets, fonts, and route prefetching
 */

import { getPerformanceConfig, getDeviceCapabilities } from './config';

type AssetType = 'font' | 'script' | 'style' | 'image' | 'fetch';
type PreloadPriority = 'critical' | 'high' | 'low';

interface PreloadAsset {
  href: string;
  as: AssetType;
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  priority: PreloadPriority;
}

interface PreloadState {
  loaded: Set<string>;
  failed: Set<string>;
  pending: Set<string>;
}

class AssetPreloader {
  private state: PreloadState = {
    loaded: new Set(),
    failed: new Set(),
    pending: new Set(),
  };

  private observer: PerformanceObserver | null = null;

  /**
   * Initialize preloader - call this early in app lifecycle
   */
  init(): void {
    const config = getPerformanceConfig();
    const capabilities = getDeviceCapabilities();

    // Skip on save-data mode
    if (capabilities.saveData) {
      console.log('[AssetPreloader] Skipping preload due to save-data mode');
      return;
    }

    // Add preconnect hints
    this.addPreconnectHints(config.preload.preconnectOrigins);

    // Preload critical fonts
    config.preload.criticalFonts.forEach((font) => {
      this.preload({
        href: font,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
        priority: 'critical',
      });
    });

    // Preload critical scripts
    config.preload.criticalScripts.forEach((script) => {
      this.preload({
        href: script,
        as: 'script',
        priority: 'critical',
      });
    });

    // Setup route prefetching on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.prefetchRoutes(config.preload.prefetchRoutes);
      });
    } else {
      setTimeout(() => {
        this.prefetchRoutes(config.preload.prefetchRoutes);
      }, 2000);
    }

    // Monitor resource timing
    this.setupPerformanceObserver();

    console.log('[AssetPreloader] Initialized');
  }

  /**
   * Add preconnect hints for origins
   */
  private addPreconnectHints(origins: string[]): void {
    origins.forEach((origin) => {
      // Preconnect
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = origin;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);

      // DNS prefetch as fallback
      const dnsPrefetch = document.createElement('link');
      dnsPrefetch.rel = 'dns-prefetch';
      dnsPrefetch.href = origin;
      document.head.appendChild(dnsPrefetch);
    });
  }

  /**
   * Preload a single asset
   */
  preload(asset: PreloadAsset): Promise<void> {
    // Skip if already loaded or pending
    if (this.state.loaded.has(asset.href) || this.state.pending.has(asset.href)) {
      return Promise.resolve();
    }

    this.state.pending.add(asset.href);

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset.href;
      link.as = asset.as;

      if (asset.type) {
        link.type = asset.type;
      }

      if (asset.crossOrigin) {
        link.crossOrigin = asset.crossOrigin;
      }

      // Set fetchpriority for modern browsers
      if (asset.priority === 'critical') {
        (link as any).fetchPriority = 'high';
      }

      link.onload = () => {
        this.state.pending.delete(asset.href);
        this.state.loaded.add(asset.href);
        resolve();
      };

      link.onerror = () => {
        this.state.pending.delete(asset.href);
        this.state.failed.add(asset.href);
        reject(new Error(`Failed to preload: ${asset.href}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preload multiple assets with priority queue
   */
  async preloadBatch(assets: PreloadAsset[]): Promise<void> {
    // Sort by priority
    const sorted = [...assets].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Process critical assets immediately
    const critical = sorted.filter((a) => a.priority === 'critical');
    await Promise.all(critical.map((a) => this.preload(a).catch(() => {})));

    // Process others
    const rest = sorted.filter((a) => a.priority !== 'critical');
    for (const asset of rest) {
      await this.preload(asset).catch(() => {});
    }
  }

  /**
   * Prefetch routes for faster navigation
   */
  prefetchRoutes(routes: string[]): void {
    const capabilities = getDeviceCapabilities();

    // Don't prefetch on slow connections
    if (capabilities.connection === 'slow-2g' || capabilities.connection === '2g') {
      return;
    }

    routes.forEach((route) => {
      if (this.state.loaded.has(route)) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      (link as any).fetchPriority = 'low';
      document.head.appendChild(link);

      this.state.loaded.add(route);
    });
  }

  /**
   * Prefetch a specific route on hover/focus
   */
  prefetchOnInteraction(route: string): void {
    if (this.state.loaded.has(route) || this.state.pending.has(route)) {
      return;
    }

    // Use prefetch for navigation
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);

    this.state.pending.add(route);

    // Also preload the chunk if it's a known route
    this.preloadRouteChunk(route);
  }

  /**
   * Preload route chunk for code-split routes
   */
  private preloadRouteChunk(route: string): void {
    // Map routes to their chunk names (based on routes.tsx)
    const routeChunks: Record<string, string> = {
      '/': 'HomePage',
      '/simulations': 'SimulationsListPage',
      '/blueprints': 'BlueprintsGallery',
      '/challenges': 'ChallengesPage',
      '/dashboard': 'DashboardPage',
      '/pricing': 'PricingPage',
      '/admin': 'AdminDashboard',
    };

    const chunkName = routeChunks[route];
    if (chunkName) {
      // Vite chunk naming pattern
      const chunkUrl = `/chunks/${chunkName}.js`;
      this.preload({
        href: chunkUrl,
        as: 'script',
        priority: 'low',
      }).catch(() => {
        // Chunk might not exist with that exact name
      });
    }
  }

  /**
   * Preload image
   */
  preloadImage(src: string, priority: PreloadPriority = 'low'): Promise<void> {
    return this.preload({
      href: src,
      as: 'image',
      priority,
    });
  }

  /**
   * Preload multiple images
   */
  preloadImages(srcs: string[], priority: PreloadPriority = 'low'): Promise<void[]> {
    return Promise.all(srcs.map((src) => this.preloadImage(src, priority).catch(() => {})));
  }

  /**
   * Setup performance observer to track resource loading
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resource = entry as PerformanceResourceTiming;

          // Track slow resources
          if (resource.duration > 1000) {
            console.warn('[AssetPreloader] Slow resource:', {
              name: resource.name,
              duration: Math.round(resource.duration),
              type: resource.initiatorType,
            });
          }
        });
      });

      this.observer.observe({ type: 'resource', buffered: false });
    } catch {
      // Resource timing not supported
    }
  }

  /**
   * Get preload statistics
   */
  getStats(): { loaded: number; failed: number; pending: number } {
    return {
      loaded: this.state.loaded.size,
      failed: this.state.failed.size,
      pending: this.state.pending.size,
    };
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(href: string): boolean {
    return this.state.loaded.has(href);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.observer?.disconnect();
    this.state.loaded.clear();
    this.state.failed.clear();
    this.state.pending.clear();
  }
}

// Export singleton
export const assetPreloader = new AssetPreloader();

/**
 * React hook for prefetching on link hover
 */
export function usePrefetchOnHover(route: string) {
  return {
    onMouseEnter: () => assetPreloader.prefetchOnInteraction(route),
    onFocus: () => assetPreloader.prefetchOnInteraction(route),
  };
}

/**
 * Preload critical assets for a specific page
 */
export function preloadPageAssets(
  images: string[],
  scripts: string[] = []
): Promise<void> {
  const assets: PreloadAsset[] = [
    ...images.map((href) => ({
      href,
      as: 'image' as AssetType,
      priority: 'high' as PreloadPriority,
    })),
    ...scripts.map((href) => ({
      href,
      as: 'script' as AssetType,
      priority: 'high' as PreloadPriority,
    })),
  ];

  return assetPreloader.preloadBatch(assets);
}
