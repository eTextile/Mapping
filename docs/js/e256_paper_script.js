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

let selectItem = {};
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

var triggerOptions = {
  "name": "Trigger",
  "from": [50, 50],
  "to": [100, 100],
  "strokeColor": "lightblue",
  "fillColor": "red",
  "data": {
    "channel": 1,
    "note": 1
  }
}

var toggelOptions = {
  "name": "Toggel",
  "from": [50, 50],
  "to": [100, 100],
  "strokeColor": "lightblue",
  "fillColor": "black",
  "data": {
    "channel": 1,
    "note": 1
  }
}

var sliderOptions = {
  "name": "Slider",
  "from": [50, 50],
  "to": [100, 300],
  "strokeColor": "lightblue",
  "fillColor": "yellow",
  "strokeWidth": 10,
  "selected": false,
  "data": {
    "channel": 1,
    "cChange": 32,
    "min": 0,
    "max": 127
  }
}

var knobOptions = {
  "name": "Knob",
  "center": [100, 100],
  "radius": [50, 50],
  "strokeColor": "lightblue",
  "fillColor": "blue",
  "opacity": 0.5,
  "strokeWidth": 10,
  "selected": false,
  "data": {
    "channel": 1,
    "cChangeTeta": 32,
    "min_t": 0,
    "max_t": 127,   
    "cChangeRadius": 33,
    "min_r": 0,
    "max_r": 127
  }
}

var hitOptions = {
  "segments": true,
  "stroke": true,
  "fill": true,
  "tolerance": 2
}

window.onload = function () {
  'use strict';
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
        activeLayer = selectItem = selectSegment = selectPath = null;
        return;
      } else {
        selectItem = hitResult.item;
        activeLayer = hitResult.item.layer;
        project.layers[activeLayer.index].activate();
        selectPath = hitResult.type;
        updateParams(selectItem);
        switch (hitResult.type) {
          case 'stroke':
            translate = false;
            selectSegment = hitResult.location.index;
            break;
          case 'fill':
            translate = true;
            break;
          case 'segment':
            //
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

  function updateParams(item) {
    //$('#summary_content').html(selectItem.name);
    //$("#param0").val("X: " + Math.round(selectItem.position.x));
    //$("#param1").val("Y: " + Math.round(selectItem.position.y));

    switch (item.name) {
      case "Trigger":
        $("#param-0").collapse("show");
        $("#inputParamAtribute-0").html(item.name);
        $("#inputParamValue-0").val(item.id);
        $("#param-1").collapse("show");
        $("#inputParamAtribute-1").html("Chan");
        $("#inputParamValue-1").val(item.data.channel);
        $("#param-2").collapse("show");
        $("#inputParamAtribute-2").html("Note");
        $("#inputParamValue-2").val(item.data.note);
        $("#param-3").collapse("hide");
        $("#param-4").collapse("hide");
        $("#param-5").collapse("hide");
        $("#param-6").collapse("hide");
        $("#param-7").collapse("hide");
        break;
      case "Toggel":
        $("#param-0").collapse("show");
        $("#inputParamAtribute-0").html(item.name);
        $("#inputParamValue-0").val(item.id);
        $("#param-1").collapse("show");
        $("#inputParamAtribute-1").html("Chan");
        $("#inputParamValue-1").val(item.data.channel);
        $("#param-2").collapse("show");
        $("#inputParamAtribute-2").html("Note");
        $("#inputParamValue-2").val(item.data.note);
        $("#param-3").collapse("hide");
        $("#param-4").collapse("hide");
        $("#param-5").collapse("hide");
        $("#param-6").collapse("hide");
        $("#param-7").collapse("hide");
        break;
      case "Slider":
        $("#param-0").collapse("show");
        $("#inputParamAtribute-0").html(item.name);
        $("#inputParamValue-0").val(item.id);
        $("#param-1").collapse("show");
        $("#inputParamAtribute-1").html("Chan");
        $("#inputParamValue-1").val(item.data.channel);
        $("#param-2").collapse("show");
        $("#inputParamAtribute-2").html("cChange");
        $("#inputParamValue-2").val(item.data.cChange);
        $("#param-3").collapse("show");
        $("#inputParamAtribute-3").html("min");
        $("#inputParamValue-3").val(item.data.min);
        $("#param-4").collapse("show");
        $("#inputParamAtribute-4").html("max");
        $("#inputParamValue-4").val(item.data.max);
        $("#param-5").collapse("hide");
        $("#param-6").collapse("hide");
        $("#param-7").collapse("hide");
        break;
      case "Knob":
        $("#param-0").collapse("show");
        $("#inputParamAtribute-0").html(item.name);
        $("#inputParamValue-0").val(item.id);
        $("#param-1").collapse("show");
        $("#inputParamAtribute-1").html("Chan");
        $("#inputParamValue-1").val(item.data.channel);
        $("#param-2").collapse("show");
        $("#inputParamAtribute-2").html("CC-teta");
        $("#inputParamValue-2").val(item.data.cChangeTeta);
        $("#param-3").collapse("show");
        $("#inputParamAtribute-3").html("min");
        $("#inputParamValue-3").val(item.data.min_t);
        $("#param-4").collapse("show");
        $("#inputParamAtribute-4").html("max");
        $("#inputParamValue-4").val(item.data.max_t);
        $("#param-5").collapse("show");
        $("#inputParamAtribute-5").html("CC-radius");
        $("#inputParamValue-5").val(item.data.cChangeRadius);
        $("#param-6").collapse("show");
        $("#inputParamAtribute-6").html("min");
        $("#inputParamValue-6").val(item.data.min_r);
        $("#param-7").collapse("show");
        $("#inputParamAtribute-7").html("max");
        $("#inputParamValue-7").val(item.data.max_r);
        break;
    }
  }

  //////////////////////////////////// TODO
  tool.onKeyDown = function (event) {
    //console.log(event.key);
    if (event.modifiers.shift) {
      if (Key.isDown('backspace')) {
        selectItem.remove();
      }
    }
  }

  function updateTrigger(event) {
    // Same as updateSlider
    updateSlider(event);
  }

  function updateToggel(event) {
    // Same as updateSlider
    updateSlider(event);
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
    if (shapeMode === 'Trigger') {
      var e256_trigger = new Path.Rectangle(triggerOptions);
      layerTrigger.position = event.point;
      layerTrigger.activate();
      project.activeLayer.addChild(e256_trigger);
      activeLayer = project.activeLayer;
    }
    else if (shapeMode === 'Toggel') {
      var e256_toggel = new Path.Rectangle(toggelOptions);
      e256_toggel.position = event.point;
      layerToggel.activate();
      project.activeLayer.addChild(e256_toggel);
      activeLayer = project.activeLayer; sendParamssendParams
    }
    else if (shapeMode === 'Slider') {
      var e256_slider = new Path.Rectangle(sliderOptions);
      e256_slider.position = event.point;
      layerSlider.activate();
      project.activeLayer.addChild(e256_slider);
      activeLayer = project.activeLayer;
    }
    else if (shapeMode === 'Knob') {
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
  blobPath[event].add(pos);
  //blobPathSmooth[event].smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15
  //blobPath[event].smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth
}

function onBlobRelease(event) {
  blobTouch[event].remove();
  blobTouch.splice(event, 1);
  blobPath[event].remove();
  blobPath.splice(event, 1);
}

function modeSelector(event) {
  currentMode = event;
}

function toolSelector(event) {
  shapeMode = event;
}
