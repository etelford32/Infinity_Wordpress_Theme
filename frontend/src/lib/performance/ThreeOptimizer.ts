/**
 * Three.js Performance Optimizer
 * Handles LOD, object pooling, frustum culling, and adaptive quality
 */

import * as THREE from 'three';
import {
  getPerformanceConfig,
  getDeviceCapabilities,
  QualityLevel,
} from './config';
import { performanceMonitor } from './PerformanceMonitor';

/**
 * LOD (Level of Detail) Manager
 * Automatically switches mesh detail based on distance from camera
 */
export class LODManager {
  private lodGroups: Map<string, THREE.LOD> = new Map();
  private camera: THREE.Camera | null = null;
  private config = getPerformanceConfig();

  /**
   * Set the camera used for LOD calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Create an LOD group with multiple detail levels
   */
  createLOD(
    id: string,
    levels: { mesh: THREE.Mesh; distance: number }[]
  ): THREE.LOD {
    const lod = new THREE.LOD();

    // Sort by distance (closest first)
    const sortedLevels = [...levels].sort((a, b) => a.distance - b.distance);

    sortedLevels.forEach(({ mesh, distance }) => {
      lod.addLevel(mesh, distance * this.config.adaptive.qualityLevels[1].lodBias);
    });

    this.lodGroups.set(id, lod);
    return lod;
  }

  /**
   * Create LOD from a high-detail mesh (auto-generate lower detail levels)
   */
  createAutoLOD(id: string, highDetailMesh: THREE.Mesh): THREE.LOD {
    const lod = new THREE.LOD();
    const [highDist, medDist, lowDist] = this.config.threeJs.lodDistances;

    // High detail
    lod.addLevel(highDetailMesh.clone(), 0);

    // Medium detail (simplified geometry)
    const mediumMesh = this.simplifyMesh(highDetailMesh, 0.5);
    lod.addLevel(mediumMesh, highDist);

    // Low detail (more simplified)
    const lowMesh = this.simplifyMesh(highDetailMesh, 0.25);
    lod.addLevel(lowMesh, medDist);

    // Very low detail (billboard or simple shape)
    const veryLowMesh = this.createBillboard(highDetailMesh);
    lod.addLevel(veryLowMesh, lowDist);

    this.lodGroups.set(id, lod);
    return lod;
  }

  /**
   * Simplify mesh geometry (basic implementation)
   */
  private simplifyMesh(mesh: THREE.Mesh, factor: number): THREE.Mesh {
    const geometry = mesh.geometry.clone();

    // For BufferGeometry, we'd ideally use a simplification algorithm
    // like SimplifyModifier. For now, we'll just skip vertices
    if (geometry.index && factor < 1) {
      const indices = geometry.index.array;
      const newIndices: number[] = [];

      // Skip triangles based on factor
      const step = Math.max(1, Math.floor(1 / factor));
      for (let i = 0; i < indices.length; i += 3 * step) {
        if (i + 2 < indices.length) {
          newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
        }
      }

      geometry.setIndex(newIndices);
    }

    const simplifiedMesh = new THREE.Mesh(geometry, mesh.material);
    simplifiedMesh.castShadow = mesh.castShadow && factor > 0.5;
    simplifiedMesh.receiveShadow = mesh.receiveShadow;

    return simplifiedMesh;
  }

  /**
   * Create a billboard sprite for very far distances
   */
  private createBillboard(mesh: THREE.Mesh): THREE.Sprite {
    // Create a simple colored sprite as placeholder
    const material = new THREE.SpriteMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.8,
    });

    const sprite = new THREE.Sprite(material);

    // Scale based on original mesh bounds
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    sprite.scale.set(maxDim, maxDim, 1);

    return sprite;
  }

  /**
   * Update all LOD groups (call each frame)
   */
  update(): void {
    if (!this.camera) return;

    this.lodGroups.forEach((lod) => {
      lod.update(this.camera!);
    });
  }

  /**
   * Remove an LOD group
   */
  remove(id: string): void {
    const lod = this.lodGroups.get(id);
    if (lod) {
      lod.parent?.remove(lod);
      this.lodGroups.delete(id);
    }
  }

  /**
   * Clear all LOD groups
   */
  clear(): void {
    this.lodGroups.forEach((lod) => {
      lod.parent?.remove(lod);
    });
    this.lodGroups.clear();
  }
}

