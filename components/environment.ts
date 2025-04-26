import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';

export function setupEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer, path: string, fogColor): void {
  // Add dense fog to the scene
  // const fogColor = 0x888888; // Softer gray fog color to reduce brightness
  const fogDensity = 0.0002; // Lower density for a more subtle effect
  scene.fog = new THREE.FogExp2(fogColor, fogDensity);

  // Load and apply an ambient texture
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const exrLoader = new EXRLoader();
  exrLoader.load(
    `./assets/images/${path}`,
    (texture: THREE.DataTexture) => {
      const cubemap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = cubemap; // Set the cubemap as the scene environment
      scene.background = cubemap; // Optionally set it as the background
      texture.dispose();
      pmremGenerator.dispose();
    },
    undefined,
    (error: Error) => {
      console.error('An error occurred while loading the EXR texture:', error);
    }
  );
}
