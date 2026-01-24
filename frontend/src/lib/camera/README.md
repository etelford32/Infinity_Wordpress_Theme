# 🎥 Advanced Camera System

A powerful, flexible camera control system for 3D space simulations. Fly freely through space, orbit around objects, or follow targets - all with smooth, intuitive controls.

## 🌟 Features

### Camera Modes

#### 🚀 **Free-Fly Mode** (Recommended)
- **6DOF Movement**: Move in any direction (forward, back, left, right, up, down)
- **Free Look**: Look in any direction with mouse
- **Speed Control**: Adjust movement speed with mouse wheel
- **Boost**: Hold Shift for faster movement
- **Pointer Lock**: Click to lock mouse for immersive control

**Perfect for**: Exploring large spaces, navigating between objects, cinematic shots

#### 🔄 **Orbit Mode**
- **Rotate**: Drag mouse to orbit around target
- **Zoom**: Mouse wheel to zoom in/out
- **Auto-target**: Automatically focuses on specified object

**Perfect for**: Examining objects closely, inspecting details, stable viewing

#### 👤 **Follow Mode**
- **Auto-follow**: Camera follows target from behind
- **Smooth tracking**: Damped movement for cinematic feel
- **Consistent distance**: Maintains set distance from target

**Perfect for**: Following moving objects, chase cameras, guided tours

#### 🎬 **Cinematic Mode** (Coming Soon)
- **Scripted paths**: Define camera movement paths
- **Keyframe animation**: Smooth interpolation between points
- **Timeline control**: Play, pause, scrub through animations

**Perfect for**: Presentations, demos, automated tours

---

## 📖 Usage

### Quick Start

```typescript
import { SimulationRendererAdvanced } from '@components/Simulation';
import { CameraMode } from '@lib/camera';

function MySimulation() {
  return (
    <SimulationRendererAdvanced
      simulationId="solar-system"
      config={simulationConfig}
      cameraConfig={{
        mode: CameraMode.FREE_FLY,
        moveSpeed: 50,
        lookSpeed: 0.002,
        boostMultiplier: 3,
        damping: 0.9,
      }}
      showCameraModeSelector={true}
    />
  );
}
```

### Using Camera Controller Directly

```typescript
import { CameraController, CameraMode } from '@lib/camera';
import * as THREE from 'three';

// Create camera controller
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
const domElement = document.getElementById('canvas');

const controller = new CameraController(camera, domElement, {
  mode: CameraMode.FREE_FLY,
  moveSpeed: 50,
  lookSpeed: 0.002,
  boostMultiplier: 3,
  damping: 0.9,
});

// Update in render loop
function animate() {
  const deltaTime = clock.getDelta();
  controller.update(deltaTime);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Using React Hook

```typescript
import { useCameraControls } from '@hooks/useCameraControls';
import { CameraMode } from '@lib/camera';

function MyComponent() {
  const {
    mode,
    isPointerLocked,
    setMode,
    setTarget,
    update,
    requestPointerLock,
  } = useCameraControls({
    camera,
    domElement,
    initialConfig: {
      mode: CameraMode.FREE_FLY,
      moveSpeed: 50,
    },
    enabled: true,
  });

  // Use in render loop
  useEffect(() => {
    const animate = () => {
      update(deltaTime);
      // ... rest of render loop
    };
  }, [update]);

  return (
    <div>
      <button onClick={() => setMode(CameraMode.ORBIT)}>
        Switch to Orbit
      </button>
      <button onClick={requestPointerLock}>
        Lock Mouse
      </button>
    </div>
  );
}
```

---

## ⌨️ Controls

### Free-Fly Mode

| Input | Action |
|-------|--------|
| **W** or **↑** | Move forward |
| **S** or **↓** | Move backward |
| **A** or **←** | Move left |
| **D** or **→** | Move right |
| **Q** or **Page Down** | Move down |
| **E** or **Page Up** | Move up |
| **Shift** | Boost speed (3x default) |
| **Mouse move** | Look around (when locked) |
| **Mouse click** | Lock/unlock pointer |
| **Scroll wheel** | Adjust move speed |
| **ESC** | Unlock mouse |

### Orbit Mode

| Input | Action |
|-------|--------|
| **Mouse drag** | Rotate around target |
| **Scroll wheel** | Zoom in/out |

### Follow Mode

| Input | Action |
|-------|--------|
| No manual controls | Camera follows target automatically |

---

## ⚙️ Configuration

### CameraControllerConfig

```typescript
interface CameraControllerConfig {
  mode?: CameraMode;              // Default: FREE_FLY
  moveSpeed?: number;             // Default: 50
  lookSpeed?: number;             // Default: 0.002
  boostMultiplier?: number;       // Default: 3
  damping?: number;               // Default: 0.9 (0-1, higher = more damping)
  invertY?: boolean;              // Default: false
  target?: THREE.Object3D | null; // For orbit/follow modes
  minDistance?: number;           // Default: 10 (orbit mode)
  maxDistance?: number;           // Default: 5000 (orbit mode)
}
```

### Recommended Settings

#### Exploring Large Spaces
```typescript
{
  mode: CameraMode.FREE_FLY,
  moveSpeed: 100,
  boostMultiplier: 5,
  damping: 0.85,
}
```

#### Inspecting Small Objects
```typescript
{
  mode: CameraMode.ORBIT,
  target: myObject,
  minDistance: 5,
  maxDistance: 100,
}
```

#### Cinematic Feel
```typescript
{
  mode: CameraMode.FREE_FLY,
  moveSpeed: 30,
  boostMultiplier: 2,
  damping: 0.95, // Very smooth
}
```

#### Fast-Paced Action
```typescript
{
  mode: CameraMode.FREE_FLY,
  moveSpeed: 150,
  boostMultiplier: 10,
  damping: 0.7,  // More responsive
  lookSpeed: 0.003, // Faster look
}
```

---

## 🎯 Advanced Features

### Switching Modes Programmatically

```typescript
// Switch to orbit mode and set target
controller.setMode(CameraMode.ORBIT);
controller.setTarget(sun.mesh);

