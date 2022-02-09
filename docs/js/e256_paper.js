//import { Blobs } from 'e256_parcer.js';
//const Blobs = require('e256_parcer.js');
var path;
var start;

window.onload = function () {
    // Get a reference to the canvas object
    var canvas = document.getElementById('canvas');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    // Create a Paper.js Path to draw a line into it:
    path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:

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

function onBlobsUpdate(event){
  let myBlob = e256_blobs.get(event);
  path.lineTo(start.add([myBlob.x*2, myBlob.y*2]));
  paper.view.draw();
}