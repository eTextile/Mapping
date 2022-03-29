/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

import * as THREE from 'three';

let camera, scene, geometry, renderer;
var paperWidth, paperHeight;
var windowHalfX, windowHalfY;

$(document).ready(function () {

  init();
  animate();

  function init() {
    var myCanvas = document.getElementById('canvas-3D');

    paperWidth = (window.innerWidth * 0.7);
    paperHeight = (window.innerHeight * 0.8);
    windowHalfX = (paperWidth / 2);
    windowHalfY = (paperHeight / 2);

    camera = new THREE.PerspectiveCamera(45, paperWidth / paperHeight, 1, 1000);
    camera.position.z = 31;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    //scene.background = new THREE.Color(0x050505);

    const light = new THREE.HemisphereLight();
    scene.add(light);
    
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

    const sizeX = 26;
    const sizeY = 26;

    const X_offset = (sizeX / 2);
    const Y_offset = (sizeY / 2);

    const segmentSizeX = (sizeX / RAW_COLS);
    const segmentSizeY = (sizeY / RAW_ROWS);

    // RAW_FRAME = RAW_ROWS * RAW_COLS (16 * 16)
    for (var i = 0; i < RAW_ROWS; i++) {
      const y = (i * segmentSizeY) - Y_offset;
      for (var j = 0; j < RAW_COLS; j++) {
        const x = (j * segmentSizeX) - X_offset;
        vertices.push(x, y, 0); // Make new vertex
        normals.push(0, 0, 1);
        const r = (x / sizeX) + 0.5;
        const g = (y / sizeY) + 0.5;
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
      vertexColors: true
    });

    const wireMaterial = new THREE.MeshPhongMaterial({
      wireframe: true,
      color: 0xffffff
    });

    let mesh = new THREE.Mesh(geometry, material);
    let edges = new THREE.Mesh(geometry, wireMaterial);

    mesh.add(edges);
    mesh.rotation.set(-1, 0, 0);

    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(paperWidth, paperHeight);
    myCanvas.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
  }
});

function onWindowResize() {
  paperWidth = window.innerWidth * 0.7;
  paperHeight = window.innerHeight * 0.8;
  windowHalfX = (paperWidth / 2);
  windowHalfY = (paperHeight / 2);
  renderer.setSize(paperWidth, paperHeight);
  camera.aspect = paperWidth / paperHeight;
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