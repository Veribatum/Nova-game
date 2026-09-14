import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const loader = new GLTFLoader()

loader.load('./assets/models/nova.glb', (gltf) => {
  scene.add(gltf.scene)
}, undefined, (e) => console.error(e))

// same for walls
loader.load('./assets/models/walls/ShortWall_DarkPlastic_Straight.glb', ...)