import * as THREE from 'three';

/**
 * Orbital mechanics utilities
 */
export class OrbitalMechanics {
  /**
   * Calculate orbital velocity for circular orbit
   * v = sqrt(G * M / r)
   */
  static calculateOrbitalVelocity(
    centralMass: number,
    orbitalRadius: number,
    G: number = 6.674e-11
  ): number {
    return Math.sqrt((G * centralMass) / orbitalRadius);
  }

  /**
   * Calculate orbital period
   * T = 2π * sqrt(r^3 / (G * M))
   */
  static calculateOrbitalPeriod(
    centralMass: number,
    orbitalRadius: number,
    G: number = 6.674e-11
  ): number {
    return 2 * Math.PI * Math.sqrt(Math.pow(orbitalRadius, 3) / (G * centralMass));
  }

  /**
   * Calculate escape velocity
   * v_escape = sqrt(2 * G * M / r)
   */
  static calculateEscapeVelocity(
    mass: number,
    radius: number,
    G: number = 6.674e-11
  ): number {
    return Math.sqrt((2 * G * mass) / radius);
  }

  /**
   * Calculate gravitational force between two bodies
   * F = G * (m1 * m2) / r^2
   */
  static calculateGravitationalForce(
    mass1: number,
    mass2: number,
    distance: number,
    G: number = 6.674e-11
  ): number {
    if (distance === 0) return 0;
    return (G * mass1 * mass2) / (distance * distance);
  }

  /**
   * Calculate position on elliptical orbit
   */
  static calculateEllipticalPosition(
    semiMajorAxis: number,
    eccentricity: number,
    angle: number
  ): THREE.Vector3 {
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
    const x = semiMajorAxis * Math.cos(angle);
    const z = semiMinorAxis * Math.sin(angle);
    return new THREE.Vector3(x, 0, z);
  }
}

/**
 * Texture loading utilities
 */
export class TextureLoader {
  private static loader = new THREE.TextureLoader();
  private static cache: Map<string, THREE.Texture> = new Map();

  /**
   * Load texture with caching
   */
  static async load(url: string): Promise<THREE.Texture> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        texture => {
          this.cache.set(url, texture);
          resolve(texture);
        },
        undefined,
        error => {
          console.error(`[TextureLoader] Failed to load: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load multiple textures
   */
  static async loadMultiple(urls: string[]): Promise<THREE.Texture[]> {
    return Promise.all(urls.map(url => this.load(url)));
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
  }
}

/**
 * Starfield generation
 */
export class StarfieldGenerator {
  /**
   * Create a starfield background
   */
  static create(
    count: number = 10000,
    radius: number = 1000,
    size: number = 1
  ): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    // Star colors (approximating different stellar types)
    const starColors = [
      new THREE.Color(0xaaaaff), // Blue (hot)
      new THREE.Color(0xffffff), // White
      new THREE.Color(0xffffaa), // Yellow
      new THREE.Color(0xffaa66), // Orange
      new THREE.Color(0xff6644), // Red (cool)
    ];

    for (let i = 0; i < count; i++) {
      // Random position on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius + Math.random() * 100;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      // Random star color
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create a nebula effect (simple particle cloud)
   */
  static createNebula(
    count: number = 5000,
    radius: number = 500,
    color: THREE.Color = new THREE.Color(0x6366f1)
  ): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < count; i++) {
      // Random position in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * radius;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      // Vary color slightly
      const variation = 0.3;
      const r_color = Math.max(0, Math.min(1, color.r + (Math.random() - 0.5) * variation));
      const g_color = Math.max(0, Math.min(1, color.g + (Math.random() - 0.5) * variation));
      const b_color = Math.max(0, Math.min(1, color.b + (Math.random() - 0.5) * variation));

      colors.push(r_color, g_color, b_color);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }
}

/**
 * Camera utilities
 */
export class CameraUtils {
  /**
   * Smoothly move camera to target position
   */
  static smoothMoveTo(
    camera: THREE.Camera,
    targetPosition: THREE.Vector3,
    duration: number = 1000
  ): Promise<void> {
    return new Promise(resolve => {
      const startPosition = camera.position.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        camera.position.lerpVectors(startPosition, targetPosition, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Calculate camera distance to fit object in view
   */
  static calculateDistanceToFit(
    objectRadius: number,
    fov: number = 75
  ): number {
    const vFOV = THREE.MathUtils.degToRad(fov);
    return objectRadius / Math.tan(vFOV / 2);
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private maxSamples: number = 60;
  private lastFrameTime: number = 0;

  /**
   * Record frame time
   */
  recordFrame(currentTime: number): void {
    if (this.lastFrameTime > 0) {
      const frameTime = currentTime - this.lastFrameTime;
      this.frameTimes.push(frameTime);

      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift();
      }
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 0;

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return 1000 / avgFrameTime;
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const lastFrameTime = this.frameTimes[this.frameTimes.length - 1];
    return 1000 / lastFrameTime;
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(targetFPS: number = 30): boolean {
    return this.getAverageFPS() >= targetFPS;
  }

  /**
   * Reset
   */
  reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = 0;
  }
}

/**
 * Color utilities
 */
export class ColorUtils {
  /**
   * Generate temperature-based color (for stars)
   */
  static temperatureToColor(temperature: number): THREE.Color {
    // Simplified blackbody radiation color
    // Temperature in Kelvin
    const temp = temperature / 100;
    let r, g, b;

    // Red
    if (temp <= 66) {
      r = 255;
    } else {
      r = temp - 60;
      r = 329.698727446 * Math.pow(r, -0.1332047592);
      r = Math.max(0, Math.min(255, r));
    }

    // Green
    if (temp <= 66) {
      g = temp;
      g = 99.4708025861 * Math.log(g) - 161.1195681661;
    } else {
      g = temp - 60;
      g = 288.1221695283 * Math.pow(g, -0.0755148492);
    }
    g = Math.max(0, Math.min(255, g));

    // Blue
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
      b = Math.max(0, Math.min(255, b));
    }

    return new THREE.Color(r / 255, g / 255, b / 255);
  }
}
