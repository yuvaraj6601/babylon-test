import { plot15 } from '../helpers/plotPathData';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function createGrass(scene: THREE.Scene) {
  const loader = new GLTFLoader();
  loader.load('../public/assets/models/grass.glb', (gltf) => {
    const grassMesh = gltf.scene;

    plot15.forEach((data) => {
      const instance = grassMesh.clone();
      instance.position.set(data.position.x, data.position.y-16, data.position.z);
      instance.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
      instance.scale.set(data.scale.x, data.scale.y, data.scale.z);
      scene.add(instance);
    });
  });
}