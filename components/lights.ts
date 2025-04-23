import * as THREE from 'three';

export function addLights(scene: THREE.Scene): void {

  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 10);
  // hemiLight.color.setHSL(0.6, 1, 0.6);
  // hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  // hemiLight.position.set(0, 50, 0);
  // hemiLight.castShadow = true; // Enable shadow casting for the hemisphere light
  // scene.add(hemiLight);

  // const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 100);
  // scene.add(hemiLightHelper);
  // Add lighting to the scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Soft white light
  // ambientLight.castShadow = true; // Ambient light does not cast shadows
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Increased intensity for a large area like the sun
  directionalLight.position.set(0, 1000, 0); // Adjusted position for better coverage
  directionalLight.rotation.set(Math.PI / 4, Math.PI / 4, 0); // Rotate the light for a different angle
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 8096; // Higher shadow map resolution width for better quality
  directionalLight.shadow.mapSize.height = 8096; // Higher shadow map resolution height for better quality
  directionalLight.shadow.camera.near = 0.5; // Near clipping plane
  directionalLight.shadow.camera.far = 5000; // Far clipping plane for a larger area
  directionalLight.shadow.camera.left = -2500; // Extend shadow camera bounds
  directionalLight.shadow.camera.right = 2500;
  directionalLight.shadow.camera.top = 2500;
  directionalLight.shadow.camera.bottom = -2500;
  directionalLight.target.position.set(0, 0, -800); // Point the light towards the center of the scene
  scene.add(directionalLight);
  scene.add(directionalLight.target); // Add the target to the scene

  // // // Add a helper to visualize the directional light
  // const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
  // scene.add(lightHelper);

  // // Add a helper to visualize the shadow camera
  // const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
  // scene.add(shadowCameraHelper);
}