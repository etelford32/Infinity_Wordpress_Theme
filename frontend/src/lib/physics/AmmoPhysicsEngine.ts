import * as THREE from 'three';
import {
  PhysicsEngine,
  PhysicsBodyConfig,
  PhysicsBodyShape,
  CollisionEvent,
} from './PhysicsEngine';

// Ammo.js types - using interface declarations for better flexibility
// The actual Ammo.js module is loaded dynamically and provides these classes
interface AmmoAPI {
  btVector3: new (x?: number, y?: number, z?: number) => AmmoVector3;
  btQuaternion: new (x?: number, y?: number, z?: number, w?: number) => AmmoQuaternion;
  AmmoTransform: new () => AmmoTransform;
  btDefaultMotionState: new (transform?: AmmoTransform) => AmmoMotionState;
  btDefaultCollisionConfiguration: new () => unknown;
  btCollisionDispatcher: new (config: unknown) => unknown;
  btDbvtBroadphase: new () => unknown;
  btSequentialImpulseConstraintSolver: new () => unknown;
  AmmoDynamicsWorld: new (
    dispatcher: unknown,
    broadphase: unknown,
    solver: unknown,
    config: unknown
  ) => AmmoDynamicsWorld;
  btSphereShape: new (radius: number) => AmmoCollisionShape;
  btBoxShape: new (halfExtents: AmmoVector3) => AmmoCollisionShape;
  btStaticPlaneShape: new (normal: AmmoVector3, constant: number) => AmmoCollisionShape;
  btCylinderShape: new (halfExtents: AmmoVector3) => AmmoCollisionShape;
  AmmoRigidBodyConstructionInfo: new (
    mass: number,
    motionState: AmmoMotionState,
    shape: AmmoCollisionShape,
    localInertia: AmmoVector3
  ) => AmmoRigidBodyInfo;
  AmmoRigidBody: new (info: AmmoRigidBodyInfo) => AmmoRigidBody;
  destroy: (obj: unknown) => void;
}

interface AmmoVector3 {
  x(): number;
  y(): number;
  z(): number;
  setValue(x: number, y: number, z: number): void;
}

interface AmmoQuaternion {
  x(): number;
  y(): number;
  z(): number;
  w(): number;
  setValue(x: number, y: number, z: number, w: number): void;
}

interface AmmoTransform {
  setIdentity(): void;
  setOrigin(origin: AmmoVector3): void;
  setRotation(rotation: AmmoQuaternion): void;
  getOrigin(): AmmoVector3;
  getRotation(): AmmoQuaternion;
}

interface AmmoMotionState {
  getWorldTransform(transform: AmmoTransform): void;
  setWorldTransform(transform: AmmoTransform): void;
}

interface AmmoCollisionShape {
  calculateLocalInertia(mass: number, inertia: AmmoVector3): void;
  setMargin(margin: number): void;
}

interface AmmoRigidBodyInfo {
  m_friction: number;
  m_restitution: number;
  m_linearDamping: number;
  m_angularDamping: number;
}

interface AmmoRigidBody {
  setLinearVelocity(velocity: AmmoVector3): void;
  setAngularVelocity(velocity: AmmoVector3): void;
  getLinearVelocity(): AmmoVector3;
  getAngularVelocity(): AmmoVector3;
  setAngularFactor(factor: AmmoVector3): void;
  applyCentralForce(force: AmmoVector3): void;
  applyForce(force: AmmoVector3, relPos: AmmoVector3): void;
  applyCentralImpulse(impulse: AmmoVector3): void;
  applyImpulse(impulse: AmmoVector3, relPos: AmmoVector3): void;
  applyTorque(torque: AmmoVector3): void;
  setMassProps(mass: number, inertia: AmmoVector3): void;
  getMotionState(): AmmoMotionState;
  getWorldTransform(): AmmoTransform;
  setWorldTransform(transform: AmmoTransform): void;
  setActivationState(state: number): void;
  activate(forceActivation?: boolean): void;
  setCollisionFlags(flags: number): void;
  getCollisionFlags(): number;
  getCollisionShape(): AmmoCollisionShape;
}

