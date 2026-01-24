import * as THREE from 'three';
import { SimulationBody as ISimulationBody, SimulationBodyConfig } from './BaseSimulation';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { CannonPhysicsEngine } from '../physics/CannonPhysicsEngine';

/**
 * Concrete implementation of SimulationBody
 * Combines Three.js mesh with physics body
 */
export class SimulationBody implements ISimulationBody {
  id: string;
  mesh: THREE.Mesh | THREE.Object3D;
  physicsBody?: any;
  config: SimulationBodyConfig;
  userData: Record<string, any>;

  private physics?: PhysicsEngine;

  constructor(
    id: string,
    mesh: THREE.Mesh | THREE.Object3D,
    config: SimulationBodyConfig,
    physics?: PhysicsEngine,
    physicsBody?: any
  ) {
    this.id = id;
    this.mesh = mesh;
    this.config = config;
    this.physics = physics;
    this.physicsBody = physicsBody;
    this.userData = config.userData || {};

    // Set initial position and rotation
    if (config.position) {
      const pos = Array.isArray(config.position)
        ? new THREE.Vector3(...config.position)
        : config.position;
      this.mesh.position.copy(pos);
    }

    if (config.rotation) {
      const rot = Array.isArray(config.rotation)
        ? new THREE.Euler(...config.rotation)
        : config.rotation;
      this.mesh.rotation.copy(rot);
    }
  }

  /**
   * Update the body (sync mesh with physics, custom logic, etc.)
   */
  update(deltaTime: number): void {
    // Sync Three.js mesh with physics body
    if (this.physicsBody && this.physics) {
      this.syncMeshWithPhysics();
    }

    // Custom update logic can be added via userData callbacks
    if (this.userData.onUpdate) {
      this.userData.onUpdate(this, deltaTime);
    }
  }

  /**
   * Sync Three.js mesh position/rotation with physics body
   */
  private syncMeshWithPhysics(): void {
    if (!this.physicsBody || !this.physics) return;

    // Use engine-specific sync if available
    if (this.physics instanceof CannonPhysicsEngine) {
      CannonPhysicsEngine.syncMeshWithBody(this.mesh, this.physicsBody);
    } else {
      // Generic sync
      const position = this.physics.getPosition(this.physicsBody);
      const rotation = this.physics.getRotation(this.physicsBody);

      this.mesh.position.copy(position);
      this.mesh.quaternion.copy(rotation);
    }
  }

  /**
   * Set position
   */
  setPosition(position: THREE.Vector3): void {
    this.mesh.position.copy(position);

    if (this.physicsBody && this.physics) {
      this.physics.setPosition(this.physicsBody, position);
    }
  }

  /**
   * Set velocity
   */
  setVelocity(velocity: THREE.Vector3): void {
    if (this.physicsBody && this.physics) {
      this.physics.setVelocity(this.physicsBody, velocity);
    }
  }

  /**
   * Set mass
   */
  setMass(mass: number): void {
    this.config.mass = mass;

    if (this.physicsBody && this.physics) {
      this.physics.setMass(this.physicsBody, mass);
    }
  }

  /**
   * Apply force
   */
  applyForce(force: THREE.Vector3, point?: THREE.Vector3): void {
    if (this.physicsBody && this.physics) {
      this.physics.applyForce(this.physicsBody, force, point);
    }
  }

  /**
   * Apply impulse
   */
  applyImpulse(impulse: THREE.Vector3, point?: THREE.Vector3): void {
    if (this.physicsBody && this.physics) {
      this.physics.applyImpulse(this.physicsBody, impulse, point);
    }
  }

  /**
   * Get current position
   */
  getPosition(): THREE.Vector3 {
    if (this.physicsBody && this.physics) {
      return this.physics.getPosition(this.physicsBody);
    }
    return this.mesh.position.clone();
  }

  /**
   * Get current velocity
   */
  getVelocity(): THREE.Vector3 {
    if (this.physicsBody && this.physics) {
      return this.physics.getVelocity(this.physicsBody);
    }
    return new THREE.Vector3();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Dispose geometry
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.geometry.dispose();

      // Dispose materials
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(material => material.dispose());
      } else {
        this.mesh.material.dispose();
      }

      // Dispose textures
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(material => {
          if (material.map) material.map.dispose();
          if ((material as any).normalMap) (material as any).normalMap.dispose();
        });
      } else {
        if (this.mesh.material.map) this.mesh.material.map.dispose();
        if ((this.mesh.material as any).normalMap)
          (this.mesh.material as any).normalMap.dispose();
      }
    }

    // Clear user data
    this.userData = {};
  }

  /**
   * Factory: Create a simulation body from configuration
   */
  static createFromConfig(
    config: SimulationBodyConfig,
    physics?: PhysicsEngine
  ): SimulationBody {
    // Create Three.js mesh
    const mesh = this.createMesh(config);

    // Create physics body if physics engine provided
    let physicsBody: any = undefined;
    if (physics && config.mass > 0) {
      physicsBody = physics.createBody({
        shape: config.type === 'sphere' ? 0 : config.type === 'box' ? 1 : 2, // Map to enum
        mass: config.mass,
        position: Array.isArray(config.position)
          ? new THREE.Vector3(...config.position)
          : config.position,
        rotation: config.rotation
          ? Array.isArray(config.rotation)
            ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...config.rotation))
            : new THREE.Quaternion().setFromEuler(config.rotation)
          : undefined,
        velocity: config.velocity
          ? Array.isArray(config.velocity)
            ? new THREE.Vector3(...config.velocity)
            : config.velocity
          : undefined,
        angularVelocity: config.angularVelocity
          ? Array.isArray(config.angularVelocity)
            ? new THREE.Vector3(...config.angularVelocity)
            : config.angularVelocity
          : undefined,
        restitution: config.restitution,
        friction: config.friction,
        damping: config.damping,
        angularDamping: config.angularDamping,
        radius: config.radius,
        width: config.width,
        height: config.height,
        depth: config.depth,
      } as any);
    }

    return new SimulationBody(config.id, mesh, config, physics, physicsBody);
  }

  /**
   * Create Three.js mesh from configuration
   */
  private static createMesh(config: SimulationBodyConfig): THREE.Mesh {
    // Create geometry
    let geometry: THREE.BufferGeometry;

    switch (config.type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          config.radius || 1,
          config.segments || 32,
          config.segments || 32
        );
        break;

      case 'box':
        geometry = new THREE.BoxGeometry(
          config.width || 1,
          config.height || 1,
          config.depth || 1
        );
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(
          config.width || 10,
          config.height || 10
        );
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          config.radius || 1,
          config.radius || 1,
          config.height || 2,
          config.segments || 32
        );
        break;

      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
    }

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: config.material.color || 0xffffff,
      emissive: config.material.emissive || 0x000000,
      emissiveIntensity: config.material.emissiveIntensity || 1,
      metalness: config.material.metalness ?? 0.3,
      roughness: config.material.roughness ?? 0.7,
      transparent: config.material.transparent ?? false,
      opacity: config.material.opacity ?? 1,
    });

    // Load texture if provided
    if (config.material.texture) {
      const textureLoader = new THREE.TextureLoader();
      material.map = textureLoader.load(config.material.texture);
    }

    // Load normal map if provided
    if (config.material.normalMap) {
      const textureLoader = new THREE.TextureLoader();
      material.normalMap = textureLoader.load(config.material.normalMap);
    }

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }
}
