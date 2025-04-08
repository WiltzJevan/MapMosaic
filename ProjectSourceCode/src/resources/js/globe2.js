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

/** Animations (Old)
(function animate() {
  requestAnimationFrame(animate);
  world.rotation.y += 0.001;
  controls.update();
  renderer.render(scene, camera);
})(); */

let rotating = true;

function stopRotation() {
  rotating = false;
}
function resumeRotation() {
  rotating = true;
}

// Animations
(function animate() {
  requestAnimationFrame(animate);
  if (rotating) {
    world.rotation.y += 0.001;
  }
  controls.update();
  renderer.render(scene, camera);
})();

// Marker & User Trip Interactions (WIP)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(world.globeObject());

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const r = world.getGlobeRadius();
    const lat = 90 - (Math.acos(point.y / r) * 180 / Math.PI);
    const lon = ((270 + (Math.atan2(point.x, point.z) * 180 / Math.PI)) % 360) - 180;

    document.getElementById('live-coords').innerText = 
      `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
    
    // Optional autofill
    document.getElementById('lat-input').value = lat.toFixed(6);
    document.getElementById('lon-input').value = lon.toFixed(6);
  }
});


//renderer.domElement.addEventListener('dblclick', onDoubleClick, false);

//const raycaster = new THREE.Raycaster();
//const mouse = new THREE.Vector2();

function addMarker(lat, lon, event) {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const r = world.getGlobeRadius ? world.getGlobeRadius() + 1 : 100;
  marker.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );

  scene.add(marker);
  showPopup(lat, lon, event);
  stopRotation();
}

window.addMarkerFromInput = function () {
  const lat = parseFloat(document.getElementById('lat-input').value);
  const lon = parseFloat(document.getElementById('lon-input').value);

  if (isNaN(lat) || isNaN(lon)) {
    alert("Invalid coordinates!");
    return;
  }

  addMarker(lat, lon);
};


function onDoubleClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const globe = world.globeObject?.();
  if (!globe) {
    console.warn('world.globeObject() is undefined');
    return;
  }

  const intersects = raycaster.intersectObject(globe);
  if (intersects.length > 0) {
    const point = intersects[0].point;

    const radius = world.getGlobeRadius ? world.getGlobeRadius() : 100;
    const lat = 90 - (Math.acos(point.y / radius) * 180 / Math.PI);
    const lon = ((270 + (Math.atan2(point.x, point.z) * 180 / Math.PI)) % 360) - 180;

    addMarker(lat, lon, event);
  } else {
    console.log('No intersection with globe');
  }
}

function showPopup(lat, lon, event) {
  const popup = document.getElementById('popup');
  popup.style.left = `${event.clientX + 10}px`;
  popup.style.top = `${event.clientY + 10}px`;
  popup.innerHTML = `
    <strong>Marker Placed</strong><br>
    Lat: ${lat.toFixed(2)}<br>
    Lon: ${lon.toFixed(2)}<br>
    <button onclick="hidePopup()">Close</button>
  `;
  popup.style.display = 'block';
}

window.hidePopup = function () {
  document.getElementById('popup').style.display = 'none';
  resumeRotation();
};