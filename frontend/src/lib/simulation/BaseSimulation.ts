import * as THREE from 'three';
import { PhysicsEngine } from '../physics/PhysicsEngine';

/**
 * Base interface for all simulation configurations
 */
export interface BaseSimulationConfig {
  version: string;
  engine: 'cannon' | 'ammo' | 'gpu';
  scene: {
    background: string | THREE.Color;
    fog?: {
      color: string;
      near: number;
      far: number;
    };
    cameraPosition: [number, number, number];
    cameraTarget?: [number, number, number];
  };
  controls?: {
    allowMassChange?: boolean;
    allowVelocityChange?: boolean;
    allowAddRemove?: boolean;
    allowTimeControl?: boolean;
    allowCameraControl?: boolean;
  };
  performance?: {
    targetFPS?: number;
    maxParticles?: number;
    enableShadows?: boolean;
    enablePostProcessing?: boolean;
  };
  tutorial?: {
    enabled: boolean;
    steps: string[];
  };
}

/**
 * Simulation body configuration
 */
export interface SimulationBodyConfig {
  id: string;
  type: 'sphere' | 'box' | 'plane' | 'cylinder' | 'custom';

  // Geometry
  radius?: number;
  width?: number;
  height?: number;
  depth?: number;
  segments?: number;

  // Physics
  mass: number;
  position: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  velocity?: THREE.Vector3 | [number, number, number];
  angularVelocity?: THREE.Vector3 | [number, number, number];
  restitution?: number; // Bounciness
  friction?: number;
  damping?: number; // Linear damping
  angularDamping?: number;

  // Material
  material: {
    color?: string | number;
    emissive?: string | number;
    emissiveIntensity?: number;
    metalness?: number;
    roughness?: number;
    texture?: string;
    normalMap?: string;
    transparent?: boolean;
    opacity?: number;
  };

  // Custom properties
  userData?: Record<string, any>;
}

/**
 * Simulation body instance (runtime)
 */
export interface SimulationBody {
  id: string;
  mesh: THREE.Mesh | THREE.Object3D;
  physicsBody?: any; // Physics body from Cannon/Ammo/GPU
  config: SimulationBodyConfig;
  userData: Record<string, any>;

  // Methods
  update(deltaTime: number): void;
  dispose(): void;
  setPosition(position: THREE.Vector3): void;
  setVelocity(velocity: THREE.Vector3): void;
  setMass(mass: number): void;
}

/**
 * Simulation events
 */
export enum SimulationEvent {
  INITIALIZED = 'initialized',
  STARTED = 'started',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  STOPPED = 'stopped',
  RESET = 'reset',
  BODY_ADDED = 'body_added',
  BODY_REMOVED = 'body_removed',
  COLLISION = 'collision',
  PARAMETER_CHANGED = 'parameter_changed',
  ERROR = 'error',
}

/**
 * Event listener callback
 */
export type SimulationEventListener = (data?: any) => void;

/**
 * Simulation state
 */
export enum SimulationState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Time control settings
 */
export interface TimeControl {
  timeScale: number; // 1 = real-time, 2 = 2x speed, 0.5 = slow-mo
  isPaused: boolean;
  totalTime: number;
  deltaTime: number;
}

/**
 * Abstract base class for all simulations
 */
export abstract class BaseSimulation<TConfig extends BaseSimulationConfig = BaseSimulationConfig> {
  // Core Three.js objects
  protected scene!: THREE.Scene;
  protected camera!: THREE.PerspectiveCamera;
  protected renderer?: THREE.WebGLRenderer;

  // Physics engine
  protected physics!: PhysicsEngine;

  // Configuration
  protected config!: TConfig;

  // State
  protected state: SimulationState = SimulationState.UNINITIALIZED;
  protected bodies: Map<string, SimulationBody> = new Map();
  protected eventListeners: Map<SimulationEvent, Set<SimulationEventListener>> = new Map();

  // Time control
  protected timeControl: TimeControl = {
    timeScale: 1,
    isPaused: false,
    totalTime: 0,
    deltaTime: 0,
  };

  // Animation
  protected animationFrameId?: number;
  protected lastFrameTime: number = 0;

  /**
   * Initialize the simulation
   */
  async init(config: TConfig, scene: THREE.Scene, camera: THREE.PerspectiveCamera): Promise<void> {
    try {
      this.setState(SimulationState.INITIALIZING);

      this.config = config;
      this.scene = scene;
      this.camera = camera;

      // Setup scene
      this.setupScene();

      // Initialize physics
      await this.initPhysics();

      // Create simulation bodies
      await this.createBodies();

      // Custom initialization
      await this.onInit();

      this.setState(SimulationState.READY);
      this.emit(SimulationEvent.INITIALIZED);
    } catch (error) {
      console.error('[BaseSimulation] Initialization failed:', error);
      this.setState(SimulationState.ERROR);
      this.emit(SimulationEvent.ERROR, error);
      throw error;
    }
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.state !== SimulationState.READY && this.state !== SimulationState.PAUSED) {
      console.warn('[BaseSimulation] Cannot start simulation in current state:', this.state);
      return;
    }

    this.setState(SimulationState.RUNNING);
    this.timeControl.isPaused = false;
    this.lastFrameTime = performance.now();

    this.animate();
    this.emit(SimulationEvent.STARTED);
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    if (this.state !== SimulationState.RUNNING) {
      return;
    }

    this.setState(SimulationState.PAUSED);
    this.timeControl.isPaused = true;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    this.emit(SimulationEvent.PAUSED);
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    if (this.state !== SimulationState.PAUSED) {
      return;
    }

