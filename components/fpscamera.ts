import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import * as THREE from 'three';

export function setupFPSCamera(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const controls = new PointerLockControls(camera, document.body);

  document.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    console.log('Pointer locked');
  });

  controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
  });

  scene.add(controls.getObject());

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;
  let moveUp = false;
  let moveDown = false;

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;
      case 'Space': // Move up
        moveUp = true;
        break;
      case 'ShiftLeft': // Move down
        moveDown = true;
        break;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;
      case 'Space': // Stop moving up
        moveUp = false;
        break;
      case 'ShiftLeft': // Stop moving down
        moveDown = false;
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const clock = new THREE.Clock();

  function update() {
    const delta = clock.getDelta();

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.y -= velocity.y * 10.0 * delta; // Add vertical damping
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveUp) - Number(moveDown); // Add vertical direction
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
    if (moveUp || moveDown) velocity.y -= direction.y * 400.0 * delta; // Apply vertical velocity

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    camera.position.y += velocity.y * delta; // Update vertical position

    requestAnimationFrame(update);
  }

  update();
}