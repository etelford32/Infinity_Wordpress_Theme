/**
 * Type declarations for Ammo.js (Bullet Physics port)
 * These are partial typings covering the most commonly used classes
 */

declare module 'ammo.js' {
  export default function Ammo(): Promise<typeof Ammo>;

  // Vector and Transform types
  export class btVector3 {
    constructor(x?: number, y?: number, z?: number);
    x(): number;
    y(): number;
    z(): number;
    setX(x: number): void;
    setY(y: number): void;
    setZ(z: number): void;
    setValue(x: number, y: number, z: number): void;
    normalize(): void;
    length(): number;
    op_add(v: btVector3): btVector3;
    op_sub(v: btVector3): btVector3;
    op_mul(s: number): btVector3;
  }

  export class btQuaternion {
    constructor(x?: number, y?: number, z?: number, w?: number);
    x(): number;
    y(): number;
    z(): number;
    w(): number;
    setX(x: number): void;
    setY(y: number): void;
    setZ(z: number): void;
    setW(w: number): void;
    setValue(x: number, y: number, z: number, w: number): void;
    setEulerZYX(z: number, y: number, x: number): void;
    normalize(): void;
  }

  export class btTransform {
    constructor();
    setIdentity(): void;
    setOrigin(origin: btVector3): void;
    setRotation(rotation: btQuaternion): void;
    getOrigin(): btVector3;
    getRotation(): btQuaternion;
  }

  // Motion State
  export class btDefaultMotionState {
    constructor(startTrans?: btTransform, centerOfMassOffset?: btTransform);
    getWorldTransform(worldTrans: btTransform): void;
    setWorldTransform(worldTrans: btTransform): void;
  }

  export class btMotionState {
    getWorldTransform(worldTrans: btTransform): void;
    setWorldTransform(worldTrans: btTransform): void;
  }

  // Collision Shapes
  export class btCollisionShape {
    setLocalScaling(scaling: btVector3): void;
    getLocalScaling(): btVector3;
    calculateLocalInertia(mass: number, inertia: btVector3): void;
    setMargin(margin: number): void;
    getMargin(): number;
  }

  export class btBoxShape extends btCollisionShape {
    constructor(boxHalfExtents: btVector3);
  }

  export class btSphereShape extends btCollisionShape {
    constructor(radius: number);
    getRadius(): number;
  }

  export class btCylinderShape extends btCollisionShape {
    constructor(halfExtents: btVector3);
  }

  export class btCylinderShapeX extends btCylinderShape {
    constructor(halfExtents: btVector3);
  }

  export class btCylinderShapeZ extends btCylinderShape {
    constructor(halfExtents: btVector3);
  }

  export class btCapsuleShape extends btCollisionShape {
    constructor(radius: number, height: number);
  }

  export class btConeShape extends btCollisionShape {
    constructor(radius: number, height: number);
  }

  export class btStaticPlaneShape extends btCollisionShape {
    constructor(planeNormal: btVector3, planeConstant: number);
  }

  export class btCompoundShape extends btCollisionShape {
    constructor(enableDynamicAabbTree?: boolean);
    addChildShape(localTransform: btTransform, shape: btCollisionShape): void;
    removeChildShape(shape: btCollisionShape): void;
    getNumChildShapes(): number;
    getChildShape(index: number): btCollisionShape;
  }

  export class btConvexHullShape extends btCollisionShape {
    constructor();
    addPoint(point: btVector3, recalculateLocalAabb?: boolean): void;
  }

  // Rigid Body
  export class btRigidBodyConstructionInfo {
    constructor(
      mass: number,
      motionState: btMotionState,
      collisionShape: btCollisionShape,
      localInertia?: btVector3
    );
    m_linearDamping: number;
    m_angularDamping: number;
    m_friction: number;
    m_restitution: number;
    m_linearSleepingThreshold: number;
    m_angularSleepingThreshold: number;
  }

  export class btRigidBody {
    constructor(constructionInfo: btRigidBodyConstructionInfo);
    setLinearVelocity(velocity: btVector3): void;
    setAngularVelocity(velocity: btVector3): void;
    getLinearVelocity(): btVector3;
    getAngularVelocity(): btVector3;
    setLinearFactor(factor: btVector3): void;
    setAngularFactor(factor: btVector3): void;
    applyCentralForce(force: btVector3): void;
    applyForce(force: btVector3, relPos: btVector3): void;
    applyCentralImpulse(impulse: btVector3): void;
    applyImpulse(impulse: btVector3, relPos: btVector3): void;
    applyTorque(torque: btVector3): void;
    applyTorqueImpulse(torque: btVector3): void;
    setDamping(linear: number, angular: number): void;
    setMassProps(mass: number, inertia: btVector3): void;
    getMotionState(): btMotionState;
    setMotionState(motionState: btMotionState): void;
    getWorldTransform(): btTransform;
    setWorldTransform(transform: btTransform): void;
    getCenterOfMassTransform(): btTransform;
    setCenterOfMassTransform(transform: btTransform): void;
    setActivationState(state: number): void;
    getActivationState(): number;
    activate(forceActivation?: boolean): void;
    isActive(): boolean;
    isStaticObject(): boolean;
    isKinematicObject(): boolean;
    setCollisionFlags(flags: number): void;
    getCollisionFlags(): number;
    setFriction(friction: number): void;
    getFriction(): number;
    setRestitution(restitution: number): void;
    getRestitution(): number;
    setUserIndex(index: number): void;
    getUserIndex(): number;
    setUserPointer(userPointer: unknown): void;
    getUserPointer(): unknown;
    getCollisionShape(): btCollisionShape;
    setCollisionShape(shape: btCollisionShape): void;
    setGravity(gravity: btVector3): void;
    getGravity(): btVector3;
  }

