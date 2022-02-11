var circleArray = [];

window.onload = function() {
  var myCanvas = document.getElementById('canvas');
  paper.install(window);
  paper.setup(myCanvas);
}

function onFrame(event) {
  //paper.view.draw();
}

/*
function onMouseMove(event) {
  project.activeLayer.selected = false;
  if (event.item)
    event.item.selected = true;
}

function onMouseDrag(event) {
  if (segment) {
    segment.point += event.delta;
    path.smooth();
  } else if (path) {
    path.position += event.delta;
  }
}
*/

function onBlobDown() {
  let circle = new Path.Circle({
    center: [0, 0],
    radius: 10,
    fillColor: 'red'
  });
  circleArray.push(circle);
}

function onBlobUpdate(event) {
  //console.log("BLOB_INDEX: " + event);
  let blob = new Blob;
  blob = e256_blobs.get(event);
  //console.log("BLOB_X: " + blob.x + " BLOB_Y: " + blob.y);
  let pos = new Point(blob.x*4, blob.y*4);
  circleArray[event].position = pos;
  circleArray[event].radius = blob.z;
}

function onBlobRelease(event) {

  circleArray[event].remove();
  circleArray.splice(event, 1);
  //paper.view.draw();
}
