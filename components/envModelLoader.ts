import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';

export function envModelLoader(
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
      gltf.scene.position.set(-280, -240, 400); // Adjust position as needed
      gltf.scene.rotation.set(THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(0)); // Adjust rotation as needed

      parentNode.add(gltf.scene); // Add the loaded model to the empty node


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