/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

//Cool snap: https://gist.github.com/willismorse/d2a291d20d7a4419e732b9f1679eb3e3

let currentMode = 'editMode';

var myWidth;
var myHeight;
var x_scaleFactor;
var y_scaleFactor;

let selectItem;
let selectPath;
let selectSegment;
let activeLayer;

var translate = false;
let blobTouch = [];
let blobPath = [];
let blobPathSmooth = [];

var layerToggel;
var layerTrigger;
var layerSlider;
var layerKnob;

var shapeMode;

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
  center: [100, 100],
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

window.onload = function () {
  //'use strict';
  paper.install(window);

  paper.setup(document.getElementById('canvas-2D'));

  myWidth = window.innerWidth;
  myHeight = window.innerHeight;

  paper.view.viewSize = new Size(myWidth, myHeight);

  x_scaleFactor = (myWidth / 127);
  y_scaleFactor = (myHeight / 127);

  var tool = new paper.Tool();
  tool.activate();
  tool.minDistance = 5;

  layerTrigger = new Layer();
  layerToggel = new Layer();
  layerSlider = new Layer();
  layerKnob = new Layer();

  // MOUSE_OVER
  tool.onMouseMove = function (event) {
    project.activeLayer.selected = false;
    if (event.item) {
      event.item.selected = true;
    }
  }

  tool.onMouseDown = function (event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (currentMode === 'editMode') {
      if (!hitResult) {
        drawShape(event);
        //activeLayer = selectItem = selectSegment = selectPath = null;
        return;
      } else {
        selectItem = hitResult.item;
        activeLayer = hitResult.item.layer;
        project.layers[activeLayer.index].activate();
        switch (hitResult.type) {
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
    else if (currentMode === 'playMode') {
      //
    }
  }

  //////////////////////////////////// TODO
  tool.onKeyDown = function (event) {
    //console.log(event.key);
    if (Key.isDown('backspace')) {
      selectItem.remove();
    }
  }

  function updateTrigger(event) {
    // Same as updateSlider
  }

  function updateToggel(event) {
    // Same as updateSlider
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
    if (currentMode === 'editMode') {
      switch (activeLayer) {
        case layerTrigger:
          updateTrigger(event);
          break;
        case layerToggel:
          updateToggel(event);
          break;
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
    } else if (currentMode === 'playMode') {
      // TODO
    }
  }

  ////////////// ADD_CONTROL_GUI
  // TODO: create the shapes using the mouse point (event.point)
  function drawShape(event) {

    if (shapeMode === 'trigger') {
      var e256_trigger = new Path.Rectangle(triggerOptions);
      layerTrigger.position = event.point;
      layerTrigger.activate();
      project.activeLayer.addChild(e256_trigger);
      activeLayer = project.activeLayer;
    }
    else if (shapeMode === 'toggel') {
      var e256_toggel = new Path.Rectangle(toggelOptions);
      e256_toggel.position = event.point;
      layerToggel.activate();
      project.activeLayer.addChild(e256_toggel);
      activeLayer = project.activeLayer;
    }
    else if (shapeMode === 'slider') {
      var e256_slider = new Path.Rectangle(sliderOptions);
      e256_slider.position = event.point;
      layerSlider.activate();
      project.activeLayer.addChild(e256_slider);
      activeLayer = project.activeLayer;
    }
    else if (shapeMode === 'knob') {
      var e256_knob = new Path.Circle(knobOptions);
      e256_knob.fillColor = Color.random();
      e256_knob.position = event.point;
      layerKnob.activate();
      project.activeLayer.addChild(e256_knob);
      activeLayer = project.activeLayer;
    }
  }

}

var setRadius = function (path, radius) {
  // figure out what the new radius should be without the stroke
  var newRadiusWithoutStroke = radius - path.strokeWidth / 2;
  // figure out what the current radius is without the stroke 
  var oldRadiusWithoutStroke = path.bounds.width / 2;
  path.scale(newRadiusWithoutStroke / oldRadiusWithoutStroke);
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
  let pos = new Point(blob.x * x_scaleFactor, blob.y * y_scaleFactor);
  blobTouch[event].position = pos;
  //blobTouch[event].radius = blob.z; // FIXME!
  //blobPath[event].add(pos);

  //blobPathSmooth[event].add(pos);
  //blobPathSmooth[event].smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15

  //blobPathSmooth[] = blobPath[event].lastSegment.clone();
  //console.log("SEGMENT: " + copy.point.x);



  //copy.segments[0].position.x += 10;
  //copy.segments[0].position.y += 10;
  //copy.segments[1].position.x += 10;
  //copy.segments[1].position.y += 10;
  //blobPath[event].fullySelected = true;
  //blobPath[event].smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth
  //blobPath[event].fullySelected = false;
}

function onBlobRelease(event) {
  blobTouch[event].remove();
  blobTouch.splice(event, 1);
  blobPath[event].remove();
  blobPath.splice(event, 1);
}

function modeSelector(event) {
  currentMode = event.target.id;
}

function toolSelector(event) {
  shapeMode = event.target.id;
}