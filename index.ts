import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer,} from 'postprocessing';
import { addEffects } from './components/effects';
import { addLights } from './components/lights';
import { loadLandModel } from './components/modelLoader';
import { setupEnvironment } from './components/environment';
import { setupControlledCamera } from './components/controlledCamera';
import { envModelLoader } from './components/envModelLoader';
import { setPathCamera } from './components/pathCamera';
import { cinematic } from './public/assets/plotData/cinematic'; // Import the cinematic data

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.setFocalLength(28);
camera.position.set( 197.83952660059217,1695.0960537911499, 8119.448619810425); // Set initial camera position
camera.lookAt(-536.7885235499837, -31.3894295837718, 27.600621935653407);
const renderer = new THREE.WebGLRenderer({
  antialias: true, // Disable for postprocessing performance
  powerPreference: 'high-performance',
  // stencil: false, // Often not needed for postprocessing
  depth: true,
  depthWrite: true
});
// renderer.setPixelRatio(window.devicePixelRatio)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.antialias = false;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.addEventListener('mousedown', (event) => {
  event.preventDefault();
});

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});


// // add controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // Enable smooth damping for better user experience
// controls.dampingFactor = 0.05; // Adjust damping factor
// controls.minDistance = 1; // Set minimum zoom distance
// controls.maxDistance = 10000; // Set maximum zoom distance
// controls.target.set(0, 0, 0); // Set the target point for the camera to look at
// controls.update(); // Update controls

// Set up EffectComposer
const composer = new EffectComposer(renderer, {
  depthBuffer: true, // Ensure depth buffer is enabled
  stencilBuffer: false,
});


// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// const modelpath = './assets/models/KaliMark_PlotCamPathLines.glb'; // Path to the model
const modelpath = 'assets/models/KaliMark_25_4Lemontrees.glb'; // Path to the model
loadLandModel(scene, modelpath, () => addcontrolledCamera()); // Load the land model

const envModelpath = 'assets/models/Environment2.glb'; // Path to the model
envModelLoader(scene, envModelpath, () => {}); // Load the land model


function addcontrolledCamera() {
  function findMeshesByNames(scene: THREE.Scene, names: string[]): THREE.Mesh[] {
    const foundMeshes: THREE.Mesh[] = [];

    function traverseAndFind(object: THREE.Object3D) {
      if (object.isMesh && names.includes(object.name)) {
        foundMeshes.push(object as THREE.Mesh);
      }
      object.children.forEach(traverseAndFind); // Recursively check children
    }

    scene.children.forEach(traverseAndFind);

  

    // createGrass(scene);
    addEffects(scene, camera, composer); // Call the addEffects function
    addLights(scene); // Call the addLights function

    return foundMeshes;
  }

  const foundMesh = findMeshesByNames(scene, ["3DGeom-5", "3DGeom-113", "3DGeom-3"]);
  if (foundMesh) {
    console.log('Found mesh:', foundMesh);
    // startCinematic();
    // setupControlledCamera(scene, camera, foundMesh); // Call the controlled camera setup function
    // setPathCamera(scene, camera);
    // camera.position.set(-593.1666206316243, -58.77807395693095, 155.86438266969157);
    // camera.lookAt(-511.07808957971827, -28.033032820257773, 26.949399991116252);
    // camera.position.set(-541.4250755705959, -34.24183544050365, 35.98386625888884);
    // camera.rotation.set(0, -0.5052000000178812, 0);
    // camera.lookAt(-536.7885235499837, -31.3894295837718, 27.600621935653407);
  } else {
    console.log('Mesh not found');
  }
}

function startCinematic() {
    const timeline = gsap.timeline();

    cinematic.forEach((point, index) => {
      timeline.to(camera.position, {
        x: point.position.x,
        y: point.position.y,
        z: point.position.z,
        duration: point.duration, // Default duration if not specified
        ease: 'expo.inOut',
        onUpdate: () => {
          // camera.lookAt( -536.7885235499837, -31.3894295837718, 27.600621935653407);
          camera.lookAt(-511.07808957971827,-28.033032820257773,26.949399991116252)

        },
      });
    });

    timeline.call(() => {
      setPathCamera(scene, camera);
      camera.position.set(-593.1666206316243,-58.77807395693095,155.86438266969157);
      camera.lookAt(-511.07808957971827, -28.033032820257773, 26.949399991116252);
    });
}

