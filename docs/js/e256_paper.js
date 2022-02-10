var circleArray = [];

window.onload = function() { 
  paper.setup('myCanvas');
}

/*
function onFrame(event) {
	for (var i = 0, l = circleArray.length; i < l; i++) {
	}
}

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
  var circle = new paper.Path.Circle({
    center: [160, 80],
    radius: 10,
    fillColor: 'red'
  });
  circleArray.push(circle);
}

function onBlobUpdate(event) {
  let circle = circleArray[event];
  circle.center = new paper.Point(e256_blobs[event].x, e256_blobs[event].y);
  circle.radius = e256_blobs[event].z;
  paper.view.draw();
}

function onBlobRelease(event) {
  circleArray.splice(event, 1);
}
