/**
 * Simulation library exports
 */

// Base classes and interfaces
export { BaseSimulation, SimulationState, SimulationEvent } from './BaseSimulation';
export type {
  BaseSimulationConfig,
  SimulationBodyConfig,
  SimulationBody as ISimulationBody,
  SimulationEventListener,
  TimeControl,
} from './BaseSimulation';

// Concrete simulation body implementation
export { SimulationBody } from './SimulationBody';

// Simulation registry
export { SimulationRegistry, RegisterSimulation } from './SimulationRegistry';
export type { SimulationMetadata, SimulationFactory } from './SimulationRegistry';

// Utilities
export {
  OrbitalMechanics,
  TextureLoader,
  StarfieldGenerator,
  CameraUtils,
  PerformanceMonitor,
  ColorUtils,
} from './utils';

// Physics
export {
  PhysicsEngine,
  PhysicsEngineType,
  PhysicsBodyShape,
  PhysicsEngineFactory,
} from '../physics/PhysicsEngine';
export type {
  PhysicsBodyConfig,
  CollisionEvent,
} from '../physics/PhysicsEngine';

export { CannonPhysicsEngine } from '../physics/CannonPhysicsEngine';
export { AmmoPhysicsEngine } from '../physics/AmmoPhysicsEngine';
export { GPUPhysicsEngine } from '../physics/GPUPhysicsEngine';
