import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import * as THREE from 'three';
import { readDataFromFile, saveDataToFile } from '../helpers/functions'; // Import the saveDataToFile function

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
      case 'KeyR': // Record camera data and create a sphere
        const position = camera.position.clone();
        const rotation = camera.rotation.clone();
        const scale = camera.scale.clone();
        recordedData.push({ position, rotation, scale });
        console.log('Recorded Camera Data:', { position, rotation, scale });

        // Create a sphere at the recorded position
        const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(position).setY(position.y);
        scene.add(sphere);
        break;
      case 'KeyG': // Save recorded data to a file
        saveDataToFile(recordedData, 'plot.json');
        break;
      case 'KeyY': // Delete the last value in the array and remove the last sphere
        if (recordedData.length > 0) {
          const removedData = recordedData.pop(); // Remove the last entry
          console.log('Removed Camera Data:', removedData);

          // Remove the last sphere from the scene
          const lastSphere = scene.children.find(
        (child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry
          );
          if (lastSphere) {
        scene.remove(lastSphere);
          }
        } else {
          console.log('No data to remove.');
        }
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


  
//   readDataFromFile('/public/assets/plotData/mainPath.json')
//     .then((curveData: Array<{ x: number; y: number; z: number }>) => {
//       const points = curveData.map((point: any) => new THREE.Vector3(point.position.x, point.position.y - 16, point.position.z));
//       const curve = new THREE.CatmullRomCurve3(points);

//       const tubeGeometry = new THREE.TubeGeometry(curve, 100, 2, 8, false);
//       const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
//       const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

//       scene.add(tubeMesh);
//       console.log('Tube drawn from curve data');
//     })
//     .catch((error) => {
//       console.error('Error loading curve data:', error);
// });
  

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


