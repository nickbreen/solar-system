import {PerspectiveCamera, Scene, TextureLoader, WebGLRenderer} from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import StarField from "./starfield.js";
import Sun from "./sun.js";

const loader = new TextureLoader();
const textures = {}
document.querySelectorAll('link[data-texture]')
  .forEach(link => textures[link.dataset.texture] = loader.load(link.href));

class SolarSystem extends Scene
{
  constructor(textures)
  {
    super()
      .add(new StarField({numStars: 1000, distance: 60}))
      .add(new Sun(textures.sun));
  }

  animate(t)
  {
    this.children.filter(child => child.animate).forEach(child => child.animate(t))
  }
}

const camera = new PerspectiveCamera(75, 1, 0.1, 100);
camera.position.set(1, 0, 0);
const canvas = document.getElementById("renderer");
const renderer = new WebGLRenderer({canvas, antialias: true});
const controls = new OrbitControls(camera, renderer.domElement);

new ResizeObserver(entries => {
  for (let entry of entries)
  {
    const {width, height} = entry.contentRect;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}).observe(canvas);

const scene = new SolarSystem(textures);

renderer.setAnimationLoop(t => {
  scene.animate(t);
  renderer.render(scene, camera);
  controls.update(t)
});

controls.zoomToCursor = true;
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 60;


