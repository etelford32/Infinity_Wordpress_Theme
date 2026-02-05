/**
 * Service Worker Manager
 * Handles registration, updates, and communication with the service worker
 */

import { getPerformanceConfig } from './config';

type SWStatus = 'unsupported' | 'installing' | 'waiting' | 'active' | 'error';

interface SWState {
  status: SWStatus;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  error: Error | null;
}

type SWCallback = (state: SWState) => void;

class ServiceWorkerManager {
  private state: SWState = {
    status: 'unsupported',
    registration: null,
    updateAvailable: false,
    error: null,
  };

  private callbacks: SWCallback[] = [];
  private refreshing = false;

  /**
   * Initialize and register service worker
   */
  async init(): Promise<SWState> {
    const config = getPerformanceConfig();

    // Check if service worker is supported and enabled
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Manager] Service Worker not supported');
      this.updateState({ status: 'unsupported' });
      return this.state;
    }

    if (!config.serviceWorker.enabled) {
      console.log('[SW Manager] Service Worker disabled in config');
      return this.state;
    }

    // Don't register on localhost in development (optional)
    // if (location.hostname === 'localhost') {
    //   console.log('[SW Manager] Skipping SW registration in development');
    //   return this.state;
    // }

    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      this.updateState({
        registration,
        status: 'installing',
      });

      console.log('[SW Manager] Service Worker registered:', registration.scope);

      // Setup event handlers
      this.setupRegistrationHandlers(registration);

      // Check for updates periodically
      this.setupUpdateChecker(registration);

      // Handle controller change (new SW activated)
      this.setupControllerChangeHandler();

      return this.state;
    } catch (error) {
      console.error('[SW Manager] Registration failed:', error);
      this.updateState({
        status: 'error',
        error: error as Error,
      });
      return this.state;
    }
  }

  /**
   * Setup handlers for registration state changes
   */
  private setupRegistrationHandlers(registration: ServiceWorkerRegistration): void {
    // Installing worker
    if (registration.installing) {
      this.trackWorkerState(registration.installing);
    }

    // Waiting worker (update available)
    if (registration.waiting) {
      this.updateState({ updateAvailable: true, status: 'waiting' });
    }

    // Active worker
    if (registration.active) {
      this.updateState({ status: 'active' });
    }

    // Listen for new workers
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        this.trackWorkerState(newWorker);
      }
    });
  }

  /**
   * Track individual worker state changes
   */
  private trackWorkerState(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      console.log('[SW Manager] Worker state:', worker.state);

      switch (worker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // New update available
            this.updateState({ updateAvailable: true, status: 'waiting' });
            this.notifyUpdateAvailable();
          } else {
            // Fresh install
            this.updateState({ status: 'active' });
          }
          break;

        case 'activated':
          this.updateState({ status: 'active', updateAvailable: false });
          break;

        case 'redundant':
          console.warn('[SW Manager] Worker became redundant');
          break;
      }
    });
  }

  /**
   * Setup controller change handler for page refresh
   */
  private setupControllerChangeHandler(): void {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      this.refreshing = true;
      console.log('[SW Manager] New service worker activated, reloading...');
      window.location.reload();
    });
  }

  /**
   * Setup periodic update checker
   */
  private setupUpdateChecker(registration: ServiceWorkerRegistration): void {
    // Check for updates every hour
    setInterval(() => {
      registration.update().catch((err) => {
        console.warn('[SW Manager] Update check failed:', err);
      });
    }, 60 * 60 * 1000);

    // Also check on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => {});
      }
    });
  }

  /**
   * Notify user about available update
   */
  private notifyUpdateAvailable(): void {
    console.log('[SW Manager] Update available');

    // Dispatch custom event for UI to handle
    window.dispatchEvent(
      new CustomEvent('sw-update-available', {
        detail: { manager: this },
      })
    );
  }

  /**
   * Apply pending update (skip waiting)
   */
  applyUpdate(): void {
    const waiting = this.state.registration?.waiting;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (this.state.registration?.active) {
      this.state.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }

    // Also clear from main thread
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }

    console.log('[SW Manager] Caches cleared');
  }

  /**
   * Pre-cache specific URLs
   */
  cacheUrls(urls: string[]): void {
    if (this.state.registration?.active) {
      this.state.registration.active.postMessage({
        type: 'CACHE_URLS',
        urls,
      });
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: SWCallback): () => void {
    this.callbacks.push(callback);
    // Immediately call with current state
    callback(this.state);

    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get current state
   */
  getState(): SWState {
    return { ...this.state };
  }

  /**
   * Check if SW is active
   */
  isActive(): boolean {
    return this.state.status === 'active';
  }

  /**
   * Check if update is available
   */
  hasUpdate(): boolean {
    return this.state.updateAvailable;
  }

  /**
   * Update internal state and notify subscribers
   */
  private updateState(partial: Partial<SWState>): void {
    this.state = { ...this.state, ...partial };
    this.callbacks.forEach((cb) => cb(this.state));
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (this.state.registration) {
      const success = await this.state.registration.unregister();
      if (success) {
        this.updateState({
          status: 'unsupported',
          registration: null,
          updateAvailable: false,
        });
      }
      return success;
    }
    return false;
  }
}

// Export singleton
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * React hook for service worker state
 */
export function useServiceWorker() {
  // This would be implemented as a React hook
  // For now, return the manager instance
  return serviceWorkerManager;
}

/**
 * Initialize service worker on app start
 */
export function initServiceWorker(): Promise<SWState> {
  return serviceWorkerManager.init();
}