/**
 * Object Pool for reusing Three.js objects
 */
export class ObjectPool<T extends THREE.Object3D> {
  private pool: T[] = [];
  private activeObjects: Set<T> = new Set();
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createObject());
    }
  }

  private createObject(): T {
    const obj = this.factory();
    obj.visible = false;
    return obj;
  }

  /**
   * Get an object from the pool
   */
  acquire(): T | null {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else if (this.activeObjects.size < this.maxSize) {
      obj = this.createObject();
    } else {
      console.warn('[ObjectPool] Max size reached');
      return null;
    }

    obj.visible = true;
    this.activeObjects.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (!this.activeObjects.has(obj)) return;

    obj.visible = false;
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);

    this.activeObjects.delete(obj);
    this.pool.push(obj);
  }

  /**
   * Release all active objects
   */
  releaseAll(): void {
    this.activeObjects.forEach((obj) => {
      obj.visible = false;
      this.pool.push(obj);
    });
    this.activeObjects.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; active: number; total: number } {
    return {
      available: this.pool.length,
      active: this.activeObjects.size,
      total: this.pool.length + this.activeObjects.size,
    };
  }

  /**
   * Dispose all objects
   */
  dispose(): void {
    [...this.pool, ...this.activeObjects].forEach((obj) => {
      if ((obj as any).geometry) {
        (obj as any).geometry.dispose();
      }
      if ((obj as any).material) {
        const material = (obj as any).material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    });
    this.pool = [];
    this.activeObjects.clear();
  }
}

/**
 * Adaptive Quality Manager
 * Automatically adjusts rendering quality based on performance
 */
export class AdaptiveQualityManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private currentLevel: number = 1; // Start at 'high'
  private config = getPerformanceConfig();
  private capabilities = getDeviceCapabilities();
  private fpsHistory: number[] = [];
  private checkInterval: number | null = null;

  /**
   * Initialize with renderer and scene
   */
  init(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
    this.renderer = renderer;
    this.scene = scene;

    // Set initial quality based on device capabilities
    this.setInitialQuality();

    // Start monitoring if adaptive is enabled
    if (this.config.adaptive.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Set initial quality based on device
   */
  private setInitialQuality(): void {
    switch (this.capabilities.tier) {
      case 'low':
        this.currentLevel = 3; // 'low'
        break;
      case 'medium':
        this.currentLevel = 2; // 'medium'
        break;
      case 'high':
        this.currentLevel = 1; // 'high'
        break;
    }

    this.applyQualityLevel();
  }

  /**
   * Start FPS monitoring for adaptive quality
   */
  private startMonitoring(): void {
    // Subscribe to performance monitor
    performanceMonitor.subscribe((metrics) => {
      if (metrics.fps !== undefined) {
        this.fpsHistory.push(metrics.fps);
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }
      }
    });

    // Check quality periodically
    this.checkInterval = window.setInterval(() => {
      this.checkAndAdjustQuality();
    }, this.config.adaptive.checkInterval);
  }

  /**
   * Check FPS and adjust quality if needed
   */
  private checkAndAdjustQuality(): void {
    if (this.fpsHistory.length < 5) return;

    const avgFps =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    const { targetFPS, minFPS, qualityLevels } = this.config.adaptive;

    // Decrease quality if FPS is too low
    if (avgFps < minFPS && this.currentLevel < qualityLevels.length - 1) {
      this.currentLevel++;
      this.applyQualityLevel();
      this.fpsHistory = [];
      console.log(
        `[AdaptiveQuality] Decreased to ${qualityLevels[this.currentLevel].name} (FPS: ${avgFps.toFixed(1)})`
      );
    }
    // Increase quality if FPS is consistently high
    else if (avgFps > targetFPS * 0.95 && this.currentLevel > 0) {
      this.currentLevel--;
      this.applyQualityLevel();
      this.fpsHistory = [];
      console.log(
        `[AdaptiveQuality] Increased to ${qualityLevels[this.currentLevel].name} (FPS: ${avgFps.toFixed(1)})`
      );
    }
  }

  /**
   * Apply current quality level settings
   */
  private applyQualityLevel(): void {
    if (!this.renderer || !this.scene) return;

    const level = this.config.adaptive.qualityLevels[this.currentLevel];

    // Pixel ratio
    this.renderer.setPixelRatio(
      Math.min(level.pixelRatio, window.devicePixelRatio)
    );

    // Shadow map size
    this.renderer.shadowMap.enabled = level.shadowMapSize > 0;
    if (this.renderer.shadowMap.enabled) {
      // Update shadow maps for all lights
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Light && obj.shadow) {
          obj.shadow.mapSize.setScalar(level.shadowMapSize);
          obj.shadow.map?.dispose();
          obj.shadow.map = null;
        }
      });
    }

    console.log(`[AdaptiveQuality] Applied level: ${level.name}`);
  }

  /**
   * Get current quality level
   */
  getCurrentLevel(): QualityLevel {
    return this.config.adaptive.qualityLevels[this.currentLevel];
  }

  /**
   * Force a specific quality level
   */
  setQualityLevel(levelIndex: number): void {
    if (levelIndex >= 0 && levelIndex < this.config.adaptive.qualityLevels.length) {
      this.currentLevel = levelIndex;
      this.applyQualityLevel();
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

/**
 * Frustum Culling Helper
 * Optimizes which objects are rendered based on camera view
 */
export class FrustumCuller {
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();

  /**
   * Update frustum from camera
   */
  updateFrustum(camera: THREE.Camera): void {
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   * Check if object is in frustum
   */
  isInFrustum(object: THREE.Object3D): boolean {
    // Check if object is a Mesh with geometry
    if (!(object instanceof THREE.Mesh) || !object.geometry) {
      return true; // Non-mesh objects are always "visible"
    }

    // Ensure bounding sphere is computed
    const geometry = object.geometry;
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }

    // Create world-space bounding sphere
    const sphere = geometry.boundingSphere!.clone();
    sphere.applyMatrix4(object.matrixWorld);

    return this.frustum.intersectsSphere(sphere);
  }

  /**
   * Cull objects in a scene (set visibility)
   */
  cullScene(scene: THREE.Scene, camera: THREE.Camera): number {
    this.updateFrustum(camera);

    let culledCount = 0;

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const inFrustum = this.isInFrustum(obj);
        if (obj.visible !== inFrustum) {
          obj.visible = inFrustum;
          if (!inFrustum) culledCount++;
        }
      }
    });

    return culledCount;
  }
}

