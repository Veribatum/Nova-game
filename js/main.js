// this is the part that was missing in js/main.js
let mixer, clock = new THREE.Clock();

loader.load('./assets/models/nova.glb', (gltf) => {
  const model = gltf.scene;
  mixer = new THREE.AnimationMixer(model);
  // Mixamo names it mixamo.com or Idle - play whatever is first
  const clip = gltf.animations[0];
  mixer.clipAction(clip).play(); // THIS was missing - that's why T-pose
  scene.add(model);
});

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if(mixer) mixer.update(dt); // THIS LINE - without it she freezes in T-pose
  renderer.render(scene,camera);
}