  // Collision Configuration
  export class btDefaultCollisionConfiguration {
    constructor();
  }

  export class btCollisionConfiguration {}

  // Dispatcher
  export class btCollisionDispatcher {
    constructor(collisionConfiguration: btCollisionConfiguration);
    getNumManifolds(): number;
    getManifoldByIndexInternal(index: number): btPersistentManifold;
  }

  export class btDispatcher {
    getNumManifolds(): number;
    getManifoldByIndexInternal(index: number): btPersistentManifold;
  }

  // Broadphase
  export class btBroadphaseInterface {}

  export class btDbvtBroadphase extends btBroadphaseInterface {
    constructor();
  }

  export class btAxisSweep3 extends btBroadphaseInterface {
    constructor(worldAabbMin: btVector3, worldAabbMax: btVector3, maxHandles?: number);
  }

  // Constraint Solver
  export class btConstraintSolver {}

  export class btSequentialImpulseConstraintSolver extends btConstraintSolver {
    constructor();
  }

  // Dynamics World
  export class btDynamicsWorld {
    addRigidBody(body: btRigidBody): void;
    addRigidBody(body: btRigidBody, group: number, mask: number): void;
    removeRigidBody(body: btRigidBody): void;
    setGravity(gravity: btVector3): void;
    getGravity(): btVector3;
    stepSimulation(timeStep: number, maxSubSteps?: number, fixedTimeStep?: number): number;
    getDispatcher(): btDispatcher;
  }

  export class btDiscreteDynamicsWorld extends btDynamicsWorld {
    constructor(
      dispatcher: btDispatcher,
      broadphase: btBroadphaseInterface,
      solver: btConstraintSolver,
      collisionConfiguration: btCollisionConfiguration
    );
  }

  // Contact/Collision manifold
  export class btPersistentManifold {
    getBody0(): btRigidBody;
    getBody1(): btRigidBody;
    getNumContacts(): number;
    getContactPoint(index: number): btManifoldPoint;
  }

  export class btManifoldPoint {
    getPositionWorldOnA(): btVector3;
    getPositionWorldOnB(): btVector3;
    getAppliedImpulse(): number;
    getDistance(): number;
    m_normalWorldOnB: btVector3;
  }

  // Constraints
  export class btTypedConstraint {
    enableFeedback(needsFeedback: boolean): void;
    getAppliedImpulse(): number;
  }

  export class btPoint2PointConstraint extends btTypedConstraint {
    constructor(rbA: btRigidBody, pivotInA: btVector3);
    constructor(rbA: btRigidBody, rbB: btRigidBody, pivotInA: btVector3, pivotInB: btVector3);
    setPivotA(pivotA: btVector3): void;
    setPivotB(pivotB: btVector3): void;
  }

  export class btHingeConstraint extends btTypedConstraint {
    constructor(
      rbA: btRigidBody,
      rbB: btRigidBody,
      pivotInA: btVector3,
      pivotInB: btVector3,
      axisInA: btVector3,
      axisInB: btVector3,
      useReferenceFrameA?: boolean
    );
    setLimit(low: number, high: number, softness?: number, biasFactor?: number, relaxationFactor?: number): void;
    enableAngularMotor(enableMotor: boolean, targetVelocity: number, maxMotorImpulse: number): void;
  }

  export class btSliderConstraint extends btTypedConstraint {
    constructor(
      rbA: btRigidBody,
      rbB: btRigidBody,
      frameInA: btTransform,
      frameInB: btTransform,
      useLinearReferenceFrameA: boolean
    );
    setLowerLinLimit(lowerLimit: number): void;
    setUpperLinLimit(upperLimit: number): void;
    setLowerAngLimit(lowerLimit: number): void;
    setUpperAngLimit(upperLimit: number): void;
  }

  export class btGeneric6DofConstraint extends btTypedConstraint {
    constructor(
      rbA: btRigidBody,
      rbB: btRigidBody,
      frameInA: btTransform,
      frameInB: btTransform,
      useLinearReferenceFrameA: boolean
    );
    setLinearLowerLimit(linearLower: btVector3): void;
    setLinearUpperLimit(linearUpper: btVector3): void;
    setAngularLowerLimit(angularLower: btVector3): void;
    setAngularUpperLimit(angularUpper: btVector3): void;
  }

  export class btGeneric6DofSpringConstraint extends btGeneric6DofConstraint {
    constructor(
      rbA: btRigidBody,
      rbB: btRigidBody,
      frameInA: btTransform,
      frameInB: btTransform,
      useLinearReferenceFrameA: boolean
    );
    enableSpring(index: number, onOff: boolean): void;
    setStiffness(index: number, stiffness: number): void;
    setDamping(index: number, damping: number): void;
  }

  // Activation states
  export const ACTIVE_TAG: number;
  export const ISLAND_SLEEPING: number;
  export const WANTS_DEACTIVATION: number;
  export const DISABLE_DEACTIVATION: number;
  export const DISABLE_SIMULATION: number;

  // Collision flags
  export const CF_STATIC_OBJECT: number;
  export const CF_KINEMATIC_OBJECT: number;
  export const CF_NO_CONTACT_RESPONSE: number;
  export const CF_CUSTOM_MATERIAL_CALLBACK: number;
  export const CF_CHARACTER_OBJECT: number;

  // Memory management
  export function destroy(obj: unknown): void;
}