/**
 * Texture Manager for optimized texture loading
 */
export class TextureManager {
  private textureLoader = new THREE.TextureLoader();
  private loadedTextures: Map<string, THREE.Texture> = new Map();
  private config = getPerformanceConfig();

  /**
   * Load texture with quality settings
   */
  async loadTexture(
    url: string,
    options: {
      quality?: 'high' | 'medium' | 'low';
      generateMipmaps?: boolean;
    } = {}
  ): Promise<THREE.Texture> {
    // Check cache
    const cacheKey = `${url}-${options.quality || 'auto'}`;
    if (this.loadedTextures.has(cacheKey)) {
      return this.loadedTextures.get(cacheKey)!;
    }

    // Determine quality
    const quality = options.quality || this.config.threeJs.textureQuality;
    const actualQuality = quality === 'auto' ? this.getAutoQuality() : quality;

    // Modify URL for quality (if using image service)
    const qualityUrl = this.getQualityUrl(url, actualQuality);

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        qualityUrl,
        (texture) => {
          texture.generateMipmaps = options.generateMipmaps ?? actualQuality !== 'low';
          texture.minFilter =
            actualQuality === 'low'
              ? THREE.LinearFilter
              : THREE.LinearMipmapLinearFilter;
          texture.anisotropy =
            actualQuality === 'high' ? 16 : actualQuality === 'medium' ? 4 : 1;

          this.loadedTextures.set(cacheKey, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  private getAutoQuality(): 'high' | 'medium' | 'low' {
    const capabilities = getDeviceCapabilities();
    return capabilities.tier;
  }

  private getQualityUrl(url: string, quality: 'high' | 'medium' | 'low'): string {
    // If using a CDN with quality params
    const qualityMap = { high: 90, medium: 70, low: 50 };
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}q=${qualityMap[quality]}`;
  }

  /**
   * Dispose all textures
   */
  dispose(): void {
    this.loadedTextures.forEach((texture) => texture.dispose());
    this.loadedTextures.clear();
  }
}

// Export singleton instances
export const lodManager = new LODManager();
export const adaptiveQuality = new AdaptiveQualityManager();
export const frustumCuller = new FrustumCuller();
export const textureManager = new TextureManager();
