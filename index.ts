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


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
const renderer = new THREE.WebGLRenderer({
  antialias: false, // Disable for postprocessing performance
  powerPreference: 'high-performance',
  stencil: false, // Often not needed for postprocessing
  depth: true
});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
  stencilBuffer: false
});

setupEnvironment(scene, renderer); // Call the environment setup function

// setupFPSCamera(scene, camera); // Call the FPS camera setup function

camera.position.set(-11.083007770875376, -151.3280583711492, 615.5883824785229); // Set initial camera position
// camera.position.set(-541.4250755705959, -34.24183544050365, 35.98386625888884); // Set initial camera position
camera.position.set( -541.4250755705959, -34.24183544050365, 35.98386625888884); // Set initial camera position
camera.rotation.set( 0, -0.5052000000178812,  0)
// camera.position.set(0,0,0); // Set initial camera position

addEffects(scene, camera, composer); // Call the addEffects function
addLights(scene); // Call the addLights function
// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// const modelpath = './assets/models/KaliMark_PlotCamPathLines.glb'; // Path to the model
const modelpath = './assets/models/KaliMark_PlotNo.glb'; // Path to the model
loadLandModel(scene, modelpath, () => addcontrolledCamera()); // Load the land model

const envModelpath = './assets/models/Environment.glb'; // Path to the model
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

    return foundMeshes;
  }

  const foundMesh = findMeshesByNames(scene, ["3DGeom-5", "3DGeom-6", "3DGeom-1"]);
  if (foundMesh) {
    console.log('Found mesh:', foundMesh);
    setPathCamera(scene, camera); // Call the controlled camera setup function
    // setupControlledCamera(scene, camera, foundMesh); // Call the controlled camera setup function
  } else {
    console.log('Mesh not found');
  }
}

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