// Switch to free-fly
controller.setMode(CameraMode.FREE_FLY);
```

### Dynamic Speed Adjustment

```typescript
// Increase speed
controller.configure({ moveSpeed: 200 });

// Adjust based on distance to object
const distance = camera.position.distanceTo(target.position);
const speed = Math.max(10, distance * 0.1);
controller.configure({ moveSpeed: speed });
```

### Smooth Camera Transitions

```typescript
// Smoothly move camera to position
async function moveCameraTo(position: THREE.Vector3) {
  const start = camera.position.clone();
  const duration = 2000; // 2 seconds
  const startTime = Date.now();

  return new Promise((resolve) => {
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      camera.position.lerpVectors(start, position, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    animate();
  });
}
```

### Collision Detection (Optional)

```typescript
// Add to update loop
function updateWithCollisions(deltaTime: number) {
  const oldPosition = camera.position.clone();

  // Update camera
  controller.update(deltaTime);

  // Check for collisions
  if (checkCollision(camera.position)) {
    // Revert to old position
    camera.position.copy(oldPosition);
  }
}
```

---

## 🎨 UI Components

### CameraModeSelector

Pre-built UI component for switching camera modes:

```typescript
import { CameraModeSelector } from '@components/Simulation';

<CameraModeSelector
  currentMode={cameraMode}
  onModeChange={setCameraMode}
  isPointerLocked={isPointerLocked}
  onPointerLockToggle={handlePointerLockToggle}
  disabled={false}
/>
```

Features:
- Visual mode indicators with icons
- Mode descriptions
- Pointer lock toggle (Free-Fly mode)
- Context-specific control hints
- Disabled state for unimplemented modes

---

## 🐛 Troubleshooting

### Mouse not responding in Free-Fly mode
**Solution**: Click on the canvas to request pointer lock. The mouse only controls view when locked.

### Camera moving too fast/slow
**Solution**:
- Scroll wheel to adjust speed in real-time
- Or configure `moveSpeed` parameter
- Use Shift to temporarily boost speed

### Can't orbit around object
**Solution**:
- Ensure you've set a target with `setTarget(object)`
- Check that `mode` is set to `ORBIT`
- Verify target object exists in scene

### Camera jittery or stuttering
**Solution**:
- Increase `damping` (0.9-0.95) for smoother movement
- Ensure `update()` is called with consistent deltaTime
- Check that deltaTime is capped (< 0.1)

### Pointer lock not working
**Solution**:
- Pointer Lock API requires user interaction (click)
- Must be called from user event handler
- Some browsers require HTTPS for pointer lock

---

## 📊 Performance Tips

### Optimize for Large Scenes

```typescript
// Adjust damping based on FPS
const targetFPS = 60;
const currentFPS = 1 / deltaTime;

if (currentFPS < targetFPS) {
  controller.configure({
    damping: 0.95, // Increase for better performance
  });
}
```

### Reduce Update Frequency

```typescript
// Update camera every N frames
let frameCount = 0;

function animate() {
  frameCount++;

  if (frameCount % 2 === 0) { // Update every other frame
    controller.update(deltaTime * 2);
  }
}
```

### Disable When Not Needed

```typescript
// Disable camera during cinematics
controller.setEnabled(false);

// Re-enable for user control
controller.setEnabled(true);
```

---

## 🎓 Best Practices

### 1. **Always dispose controllers**
```typescript
useEffect(() => {
  const controller = new CameraController(camera, domElement);

  return () => {
    controller.dispose(); // Cleanup event listeners
  };
}, []);
```

### 2. **Use appropriate modes for content**
- **Free-Fly**: Large open spaces, exploration
- **Orbit**: Examining objects, tutorials
- **Follow**: Guided experiences, storytelling

### 3. **Provide visual feedback**
```typescript
// Show pointer lock status
{isPointerLocked && (
  <div className="pointer-lock-indicator">
    🔒 Mouse Locked (ESC to unlock)
  </div>
)}
```

### 4. **Cap deltaTime for stability**
```typescript
const cappedDelta = Math.min(deltaTime, 1 / 30); // Max 30 FPS
controller.update(cappedDelta);
```

### 5. **Test on different devices**
- Desktop: Full keyboard + mouse
- Laptop: Trackpad support
- Touch devices: Touch controls (future)

---

## 🚀 Future Enhancements

- [ ] Touch controls for mobile
- [ ] Gamepad support
- [ ] Path recording for cinematics
- [ ] Camera shake effects
- [ ] Field of view adjustments
- [ ] Roll control (barrel rolls!)
- [ ] Autopilot to targets
- [ ] Save/load camera positions
- [ ] VR camera support

---

## 💡 Examples

Check out these simulations using the camera system:

- **Solar System**: Free-fly to explore planets, orbit to examine
- **Galaxy Collision**: Follow mode to track star movements
- **Asteroid Field**: Free-fly with boost for high-speed navigation
- **Planet Surface**: Low-altitude free-fly over terrain

---

## 📝 API Reference

See [CameraController.ts](./CameraController.ts) for complete API documentation.

---

**Built with ❤️ for the Infinity WordPress Theme**
