import * as THREE from 'three';

/**
 * Camera control modes
 */
export enum CameraMode {
  FREE_FLY = 'free-fly',     // Free movement in all directions
  ORBIT = 'orbit',           // Orbit around a target
  FOLLOW = 'follow',         // Follow a target from behind
  CINEMATIC = 'cinematic',   // Scripted camera path
}

/**
 * Camera controller configuration
 */
export interface CameraControllerConfig {
  mode?: CameraMode;
  moveSpeed?: number;
  lookSpeed?: number;
  boostMultiplier?: number;
  damping?: number;
  invertY?: boolean;
  target?: THREE.Object3D | null;
  minDistance?: number;
  maxDistance?: number;
}

/**
 * Input state
 */
interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
}

/**
 * Advanced camera controller for space simulations
 * Supports free-fly, orbit, and follow modes
 */
export class CameraController {
  private camera: THREE.Camera;
  private domElement: HTMLElement;

  // Configuration
  private mode: CameraMode = CameraMode.FREE_FLY;
  private moveSpeed: number = 50;
  private lookSpeed: number = 0.002;
  private boostMultiplier: number = 3;
  private damping: number = 0.9;
  private invertY: boolean = false;
  private target: THREE.Object3D | null = null;
  private minDistance: number = 10;
  private maxDistance: number = 5000;

