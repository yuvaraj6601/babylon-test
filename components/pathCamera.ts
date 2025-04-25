import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
// import { mainPath } from '../helpers/mainPathData'; // Import points from the data file
import { readDataFromFile, saveDataToFile, saveTDataToFile } from '../helpers/functions';
import * as TWEEN from '@tweenjs/tween.js';

export async function setPathCamera (scene: THREE.Scene, camera: THREE.PerspectiveCamera){
  const controls = new PointerLockControls(camera, document.body);
  let isMainPath = true; // Flag to track the current path

  const triggers: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3; t: number }> = [];

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

  let velocity = 50; // Initial velocity

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Equal') { // '+' key
      velocity += 10;
      console.log(`Velocity increased to: ${velocity}`);
    } else if (event.code === 'Minus') { // '-' key
      velocity = Math.max(10, velocity - 10); // Ensure velocity doesn't go below 10
      console.log(`Velocity decreased to: ${velocity}`);
    }
  });
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
      case 'KeyR': {
        // Record camera state and t
        recordCameraPoints();
        break;
      }
      case 'KeyJ': {
        // Save camera log to a file
        saveTDataToFile(triggers, 'triggers.json');
        break;
      }
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
  const mainPath = await readDataFromFile(`/assets/plotData/mainPath.json`)
  // Create a tube geometry based on the mainPath

  let points = mainPath.map((point) => new THREE.Vector3(point.position.x, point.position.y-16, point.position.z));
  let path = new THREE.CatmullRomCurve3(points, false, 'chordal'); // Use 'centripetal' for smoother interpolation
  path.closed = false;

  // const tubeGeometry = new THREE.TubeGeometry(path, 100, 2, 8, false);
  // const tubeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff, side: THREE.DoubleSide, wireframe: false});
  // const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
  // scene.add(tubeMesh);

  let t = 0; // Parameter to track position along the path
  let lastPathLocation = 0; // Last location on the path
  const lerpFactor = 0.1; // Factor for smoothing camera movement

  const currentCameraPosition = new THREE.Vector3(-541.4250755705959, -34.24183544050365, 35.98386625888884);
  const currentLookAtPosition = new THREE.Vector3(-541.4250755705959, -34.24183544050365, 35.98386625888884);


  function switchPath(newPathPoints: Array<{ position: { x: number; y: number; z: number } }>, continueFromLastPosition = false) {
    // Update the path with new points
    points = newPathPoints.map((point) => new THREE.Vector3(point.position.x, point.position.y - 16, point.position.z));
    path = new THREE.CatmullRomCurve3(points, false, 'chordal');
    path.closed = false;

    // Smoothly transition the camera to the new path
    const targetPosition = continueFromLastPosition
      ? path.getPointAt(lastPathLocation)
      : path.getPointAt(0);

    const transitionDuration = 2000; // Duration of the transition in milliseconds
    const startPosition = camera.position.clone();

    new TWEEN.Tween(startPosition)
      .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, transitionDuration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        camera.position.set(startPosition.x, startPosition.y, startPosition.z);
        currentCameraPosition.copy(camera.position);
      })
      .onComplete(() => {
        currentCameraPosition.copy(targetPosition);
        if (!continueFromLastPosition) {
          t = 0; // Reset the movement parameter
        }
      })
      .start();

    // Optionally, smoothly adjust the camera's look-at direction
    const targetLookAt = path.getPointAt((lastPathLocation + 0.02) % 1);
    const startLookAt = currentLookAtPosition.clone();

    new TWEEN.Tween(startLookAt)
      .to({ x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z }, transitionDuration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        currentLookAtPosition.set(startLookAt.x, startLookAt.y, startLookAt.z);
        camera.lookAt(currentLookAtPosition);
      })
      .start();
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
    }

    const targetPosition = path.getPointAt(t);
    const targetLookAtPosition = path.getPointAt((t + 0.02) % 1);

    currentCameraPosition.lerp(new THREE.Vector3(targetPosition.x, targetPosition.y + 16, targetPosition.z), lerpFactor * delta * 60);
    camera.position.copy(currentCameraPosition);

    if (moveForward || moveBackward) {
      // Look along the path when moving
      const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(camera.position, targetLookAtPosition, new THREE.Vector3(0, 1, 0))
      );
      camera.quaternion.slerp(targetQuaternion, lerpFactor * delta * 60);
      // Optionally, reset manual yaw here if you want
    } else {
      // Allow manual yaw when not moving
      if (turnLeft || turnRight) {
        const targetRotationY = camera.rotation.y + (turnLeft ? turnSpeed : -turnSpeed);
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotationY, 0.2 * delta * 720);
      }
    }
  }


  function recordCameraPoints() {
    triggers.push({
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      scale: camera.scale.clone(),
      t:t,
    });
    console.log(triggers)
  }

  // Add collision detection logic directly within the existing functions
  const spheres: THREE.Mesh[] = [];



  const buttons: THREE.Mesh[] = [];

  readDataFromFile(`/assets/plotData/triggers.json`)
    .then((triggers) => {
      
    // Create spheres at the logged positions
      triggers.forEach((logEntry) => {
      const sphereGeometry = new THREE.SphereGeometry(10, 60, 60); // Adjust size as needed
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0 });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(logEntry.position.x, logEntry.position.y, logEntry.position.z);
      spheres.push(sphere);
      scene.add(sphere);
    });


    triggers.forEach((logEntry, index) => {
    const plots = ['plot15', 'plot16', 'plot16a', 'plot14', 'plot12a', 'plot12', 'plot11', 'plot10', 'plot7', 'plot7a', 'plot9', 'plot4', 'plot5', 'plot6', 'plot1', 'plot2', 'plot3'];
    const plotNames = ['Plot15', 'Plot16', 'Plot16A', 'Plot14', 'Plot12A', 'Plot12', 'Plot11', 'Plot10', 'Plot07', 'Plot07A', 'Plot09', 'Plot04', 'Plot05', 'Plot06', 'Plot01', 'Plot02', 'Plot03'];

    const plotName = plotNames[index];
    const plotMesh = scene.getObjectByName(plotName); // Find the mesh by name in the scene



    if (plotMesh) {
      plotMesh.material.transparent = true; // Ensure the material is set to transparent
      plotMesh.material.opacity = 0; // Set initial opacity to 0
    }

    let isColliding = false;

    function handleCollisionEnter() {
      if (!isColliding) {
      isColliding = true;
      console.log("plotMesh", index);
      if (plotMesh) {
        plotMesh.material.opacity = 1;

        // Fade in animation
        // const fadeIn = { opacity: 0 };
        // new TWEEN.Tween(fadeIn)
        //   .to({ opacity: 1 }, 1000) // Adjust duration as needed
        //   .onUpdate(() => {
        //     plotMesh.material.opacity = fadeIn.opacity;
        //     plotMesh.material.needsUpdate = true; // Ensure material updates
        //   })
        //   .start();
      }

      // Add an event listener for the Enter key to switch paths
      const onEnterKeyPress = (event: KeyboardEvent) => {
        console.log("first")
        if (event.code === 'Enter') {
            readDataFromFile(`/assets/plotData/${plots[index]}.json`)
            .then((data) => {
              const selectedPlot = data; // Select the plot based on the index
              switchPath(selectedPlot);
              isMainPath = false;
              lastPathLocation = triggers[index].t; // Use the t value of the current sphere
            })
            .catch((error) => {
              console.error('Error loading plot data:', error);
            });
            
          document.removeEventListener('keydown', onEnterKeyPress); // Remove listener after switching
        }
      };

      document.addEventListener('keydown', onEnterKeyPress);
      }
    }

    function handleCollisionExit() {
      if (isColliding) {
        isColliding = false;
        if (plotMesh) {
          plotMesh.material.opacity = 0;
          // Fade out animation
          // const fadeOut = { opacity: 1 };
          // new TWEEN.Tween(fadeOut)
          //   .to({ opacity: 0 }, 1000) // Adjust duration as needed
          //   .onUpdate(() => {
          //     plotMesh.material.opacity = fadeOut.opacity;
          //   })
          //   .start();
        }
      }
    }

    // Add collision detection logic
    function checkSphereCollision() {
      const distance = camera.position.distanceTo(spheres[index].position);
      if (distance < 30) { // Adjust collision threshold as needed
        handleCollisionEnter();
      } else {
        handleCollisionExit();
      }
    }

    // Call collision detection in the animation loop
    function animate() {
      requestAnimationFrame(animate);
      checkSphereCollision(); // Check collision for this sphere
      TWEEN.update(performance.now()); // Pass the current time to ensure TWEEN animations are updated
    }
    animate()
  });
  }
);
 async function checkEndOfPath() {
    if (!isMainPath && t >= 1) {
      switchPath(mainPath, true); // Switch back to the main path
      isMainPath = true; // Set the flag to indicate the main path
      t = lastPathLocation; // Restore the last location on the main path
    }
  }

  // Add raycasting for button clicks
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(buttons);

    if (intersects.length > 0) {
      const button = intersects[0].object;
      if (button.onClick) button.onClick(); // Trigger the button's click handler
    }
  });

  function animateupdate() {
    requestAnimationFrame(animateupdate);
    updateCamera();
    controls.update(); // Update PointerLockControls
    checkEndOfPath(); // Check if the end of the path is reached
    TWEEN.update(performance.now());
  }

  animateupdate();
}
