import * as THREE from 'three';

export function addLights(scene: THREE.Scene): void {
  // Add lighting to the scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright directional light
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
}