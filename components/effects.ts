import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass } from 'postprocessing';
import { GodRaysEffect } from 'postprocessing';

export function addEffects(scene: THREE.Scene, camera: THREE.PerspectiveCamera, composer:EffectComposer) {

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Create a light source for the god rays
  const godRayLight = new THREE.PointLight(0xffffff, 100, 100);
  godRayLight.position.set(0, 10, 0);
  scene.add(godRayLight);

  // Add a sphere to represent the light source (optional)
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 1, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffddaa,
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
  const effectPass = new EffectPass(camera, godRaysEffect);
  effectPass.renderToScreen = true;
  composer.addPass(effectPass);
}