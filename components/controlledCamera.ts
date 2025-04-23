import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import * as THREE from 'three';
import { saveDataToFile } from '../helpers/functions'; // Import the saveDataToFile function

export function setupControlledCamera(scene: THREE.Scene, camera: THREE.PerspectiveCamera, meshes: THREE.Mesh[]) {
  const controls = new PointerLockControls(camera, document.body);

  // Ensure PointerLockControls is properly initialized
  document.addEventListener('click', () => {
    if (!controls.isLocked) {
      controls.lock();
    }
  });

  controls.addEventListener('lock', () => {
    console.log('Pointer locked');
  });

  controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
  });

  scene.add(controls.getObject());

  const velocity = 50; // Adjust velocity as needed
  const rotationSpeed = 1.5; // Adjust rotation speed as needed
  let moveForward = false;
  let moveBackward = false;
  let turnLeft = false;
  let turnRight = false;

  const recordedData: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }> = [];
  const plotData: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }> = [];

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
      case 'ArrowLeft': // Rotate camera left
        turnLeft = true;
        break;
      case 'ArrowRight': // Rotate camera right
        turnRight = true;
        break;
      case 'KeyR': // Record camera data
        const position = camera.position.clone();
        const rotation = camera.rotation.clone();
        const scale = camera.scale.clone();
        recordedData.push({ position, rotation, scale });
        console.log('Recorded Camera Data:', { position, rotation, scale });
        break;
      case 'KeyG': // Save recorded data to a file
        saveDataToFile(recordedData, 'camera_data.json');
        saveDataToFile(plotData, 'plots.json');
        break;
      case 'KeyY': // Delete the last value in the array
        if (recordedData.length > 0) {
          const removedData = recordedData.pop(); // Remove the last entry
          console.log('Removed Camera Data:', removedData);
        } else {
          console.log('No data to remove.');
        }
        break;
      case 'KeyO': // Delete the last value in the array
        if (recordedData.length > 0) {
          const removedplotData = plotData.pop(); // Remove the last entry
          console.log('Removed Camera Data:', removedplotData);
        } else {
          console.log('No data to remove.');
        }
        break;
      case 'KeyP': // Add camera data to plotData and save to a separate file
        const plotPosition = camera.position.clone();
        const plotRotation = camera.rotation.clone();
        const plotScale = camera.scale.clone();
        plotData.push({ position: plotPosition, rotation: plotRotation, scale: plotScale });
        console.log('Added to Plot Data:', { position: plotPosition, rotation: plotRotation, scale: plotScale });
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
  const raycaster = new THREE.Raycaster();
  const downVector = new THREE.Vector3(0, -1, 0); // Direction for raycasting downward

  // Automatically position the camera above the first mesh at the start
  const firstMesh = meshes[0];
  const boundingBox = new THREE.Box3().setFromObject(firstMesh); // Calculate the bounding box of the first mesh
  const meshCenter = new THREE.Vector3();
  boundingBox.getCenter(meshCenter); // Get the center of the first mesh
  const initialPosition = new THREE.Vector3(meshCenter.x, boundingBox.max.y + 10, meshCenter.z); // Position above the first mesh

  raycaster.set(initialPosition, downVector);
  const intersects = raycaster.intersectObjects(meshes, true); // Check intersections with all meshes

  if (intersects.length > 0) {
    const intersect = intersects[0];
    camera.position.set(
      intersect.point.x, // Start at the intersection point
      intersect.point.y + 16, // Adjust height to stay above the surface
      intersect.point.z // Align with the mesh's surface
    );
  } else {
    console.warn('Failed to position the camera on the mesh surface.');
  }

  function update() {
    const delta = clock.getDelta();
    const moveDistance = velocity * delta;

    // Update camera position based on forward/backward movement
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize();

    const newPosition = camera.position.clone();

    if (moveForward) {
      newPosition.addScaledVector(forward, moveDistance);
    }
    if (moveBackward) {
      newPosition.addScaledVector(forward, -moveDistance);
    }

    // Rotate the camera left or right
    if (turnLeft) {
      camera.rotation.y += rotationSpeed * delta;
    }
    if (turnRight) {
      camera.rotation.y -= rotationSpeed * delta;
    }

    // Align camera position to mesh surfaces
    raycaster.set(newPosition.clone().add(new THREE.Vector3(0, 10, 0)), downVector);
    const intersects = raycaster.intersectObjects(meshes, true); // Check intersections with all meshes

    if (intersects.length > 0) {
      const intersect = intersects[0];
      camera.position.set(
        intersect.point.x, // Follow the path on the mesh
        intersect.point.y + 16, // Adjust height to stay above the surface
        intersect.point.z // Follow the path on the mesh
      );
    } else {
      console.log('Out of bounds: Preventing movement');
    }

    requestAnimationFrame(update);
  }

  update();
}


