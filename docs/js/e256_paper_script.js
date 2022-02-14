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
let selectSegment;
let activeLayer;

var translate = false;
let blobTouch = [];
let blobPath = [];


var layerToggel;
var layerTrigger;
var layerSlider;
var layerKnob;

var toggelOptions = {
}
var triggerOptions = {
}

// SHAPES DEFAULT PARAMS
var sliderOptions = {
  from: [50, 50],
  to: [100, 200],
  strokeColor: 'lightblue',
  fillColor: 'yellow',
  /*
  fillColor: {
    gradient: {
        stops: ['yellow', 'blue']
    }
  },
  */
  strokeWidth: 10,
  selected: false,
};

var knobOptions = {
  center: [100,100],
  radius: [50, 50],
  strokeColor: 'lightblue',
  fillColor: 'blue',
  /*
  fillColor: {
    gradient: {
        stops: ['yellow', 'blue']
    }
  },
  */
  strokeWidth: 10,
  selected: false,
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

  layerSlider = new Layer();
  layerKnob = new Layer();
  layerToggel = new Layer();
  layerTrigger = new Layer();

  // MOUSE_OVER
  tool.onMouseMove = function (event) {
    project.activeLayer.selected = false;
    if (event.item) {
      event.item.selected = true;
    }
  }

  tool.onMouseDown = function (event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      activeLayer = selectItem = selectSegment = selectPath = null;
      return;
    } else {
      selectItem = hitResult.item;
      activeLayer = hitResult.item.layer;
      project.layers[activeLayer.index].activate();
      switch (hitResult.type){
      case 'stroke':
        translate = false;
        selectPath = hitResult.type;
        selectSegment = hitResult.location.index;
        break;
      case 'fill':
        selectPath = hitResult.type;
        translate = true;
        break;
      case 'segment':
        selectPath = hitResult.type;
        break;
      default:
        // NA
        break;
      }
    }
  }

  function updateSlider(event) {
    switch (selectPath) {
      case 'stroke':
        switch (selectSegment) {
          case 0:
            selectItem.segments[0].point.x = event.point.x;
            selectItem.segments[1].point.x = event.point.x;
            break;
          case 1:
            selectItem.segments[1].point.y = event.point.y;
            selectItem.segments[2].point.y = event.point.y;
            break;
          case 2:
            selectItem.segments[2].point.x = event.point.x;
            selectItem.segments[3].point.x = event.point.x;
            break;
          case 3:
            selectItem.segments[3].point.y = event.point.y;
            selectItem.segments[0].point.y = event.point.y;
            break;
        }
      case 'fill':
        if (translate) selectItem.translate(event.delta);
        break;
      case 'segment':
        // NA
        break;
    }
  }

  function updateKnob(event) {
    switch (selectPath) {
      case 'stroke' || 'segment':
        var x = event.point.x - selectItem.position.x;
        var y = event.point.y - selectItem.position.y;
        var radius = Math.sqrt((x * x) + (y * y));
        setRadius(selectItem, radius);
        break;
      case 'fill':
        if (translate) selectItem.translate(event.delta);
        break;
    }
  }

  tool.onMouseDrag = function (event) {
    switch (activeLayer) {
      case layerSlider:
        updateSlider(event);
        break;
      case layerKnob:
        updateKnob(event);
        break;
      default:
        // NA
        break;
    }
  }

})

var setRadius = function(path, radius) {
  // figure out what the new radius should be without the stroke
  var newRadiusWithoutStroke = radius - path.strokeWidth / 2;
  // figure out what the current radius is without the stroke 
  var oldRadiusWithoutStroke = path.bounds.width / 2;
  path.scale(newRadiusWithoutStroke / oldRadiusWithoutStroke);
}

////////////// ADD_CONTROL_GUI

function toggelMode(event) {
  var e256_toggel = new Path.Rectangle(toggelOptions);
  //e256_slider.fillColor = Color.random();
  layerToggel.activate();
  project.activeLayer.addChild(e256_toggel);
  activeLayer = project.activeLayer;
}
function triggerMode(event) {
  var e256_trigger = new Path.Rectangle(triggerOptions);
  //e256_slider.fillColor = Color.random();
  layerTrigger.activate();
  project.activeLayer.addChild(e256_trigger);
  activeLayer = project.activeLayer;
}
function sliderMode(event) {
  var e256_slider = new Path.Rectangle(sliderOptions);
  //e256_slider.fillColor = Color.random();
  layerSlider.activate();
  project.activeLayer.addChild(e256_slider);
  activeLayer = project.activeLayer;
}
function knobMode(event) {
  var e256_knob = new Path.Circle(knobOptions); 
  //e256_knob.fillColor = Color.random();
  layerKnob.activate();
  project.activeLayer.addChild(e256_knob);
  activeLayer = project.activeLayer;
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
  //blobTouch[event].radius = blob.z;
  blobPath[event].add(pos);
  //blobPath[event].path.smooth({ type: 'catmull-rom', factor: 0.1 }); // http://paperjs.org/reference/path/#smooth
}

function onBlobRelease(event) {
  blobTouch[event].remove();
  blobTouch.splice(event, 1);
  blobPath[event].remove();
  blobPath.splice(event, 1);
}

//////////////////////////////////// TODO
//onKeyDown(delate)
//project.activeLayer.children[itemName].remove();

 /*
  if (event.modifiers.shift) {
    if (hitResult.type == 'segment') {
      hitResult.segment.remove();
    }
    return;
  */