console.log("globe2.js loaded");

//import * as THREE from 'three';
//import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import * as THREE from 'https://esm.sh/three@0.150.1';
//import Globe from 'three-globe';
import Globe from 'https://esm.sh/three-globe@2.30.0';

console.log("globe2.js imports loaded");

// Imports controls
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from 'https://esm.sh/three@0.150.1/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('globeViz').appendChild(renderer.domElement);

// Scene & camera adjustments
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
function createStarfield() {
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 10000;

  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 2000; // spread stars out in space
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
  return new THREE.Points(starsGeometry, starsMaterial);
}
const stars = createStarfield();
scene.add(stars);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
camera.position.z = 300;

// Lighting
scene.add(new THREE.AmbientLight(0xbbbbbb));
scene.add(new THREE.DirectionalLight(0xffffff, 0.6));

// Globe Texturization
const world = new Globe()
  .globeImageUrl('/resources/images/globe.jpg')
  .bumpImageUrl('/resources/images/earthbump1k.jpg');

scene.add(world);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enablePan = false;
controls.minDistance = 120;
controls.maxDistance = 500;

// Animations
(function animate() {
  requestAnimationFrame(animate);
  world.rotation.y += 0.001;
  controls.update();
  renderer.render(scene, camera);
})();
