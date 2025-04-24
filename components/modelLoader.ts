import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';

export function loadLandModel(
  scene: THREE.Scene,
  modelPath: string, // Added modelPath as a parameter
  onLoadCallback?: (gltfScene: THREE.Group) => void
) {
  const manager = new LoadingManager();
  manager.addHandler(/\.tga$/i, new TGALoader());
  manager.addHandler(/\.tif$/i, new THREE.TextureLoader());

  const landModelLoader = new GLTFLoader(manager); // Initialize GLTFLoader

  landModelLoader.load(
    modelPath,
    (gltf) => {
      // Successfully loaded the model
      const parentNode = new THREE.Object3D(); // Create an empty node
      parentNode.position.set(0, 0, 0); // Set position to (0, 0, 0)
      scene.add(parentNode); // Add the empty node to the scene

      gltf.scene.scale.set(10, 10, 10); // Adjust scale as needed
      gltf.scene.position.set(0, -1000, 0); // Adjust position as needed

      parentNode.add(gltf.scene); // Add the loaded model to the empty node

      // Enable shadow casting for all meshes in the model
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true; // Enable shadow casting
          child.receiveShadow = true; // Enable shadow receiving (optional)
          if (child.material) {
            const material = child.material;
            if (material.name === 'Material.003') {
              material.transparent = true; // Example: Make the material transparent
              material.opacity = 1; // Example: Set opacity to 50%
              material.color.set(0xFFD700); // Example: Change color to gold
              material.metalness = 1.; // Example: Set metalness to 0.5
            }
          }
        }
      });

      // Find meshes with specific names and set their opacity to 0
      const targetMeshNames = [
        "Plot03",
        "Plot04",
        "Plot02",
        "Plot01",
        "Plot05",
        "Plot06",
        "Plot07",
        "Plot07A",
        "Plot09",
        "Plot10",
        "Plot11",
        "Plot12",
        "Plot12A",
        "Plot14",
        "Plot15",
        "Plot16",
        "Plot16A"
      ]; // Replace with actual mesh names
      const targetMeshes: THREE.Mesh[] = [];

      gltf.scene.traverse((child) => {
        console.log(child.name)
        if (child instanceof THREE.Mesh && targetMeshNames.includes(child.name)) {
          targetMeshes.push(child);
          if (child.material) {
        child.material.transparent = true;
        child.material.opacity = 0; // Set opacity to 0
          }
        }
      });

      console.log('Target meshes:', targetMeshes);

      // Call the callback function if provided
      if (onLoadCallback) {
        onLoadCallback(gltf.scene);
      }
    },
    undefined, // Optional progress callback
    (error) => {
      // Handle errors during loading
      console.error('An error occurred while loading the GLB model:', error);
    }
  );
}