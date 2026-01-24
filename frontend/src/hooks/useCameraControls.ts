import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraController, CameraMode, CameraControllerConfig } from '@lib/camera/CameraController';

interface UseCameraControlsOptions {
  camera: THREE.Camera | null;
  domElement: HTMLElement | null;
  initialConfig?: CameraControllerConfig;
  enabled?: boolean;
}

/**
 * Hook to manage camera controls
 */
export function useCameraControls({
  camera,
  domElement,
  initialConfig = {},
  enabled = true,
}: UseCameraControlsOptions) {
  const controllerRef = useRef<CameraController | null>(null);
  const [mode, setModeState] = useState<CameraMode>(
    initialConfig.mode || CameraMode.FREE_FLY
  );
  const [target, setTargetState] = useState<THREE.Object3D | null>(
    initialConfig.target || null
  );
  const [moveSpeed, setMoveSpeedState] = useState<number>(
    initialConfig.moveSpeed || 50
  );
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  /**
   * Initialize controller
   */
  useEffect(() => {
    if (!camera || !domElement) return;

    const controller = new CameraController(camera, domElement, {
      ...initialConfig,
      mode: mode,
      target: target,
      moveSpeed: moveSpeed,
    });

    controllerRef.current = controller;
    controller.setEnabled(enabled);

    // Monitor pointer lock state
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === domElement);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);

    return () => {
      controller.dispose();
      controllerRef.current = null;

      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
    };
  }, [camera, domElement]);

  /**
   * Update controller when config changes
   */
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setEnabled(enabled);
    }
  }, [enabled]);

  /**
   * Update camera controller (call in render loop)
   */
  const update = useCallback((deltaTime: number) => {
    if (controllerRef.current) {
      controllerRef.current.update(deltaTime);
    }
  }, []);

  /**
   * Set camera mode
   */
  const setMode = useCallback((newMode: CameraMode) => {
    if (controllerRef.current) {
      controllerRef.current.setMode(newMode);
      setModeState(newMode);
    }
  }, []);

  /**
   * Set target for orbit/follow modes
   */
  const setTarget = useCallback((newTarget: THREE.Object3D | null) => {
    if (controllerRef.current) {
      controllerRef.current.setTarget(newTarget);
      setTargetState(newTarget);
    }
  }, []);

  /**
   * Configure controller
   */
  const configure = useCallback((config: CameraControllerConfig) => {
    if (controllerRef.current) {
      controllerRef.current.configure(config);

      // Update state
      if (config.mode !== undefined) setModeState(config.mode);
      if (config.target !== undefined) setTargetState(config.target);
      if (config.moveSpeed !== undefined) setMoveSpeedState(config.moveSpeed);
    }
  }, []);

  /**
   * Request pointer lock (for free-fly mode)
   */
  const requestPointerLock = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.requestPointerLock();
    }
  }, []);

  /**
   * Exit pointer lock
   */
  const exitPointerLock = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.exitPointerLock();
    }
  }, []);

  /**
   * Toggle between free-fly and orbit mode
   */
  const toggleMode = useCallback(() => {
    const newMode = mode === CameraMode.FREE_FLY ? CameraMode.ORBIT : CameraMode.FREE_FLY;
    setMode(newMode);
  }, [mode, setMode]);

  return {
    controller: controllerRef.current,
    mode,
    target,
    moveSpeed,
    isPointerLocked,
    update,
    setMode,
    setTarget,
    configure,
    requestPointerLock,
    exitPointerLock,
    toggleMode,
  };
}
