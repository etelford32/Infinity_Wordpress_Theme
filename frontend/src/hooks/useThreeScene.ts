import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Hook to initialize and manage Three.js scene
 */
export function useThreeScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: {
    cameraPosition?: [number, number, number];
    cameraFov?: number;
    enableControls?: boolean;
    backgroundColor?: string | THREE.Color;
    enableShadows?: boolean;
  } = {}
) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = options.backgroundColor
        ? typeof options.backgroundColor === 'string'
          ? new THREE.Color(options.backgroundColor)
          : options.backgroundColor
        : new THREE.Color(0x000000);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        options.cameraFov || 75,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        10000
      );

      const [x, y, z] = options.cameraPosition || [0, 50, 100];
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
      });

      renderer.setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight
      );
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (options.enableShadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      // Create orbit controls
      let controls: OrbitControls | null = null;
      if (options.enableControls !== false) {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 5000;
        controls.enablePan = true;
        controls.enableZoom = true;
      }

      // Store refs
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      controlsRef.current = controls;

      setIsReady(true);

      // Handle window resize
      const handleResize = () => {
        if (!canvasRef.current || !camera || !renderer) return;

        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (controls) {
          controls.dispose();
        }

        if (renderer) {
          renderer.dispose();
        }

        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
        controlsRef.current = null;

        setIsReady(false);
      };
    } catch (err) {
      console.error('[useThreeScene] Initialization failed:', err);
      setError(err as Error);
    }
  }, [canvasRef, options.enableControls, options.enableShadows]);

  /**
   * Start render loop
   */
  const startRenderLoop = (callback?: (deltaTime: number) => void) => {
    let lastTime = performance.now();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Custom callback
      if (callback) {
        callback(deltaTime);
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
  };

  /**
   * Stop render loop
   */
  const stopRenderLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    isReady,
    error,
    startRenderLoop,
    stopRenderLoop,
  };
}
