/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

//Cool snap: https://gist.github.com/willismorse/d2a291d20d7a4419e732b9f1679eb3e3

var myWidth, myHeight;
var myCanvas, paper;
let selectItem;
let selectPath;

let blobTouch = [];
let blobPath = [];

// SHAPES DEFAULT PARAMS
var sliderOptions = {
  from: [50, 50],
  to: [100, 200],
  strokeColor: 'lightblue',
  fillColor: 'lightblue',
  strokeWidth: 1,
  selected: false
};

var hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 2
};

$(document).ready(function(){

  'use strict';
  paper.install(window);
  paper.setup(document.getElementById('canvas'));
  myWidth = window.innerWidth;
  myHeight = window.innerHeight;
  var tool = new paper.Tool();
  tool.activate();
  tool.minDistance = 5; 
  
  /*
  if (event.modifiers.shift) {
    if (hitResult.type == 'segment') {
      hitResult.segment.remove();
    }
    return;
  */

  // MOUSE_OVER
  tool.onMouseMove = function (event) {
    project.activeLayer.selected = false;
    if (event.item) {
      event.item.selected = true;
    }
  }

  tool.onMouseDown = function (event) {
    var hitResult = project.activeLayer.hitTest(event.point, hitOptions);
    if (!hitResult) {
      console.log("MOUSE_DOWN: null");
      return;
    } else {
      selectItem = hitResult.item;
      switch (hitResult.type){
      case 'segment':
        console.log("MOUSE_DOWN_SEGMENT: " + hitResult);
        selectPath = hitResult.type;
        break;
      case 'stroke':
        selectPath = hitResult.type;
        console.log("MOUSE_DOWN_STROKE: " + selectItem.strokeBounds);

        //selectPath = selectItem.insert(location.index + 1, event.point);
        //path.smooth();
        break;
      case 'fill':
        selectPath = hitResult.type;
        break;
      default:
        selectPath = null;
        break;
      }
    }
  }

  tool.onMouseDrag = function (event) {
    switch (selectPath){
      case 'segment':
        selectPath.point += event.delta;
        selectItem.smooth();
        break;
      case 'stroke':
        //
        break;
      case 'fill':
        selectItem.translate(event.delta);
        break;
    } 
  }

  tool.updateRect = function(event) {
    //var tlVec = bounds.topLeft.subtract(bounds.center).multiply(scale);
    //var brVec = bounds.bottomRight.subtract(bounds.center).multiply(scale);
    //var newBounds = new Rectangle(tlVec + bounds.center, brVec + bounds.center);
  }

})

////////////// ADD_SHAPES
function addSlider(event) {
  var slider = new Shape.Rectangle(sliderOptions);
  project.activeLayer.addChild(slider);
}


////////////// BLOB_INPUT
function onBlobDown() {
  let circle = new Path.Circle({
    center: [0, 0],
    radius: 10,
    fillColor: 'red'
  });
  blobTouch.push(circle);
  path = new Path();
  path.strokeColor = '#00000';
  blobPath.push(path);
}

function onBlobUpdate(event) {
  let blob = new Blob;
  blob = e256_blobs.get(event);
  let pos = new Point(blob.x * 4, blob.y * 4);
  blobTouch[event].position = pos;
  blobTouch[event].radius = blob.z;
  blobPath[event].add(pos);
}

function onBlobRelease(event) {
  blobTouch[event].remove();
  blobTouch.splice(event, 1);
  blobPath[event].remove();
  blobPath.splice(event, 1);
}

//onKeyDown(delate)
//project.activeLayer.children[itemName].remove();