setupEnvironment(scene, renderer, "morning.exr", 0x666666)

document.getElementById('env1').addEventListener('click', (event) => {
  setupEnvironment(scene, renderer, "night.exr", 0x111111);
  turnonLights();
});

document.getElementById('env2').addEventListener('click', (event) => {
  setupEnvironment(scene, renderer, "sunset.exr", 0x999999);
  turnoffLights()
});

document.getElementById('env3').addEventListener('click', (event) => {
  setupEnvironment(scene, renderer, "morning.exr", 0x999999);
  turnonLights()
});

document.getElementById('env4').addEventListener('click', (event) => {
  setupEnvironment(scene, renderer, "clearsky.exr", 0x999999);
  turnoffLights()
});

document.getElementById('toggleLampPostButtonOn').addEventListener('click', (event) => {
  turnonLights()
});

document.getElementById('toggleLampPostButtonOff').addEventListener('click', (event) => {
  turnoffLights()
});

function turnoffLights(){
  scene.traverse((object: THREE.Object3D) => {
    // Find all point lights and modify their intensity and color
    if (object instanceof THREE.PointLight) {
      object.intensity = 1000; // Set the desired intensity
      object.color.set(0xffffff); // Set the desired color (red in this case)
    }
  })
}

function turnonLights() {
  scene.traverse((object: THREE.Object3D) => {
    // Find all point lights and modify their intensity and color
    if (object instanceof THREE.PointLight) {
      object.intensity = 200000; // Set the desired intensity
      object.color.set(0x96702A); // Set the desired color (red in this case)
    }
  })
}

function turnoffNumLights() {
  scene.traverse((object: THREE.Object3D) => {
    // Find all point lights and modify their intensity and color
    if (object instanceof THREE.PointLight) {
      object.intensity = 1000; // Set the desired intensity
      object.color.set(0xffffff); // Set the desired color (red in this case)
    }
  })
}

function turnonNumLights() {
  scene.traverse((object: THREE.Object3D) => {
    // Find all point lights and modify their intensity and color
    if (object instanceof THREE.PointLight) {
      object.intensity = 200000; // Set the desired intensity
      object.color.set(0x96702A); // Set the desired color (red in this case)
    }
  })
}

const cameraData: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }[] = [];

// window.addEventListener('keydown', (event) => {
//   if (event.key === 'r') {
//     const position = camera.position.clone();
//     const rotation = camera.rotation.clone();
//     const scale = camera.scale.clone();
//     cameraData.push({ position, rotation, scale });
//     console.log('Recorded Camera Data:', { position, rotation, scale });

//     // Create a sphere at the recorded position
//     const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
//     const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//     const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//     sphere.position.copy(position).setY(position.y);
//     scene.add(sphere);
//   } else if (event.key === 'y') {
//     if (cameraData.length > 0) {
//       const removedData = cameraData.pop(); // Remove the last entry
//       console.log('Removed Camera Data:', removedData);

//       // Remove the last sphere from the scene
//       // Remove all spheres from the scene
//       scene.children
//         .filter((child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry)
//         .forEach((sphere) => scene.remove(sphere));

//       // Add spheres back based on the updated recordedData
//       cameraData.forEach((data) => {
//         const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
//         const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//         const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//         sphere.position.copy(data.position).setY(data.position.y);
//         scene.add(sphere);
//       });

//       cameraData.forEach((data) => {
//         const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
//         const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//         const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//         sphere.position.copy(data.position).setY(data.position.y);
//         scene.add(sphere);
//       });
//     }
//   } else if (event.key === 'g') {
//     saveDataToFile(cameraData, 'cameraData.json');
//     console.log('Camera data saved to file.');
//   }
// });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('enter-btn').addEventListener('click', () => {
  startCinematic();
});


// Animation loop
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

animate();