interface AmmoDynamicsWorld {
  setGravity(gravity: AmmoVector3): void;
  stepSimulation(timeStep: number, maxSubSteps?: number, fixedTimeStep?: number): number;
  addRigidBody(body: AmmoRigidBody, group?: number, mask?: number): void;
  removeRigidBody(body: AmmoRigidBody): void;
  getDispatcher(): AmmoDispatcher;
}

interface AmmoDispatcher {
  getNumManifolds(): number;
  getManifoldByIndexInternal(index: number): AmmoManifold;
}

interface AmmoManifold {
  getBody0(): AmmoRigidBody;
  getBody1(): AmmoRigidBody;
  getNumContacts(): number;
  getContactPoint(index: number): AmmoContactPoint;
}

interface AmmoContactPoint {
  getPositionWorldOnA(): AmmoVector3;
  getAppliedImpulse(): number;
}

/**
 * Ammo.js physics engine implementation
 * Good for: Realistic physics, complex constraints, soft bodies,
 * and accurate gravitational N-body simulations
 *
 * Ammo.js is a direct port of the Bullet Physics engine to JavaScript
 * via Emscripten, providing industry-standard physics simulation.
 */
export class AmmoPhysicsEngine extends PhysicsEngine {
  private Ammo: AmmoAPI | null = null;
  private world: AmmoDynamicsWorld | null = null;
  private bodyMap: Map<AmmoRigidBody, string> = new Map();
  private bodyIdCounter = 0;

  // Reusable objects to avoid GC pressure
  private tmpTrans: AmmoTransform | null = null;
  private tmpVec: AmmoVector3 | null = null;
  private tmpQuat: AmmoQuaternion | null = null;

  /**
   * Initialize Ammo.js world
   */
  async init(): Promise<void> {
    // Dynamically import Ammo.js
    const AmmoModule = await import('ammo.js');
    this.Ammo = (await AmmoModule.default()) as unknown as AmmoAPI;

    // Create collision configuration
    const collisionConfiguration = new this.Ammo.btDefaultCollisionConfiguration();

    // Create dispatcher for collision detection
    const dispatcher = new this.Ammo.btCollisionDispatcher(collisionConfiguration);

    // Broadphase for fast collision filtering
    const broadphase = new this.Ammo.btDbvtBroadphase();

    // Constraint solver
    const solver = new this.Ammo.btSequentialImpulseConstraintSolver();

    // Create the dynamics world
    this.world = new this.Ammo.AmmoDynamicsWorld(
      dispatcher,
      broadphase,
      solver,
      collisionConfiguration
    );

    // Set gravity
    const gravity = new this.Ammo.btVector3(this.gravity.x, this.gravity.y, this.gravity.z);
    this.world.setGravity(gravity);
    this.Ammo.destroy(gravity);

    // Initialize reusable transform objects
    this.tmpTrans = new this.Ammo.AmmoTransform();
    this.tmpVec = new this.Ammo.btVector3(0, 0, 0);
    this.tmpQuat = new this.Ammo.btQuaternion(0, 0, 0, 1);

    console.log('[AmmoPhysicsEngine] Initialized with Bullet Physics');
  }

  /**
   * Step the physics simulation
   */
  step(deltaTime: number): void {
    if (!this.world) return;

    // Cap deltaTime to prevent physics explosion
    const cappedDelta = Math.min(deltaTime, 1 / 30);

    // Fixed timestep for stable physics
    const fixedTimeStep = 1 / 60;
    const maxSubSteps = 3;

    this.world.stepSimulation(cappedDelta, maxSubSteps, fixedTimeStep);

    // Process collisions
    this.processCollisions();
  }

