import { BaseSimulation, BaseSimulationConfig } from './BaseSimulation';
import * as THREE from 'three';

/**
 * Simulation metadata for registration
 */
export interface SimulationMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  defaultEngine: 'cannon' | 'ammo' | 'gpu';
  minParticles: number;
  maxParticles: number;
  tags: string[];
}

/**
 * Simulation factory function
 */
export type SimulationFactory<T extends BaseSimulation = BaseSimulation> = (
  config: any,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => Promise<T>;

/**
 * Registered simulation entry
 */
interface SimulationEntry {
  metadata: SimulationMetadata;
  factory: SimulationFactory;
}

/**
 * Simulation Registry
 * Central place to register and retrieve simulations
 */
export class SimulationRegistry {
  private static simulations: Map<string, SimulationEntry> = new Map();

  /**
   * Register a simulation
   */
  static register(
    metadata: SimulationMetadata,
    factory: SimulationFactory
  ): void {
    if (this.simulations.has(metadata.id)) {
      console.warn(`[SimulationRegistry] Overwriting simulation: ${metadata.id}`);
    }

    this.simulations.set(metadata.id, { metadata, factory });
    console.log(`[SimulationRegistry] Registered: ${metadata.id}`);
  }

  /**
   * Get simulation factory
   */
  static getFactory(id: string): SimulationFactory | undefined {
    const entry = this.simulations.get(id);
    return entry?.factory;
  }

  /**
   * Get simulation metadata
   */
  static getMetadata(id: string): SimulationMetadata | undefined {
    const entry = this.simulations.get(id);
    return entry?.metadata;
  }

  /**
   * Get all registered simulations
   */
  static getAll(): SimulationMetadata[] {
    return Array.from(this.simulations.values()).map(entry => entry.metadata);
  }

  /**
   * Get simulations by category
   */
  static getByCategory(category: string): SimulationMetadata[] {
    return this.getAll().filter(sim => sim.category === category);
  }

  /**
   * Get simulations by tag
   */
  static getByTag(tag: string): SimulationMetadata[] {
    return this.getAll().filter(sim => sim.tags.includes(tag));
  }

  /**
   * Check if simulation is registered
   */
  static has(id: string): boolean {
    return this.simulations.has(id);
  }

  /**
   * Create simulation instance
   */
  static async create(
    id: string,
    config: BaseSimulationConfig,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): Promise<BaseSimulation> {
    const factory = this.getFactory(id);

    if (!factory) {
      throw new Error(`[SimulationRegistry] Simulation not found: ${id}`);
    }

    try {
      const simulation = await factory(config, scene, camera);
      return simulation;
    } catch (error) {
      console.error(`[SimulationRegistry] Failed to create simulation: ${id}`, error);
      throw error;
    }
  }

  /**
   * Unregister a simulation
   */
  static unregister(id: string): boolean {
    return this.simulations.delete(id);
  }

  /**
   * Clear all registered simulations
   */
  static clear(): void {
    this.simulations.clear();
  }
}

/**
 * Decorator to auto-register simulations
 */
export function RegisterSimulation(metadata: SimulationMetadata) {
  return function <T extends { new(...args: any[]): BaseSimulation }>(
    constructor: T
  ) {
    const factory: SimulationFactory = async (config, scene, camera) => {
      const instance = new constructor();
      await instance.init(config, scene, camera);
      return instance;
    };

    SimulationRegistry.register(metadata, factory);
    return constructor;
  };
}