  // State
  private input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
  };

  private velocity: THREE.Vector3 = new THREE.Vector3();
  private rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private isEnabled: boolean = true;
  private isLocked: boolean = false;

  // Orbit mode state
  private orbitDistance: number = 100;
  private orbitPhi: number = Math.PI / 4;
  private orbitTheta: number = 0;

  // Event listeners
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundWheel: (e: WheelEvent) => void;
  private boundPointerLockChange: () => void;

  constructor(camera: THREE.Camera, domElement: HTMLElement, config: CameraControllerConfig = {}) {
    this.camera = camera;
    this.domElement = domElement;

    // Apply configuration
    this.configure(config);

    // Set initial rotation from camera
    this.rotation.setFromQuaternion(this.camera.quaternion);

    // Bind event handlers
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.boundPointerLockChange = this.onPointerLockChange.bind(this);

    this.connect();
  }

  /**
   * Configure camera controller
   */
  configure(config: CameraControllerConfig): void {
    if (config.mode !== undefined) this.mode = config.mode;
    if (config.moveSpeed !== undefined) this.moveSpeed = config.moveSpeed;
    if (config.lookSpeed !== undefined) this.lookSpeed = config.lookSpeed;
    if (config.boostMultiplier !== undefined) this.boostMultiplier = config.boostMultiplier;
    if (config.damping !== undefined) this.damping = config.damping;
    if (config.invertY !== undefined) this.invertY = config.invertY;
    if (config.target !== undefined) this.target = config.target;
    if (config.minDistance !== undefined) this.minDistance = config.minDistance;
    if (config.maxDistance !== undefined) this.maxDistance = config.maxDistance;
  }

  /**
   * Connect event listeners
   */
  connect(): void {
    this.domElement.addEventListener('keydown', this.boundKeyDown);
    this.domElement.addEventListener('keyup', this.boundKeyUp);
    this.domElement.addEventListener('mousemove', this.boundMouseMove);
    this.domElement.addEventListener('mousedown', this.boundMouseDown);
    this.domElement.addEventListener('mouseup', this.boundMouseUp);
    this.domElement.addEventListener('wheel', this.boundWheel, { passive: false });

    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    document.addEventListener('mozpointerlockchange', this.boundPointerLockChange);

    // Make domElement focusable
    this.domElement.tabIndex = this.domElement.tabIndex !== -1 ? this.domElement.tabIndex : -1;
  }

  /**
   * Disconnect event listeners
   */
  disconnect(): void {
    this.domElement.removeEventListener('keydown', this.boundKeyDown);
    this.domElement.removeEventListener('keyup', this.boundKeyUp);
    this.domElement.removeEventListener('mousemove', this.boundMouseMove);
    this.domElement.removeEventListener('mousedown', this.boundMouseDown);
    this.domElement.removeEventListener('mouseup', this.boundMouseUp);
    this.domElement.removeEventListener('wheel', this.boundWheel);

    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    document.removeEventListener('mozpointerlockchange', this.boundPointerLockChange);
  }

  /**
   * Update camera (call every frame)
   */
  update(deltaTime: number): void {
    if (!this.isEnabled) return;

    switch (this.mode) {
      case CameraMode.FREE_FLY:
        this.updateFreeFly(deltaTime);
        break;
      case CameraMode.ORBIT:
        this.updateOrbit(deltaTime);
        break;
      case CameraMode.FOLLOW:
        this.updateFollow(deltaTime);
        break;
      case CameraMode.CINEMATIC:
        // TODO: Implement cinematic mode
        break;
    }
  }

  /**
   * Update free-fly mode
   */
  private updateFreeFly(deltaTime: number): void {
    // Calculate movement direction
    const direction = new THREE.Vector3();

    if (this.input.forward) direction.z -= 1;
    if (this.input.backward) direction.z += 1;
    if (this.input.left) direction.x -= 1;
    if (this.input.right) direction.x += 1;
    if (this.input.up) direction.y += 1;
    if (this.input.down) direction.y -= 1;

    // Normalize diagonal movement
    direction.normalize();

    // Apply camera rotation to movement
    const euler = new THREE.Euler(this.rotation.x, this.rotation.y, this.rotation.z, 'YXZ');
    direction.applyEuler(euler);

    // Apply speed
    const speed = this.moveSpeed * (this.input.boost ? this.boostMultiplier : 1);
    direction.multiplyScalar(speed * deltaTime);

    // Apply damping to velocity
    this.velocity.multiplyScalar(this.damping);

    // Add new movement
    this.velocity.add(direction);

    // Update camera position
    this.camera.position.add(this.velocity);

    // Update camera rotation
    this.camera.quaternion.setFromEuler(this.rotation);
  }

  /**
   * Update orbit mode
   */
  private updateOrbit(deltaTime: number): void {
    if (!this.target) return;

    // Clamp phi (vertical angle) to prevent gimbal lock
    this.orbitPhi = Math.max(0.01, Math.min(Math.PI - 0.01, this.orbitPhi));

    // Calculate camera position based on spherical coordinates
    const x = this.orbitDistance * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);
    const y = this.orbitDistance * Math.cos(this.orbitPhi);
    const z = this.orbitDistance * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);

    // Set camera position relative to target
    this.camera.position.copy(this.target.position);
    this.camera.position.x += x;
    this.camera.position.y += y;
    this.camera.position.z += z;

    // Look at target
    this.camera.lookAt(this.target.position);
  }

  /**
   * Update follow mode
   */
  private updateFollow(deltaTime: number): void {
    if (!this.target) return;

    // Position camera behind target
    const offset = new THREE.Vector3(0, 5, 15);
    offset.applyQuaternion(this.target.quaternion);

    const targetPosition = new THREE.Vector3();
    targetPosition.copy(this.target.position).add(offset);

    // Smooth camera movement
    this.camera.position.lerp(targetPosition, 1 - Math.pow(this.damping, deltaTime * 60));

    // Look at target
    this.camera.lookAt(this.target.position);
  }

  /**
   * Request pointer lock (for free-fly mode)
   */
  requestPointerLock(): void {
    this.domElement.requestPointerLock();
  }

  /**
   * Exit pointer lock
   */
  exitPointerLock(): void {
    document.exitPointerLock();
  }

  /**
   * Set camera mode
   */
  setMode(mode: CameraMode): void {
    this.mode = mode;

    // Reset velocities when switching modes
    this.velocity.set(0, 0, 0);

    // Initialize orbit mode
    if (mode === CameraMode.ORBIT && this.target) {
      const offset = new THREE.Vector3();
      offset.copy(this.camera.position).sub(this.target.position);
      this.orbitDistance = offset.length();
      this.orbitTheta = Math.atan2(offset.x, offset.z);
      this.orbitPhi = Math.acos(offset.y / this.orbitDistance);
    }
  }

  /**
   * Set target for orbit/follow modes
   */
  setTarget(target: THREE.Object3D | null): void {
    this.target = target;

    if (target && this.mode === CameraMode.ORBIT) {
      const offset = new THREE.Vector3();
      offset.copy(this.camera.position).sub(target.position);
      this.orbitDistance = offset.length();
      this.orbitTheta = Math.atan2(offset.x, offset.z);
      this.orbitPhi = Math.acos(offset.y / this.orbitDistance);
    }
  }

  /**
   * Enable/disable controller
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      // Reset input state
      this.resetInput();
    }
  }

  /**
   * Get current mode
   */
  getMode(): CameraMode {
    return this.mode;
  }

  /**
   * Get current target
   */
  getTarget(): THREE.Object3D | null {
    return this.target;
  }

  /**
   * Reset input state
   */
  private resetInput(): void {
    this.input.forward = false;
    this.input.backward = false;
    this.input.left = false;
    this.input.right = false;
    this.input.up = false;
    this.input.down = false;
    this.input.boost = false;
  }

  // ========================================================================
  // Event Handlers
  // ========================================================================

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = true;
        break;
      case 'KeyQ':
      case 'PageDown':
        this.input.down = true;
        break;
      case 'KeyE':
      case 'PageUp':
        this.input.up = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.boost = true;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = false;
        break;
      case 'KeyQ':
      case 'PageDown':
        this.input.down = false;
        break;
      case 'KeyE':
      case 'PageUp':
        this.input.up = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.boost = false;
        break;
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    if (this.mode === CameraMode.FREE_FLY) {
      // Free-fly: rotate view with mouse movement (when pointer locked)
      if (this.isLocked) {
        this.rotation.y -= movementX * this.lookSpeed;
        this.rotation.x -= movementY * this.lookSpeed * (this.invertY ? -1 : 1);

        // Clamp vertical rotation
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
      }
    } else if (this.mode === CameraMode.ORBIT) {
      // Orbit: rotate around target when mouse is down
      if (this.input.mouseDown) {
        this.orbitTheta -= movementX * this.lookSpeed;
        this.orbitPhi -= movementY * this.lookSpeed * (this.invertY ? -1 : 1);
      }
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) return;

    this.input.mouseDown = true;

    // Request pointer lock for free-fly mode
    if (this.mode === CameraMode.FREE_FLY && event.button === 0) {
      this.requestPointerLock();
    }
  }

  private onMouseUp(event: MouseEvent): void {
    this.input.mouseDown = false;
  }

  private onWheel(event: WheelEvent): void {
    if (!this.isEnabled) return;

    event.preventDefault();

    if (this.mode === CameraMode.ORBIT) {
      // Zoom in/out in orbit mode
      this.orbitDistance += event.deltaY * 0.01;
      this.orbitDistance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.orbitDistance)
      );
    } else if (this.mode === CameraMode.FREE_FLY) {
      // Adjust move speed in free-fly mode
      this.moveSpeed *= 1 + event.deltaY * 0.001;
      this.moveSpeed = Math.max(1, Math.min(1000, this.moveSpeed));
    }
  }

  private onPointerLockChange(): void {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  /**
   * Dispose controller
   */
  dispose(): void {
    this.disconnect();
    this.resetInput();
  }
}
