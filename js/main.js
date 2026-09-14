import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const loader = new GLTFLoader()

// Need these for T-pose fix - make sure you have these at top of your main game file too:
// let mixer; const clock = new THREE.Clock();

loader.load('./assets/models/nova.glb', (gltf) => {
  const model = gltf.scene

  // fix scale - your nova is huge in T-pose, scale to 1.7m
  const box = new THREE.Box3().setFromObject(model)
  const height = box.max.y - box.min.y
  if (height > 3) model.scale.setScalar(1.7 / height)
  model.position.y = 0

  model.traverse(o => { if(o.isMesh) { o.castShadow = true; o.frustumCulled = false; } })

  // --- T-POSE FIX ---
  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model)
    const idle = gltf.animations.find(c => /idle/i.test(c.name)) || gltf.animations[0]
    mixer.clipAction(idle).play()
    console.log('NOVA anim playing:', idle.name, 'total clips:', gltf.animations.length)
  } else {
    // no anims - force arms down
    console.log('No animations in nova.glb - forcing arms down from T-pose')
  }

  // If your main character variable is called something else, change this:
  // If you have a placeholder bunny, remove it here
  if (window.nova) scene.remove(window.nova)
  window.nova = model
  scene.add(model)

}, undefined, (e) => console.error('NOVA LOAD ERROR:', e))

// same for walls - your wall file name was wrong, use wall.glb
loader.load('./assets/models/walls/wall.glb', (gltf) => {
  const wallTemplate = gltf.scene
  // you had ShortWall_DarkPlastic_Straight.glb - renamed to wall.glb
  console.log('WALL loaded')
  // your wall tiling code here - keep what you had
  scene.add(wallTemplate)
}, undefined, (e) => console.error('WALL LOAD ERROR:', e))

// IN YOUR ANIMATE LOOP - add this line at the top:
// if (mixer) mixer.update(clock.getDelta())
