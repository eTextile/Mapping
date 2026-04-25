import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

let camera, scene, renderer;
let geometry, mesh, edges, threshold_plane;
let matrix_group;
let canvas_width, canvas_height, half_canvas;
let viz_cols, viz_rows, viz_frame;

console.log("THREE.JS REVISION:", THREE.REVISION);

// --- INIT SIZE ---
function updateCanvasSize() {
  const sensor = document.querySelector("#matrix_canvas .sensor");
  canvas_height = sensor ? sensor.clientHeight : 0;
  canvas_width = canvas_height;
  half_canvas = canvas_width / 2;
}

// --- BUILD GEOMETRY ---
function build_geometry(cols, rows) {
  const geo = new THREE.BufferGeometry();

  const vertices = [];
  const normals = [];
  const indices = [];

  const size = 22;
  const segment_size = size / cols;
  const X_offset = (cols - 1) * segment_size / 2;
  const Y_offset = (rows - 1) * segment_size / 2;

  for (let i = 0; i < rows; i++) {
    const y = i * segment_size - Y_offset;
    for (let j = 0; j < cols; j++) {
      const x = j * segment_size - X_offset;
      vertices.push(x, y, 0);
      normals.push(0, 0, 1);
    }
  }

  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const i1 = i * cols + j;
      const i2 = (i + 1) * cols + j;
      const i3 = i * cols + (j + 1);
      const i4 = (i + 1) * cols + (j + 1);
      indices.push(i1, i2, i4);
      indices.push(i1, i4, i3);
    }
  }

  const positionAttr = new THREE.Float32BufferAttribute(vertices, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);

  const normalAttr = new THREE.Float32BufferAttribute(normals, 3);
  normalAttr.setUsage(THREE.DynamicDrawUsage);

  geo.setIndex(indices);
  geo.setAttribute("position", positionAttr);
  geo.setAttribute("normal", normalAttr);

  return geo;
}

// --- SET RESOLUTION ---
window.set_matrix_resolution = function (cols, rows) {
  viz_cols = cols;
  viz_rows = rows;
  viz_frame = cols * rows;

  geometry.dispose();
  geometry = build_geometry(cols, rows);
  mesh.geometry = geometry;
  edges.geometry = geometry;

  const is_raw = (cols === RAW_COLS && rows === RAW_ROWS);
  document.getElementById("matrix_raw_btn").classList.toggle("active", is_raw);
  document.getElementById("matrix_interp_btn").classList.toggle("active", !is_raw);

  if (typeof send_midi_msg === "function") {
    const mode = is_raw ? MODE.MATRIX_RAW : MODE.MATRIX_INTERP;
    send_midi_msg(new program_change(MIDI_MODES_CHANNEL, mode));
  }
};

// --- SET THRESHOLD PLANE ---
// raw_val: firmware threshold value (0–255 raw scale, same as matrix data)
window.set_threshold_plane = function (raw_val) {
  threshold_plane.position.z = -(raw_val / 10);
};

// --- INIT ---
function init() {
  const threeCanvas = document.getElementById("canvas-3D");

  // --- RENDERER (created first — needed for PMREMGenerator) ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas_width, canvas_height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  threeCanvas.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    45,
    canvas_width / canvas_height,
    1,
    1000
  );
  camera.position.z = 35;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // --- ENVIRONMENT (studio lighting via PMREMGenerator) ---
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(0, 30, 15);
  scene.add(dirLight);

  // --- INITIAL GEOMETRY (RAW) ---
  viz_cols = RAW_COLS;
  viz_rows = RAW_ROWS;
  viz_frame = RAW_FRAME;
  geometry = build_geometry(viz_cols, viz_rows);

  // --- MATERIALS ---
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x444444,
    transparent: true,
    opacity: 0.3
  });

  const thresholdMaterial = new THREE.MeshBasicMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  // --- MESHES ---
  mesh = new THREE.Mesh(geometry, material);
  edges = new THREE.Mesh(geometry, wireMaterial);

  threshold_plane = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), thresholdMaterial);
  threshold_plane.position.z = -(5 / 10); // firmware default: val=5

  // --- GROUP (shared rotation) ---
  matrix_group = new THREE.Group();
  matrix_group.rotation.set(deg_to_rad(140), 0, 0);
  matrix_group.add(mesh);
  matrix_group.add(edges);
  matrix_group.add(threshold_plane);
  scene.add(matrix_group);

  window.addEventListener("resize", onWindowResize);
}

// --- RESIZE ---
function onWindowResize() {
  updateCanvasSize();

  renderer.setSize(canvas_width, canvas_height);

  camera.aspect = canvas_width / canvas_height;
  camera.updateProjectionMatrix();
}

// --- RENDER LOOP ---
function render() {
  if (e256_matrix.dirty) {
    const position = geometry.getAttribute("position");
    const mat = e256_matrix.matrix;

    for (let i = 0; i < viz_frame; i++) {
      position.setZ(i, -(mat[i] || 0));
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    e256_matrix.dirty = false;
  }

  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

// --- START ---
$(document).ready(function () {
  init();

  document.getElementById("matrix_canvas").addEventListener("shown.bs.collapse", function () {
    onWindowResize();
  });

  const threshold_slider = document.getElementById("threshold_slider");
  const threshold_display = document.getElementById("threshold_display");

  threshold_slider.addEventListener("input", function () {
    const val = Number(this.value);
    threshold_display.textContent = val;
    set_threshold_plane(val);
    if (typeof send_midi_msg === "function") {
      send_midi_msg(new control_change(MIDI_LEVELS_CHANNEL, THRESHOLD, val));
    }
  });

  renderer.setAnimationLoop(render);
});