    this.setState(SimulationState.RUNNING);
    this.timeControl.isPaused = false;
    this.lastFrameTime = performance.now();

    this.animate();
    this.emit(SimulationEvent.RESUMED);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    this.setState(SimulationState.STOPPED);
    this.emit(SimulationEvent.STOPPED);
  }

  /**
   * Reset the simulation to initial state
   */
  reset(): void {
    this.stop();

    // Reset time
    this.timeControl = {
      timeScale: 1,
      isPaused: false,
      totalTime: 0,
      deltaTime: 0,
    };

    // Reset bodies
    this.bodies.forEach(body => body.dispose());
    this.bodies.clear();

    // Recreate
    this.createBodies().then(() => {
      this.setState(SimulationState.READY);
      this.emit(SimulationEvent.RESET);
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();

    // Dispose all bodies
    this.bodies.forEach(body => body.dispose());
    this.bodies.clear();

    // Cleanup physics
    if (this.physics) {
      this.physics.dispose();
    }

    // Clear event listeners
    this.eventListeners.clear();

    // Custom cleanup
    this.onDispose();
  }

  /**
   * Main animation loop
   */
  protected animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const rawDelta = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Apply time scale
    const deltaTime = rawDelta * this.timeControl.timeScale;
    this.timeControl.deltaTime = deltaTime;
    this.timeControl.totalTime += deltaTime;

    // Update simulation
    this.update(deltaTime);
  };

  /**
   * Update simulation (called every frame)
   */
  protected update(deltaTime: number): void {
    if (this.state !== SimulationState.RUNNING) {
      return;
    }

    // Update physics
    if (this.physics) {
      this.physics.step(deltaTime);
    }

    // Update all bodies
    this.bodies.forEach(body => body.update(deltaTime));

    // Custom update logic
    this.onUpdate(deltaTime);
  }

  /**
   * Setup scene (background, fog, lights, etc.)
   */
  protected setupScene(): void {
    const sceneConfig = this.config.scene;

    // Background
    if (typeof sceneConfig.background === 'string') {
      this.scene.background = new THREE.Color(sceneConfig.background);
    } else {
      this.scene.background = sceneConfig.background;
    }

    // Fog
    if (sceneConfig.fog) {
      this.scene.fog = new THREE.Fog(
        new THREE.Color(sceneConfig.fog.color),
        sceneConfig.fog.near,
        sceneConfig.fog.far
      );
    }

    // Camera position
    const [x, y, z] = sceneConfig.cameraPosition;
    this.camera.position.set(x, y, z);

    // Camera target
    if (sceneConfig.cameraTarget) {
      const [tx, ty, tz] = sceneConfig.cameraTarget;
      this.camera.lookAt(tx, ty, tz);
    }

    // Add basic lighting
    this.setupLights();
  }

  /**
   * Setup default lighting
   */
  protected setupLights(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    this.scene.add(directionalLight);

    // Point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 1000);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  /**
   * Set state and log
   */
  protected setState(newState: SimulationState): void {
    console.log(`[${this.constructor.name}] State: ${this.state} -> ${newState}`);
    this.state = newState;
  }

  /**
   * Event system - emit event
   */
  protected emit(event: SimulationEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Event system - add listener
   */
  on(event: SimulationEvent, listener: SimulationEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Event system - remove listener
   */
  off(event: SimulationEvent, listener: SimulationEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Add a body to the simulation
   */
  addBody(body: SimulationBody): void {
    this.bodies.set(body.id, body);
    this.scene.add(body.mesh);

    if (body.physicsBody && this.physics) {
      this.physics.addBody(body.physicsBody);
    }

    this.emit(SimulationEvent.BODY_ADDED, body);
  }

  /**
   * Remove a body from the simulation
   */
  removeBody(id: string): void {
    const body = this.bodies.get(id);
    if (!body) return;

    this.scene.remove(body.mesh);

    if (body.physicsBody && this.physics) {
      this.physics.removeBody(body.physicsBody);
    }

    body.dispose();
    this.bodies.delete(id);

    this.emit(SimulationEvent.BODY_REMOVED, { id });
  }

  /**
   * Get a body by ID
   */
  getBody(id: string): SimulationBody | undefined {
    return this.bodies.get(id);
  }

  /**
   * Get all bodies
   */
  getBodies(): SimulationBody[] {
    return Array.from(this.bodies.values());
  }

  /**
   * Set time scale (speed)
   */
  setTimeScale(scale: number): void {
    this.timeControl.timeScale = Math.max(0, scale);
    this.emit(SimulationEvent.PARAMETER_CHANGED, { parameter: 'timeScale', value: scale });
  }

  /**
   * Get current state
   */
  getState(): SimulationState {
    return this.state;
  }

  /**
   * Get time control info
   */
  getTimeControl(): Readonly<TimeControl> {
    return { ...this.timeControl };
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<TConfig> {
    return { ...this.config };
  }

  // ========================================================================
  // Abstract methods - must be implemented by subclasses
  // ========================================================================

  /**
   * Initialize physics engine
   */
  protected abstract initPhysics(): Promise<void>;

  /**
   * Create simulation bodies
   */
  protected abstract createBodies(): Promise<void>;

  /**
   * Custom initialization logic
   */
  protected abstract onInit(): Promise<void>;

  /**
   * Custom update logic (called every frame)
   */
  protected abstract onUpdate(deltaTime: number): void;

  /**
   * Custom cleanup logic
   */
  protected abstract onDispose(): void;
}
