// https://stackoverflow.com/questions/49318245/threejs-drag-points

var scene = new THREE.Scene();
const bgColor = new THREE.Color('white');
scene.background = new THREE.Color( bgColor );

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, -20, 10);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var geometry = new THREE.PlaneBufferGeometry(15, 15, 15, 15);
var plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
  wireframe: true,
  color: "blue"
}));
scene.add(plane);

var points = new THREE.Points(geometry, new THREE.PointsMaterial({
  size: 0.2,
  color: "red"
}));
scene.add(points);

function updatePlane() {
  for(let i = 0; i<256; i++){
    geometry.attributes.position.setZ(i, e256_matrix.getZ(i+1));
  }
  geometry.attributes.position.needsUpdate = true;
}

function render() {
  updatePlane();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();