  /**
   * Process collision events and trigger callbacks
   */
  private processCollisions(): void {
    if (!this.world || !this.Ammo) return;

    const dispatcher = this.world.getDispatcher();
    const numManifolds = dispatcher.getNumManifolds();

    for (let i = 0; i < numManifolds; i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i);
      const numContacts = manifold.getNumContacts();

      if (numContacts > 0) {
        const bodyA = manifold.getBody0() as AmmoRigidBody;
        const bodyB = manifold.getBody1() as AmmoRigidBody;

        const bodyIdA = this.bodyMap.get(bodyA);
        const bodyIdB = this.bodyMap.get(bodyB);

        // Collect contact points
        const contacts: THREE.Vector3[] = [];
        let totalImpulse = 0;

        for (let j = 0; j < numContacts; j++) {
          const point = manifold.getContactPoint(j);
          const worldPos = point.getPositionWorldOnA();
          contacts.push(new THREE.Vector3(worldPos.x(), worldPos.y(), worldPos.z()));
          totalImpulse += point.getAppliedImpulse();
        }

        // Trigger callbacks
        if (bodyIdA && this.collisionCallbacks.has(bodyIdA)) {
          const callback = this.collisionCallbacks.get(bodyIdA)!;
          const event: CollisionEvent = {
            bodyA,
            bodyB,
            contacts,
            impulse: totalImpulse,
          };
          callback(event);
        }

        if (bodyIdB && this.collisionCallbacks.has(bodyIdB)) {
          const callback = this.collisionCallbacks.get(bodyIdB)!;
          const event: CollisionEvent = {
            bodyA: bodyB,
            bodyB: bodyA,
            contacts,
            impulse: totalImpulse,
          };
          callback(event);
        }
      }
    }
  }

  /**
   * Create a physics body
   */
  createBody(config: PhysicsBodyConfig): AmmoRigidBody {
    if (!this.Ammo) {
      throw new Error('[AmmoPhysicsEngine] Not initialized');
    }

    // Create collision shape
    const shape = this.createShape(config);

    // Calculate local inertia for dynamic bodies
    const localInertia = new this.Ammo.btVector3(0, 0, 0);
    if (config.mass > 0) {
      shape.calculateLocalInertia(config.mass, localInertia);
    }

    // Create transform
    const transform = new this.Ammo.AmmoTransform();
    transform.setIdentity();

    // Set position
    const origin = new this.Ammo.btVector3(
      config.position.x,
      config.position.y,
      config.position.z
    );
    transform.setOrigin(origin);

    // Set rotation
    if (config.rotation) {
      const rotation = new this.Ammo.btQuaternion(
        config.rotation.x,
        config.rotation.y,
        config.rotation.z,
        config.rotation.w
      );
      transform.setRotation(rotation);
      this.Ammo.destroy(rotation);
    }

    // Create motion state
    const motionState = new this.Ammo.btDefaultMotionState(transform);

    // Create rigid body construction info
    const rbInfo = new this.Ammo.AmmoRigidBodyConstructionInfo(
      config.mass,
      motionState,
      shape,
      localInertia
    );

    // Set material properties
    rbInfo.m_friction = config.friction ?? 0.5;
    rbInfo.m_restitution = config.restitution ?? 0.0;
    rbInfo.m_linearDamping = config.damping ?? 0.01;
    rbInfo.m_angularDamping = config.angularDamping ?? 0.01;

    // Create rigid body
    const body = new this.Ammo.AmmoRigidBody(rbInfo);

    // Set initial velocity if provided
    if (config.velocity) {
      const velocity = new this.Ammo.btVector3(
        config.velocity.x,
        config.velocity.y,
        config.velocity.z
      );
      body.setLinearVelocity(velocity);
      this.Ammo.destroy(velocity);
    }

    // Set angular velocity if provided
    if (config.angularVelocity) {
      const angVel = new this.Ammo.btVector3(
        config.angularVelocity.x,
        config.angularVelocity.y,
        config.angularVelocity.z
      );
      body.setAngularVelocity(angVel);
      this.Ammo.destroy(angVel);
    }

    // Handle fixed rotation
    if (config.fixedRotation) {
      const zero = new this.Ammo.btVector3(0, 0, 0);
      body.setAngularFactor(zero);
      this.Ammo.destroy(zero);
    }

    // Handle trigger (ghost) bodies
    if (config.isTrigger) {
      body.setCollisionFlags(
        body.getCollisionFlags() | 4 // CF_NO_CONTACT_RESPONSE
      );
    }

    // Cleanup temporary objects
    this.Ammo.destroy(origin);
    this.Ammo.destroy(localInertia);
    this.Ammo.destroy(transform);
    this.Ammo.destroy(rbInfo);

    return body;
  }

  /**
   * Create collision shape based on config
   */
  private createShape(config: PhysicsBodyConfig): AmmoCollisionShape {
    if (!this.Ammo) {
      throw new Error('[AmmoPhysicsEngine] Not initialized');
    }

    switch (config.shape) {
      case PhysicsBodyShape.SPHERE: {
        return new this.Ammo.btSphereShape(config.radius || 1);
      }

      case PhysicsBodyShape.BOX: {
        const halfExtents = new this.Ammo.btVector3(
          (config.width || 1) / 2,
          (config.height || 1) / 2,
          (config.depth || 1) / 2
        );
        const shape = new this.Ammo.btBoxShape(halfExtents);
        this.Ammo.destroy(halfExtents);
        return shape;
      }

      case PhysicsBodyShape.PLANE: {
        // Create an infinite static plane
        const normal = new this.Ammo.btVector3(0, 1, 0);
        const shape = new this.Ammo.btStaticPlaneShape(normal, 0);
        this.Ammo.destroy(normal);
        return shape;
      }

      case PhysicsBodyShape.CYLINDER: {
        const halfExtents = new this.Ammo.btVector3(
          config.radius || 1,
          (config.height || 1) / 2,
          config.radius || 1
        );
        const shape = new this.Ammo.btCylinderShape(halfExtents);
        this.Ammo.destroy(halfExtents);
        return shape;
      }

      default:
        throw new Error(`[AmmoPhysicsEngine] Unsupported shape: ${config.shape}`);
    }
  }

  /**
   * Add body to world
   */
  addBody(body: AmmoRigidBody): void {
    if (!this.world) return;

    // Generate unique ID for collision tracking
    const bodyId = `ammo_body_${this.bodyIdCounter++}`;
    this.bodyMap.set(body, bodyId);

    this.world.addRigidBody(body);
    this.bodies.add(body);
  }

  /**
   * Add body to world with collision groups
   */
  addBodyWithGroups(body: AmmoRigidBody, group: number, mask: number): void {
    if (!this.world) return;

    const bodyId = `ammo_body_${this.bodyIdCounter++}`;
    this.bodyMap.set(body, bodyId);

    this.world.addRigidBody(body, group, mask);
    this.bodies.add(body);
  }

  /**
   * Remove body from world
   */
  removeBody(body: AmmoRigidBody): void {
    if (!this.world || !this.Ammo) return;

    this.world.removeRigidBody(body);
    this.bodies.delete(body);

    const bodyId = this.bodyMap.get(body);
    if (bodyId) {
      this.collisionCallbacks.delete(bodyId);
      this.bodyMap.delete(body);
    }

    // Clean up Ammo.js objects
    const motionState = body.getMotionState();
    this.Ammo.destroy(motionState);
    this.Ammo.destroy(body);
  }

  /**
   * Apply force to body (accumulated over the timestep)
   */
  applyForce(body: AmmoRigidBody, force: THREE.Vector3, point?: THREE.Vector3): void {
    if (!this.Ammo) return;

    const ammoForce = new this.Ammo.btVector3(force.x, force.y, force.z);

    if (point) {
      const ammoPoint = new this.Ammo.btVector3(point.x, point.y, point.z);
      body.applyForce(ammoForce, ammoPoint);
      this.Ammo.destroy(ammoPoint);
    } else {
      body.applyCentralForce(ammoForce);
    }

    body.activate(true);
    this.Ammo.destroy(ammoForce);
  }

  /**
   * Apply impulse to body (instantaneous change in momentum)
   */
  applyImpulse(body: AmmoRigidBody, impulse: THREE.Vector3, point?: THREE.Vector3): void {
    if (!this.Ammo) return;

    const ammoImpulse = new this.Ammo.btVector3(impulse.x, impulse.y, impulse.z);

    if (point) {
      const ammoPoint = new this.Ammo.btVector3(point.x, point.y, point.z);
      body.applyImpulse(ammoImpulse, ammoPoint);
      this.Ammo.destroy(ammoPoint);
    } else {
      body.applyCentralImpulse(ammoImpulse);
    }

    body.activate(true);
    this.Ammo.destroy(ammoImpulse);
  }

  /**
   * Apply torque to body
   */
  applyTorque(body: AmmoRigidBody, torque: THREE.Vector3): void {
    if (!this.Ammo) return;

    const ammoTorque = new this.Ammo.btVector3(torque.x, torque.y, torque.z);
    body.applyTorque(ammoTorque);
    body.activate(true);
    this.Ammo.destroy(ammoTorque);
  }

  /**
   * Set body position
   */
  setPosition(body: AmmoRigidBody, position: THREE.Vector3): void {
    if (!this.Ammo || !this.tmpTrans || !this.tmpVec) return;

    const motionState = body.getMotionState();
    motionState.getWorldTransform(this.tmpTrans);

    this.tmpVec.setValue(position.x, position.y, position.z);
    this.tmpTrans.setOrigin(this.tmpVec);

    motionState.setWorldTransform(this.tmpTrans);
    body.setWorldTransform(this.tmpTrans);
    body.activate(true);
  }

  /**
   * Set body velocity
   */
  setVelocity(body: AmmoRigidBody, velocity: THREE.Vector3): void {
    if (!this.Ammo) return;

    const ammoVel = new this.Ammo.btVector3(velocity.x, velocity.y, velocity.z);
    body.setLinearVelocity(ammoVel);
    body.activate(true);
    this.Ammo.destroy(ammoVel);
  }

  /**
   * Set body angular velocity
   */
  setAngularVelocity(body: AmmoRigidBody, angularVelocity: THREE.Vector3): void {
    if (!this.Ammo) return;

    const ammoAngVel = new this.Ammo.btVector3(
      angularVelocity.x,
      angularVelocity.y,
      angularVelocity.z
    );
    body.setAngularVelocity(ammoAngVel);
    body.activate(true);
    this.Ammo.destroy(ammoAngVel);
  }

  /**
   * Set body mass (recalculates inertia)
   */
  setMass(body: AmmoRigidBody, mass: number): void {
    if (!this.Ammo) return;

    const localInertia = new this.Ammo.btVector3(0, 0, 0);

    if (mass > 0) {
      body.getCollisionShape().calculateLocalInertia(mass, localInertia);
    }

    body.setMassProps(mass, localInertia);
    body.activate(true);
    this.Ammo.destroy(localInertia);
  }

  /**
   * Get body position
   */
  getPosition(body: AmmoRigidBody): THREE.Vector3 {
    if (!this.tmpTrans) return new THREE.Vector3();

    const motionState = body.getMotionState();
    motionState.getWorldTransform(this.tmpTrans);
    const origin = this.tmpTrans.getOrigin();

    return new THREE.Vector3(origin.x(), origin.y(), origin.z());
  }

  /**
   * Get body velocity
   */
  getVelocity(body: AmmoRigidBody): THREE.Vector3 {
    const velocity = body.getLinearVelocity();
    return new THREE.Vector3(velocity.x(), velocity.y(), velocity.z());
  }

  /**
   * Get body angular velocity
   */
  getAngularVelocity(body: AmmoRigidBody): THREE.Vector3 {
    const angVel = body.getAngularVelocity();
    return new THREE.Vector3(angVel.x(), angVel.y(), angVel.z());
  }

  /**
   * Get body rotation
   */
  getRotation(body: AmmoRigidBody): THREE.Quaternion {
    if (!this.tmpTrans) return new THREE.Quaternion();

    const motionState = body.getMotionState();
    motionState.getWorldTransform(this.tmpTrans);
    const rotation = this.tmpTrans.getRotation();

    return new THREE.Quaternion(
      rotation.x(),
      rotation.y(),
      rotation.z(),
      rotation.w()
    );
  }

  /**
   * Set gravity
   */
  override setGravity(gravity: THREE.Vector3): void {
    super.setGravity(gravity);

    if (this.world && this.Ammo) {
      const ammoGravity = new this.Ammo.btVector3(gravity.x, gravity.y, gravity.z);
      this.world.setGravity(ammoGravity);
      this.Ammo.destroy(ammoGravity);
    }
  }

  /**
   * Get the Ammo.js world instance
   */
  getWorld(): AmmoDynamicsWorld | null {
    return this.world;
  }

  /**
   * Get the Ammo module reference
   */
  getAmmo(): AmmoAPI | null {
    return this.Ammo;
  }

  /**
   * Get body ID for collision callback registration
   */
  getBodyId(body: AmmoRigidBody): string | undefined {
    return this.bodyMap.get(body);
  }

  /**
   * Register collision callback by body
   */
  onBodyCollision(body: AmmoRigidBody, callback: (event: CollisionEvent) => void): void {
    const bodyId = this.bodyMap.get(body);
    if (bodyId) {
      this.collisionCallbacks.set(bodyId, callback);
    }
  }

  /**
   * Helper: Sync Three.js mesh with Ammo.js body
   */
  static syncMeshWithBody(
    mesh: THREE.Object3D,
    body: AmmoRigidBody,
    tmpTrans: AmmoTransform
  ): void {
    const motionState = body.getMotionState();
    if (motionState) {
      motionState.getWorldTransform(tmpTrans);
      const origin = tmpTrans.getOrigin();
      const rotation = tmpTrans.getRotation();

      mesh.position.set(origin.x(), origin.y(), origin.z());
      mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
  }

  /**
   * Disable deactivation for a body (keeps it always active)
   */
  disableDeactivation(body: AmmoRigidBody): void {
    body.setActivationState(4); // DISABLE_DEACTIVATION
  }

  /**
   * Set body to kinematic mode
   */
  setKinematic(body: AmmoRigidBody): void {
    if (!this.Ammo) return;

    body.setCollisionFlags(
      body.getCollisionFlags() | 2 // CF_KINEMATIC_OBJECT
    );
    body.setActivationState(4); // DISABLE_DEACTIVATION
  }

  /**
   * Cleanup
   */
  override dispose(): void {
    if (!this.Ammo || !this.world) return;

    // Remove and destroy all bodies
    this.bodies.forEach((body) => {
      const rigidBody = body as AmmoRigidBody;
      this.world!.removeRigidBody(rigidBody);
      const motionState = rigidBody.getMotionState();
      if (motionState) {
        this.Ammo!.destroy(motionState);
      }
      this.Ammo!.destroy(rigidBody);
    });

    // Cleanup reusable objects
    if (this.tmpTrans) this.Ammo.destroy(this.tmpTrans);
    if (this.tmpVec) this.Ammo.destroy(this.tmpVec);
    if (this.tmpQuat) this.Ammo.destroy(this.tmpQuat);

    this.tmpTrans = null;
    this.tmpVec = null;
    this.tmpQuat = null;
    this.world = null;
    this.bodyMap.clear();

    super.dispose();
    console.log('[AmmoPhysicsEngine] Disposed');
  }
}
