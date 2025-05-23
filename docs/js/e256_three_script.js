/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

import * as THREE from './lib/three.module.js';

let camera, scene, geometry, renderer;

var canvas_width = null;
var canvas_height = null;
var half_canvas = null;

//console.log("THREE.JS: " + THREE.version); // FIXME!

canvas_height = $("#loading_canvas").height();
canvas_width = canvas_height;
half_canvas = canvas_width / 2;
//console.log("THREE_WIDTH: " + canvas_width + " THREE_HEIGHT: " + canvas_height);


function init() {
  var threeCanvas = document.getElementById("canvas-3D");

  camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
  camera.position.z = 35;
  camera.aspect = 1;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  /*
  const pointMaterial = new THREE.PointsMaterial({size: 0.2, color: "red"})
  let points = new THREE.Points(geometry, pointMaterial);
  scene.add(points);
  */

  geometry = new THREE.BufferGeometry();

  const indices = [];
  const vertices = [];
  const normals = [];
  const colors = [];

  const size = 22; // canvas_width / RAW_COLS...

  const X_offset = (size / 2) - 1;
  const Y_offset = (size / 2) - 1;

  const segment_size = (size / RAW_COLS);

  // RAW_FRAME = RAW_ROWS * RAW_COLS (16 * 16)
  for (var i = 0; i < RAW_ROWS; i++) {
    const y = (i * segment_size) - Y_offset;
    for (var j = 0; j < RAW_COLS; j++) {
      const x = (j * segment_size) - X_offset;
      vertices.push(x, y, 0); // Make new vertex
      normals.push(0, 0, 1);
      const r = (x / size) + 0.5;
      const g = (y / size) + 0.5;
      colors.push(r, g, 1); // Set vertex color
    }
  }
  for (let i = 0; i < RAW_ROWS - 1; i++) {
    for (let j = 0; j < RAW_COLS - 1; j++) {
      const i1 = i + j * RAW_COLS;
      const i2 = (i + 1) + j * RAW_COLS;
      const i3 = i + (j + 1) * RAW_COLS;
      const i4 = (i + 1) + (j + 1) * RAW_COLS;
      indices.push(i1, i2, i4);
      indices.push(i1, i3, i4);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    shininess: 100,
    vertexColors: true
  });
  let mesh = new THREE.Mesh(geometry, material);
  //scene.add(mesh);
  
  const wireMaterial = new THREE.MeshPhongMaterial({
    wireframe: true,
    color: 0xffffff
  });
  let edges = new THREE.Mesh(geometry, wireMaterial);
  scene.add(edges);  

  //mesh.rotation.set(deg_to_rad(-40), 0, 0);
  edges.rotation.set(deg_to_rad(140), 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true
 });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas_width, canvas_height);
  threeCanvas.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  canvas_height = $("#mapping_canvas").height();
  canvas_width = canvas_height;
  half_canvas = canvas_width / 2;
  console.log("THREE_WIDTH: " + canvas_width + " THREE_HEIGHT: " + canvas_height);  
  renderer.setSize(canvas_width, canvas_height);
  camera.aspect = canvas_width / canvas_height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  let position = geometry.getAttribute('position');
  
  for (let i = 0; i < RAW_FRAME; i++) {
    position.setZ(i, e256_matrix.getZ(i));
  }

  geometry.attributes.position.needsUpdate = true;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

$(document).ready(function() {
  init();
  animate();
});