import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  SceneLoader,
  MeshBuilder,
  PointerEventTypes,
  KeyboardEventTypes,
  ActionManager,
  PhysicsImpostor,
  AmmoJSPlugin,
  Quaternion,
  Matrix,
  ArcRotateCamera,
  StandardMaterial,
  Color3,
  Ray,
  HDRCubeTexture,
  Mesh,
  RayHelper,
} from "@babylonjs/core";
import "@babylonjs/loaders";

window.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const engine = new Engine(canvas, true);
  const scene: any = new Scene(engine);

  const moveForce = 20;
  const torqueForce = 15;

  const AmmoLib = await (window as any).Ammo();
  const ammoPlugin = new AmmoJSPlugin(true, AmmoLib);
  // Increased gravity from -9.81 to -30 for faster falling
  scene.enablePhysics(new Vector3(0, -30, 0), ammoPlugin);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  const sphere = MeshBuilder.CreateSphere("playerSphere", { diameter: 1 }, scene);
  sphere.rotationQuaternion = new Quaternion();
  sphere.physicsImpostor = new PhysicsImpostor(
    sphere,
    PhysicsImpostor.SphereImpostor,
    // Reduced air resistance by decreasing friction to 0.2
    { mass: 1, restitution: 0.4, friction: 0.2 },
    scene
  );

  const camera = new ArcRotateCamera("arcCamera", Math.PI / 2, Math.PI / 3, 10, sphere.position, scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 10;
  camera.wheelDeltaPercentage = 0.01;
  camera.target = sphere.position;
  camera.useAutoRotationBehavior = false;

  camera.keysUp = [];
  camera.keysDown = [];
  camera.keysLeft = [];
  camera.keysRight = [];

  const verticalOffset = new Vector3(0, 2, 0);
  camera.setTarget(sphere.position.add(verticalOffset));

  const inputMap = {};
  scene.actionManager = new ActionManager(scene);
  scene.onKeyboardObservable.add((kbInfo) => {
    const key = kbInfo.event.key.toLowerCase();
    inputMap[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
  });
  const climbForce = 15;
  const climbDetectionDistance = 1.2;
  const maxClimbHeight = 2.5;

  // Climbing state
  let isClimbing = false;
  let climbStartTime = 0;
  const climbDuration = 800;

  SceneLoader.AppendAsync("./assets/glb/", "RealEstateScene5.glb", scene)
    .then((result) => {
      console.log("Model loaded!", result);

      // Position sphere on the floor surface
      positionSphereOnFloor(64, 0);
    })
    .catch((error) => {
      console.error("Failed to load model:", error);
    });

  // Helper function to position sphere on top of floor mesh
  function positionSphereOnFloor(x: number, z: number) {
    const rayOrigin = new Vector3(x, 50, z);
    const downwardRay = new Ray(rayOrigin, new Vector3(0, -1, 0), 100);

    const floorHit = scene.pickWithRay(downwardRay, (mesh) =>
      mesh !== sphere &&
      mesh.isPickable &&
      mesh.name.toLowerCase().includes("floor")
    );

    if (floorHit?.hit && floorHit.pickedPoint) {
      sphere.position.set(x, floorHit.pickedPoint.y + 0.5, z);
      console.log("Sphere positioned on floor at height:", floorHit.pickedPoint.y + 0.5);
    } else {
      sphere.position.set(x, 2, z);
      console.log("No floor found, using fallback position");
    }
  }

  const hdrTex = new HDRCubeTexture("./assets/background/morning.hdr", scene, 512);
  hdrTex.gammaSpace = false;
  scene.environmentTexture = hdrTex;
  scene.createDefaultSkybox(hdrTex, true, 1000, 0.1);

  // Helper function to check if obstacle is climbable
  function isObstacleClimbable(obstacleHit: any, moveDirection: Vector3): boolean {
    if (!obstacleHit?.hit || !obstacleHit.pickedMesh) return false;

    const obstacleHeight = getObstacleHeight(obstacleHit.pickedMesh, obstacleHit.pickedPoint);
    const currentSphereHeight = sphere.position.y;
    const heightDifference = obstacleHeight - currentSphereHeight;

    return heightDifference > 0.2 && heightDifference <= maxClimbHeight;
  }

  // Helper function to get obstacle height at hit point
  function getObstacleHeight(mesh: any, hitPoint: Vector3): number {
    const boundingInfo = mesh.getBoundingInfo();
    const worldMatrix = mesh.getWorldMatrix();
    const max = Vector3.TransformCoordinates(boundingInfo.maximum, worldMatrix);
    return max.y;
  }

  // Helper function to perform climbing
  function performClimbing(moveDirection: Vector3, obstacleHeight: number) {
    if (isClimbing) return;

    isClimbing = true;
    climbStartTime = Date.now();

    const impostor = sphere.physicsImpostor;
    if (!impostor) return;

    // Apply upward force for climbing
    const climbVector = new Vector3(
      moveDirection.x * climbForce * 0.5,
      climbForce,
      moveDirection.z * climbForce * 0.5
    );

    // impostor.applyImpulse(climbVector, sphere.position);

    console.log("Starting climb - target height:", obstacleHeight);
  }

  engine.runRenderLoop(() => {
    const impostor = sphere.physicsImpostor;
    if (!impostor) return;

    const inputDirection = new Vector3(
      (inputMap["a"] || inputMap["arrowleft"] ? 1 : 0) +
      (inputMap["d"] || inputMap["arrowright"] ? -1 : 0),
      0,
      (inputMap["w"] || inputMap["arrowup"] ? 1 : 0) +
      (inputMap["s"] || inputMap["arrowdown"] ? -1 : 0)
    );

    // Ground detection
    const rayOrigin = sphere.position.clone();
    rayOrigin.y += 0.1;
    const groundRay = new Ray(rayOrigin, new Vector3(0, -1, 0), 5);
    const groundHit = scene.pickWithRay(groundRay, (mesh) =>
      mesh !== sphere &&
      mesh.isPickable &&
      mesh.name.toLowerCase().includes("floor")
    );
    const hitMesh = groundHit?.pickedMesh;
    const isOnRoad = groundHit?.hit && hitMesh?.name.toLowerCase().includes("floor");

    const isKeyPressed = inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"] ||
      inputMap["arrowup"] || inputMap["arrowleft"] || inputMap["arrowdown"] || inputMap["arrowright"];

    // Check if climbing is complete
    // if (isClimbing && Date.now() - climbStartTime > climbDuration) {
    //   isClimbing = false;
    //   console.log("Climbing complete");
    // }

    if (isKeyPressed && !inputDirection.equals(Vector3.Zero()) && isOnRoad) {
      inputDirection.normalize();

      const camForward = camera.getForwardRay().direction;
      camForward.y = 0;
      camForward.normalize();

      const camRight = Vector3.Cross(camForward, Vector3.Up()).normalize();
      const moveDirection = camForward.scale(inputDirection.z).add(camRight.scale(inputDirection.x)).normalize();

      // Obstacle detection
      const obstacleRay = new Ray(sphere.position, moveDirection, climbDetectionDistance);
      const obstacleHit = scene.pickWithRay(obstacleRay, (mesh) => mesh !== sphere && mesh.isPickable);

      const hasObstacle = obstacleHit?.hit &&
        obstacleHit.pickedMesh &&
        !obstacleHit.pickedMesh.name.toLowerCase().includes("floor");

      if (hasObstacle) {
        if (isObstacleClimbable(obstacleHit, moveDirection)) {
          const obstacleHeight = getObstacleHeight(obstacleHit.pickedMesh, obstacleHit.pickedPoint);

          if (!isClimbing) {
            performClimbing(moveDirection, obstacleHeight);
          }

          // Continue moving forward while climbing
          const climbMoveForce = isClimbing ? moveForce * 0.8 : moveForce;
          impostor.setLinearVelocity(moveDirection.scale(climbMoveForce));

        } else {
          impostor.setLinearVelocity(Vector3.Zero());
          console.log("Obstacle not climbable");
        }
      } else {
        // No obstacle - normal movement
        impostor.setLinearVelocity(moveDirection.scale(moveForce));

        // Apply rotation for rolling effect
        const forward = new Vector3(0, 0, 1);
        const currentRotation = sphere.rotationQuaternion ?? Quaternion.Identity();
        const rotationMatrix = new Matrix();
        currentRotation.toRotationMatrix(rotationMatrix);
        const currentForward = Vector3.TransformNormal(forward, rotationMatrix);

        const desiredRotation = Math.atan2(moveDirection.x, moveDirection.z);
        const currentRotationY = Math.atan2(currentForward.x, currentForward.z);
        let rotationDifference = desiredRotation - currentRotationY;
        if (rotationDifference > Math.PI) rotationDifference -= 2 * Math.PI;
        if (rotationDifference < -Math.PI) rotationDifference += 2 * Math.PI;

        const body = impostor.physicsBody;
        if (body) {
          const torque = new AmmoLib.btVector3(0, rotationDifference * torqueForce, 0);
          body.applyTorqueImpulse(torque);
          AmmoLib.destroy(torque);
        }
      }
    } else if (isKeyPressed && !isOnRoad) {
      impostor.setLinearVelocity(Vector3.Zero());
      console.log("Not on road - movement blocked");
    } else {
      impostor.setLinearVelocity(Vector3.Zero());
    }

    // Prevent sphere from falling below floor level
    if (groundHit?.hit && groundHit.pickedPoint) {
      const floorHeight = groundHit.pickedPoint.y;
      const minSphereHeight = floorHeight + 0.5;

      if (sphere.position.y < minSphereHeight) {
        sphere.position.y = minSphereHeight;
        const velocity = impostor.getLinearVelocity();
        impostor.setLinearVelocity(new Vector3(velocity.x, 0, velocity.z));
      }
    } else if (sphere.position.y < 0.5) {
      sphere.position.y = 0.5;
      const velocity = impostor.getLinearVelocity();
      impostor.setLinearVelocity(new Vector3(velocity.x, 0, velocity.z));
    }

    // Update camera to follow sphere
    camera.setTarget(sphere.position.add(new Vector3(0, 2, 0)));
    scene.render();
  });

  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
      const pickInfo = pointerInfo.pickInfo;
      if (pickInfo?.hit && pickInfo.pickedMesh) {
        console.log("Mesh clicked:", pickInfo.pickedMesh.name, pickInfo.pickedPoint.x, pickInfo.pickedPoint.y, pickInfo.pickedPoint.z);
      }
    }
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
});