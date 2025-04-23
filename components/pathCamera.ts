import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { mainPath } from '../helpers/mainPathData'; // Import points from the data file
import { plot15 } from '../helpers/plotPathData';

export function setPathCamera(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const controls = new PointerLockControls(camera, document.body);
  let isMainPath = true; // Flag to track the current path

  document.addEventListener('click', () => {
    // controls.lock();
  });

  controls.addEventListener('lock', () => {
    console.log('Pointer locked');
  });

  controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
  });

  scene.add(controls.getObject());

  const velocity = 100; // Adjust velocity as needed
  let moveForward = false;
  let moveBackward = false;
  let turnLeft = false;
  let turnRight = false;

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;
      case 'ArrowLeft':
        turnLeft = true;
        break;
      case 'ArrowRight':
        turnRight = true;
        break;
      case 'Digit1': // Switch to the first curve
        switchPath(mainPath, true);
        isMainPath = true; // Set the flag to indicate the main path
        t = lastPathLocation
        break;
      case 'Digit2': // Switch to the second curve
        switchPath(plot15);
        isMainPath = false; // Set the flag to indicate the plot path
        lastPathLocation = 0.013947723464939575;
        break;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;
      case 'ArrowLeft':
        turnLeft = false;
        break;
      case 'ArrowRight':
        turnRight = false;
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const clock = new THREE.Clock();

  // Initialize the first path
  let points = mainPath.map((point) => new THREE.Vector3(point.position.x, point.position.y, point.position.z));
  let path = new THREE.CatmullRomCurve3(points, false, 'centripetal'); // Use 'centripetal' for smoother interpolation
  path.closed = false;

  let t = 0; // Parameter to track position along the path
  let lastPathLocation = 0; // Last location on the path
  const lerpFactor = 0.1; // Factor for smoothing camera movement

  const currentCameraPosition = new THREE.Vector3();
  const currentLookAtPosition = new THREE.Vector3();


  function switchPath(newPathPoints: Array<{ position: { x: number; y: number; z: number } }>, continueFromLastPosition = false, ) {
    // Update the path with new points
    points = newPathPoints.map((point) => new THREE.Vector3(point.position.x, point.position.y, point.position.z));
    path = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    path.closed = true;

    if(continueFromLastPosition) {
        const lastPosition = path.getPointAt(lastPathLocation);
        camera.position.copy(lastPosition);
        currentCameraPosition.copy(lastPosition);
    }else{
      // Reset the movement parameter and camera position
      t = 0;
      const startPosition = path.getPointAt(0);
      camera.position.copy(startPosition);
      currentCameraPosition.copy(startPosition);
    }
  }

  function updateCamera() {
    const delta = clock.getDelta();
    const moveDistance = velocity * delta;
    const turnSpeed = 1.5 * delta;

    // Update t along the path
    if (moveForward) t += moveDistance / path.getLength();
    if (moveBackward) t -= moveDistance / path.getLength();
    t = THREE.MathUtils.clamp(t, 0, 1);

    if (isMainPath) {
      lastPathLocation = t; // Update the last path location
      console.log("ismainpath", t)
    }

    const targetPosition = path.getPointAt(t);
    const targetLookAtPosition = path.getPointAt((t + 0.02) % 1);

    currentCameraPosition.lerp(targetPosition, lerpFactor * delta * 60);
    camera.position.copy(currentCameraPosition);

    if (moveForward || moveBackward) {
      // Look along the path when moving
      currentLookAtPosition.lerp(targetLookAtPosition, lerpFactor * delta * 60);
      camera.lookAt(currentLookAtPosition);
      // Optionally, reset manual yaw here if you want
    } else {
      // Allow manual yaw when not moving
      if (turnLeft || turnRight) {
        const targetRotationY = camera.rotation.y + (turnLeft ? turnSpeed : -turnSpeed);
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotationY, 0.2 * delta * 720);
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    updateCamera();
    controls.update(); // Update PointerLockControls
  }

  animate();
}

export function createCurveFromMesh(mesh: THREE.Mesh): THREE.CatmullRomCurve3 {
  const geometry = mesh.geometry;

  // Ensure the geometry is a BufferGeometry
  if (!(geometry instanceof THREE.BufferGeometry)) {
    throw new Error('The geometry must be a BufferGeometry.');
  }

  // Extract the position attribute
  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) {
    throw new Error('The geometry does not have a position attribute.');
  }

  const points: THREE.Vector3[] = [];

  // Iterate through the vertices and sample points
  for (let i = 0; i < positionAttribute.count; i += 5) { // Reduce step size for denser sampling
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
    points.push(new THREE.Vector3(x, y, z));
  }

  // Create a smoother CatmullRomCurve3 from the sampled points
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal'); // Use 'centripetal' for smoother interpolation
  curve.closed = false;

  return curve;
}