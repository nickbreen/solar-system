import {PerspectiveCamera, Scene, TextureLoader, WebGLRenderer} from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import StarField from "./starfield.js";
import Sun from "./sun.js";

const loader = new TextureLoader();
const textures = {}
document.querySelectorAll("link[data-texture]").forEach(link => textures[link.dataset.texture] = loader.load(link.href));

const scene = new Scene();
const camera = new PerspectiveCamera(75, 1, 0.1, 100);
const renderer = new WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

controls.minDistance = 10;
controls.maxDistance = 60;
camera.position.set(30 * Math.cos(Math.PI / 6), 30 * Math.sin(Math.PI / 6), 40);

renderer.setSize(document.body.clientWidth, document.body.clientHeight);
renderer.render(scene, camera);

new ResizeObserver(entries => {
  for (let entry of entries)
  {
    const {width, height} = entry.contentRect;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}).observe(document.body);

const starField = new StarField({numStars: 100});
const sun = new Sun({texture: textures.sun})
scene.add(starField, sun);

const animate = t => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  starField.animate(t);
  sun.animate(t);
};

requestAnimationFrame(animate);

document.body.appendChild(renderer.domElement);
