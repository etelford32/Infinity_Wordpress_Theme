# Infinity Simulation Library

A robust, extensible framework for building interactive astrophysical simulations using Three.js and physics engines.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SIMULATION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│  BaseSimulation (Abstract)                                   │
│  ├── Lifecycle: init, start, pause, resume, stop, reset    │
│  ├── Time Control: timeScale, deltaTime, totalTime          │
│  ├── Event System: emit, on, off                            │
│  ├── Body Management: addBody, removeBody, getBody          │
│  └── Abstract Methods: createBodies, onUpdate, onInit       │
├─────────────────────────────────────────────────────────────┤
│  PhysicsEngine (Abstract)                                    │
│  ├── CannonPhysicsEngine (Rigid body physics)               │
│  ├── AmmoPhysicsEngine (Realistic physics - TODO)           │
│  └── GPUPhysicsEngine (Massive particles - TODO)            │
├─────────────────────────────────────────────────────────────┤
│  SimulationBody                                              │
│  ├── Three.js Mesh (visual representation)                  │
│  ├── Physics Body (physical simulation)                     │
│  ├── Auto-sync: mesh position ← physics body                │
│  └── Methods: setPosition, setVelocity, setMass, etc.       │
├─────────────────────────────────────────────────────────────┤
│  SimulationRegistry                                          │
│  ├── Register simulations                                   │
│  ├── Create instances dynamically                           │
│  └── Query by category, tags, difficulty                    │
├─────────────────────────────────────────────────────────────┤
│  Utilities                                                   │
│  ├── OrbitalMechanics (velocity, period, escape velocity)   │
│  ├── StarfieldGenerator (backgrounds, nebulae)              │
│  ├── TextureLoader (caching, async loading)                 │
│  ├── CameraUtils (smooth movement, auto-framing)            │
│  ├── PerformanceMonitor (FPS tracking)                      │
│  └── ColorUtils (temperature-based colors)                  │
└─────────────────────────────────────────────────────────────┘
```

## Creating a New Simulation

### Step 1: Extend BaseSimulation

```typescript
import {
  BaseSimulation,
  BaseSimulationConfig,
  RegisterSimulation,
  SimulationBody,
  PhysicsEngineFactory,
  PhysicsEngineType,
} from '@lib/simulation';
import * as THREE from 'three';

// Define your config interface
interface MySolarSystemConfig extends BaseSimulationConfig {
  bodies: {
    sun: { radius: number; mass: number };
    earth: { radius: number; mass: number; orbitRadius: number };
  };
}

// Register your simulation
@RegisterSimulation({
  id: 'my-solar-system',
  name: 'My Solar System',
  description: 'A simple solar system with Sun and Earth',
  category: 'solar-system',
  difficulty: 'beginner',
  defaultEngine: 'cannon',
  minParticles: 2,
  maxParticles: 10,
  tags: ['planets', 'orbits', 'gravity'],
})
class MySolarSystemSimulation extends BaseSimulation<MySolarSystemConfig> {
  // Initialize physics engine
  protected async initPhysics(): Promise<void> {
    this.physics = await PhysicsEngineFactory.create(
      PhysicsEngineType.CANNON
    );
    this.physics.setGravity(new THREE.Vector3(0, 0, 0)); // No global gravity
  }

  // Create simulation bodies
  protected async createBodies(): Promise<void> {
    // Create Sun
    const sun = SimulationBody.createFromConfig(
      {
        id: 'sun',
        type: 'sphere',
        radius: this.config.bodies.sun.radius,
        mass: this.config.bodies.sun.mass,
        position: [0, 0, 0],
        material: {
          color: 0xFDB813,
          emissive: 0xFF9500,
          emissiveIntensity: 1,
        },
      },
      this.physics
    );
    this.addBody(sun);

    // Create Earth with orbital velocity
    const orbitalVelocity = this.calculateOrbitalVelocity(
      this.config.bodies.sun.mass,
      this.config.bodies.earth.orbitRadius
    );

    const earth = SimulationBody.createFromConfig(
      {
        id: 'earth',
        type: 'sphere',
        radius: this.config.bodies.earth.radius,
        mass: this.config.bodies.earth.mass,
        position: [this.config.bodies.earth.orbitRadius, 0, 0],
        velocity: [0, 0, orbitalVelocity],
        material: {
          color: 0x1E88E5,
        },
      },
      this.physics
    );
    this.addBody(earth);
  }

  // Custom initialization
  protected async onInit(): Promise<void> {
    // Add starfield background
    const starfield = StarfieldGenerator.create(10000, 2000);
    this.scene.add(starfield);

    // Setup collision listeners
    this.on(SimulationEvent.COLLISION, (data) => {
      console.log('Collision detected!', data);
    });
  }

