import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass } from 'postprocessing';
import { GodRaysEffect } from 'postprocessing';
import { DepthOfFieldEffect } from 'postprocessing';

export function addEffects(scene: THREE.Scene, camera: THREE.PerspectiveCamera, composer:EffectComposer) {

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Retrieve the object with the name 'LandModel' from the scene
  scene.traverse((object: THREE.Object3D) => {

    // Find all point lights and modify their intensity and color
    if (object instanceof THREE.PointLight) {
      object.intensity = 200000; // Set the desired intensity
      object.color.set(0x96702A); // Set the desired color (red in this case)
    }

    // Check if the object's name includes 'Point'
    if (object.name.includes('Point')) {
      console.log('Found object with name including "Point":', object.name);
      

      // // Get the position of the object
      // const objectPosition = object.position;

      // // Add a sphere at the object's position
      // const sphere = new THREE.Mesh(
      // new THREE.SphereGeometry(5, 32, 32), // Adjust the size of the sphere as needed
      // new THREE.MeshBasicMaterial({
      //   color: 0xffffff,
      //   depthWrite: false,
      //   depthTest: true
      // })
      // );
      // sphere.position.copy(objectPosition);
      // scene.add(sphere);

      // // Add God Rays Effect for the sphere
      // const godRaysEffectForSphere = new GodRaysEffect(camera, sphere, {
      // density: 0.96,
      // decay: 0.93,
      // weight: 0.4,
      // exposure: 0.6,
      // samples: 60,
      // clampMax: 1.0,
      // kernelSize: 2,
      // blur: true
      // });

      // const effectPassForSphere = new EffectPass(camera, godRaysEffectForSphere);
      // composer.addPass(effectPassForSphere);
    }
  });


  // Create a light source for the god rays
  const godRayLight = new THREE.PointLight(0xffffff, 100, 100);
  godRayLight.position.set(0, 1000, 0);
  scene.add(godRayLight);

  // Add a sphere to represent the light source (optional)
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0, 0, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthWrite: false,
      depthTest: true
    })
  );
  lightSphere.position.copy(godRayLight.position);
  scene.add(lightSphere);

  // Add God Rays Effect
  const godRaysEffect = new GodRaysEffect(camera, lightSphere, {
    density: 0.96,
    decay: 0.93,
    weight: 0.4,
    exposure: 0.6,
    samples: 60,
    clampMax: 1.0,
    kernelSize: 2,
    blur: true
  });

  // // Enable shadow casting for the light source
  // godRayLight.castShadow = true;

  // // Configure shadow properties
  // godRayLight.shadow.mapSize.width = 1024;
  // godRayLight.shadow.mapSize.height = 1024;
  // godRayLight.shadow.camera.near = 0.5;
  // godRayLight.shadow.camera.far = 500;

  const effectPass = new EffectPass(camera, godRaysEffect);
  effectPass.renderToScreen = true;
  composer.addPass(effectPass);
}