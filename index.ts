import * as THREE from 'three';
import gsap from 'gsap';
import { setupFPSCamera } from './components/fpscamera'; // Import the FPS camera setup function
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { EffectComposer,} from 'postprocessing';
import { addEffects } from './components/effects';
import { addLights } from './components/lights';
import { loadLandModel } from './components/modelLoader';
import { setupEnvironment } from './components/environment';
import { setupControlledCamera } from './components/controlledCamera';
import { envModelLoader } from './components/envModelLoader';
import { setPathCamera } from './components/pathCamera';
import { saveDataToFile } from './helpers/functions';
import { cinematic } from './public/assets/plotData/cinematic'; // Import the cinematic data
import { createGrass } from './components/grass';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set( 197.83952660059217,1695.0960537911499, 8119.448619810425); // Set initial camera position
camera.rotation.set(-0.20581370947573013, 0.023847359859835687, 0.004978096697086665); // Set initial camera rotation
const renderer = new THREE.WebGLRenderer({
  antialias: true, // Disable for postprocessing performance
  powerPreference: 'high-performance',
  // stencil: false, // Often not needed for postprocessing
  depth: true
});
renderer.setPixelRatio(window.devicePixelRatio)

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// // add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth damping for better user experience
controls.dampingFactor = 0.05; // Adjust damping factor
controls.minDistance = 1; // Set minimum zoom distance
controls.maxDistance = 10000; // Set maximum zoom distance
controls.target.set(0, 0, 0); // Set the target point for the camera to look at
controls.update(); // Update controls

// Set up EffectComposer
const composer = new EffectComposer(renderer, {
  depthBuffer: true, // Ensure depth buffer is enabled
  stencilBuffer: false
});

setupEnvironment(scene, renderer); // Call the environment setup function

// setupFPSCamera(scene, camera); // Call the FPS camera setup function

// createGrass(scene);
addEffects(scene, camera, composer); // Call the addEffects function
addLights(scene); // Call the addLights function
// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// const modelpath = './assets/models/KaliMark_PlotCamPathLines.glb'; // Path to the model
const modelpath = '/public/assets/models/KaliMark_plotNoNewUi.glb'; // Path to the model
loadLandModel(scene, modelpath, () => addcontrolledCamera()); // Load the land model

const envModelpath = 'assets/models/Environment2.glb'; // Path to the model
envModelLoader(scene, envModelpath, () => {}); // Load the land model

console.log(modelpath)

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

    return foundMeshes;
  }

  const foundMesh = findMeshesByNames(scene, ["3DGeom-5", "3DGeom-6", "3DGeom-1"]);
  if (foundMesh) {
    console.log('Found mesh:', foundMesh);
    startCinematic(foundMesh);
    // setupControlledCamera(scene, camera, foundMesh); // Call the controlled camera setup function

    // setPathCamera(scene, camera);
    // camera.position.set(-541.4250755705959, -34.24183544050365, 35.98386625888884);
    // camera.lookAt(-536.7885235499837, -31.3894295837718, 27.600621935653407);
  } else {
    console.log('Mesh not found');
  }
}

function startCinematic(foundMesh: THREE.Mesh) {
    const timeline = gsap.timeline();

    cinematic.forEach((point, index) => {
      timeline.to(camera.position, {
        x: point.position.x,
        y: point.position.y,
        z: point.position.z,
        duration: point.duration, // Default duration if not specified
        ease: 'expo.inOut',
        onUpdate: () => {
          camera.lookAt( -536.7885235499837, -31.3894295837718, 27.600621935653407);
        },
      });
    });

    timeline.call(() => {
      setPathCamera(scene, camera);
      camera.position.set(-541.4250755705959, -34.24183544050365, 35.98386625888884);
      camera.lookAt(-536.7885235499837, -31.3894295837718, 27.600621935653407);
    });
}

const cameraData: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }[] = [];

window.addEventListener('keydown', (event) => {
  // if (event.key === 'r') {
  //   const position = camera.position.clone();
  //   const rotation = camera.rotation.clone();
  //   const scale = camera.scale.clone();
  //   cameraData.push({ position, rotation, scale });
  //   console.log('Camera data added:', { position, rotation, scale });
  // } else if (event.key === 'g') {
  //   saveDataToFile(cameraData, 'cameraData.json');
  //   console.log('Camera data saved to file.');
  // }
});


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

animate();