  // Custom update logic (called every frame)
  protected onUpdate(deltaTime: number): void {
    // Apply gravitational forces between bodies
    const sun = this.getBody('sun');
    const earth = this.getBody('earth');

    if (sun && earth) {
      this.applyGravity(sun, earth);
    }
  }

  // Custom cleanup
  protected onDispose(): void {
    // Clean up any custom resources
  }

  // Helper: Apply gravity between two bodies
  private applyGravity(body1: SimulationBody, body2: SimulationBody): void {
    const G = 100; // Gravitational constant (scaled for visualization)

    const pos1 = body1.getPosition();
    const pos2 = body2.getPosition();

    const direction = new THREE.Vector3().subVectors(pos2, pos1);
    const distance = direction.length();

    if (distance === 0) return;

    const forceMagnitude =
      (G * body1.config.mass * body2.config.mass) / (distance * distance);

    direction.normalize();
    const force = direction.multiplyScalar(forceMagnitude);

    // Apply force to both bodies
    body1.applyForce(force);
    body2.applyForce(force.clone().negate());
  }

  // Helper: Calculate orbital velocity
  private calculateOrbitalVelocity(centralMass: number, radius: number): number {
    const G = 100; // Same G as in applyGravity
    return Math.sqrt((G * centralMass) / radius);
  }
}
```

### Step 2: Use in React Component

```typescript
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimulationRegistry } from '@lib/simulation';

function SolarSystemViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [simulation, setSimulation] = useState<BaseSimulation | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });

    // Load simulation config (from WordPress)
    const config = {
      version: '1.0',
      engine: 'cannon',
      scene: {
        background: '#000000',
        cameraPosition: [0, 50, 100],
      },
      bodies: {
        sun: { radius: 10, mass: 1000000 },
        earth: { radius: 2, mass: 100, orbitRadius: 50 },
      },
    };

    // Create simulation
    SimulationRegistry.create('my-solar-system', config, scene, camera).then(
      (sim) => {
        setSimulation(sim);
        sim.start();
      }
    );

    // Cleanup
    return () => {
      simulation?.dispose();
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
      <div className="controls">
        <button onClick={() => simulation?.pause()}>Pause</button>
        <button onClick={() => simulation?.resume()}>Resume</button>
        <button onClick={() => simulation?.reset()}>Reset</button>
        <button onClick={() => simulation?.setTimeScale(2)}>2x Speed</button>
      </div>
    </div>
  );
}
```

## Lifecycle

```
UNINITIALIZED
    ↓ init(config, scene, camera)
INITIALIZING
    ↓ setupScene()
    ↓ initPhysics()
    ↓ createBodies()
    ↓ onInit()
READY
    ↓ start()
RUNNING ⇄ PAUSED (pause/resume)
    ↓ stop()
STOPPED
    ↓ reset()
READY
```

## Events

```typescript
simulation.on(SimulationEvent.INITIALIZED, () => {
  console.log('Simulation ready!');
});

simulation.on(SimulationEvent.STARTED, () => {
  console.log('Simulation started');
});

simulation.on(SimulationEvent.BODY_ADDED, (body) => {
  console.log('Body added:', body.id);
});

simulation.on(SimulationEvent.COLLISION, (event) => {
  console.log('Collision!', event);
});

simulation.on(SimulationEvent.PARAMETER_CHANGED, (data) => {
  console.log('Parameter changed:', data);
});

simulation.on(SimulationEvent.ERROR, (error) => {
  console.error('Simulation error:', error);
});
```

## Physics Engines

### Cannon.js (Default)
- **Best for**: Rigid body dynamics, collisions, simple physics
- **Performance**: Good for 10-1000 bodies
- **Use cases**: Solar systems, asteroid fields, simple collisions

```typescript
this.physics = await PhysicsEngineFactory.create(PhysicsEngineType.CANNON);
```

### Ammo.js (TODO)
- **Best for**: Realistic physics, complex constraints, soft bodies
- **Performance**: Heavier, 10-500 bodies
- **Use cases**: Realistic n-body gravitational simulations

```typescript
this.physics = await PhysicsEngineFactory.create(PhysicsEngineType.AMMO);
```

### GPU Compute Shaders (TODO)
- **Best for**: Massive particle systems
- **Performance**: 100K-2M+ particles
- **Use cases**: Galaxies, nebulae, star clusters

```typescript
this.physics = await PhysicsEngineFactory.create(PhysicsEngineType.GPU);
```

## Utilities

### Orbital Mechanics

```typescript
import { OrbitalMechanics } from '@lib/simulation';

