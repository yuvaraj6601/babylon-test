import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { LoadingManager } from 'three';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { setupFPSCamera } from './components/fpscamera'; // Import the FPS camera setup function
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as dat from 'dat.gui';




const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

setupFPSCamera(scene, camera); // Call the FPS camera setup function

// Load and apply an ambient texture
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const exrLoader = new EXRLoader();
exrLoader.load('./assets/images/snow_field_2k.exr', (texture: THREE.DataTexture) => {
  const cubemap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = cubemap; // Set the cubemap as the scene environment
  scene.background = cubemap; // Optionally set it as the background
  texture.dispose();
  pmremGenerator.dispose();
}, undefined, (error: Error) => {
  console.error('An error occurred while loading the EXR texture:', error);
});

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright directional light
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);


// Set up EffectComposer
const composer = new EffectComposer(renderer);

// Add RenderPass to render the scene
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add UnrealBloomPass for bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), // Resolution
  1.5,  // Strength
  0.4,  // Radius
  0.85  // Threshold (controls which areas bloom)
);
composer.addPass(bloomPass);

bloomPass.strength = 10.0; // Softer glow
bloomPass.radius = 0.5;   // Wider bloom
bloomPass.threshold = 0.9;
const gui = new dat.GUI();
gui.add(bloomPass, 'strength', 0, 3).name('Bloom Strength');
gui.add(bloomPass, 'radius', 0, 1).name('Bloom Radius');
gui.add(bloomPass, 'threshold', 0, 1).name('Bloom Threshold');

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.autoClear = false;

// Add dense fog to the scene
const fogColor = 0xaaaaaa; // Softer gray fog color to reduce brightness
const fogDensity = 0.01; // Lower density for a more subtle effect
scene.fog = new THREE.FogExp2(fogColor, fogDensity);


// Animate the camera to move in a random path
const radius = 10; // Radius of the movement area
const speed = 0.05; // Slower speed of the camera movement

camera.position.set(0, 1, 5); // Set an initial position for the camera

// function moveCameraInRandomPath() {
//   const randomX = (Math.random() - 0.5) * radius * 2; // Random x position within the radius
//   const randomY = (Math.random() - 0.5) * radius * 2; // Random y position within the radius
//   const randomZ = (Math.random() - 0.5) * radius * 2; // Random z position within the radius
//   gsap.to(camera.position, {
//     x: randomX,
//     y: randomY,
//     z: randomZ,
//     duration: 2 / speed, // Adjust duration based on speed
//     onUpdate: () => camera.lookAt(0, 0, 0), // Keep looking at the center
//     onComplete: () => moveCameraInRandomPath(), // Continue the animation
//   });
// }

// moveCameraInRandomPath(); // Start the camera movement

// Set the scene background color
scene.background = new THREE.Color(0xffffff); // White background

const manager = new LoadingManager();
manager.addHandler(/\.tga$/i, new TGALoader());
manager.addHandler(/\.tif$/i, new THREE.TextureLoader());

// Load models
const landModelLoader = new GLTFLoader(manager);
const landModelPath = './assets/models/area.glb';
landModelLoader.load(landModelPath, (gltf) => {
  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, -135, 0);
  scene.add(gltf.scene);
}, undefined, (error) => {
  console.error('An error occurred while loading the GLB model:', error);
});

// const gltfLoader = new GLTFLoader(manager);
// const glbPath = './assets/models/kodai.glb';
// gltfLoader.load(glbPath, (gltf) => {
//   gltf.scene.scale.set(0.1, 0.1, 0.1);
//   gltf.scene.position.set(0, 0, 0);
//   gltf.scene.rotation.set(0, 90, 0);
//   scene.add(gltf.scene);
// }, undefined, (error) => {
//   console.error('An error occurred while loading the GLB model:', error);
// });





// Renderer

// GSAP for camera animation

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'Digit1': // Move camera to position 1
      gsap.to(camera.position, {
        x: 5,
        y: 2,
        z: 5,
        duration: 1,
        onUpdate: () => camera.lookAt(0, 0, 0),
      });
      break;
    case 'Digit2': // Move camera to position 2
      gsap.to(camera.position, {
        x: -5,
        y: 3,
        z: -5,
        duration: 1,
        onUpdate: () => camera.lookAt(0, 0, 0),
      });
      break;
    case 'Digit3': // Move camera to position 3
      gsap.to(camera.position, {
        x: 0,
        y: 5,
        z: 10,
        duration: 1,
        onUpdate: () => camera.lookAt(0, 0, 0),
      });
      break;
    case 'Digit4': // Move camera to position 4
      gsap.to(camera.position, {
        x: 10,
        y: 1,
        z: 0,
        duration: 1,
        onUpdate: () => camera.lookAt(0, 0, 0),
      });
      break;
  }
});


// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // Enable smooth damping for better user experience
// controls.dampingFactor = 0.05; // Adjust damping factor
// controls.minDistance = 1; // Set minimum zoom distance
// controls.maxDistance = 100; // Set maximum zoom distance
// controls.target.set(0, 0, 0); // Set the target point for the camera to look at
// controls.update(); // Update controls

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