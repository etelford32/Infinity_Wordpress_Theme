import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  PhysicsEngine,
  PhysicsBodyConfig,
  PhysicsBodyShape,
  CollisionEvent,
} from './PhysicsEngine';

/**
 * Cannon.js physics engine implementation
 * Good for: Rigid body dynamics, collisions, simple physics
 */
export class CannonPhysicsEngine extends PhysicsEngine {
  private world!: CANNON.World;
  private bodyMap: Map<CANNON.Body, string> = new Map();

  /**
   * Initialize Cannon.js world
   */
  async init(): Promise<void> {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(this.gravity.x, this.gravity.y, this.gravity.z),
    });

    // Solver settings for better performance
    this.world.solver.iterations = 10;
    this.world.solver.tolerance = 0.01;

    // Broad-phase collision detection (faster for many bodies)
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    // Allow bodies to sleep for better performance
    this.world.allowSleep = true;

    console.log('[CannonPhysicsEngine] Initialized');
  }

  /**
   * Step the physics simulation
   */
  step(deltaTime: number): void {
    // Cap deltaTime to prevent physics explosion
    const cappedDelta = Math.min(deltaTime, 1 / 30);

    // Fixed timestep for more stable physics
    const fixedTimeStep = 1 / 60;
    const maxSubSteps = 3;

    this.world.step(fixedTimeStep, cappedDelta, maxSubSteps);
  }

  /**
   * Create a physics body
   */
  createBody(config: PhysicsBodyConfig): CANNON.Body {
    // Create shape
    let shape: CANNON.Shape;

    switch (config.shape) {
      case PhysicsBodyShape.SPHERE:
        shape = new CANNON.Sphere(config.radius || 1);
        break;

      case PhysicsBodyShape.BOX:
        shape = new CANNON.Box(
          new CANNON.Vec3(
            (config.width || 1) / 2,
            (config.height || 1) / 2,
            (config.depth || 1) / 2
          )
        );
        break;

      case PhysicsBodyShape.PLANE:
        shape = new CANNON.Plane();
        break;

      case PhysicsBodyShape.CYLINDER:
        shape = new CANNON.Cylinder(
          config.radius || 1,
          config.radius || 1,
          config.height || 1,
          config.segments || 8
        );
        break;

      default:
        throw new Error(`Unsupported shape: ${config.shape}`);
    }

    // Create body
    const body = new CANNON.Body({
      mass: config.mass,
      shape,
      position: new CANNON.Vec3(config.position.x, config.position.y, config.position.z),
      quaternion: config.rotation
        ? new CANNON.Quaternion(
            config.rotation.x,
            config.rotation.y,
            config.rotation.z,
            config.rotation.w
          )
        : undefined,
      velocity: config.velocity
        ? new CANNON.Vec3(config.velocity.x, config.velocity.y, config.velocity.z)
        : undefined,
      angularVelocity: config.angularVelocity
        ? new CANNON.Vec3(
            config.angularVelocity.x,
            config.angularVelocity.y,
            config.angularVelocity.z
          )
        : undefined,
      linearDamping: config.damping ?? 0.01,
      angularDamping: config.angularDamping ?? 0.01,
      fixedRotation: config.fixedRotation ?? false,
      isTrigger: config.isTrigger ?? false,
    });

    // Material properties
    body.material = new CANNON.Material();
    if (config.restitution !== undefined) {
      body.material.restitution = config.restitution;
    }
    if (config.friction !== undefined) {
      body.material.friction = config.friction;
    }

    return body;
  }

  /**
   * Add body to world
   */
  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
    this.bodies.add(body);

    // Setup collision listener
    body.addEventListener('collide', (event: any) => {
      const bodyId = this.bodyMap.get(body);
      if (bodyId && this.collisionCallbacks.has(bodyId)) {
        const callback = this.collisionCallbacks.get(bodyId)!;
        const collisionEvent: CollisionEvent = {
          bodyA: body,
          bodyB: event.body,
          contacts: event.contact
            ? [this.cannonVecToThree(event.contact.ri)]
            : [],
          impulse: event.contact?.getImpactVelocityAlongNormal() || 0,
        };
        callback(collisionEvent);
      }
    });
  }

  /**
   * Remove body from world
   */
  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
    this.bodies.delete(body);
    this.bodyMap.delete(body);
  }

  /**
   * Apply force to body
   */
  applyForce(body: CANNON.Body, force: THREE.Vector3, point?: THREE.Vector3): void {
    const cannonForce = new CANNON.Vec3(force.x, force.y, force.z);
    const cannonPoint = point
      ? new CANNON.Vec3(point.x, point.y, point.z)
      : new CANNON.Vec3(0, 0, 0);

    body.applyForce(cannonForce, cannonPoint);
  }

  /**
   * Apply impulse to body
   */
  applyImpulse(body: CANNON.Body, impulse: THREE.Vector3, point?: THREE.Vector3): void {
    const cannonImpulse = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
    const cannonPoint = point
      ? new CANNON.Vec3(point.x, point.y, point.z)
      : new CANNON.Vec3(0, 0, 0);

    body.applyImpulse(cannonImpulse, cannonPoint);
  }

  /**
   * Set body position
   */
  setPosition(body: CANNON.Body, position: THREE.Vector3): void {
    body.position.set(position.x, position.y, position.z);
    body.wakeUp();
  }

  /**
   * Set body velocity
   */
  setVelocity(body: CANNON.Body, velocity: THREE.Vector3): void {
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    body.wakeUp();
  }

  /**
   * Set body mass
   */
  setMass(body: CANNON.Body, mass: number): void {
    body.mass = mass;
    body.updateMassProperties();
    body.wakeUp();
  }

  /**
   * Get body position
   */
  getPosition(body: CANNON.Body): THREE.Vector3 {
    return new THREE.Vector3(body.position.x, body.position.y, body.position.z);
  }

  /**
   * Get body velocity
   */
  getVelocity(body: CANNON.Body): THREE.Vector3 {
    return new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z);
  }

  /**
   * Get body rotation
   */
  getRotation(body: CANNON.Body): THREE.Quaternion {
    return new THREE.Quaternion(
      body.quaternion.x,
      body.quaternion.y,
      body.quaternion.z,
      body.quaternion.w
    );
  }

  /**
   * Set gravity
   */
  override setGravity(gravity: THREE.Vector3): void {
    super.setGravity(gravity);
    this.world.gravity.set(gravity.x, gravity.y, gravity.z);
  }

  /**
   * Get the Cannon.js world instance
   */
  getWorld(): CANNON.World {
    return this.world;
  }

  /**
   * Helper: Convert Cannon.Vec3 to THREE.Vector3
   */
  private cannonVecToThree(vec: CANNON.Vec3): THREE.Vector3 {
    return new THREE.Vector3(vec.x, vec.y, vec.z);
  }

  /**
   * Helper: Sync Three.js mesh with Cannon.js body
   */
  static syncMeshWithBody(mesh: THREE.Object3D, body: CANNON.Body): void {
    mesh.position.copy(body.position as any);
    mesh.quaternion.copy(body.quaternion as any);
  }

  /**
   * Cleanup
   */
  override dispose(): void {
    this.bodies.forEach(body => {
      this.world.removeBody(body as CANNON.Body);
    });

    super.dispose();
    this.bodyMap.clear();
  }
}