// Calculate orbital velocity for circular orbit
const velocity = OrbitalMechanics.calculateOrbitalVelocity(
  centralMass,
  orbitalRadius,
  G
);

// Calculate orbital period
const period = OrbitalMechanics.calculateOrbitalPeriod(
  centralMass,
  orbitalRadius,
  G
);

// Calculate escape velocity
const escapeVel = OrbitalMechanics.calculateEscapeVelocity(mass, radius, G);

// Calculate gravitational force
const force = OrbitalMechanics.calculateGravitationalForce(
  mass1,
  mass2,
  distance,
  G
);

// Position on elliptical orbit
const position = OrbitalMechanics.calculateEllipticalPosition(
  semiMajorAxis,
  eccentricity,
  angle
);
```

### Starfield Generation

```typescript
import { StarfieldGenerator } from '@lib/simulation';

// Create starfield background
const starfield = StarfieldGenerator.create(10000, 1000, 1);
scene.add(starfield);

// Create nebula effect
const nebula = StarfieldGenerator.createNebula(
  5000,
  500,
  new THREE.Color(0x6366f1)
);
scene.add(nebula);
```

### Texture Loading

```typescript
import { TextureLoader } from '@lib/simulation';

// Load single texture (cached)
const texture = await TextureLoader.load('/textures/earth.jpg');
material.map = texture;

// Load multiple textures
const [earth, mars, jupiter] = await TextureLoader.loadMultiple([
  '/textures/earth.jpg',
  '/textures/mars.jpg',
  '/textures/jupiter.jpg',
]);
```

### Camera Utilities

```typescript
import { CameraUtils } from '@lib/simulation';

// Smooth camera movement
await CameraUtils.smoothMoveTo(
  camera,
  new THREE.Vector3(100, 50, 100),
  1000 // duration in ms
);

// Calculate distance to fit object
const distance = CameraUtils.calculateDistanceToFit(objectRadius, fov);
camera.position.z = distance;
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@lib/simulation';

const monitor = new PerformanceMonitor();

function animate() {
  monitor.recordFrame(performance.now());

  const fps = monitor.getCurrentFPS();
  const avgFps = monitor.getAverageFPS();
  const acceptable = monitor.isPerformanceAcceptable(30);

  console.log(`FPS: ${fps.toFixed(1)} | Avg: ${avgFps.toFixed(1)} | OK: ${acceptable}`);

  requestAnimationFrame(animate);
}
```

## Best Practices

1. **Always call `dispose()`** when unmounting to prevent memory leaks
2. **Use `timeScale`** for slow-motion or time-lapse effects
3. **Cap `deltaTime`** in physics step to prevent physics explosion
4. **Use event system** instead of polling for state changes
5. **Cache textures** using `TextureLoader` utility
6. **Implement `onUpdate()`** for frame-by-frame logic
7. **Use `createFromConfig()`** factory for consistency
8. **Test with different physics engines** to find best performance
9. **Add starfields** for better spatial perception
10. **Monitor FPS** and reduce particles if performance drops

## Common Patterns

### Adding Interactive Controls

```typescript
protected onInit(): Promise<void> {
  // Allow users to add planets on click
  if (this.config.controls?.allowAddRemove) {
    this.emit(SimulationEvent.PARAMETER_CHANGED, {
      parameter: 'interactive',
      value: true,
    });
  }
}
```

### Time Control

```typescript
// Pause time
simulation.pause();

// Resume
simulation.resume();

// Speed up (2x)
simulation.setTimeScale(2);

// Slow motion (0.5x)
simulation.setTimeScale(0.5);

// Reverse time (experimental)
simulation.setTimeScale(-1);
```

### Dynamic Body Management

```typescript
// Add body at runtime
const asteroid = SimulationBody.createFromConfig(
  { id: 'asteroid-1', ... },
  this.physics
);
this.addBody(asteroid);

// Remove body
this.removeBody('asteroid-1');

// Get and modify body
const earth = this.getBody('earth');
earth.setVelocity(new THREE.Vector3(0, 0, 10));
earth.setMass(200);
```

## Debugging

```typescript
// Enable verbose logging
simulation.on(SimulationEvent.BODY_ADDED, (body) => {
  console.log('[BODY_ADDED]', body);
});

simulation.on(SimulationEvent.PARAMETER_CHANGED, (data) => {
  console.log('[PARAM_CHANGED]', data);
});

// Monitor state
console.log('State:', simulation.getState());
console.log('Time:', simulation.getTimeControl());
console.log('Bodies:', simulation.getBodies().length);
```

## Next Steps

- Implement Solar System simulation
- Add Galaxy simulation with GPU compute
- Create Blueprint creator UI
- Add VR/AR support
