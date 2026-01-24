import * as THREE from 'three';

/**
 * Physics engine types
 */
export enum PhysicsEngineType {
  CANNON = 'cannon',
  AMMO = 'ammo',
  GPU = 'gpu',
}

/**
 * Physics body shape
 */
export enum PhysicsBodyShape {
  SPHERE = 'sphere',
  BOX = 'box',
  PLANE = 'plane',
  CYLINDER = 'cylinder',
  CUSTOM = 'custom',
}

/**
 * Physics body configuration
 */
export interface PhysicsBodyConfig {
  shape: PhysicsBodyShape;
  mass: number;
  position: THREE.Vector3;
  rotation?: THREE.Quaternion;
  velocity?: THREE.Vector3;
  angularVelocity?: THREE.Vector3;
  restitution?: number; // Bounciness (0-1)
  friction?: number; // Friction coefficient
  damping?: number; // Linear damping (0-1)
  angularDamping?: number; // Angular damping (0-1)
  fixedRotation?: boolean;
  isTrigger?: boolean; // Collision detection without physical response

  // Shape-specific
  radius?: number; // For sphere, cylinder
  width?: number; // For box
  height?: number; // For box, cylinder
  depth?: number; // For box
  segments?: number;
}

/**
 * Collision event data
 */
export interface CollisionEvent {
  bodyA: any;
  bodyB: any;
  contacts: THREE.Vector3[];
  impulse: number;
}

/**
 * Abstract physics engine interface
 */
export abstract class PhysicsEngine {
  protected gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  protected bodies: Set<any> = new Set();
  protected collisionCallbacks: Map<string, (event: CollisionEvent) => void> = new Map();

  /**
   * Initialize the physics engine
   */
  abstract init(): Promise<void>;

  /**
   * Step the physics simulation
   */
  abstract step(deltaTime: number): void;

  /**
   * Create a physics body
   */
  abstract createBody(config: PhysicsBodyConfig): any;

  /**
   * Add a body to the physics world
   */
  abstract addBody(body: any): void;

  /**
   * Remove a body from the physics world
   */
  abstract removeBody(body: any): void;

  /**
   * Apply force to a body
   */
  abstract applyForce(body: any, force: THREE.Vector3, point?: THREE.Vector3): void;

  /**
   * Apply impulse to a body
   */
  abstract applyImpulse(body: any, impulse: THREE.Vector3, point?: THREE.Vector3): void;

  /**
   * Set body position
   */
  abstract setPosition(body: any, position: THREE.Vector3): void;

  /**
   * Set body velocity
   */
  abstract setVelocity(body: any, velocity: THREE.Vector3): void;

  /**
   * Set body mass
   */
  abstract setMass(body: any, mass: number): void;

  /**
   * Get body position
   */
  abstract getPosition(body: any): THREE.Vector3;

  /**
   * Get body velocity
   */
  abstract getVelocity(body: any): THREE.Vector3;

  /**
   * Get body rotation (quaternion)
   */
  abstract getRotation(body: any): THREE.Quaternion;

  /**
   * Set gravity
   */
  setGravity(gravity: THREE.Vector3): void {
    this.gravity.copy(gravity);
  }

  /**
   * Get gravity
   */
  getGravity(): THREE.Vector3 {
    return this.gravity.clone();
  }

  /**
   * Register collision callback
   */
  onCollision(bodyId: string, callback: (event: CollisionEvent) => void): void {
    this.collisionCallbacks.set(bodyId, callback);
  }

  /**
   * Unregister collision callback
   */
  offCollision(bodyId: string): void {
    this.collisionCallbacks.delete(bodyId);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.bodies.clear();
    this.collisionCallbacks.clear();
  }
}

/**
 * Factory to create physics engine instances
 */
export class PhysicsEngineFactory {
  static async create(type: PhysicsEngineType): Promise<PhysicsEngine> {
    let engine: PhysicsEngine;

    switch (type) {
      case PhysicsEngineType.CANNON:
        const { CannonPhysicsEngine } = await import('./CannonPhysicsEngine');
        engine = new CannonPhysicsEngine();
        break;

      case PhysicsEngineType.AMMO:
        const { AmmoPhysicsEngine } = await import('./AmmoPhysicsEngine');
        engine = new AmmoPhysicsEngine();
        break;

      case PhysicsEngineType.GPU:
        const { GPUPhysicsEngine } = await import('./GPUPhysicsEngine');
        engine = new GPUPhysicsEngine();
        break;

      default:
        throw new Error(`Unknown physics engine type: ${type}`);
    }

    await engine.init();
    return engine;
  }
}
