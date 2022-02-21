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

let selectedItem;
let selectedtPath;
let selectSegment;
let activeLayer;

var translate = false;
let blobTouch = [];
let blobPath = [];
let blobPathSmooth = [];

var layerTrigger;
var layerToggel;
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

  function mouseEnter(event) {
    this.selected = true;
  }

  function mouseLeave(event) {
    if (this != selectedItem) {
      this.selected = false;
    }
  }

  tool.onMouseDown = function (event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (currentMode == "editMode") {
      if (!hitResult) {
        drawShape(event);
        activeLayer = selectedItem = selectSegment = selectedtPath = null;
        return;
      } else {

        //project.layers.selected = false; // NOT_WORKING!
        for (var i=1; i<4; i++){
          project.layers[i].selected = false;
        }
        
        selectedItem = hitResult.item;
        activeLayer = selectedItem.parent;
        //console.log("LAYER_ID: " + activeLayer.id);
        project.layers[activeLayer.id - 1].activate();
        selectedItem.selected = true;

        selectedtPath = hitResult.type;
        setParamsMenu(selectedItem);
        switch (hitResult.type) {
          case 'fill':
            translate = true;
            break;
          case 'stroke' || 'segment':
            translate = false;
            selectSegment = hitResult.location.index;
            break;
        }
      }
    }
    else if (currentMode === 'playMode') {
    }
  }

  function setParamsMenu(item) {
    //$('#summary_content').html(selectedItem.name);
    //$("#param0").val("X: " + Math.round(selectedItem.position.x));
    //$("#param1").val("Y: " + Math.round(selectedItem.position.y));

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
        selectedItem.remove();
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
    switch (selectedtPath) {
      case 'stroke':
        switch (selectSegment) {
          case 0:
            selectedItem.segments[0].point.x = event.point.x;
            selectedItem.segments[1].point.x = event.point.x;
            break;
          case 1:
            selectedItem.segments[1].point.y = event.point.y;
            selectedItem.segments[2].point.y = event.point.y;
            break;
          case 2:
            selectedItem.segments[2].point.x = event.point.x;
            selectedItem.segments[3].point.x = event.point.x;
            break;
          case 3:
            selectedItem.segments[3].point.y = event.point.y;
            selectedItem.segments[0].point.y = event.point.y;
            break;
        }
      case 'fill':
        if (translate) selectedItem.translate(event.delta);
        break;
      case 'segment':
        // NA
        break;
    }
  }

  function updateKnob(event) {
    switch (selectedtPath) {
      case 'stroke' || 'segment':
        var x = event.point.x - selectedItem.position.x;
        var y = event.point.y - selectedItem.position.y;
        var radius = Math.sqrt((x * x) + (y * y));
        setRadius(selectedItem, radius);
        break;
      case 'fill':
        if (translate) selectedItem.translate(event.delta);
        break;
    }
  }

  tool.onMouseDrag = function (event) {
    if (currentMode === 'editMode') {
      switch (activeLayer.id) {
        case 1:
          updateTrigger(event);
          break;
        case 2:
          updateToggel(event);
          break;
        case 3:
          updateSlider(event);
          break;
        case 4:
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
    if (shapeMode === "Trigger") {
      var e256_trigger = new Path.Rectangle(triggerOptions);
      e256_trigger.onMouseEnter = mouseEnter;
      e256_trigger.onMouseLeave = mouseLeave;
      e256_trigger.position = event.point;
      layerTrigger.activate();
      activeLayer = project.activeLayer;
      activeLayer.addChild(e256_trigger);
    }
    else if (shapeMode === "Toggel") {
      var e256_toggel = new Path.Rectangle(toggelOptions);
      e256_toggel.onMouseEnter = mouseEnter;
      e256_toggel.onMouseLeave = mouseLeave;
      e256_toggel.position = event.point;
      layerToggel.activate();
      activeLayer = project.activeLayer;
      activeLayer.addChild(e256_toggel);
    }
    else if (shapeMode === "Slider") {
      var e256_slider = new Path.Rectangle(sliderOptions);
      e256_slider.onMouseEnter = mouseEnter;
      e256_slider.onMouseLeave = mouseLeave;
      e256_slider.position = event.point;
      layerSlider.activate();
      activeLayer = project.activeLayer;
      activeLayer.addChild(e256_slider);

    }
    else if (shapeMode === "Knob") {
      var e256_knob = new Path.Circle(knobOptions);
      e256_knob.onMouseEnter = mouseEnter;
      e256_knob.onMouseLeave = mouseLeave;
      e256_knob.position = event.point;
      e256_knob.fillColor = Color.random();
      layerKnob.activate();
      activeLayer = project.activeLayer;
      activeLayer.addChild(e256_knob);
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
  if (currentMode == "editMode") {
    // NA
  }
  else{
    //project.layers.selected = false; // NOT_WORKING!
    activeLayer = selectedItem = selectSegment = selectedtPath = null;
     for (var i=1; i<4; i++){
      project.layers[i].selected = false;
    }
  }
}

function toolSelector(event) {
  shapeMode = event;
}

// Update item parameters using the txt input fields //FIXME!
function updateParams(btnSet) {
  switch (selectedItem.name) {
    case "Trigger":
      if (btnSet === "btnSet-1") selectedItem.data.channel = $("#inputParamValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.note = $("#inputParamValue-2").val();
      break;
    case "Toggel":
      if (btnSet === "btnSet-1") selectedItem.data.channel = $("#inputParamValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.note = $("#inputParamValue-2").val();
      break;
    case "Slider":
      if (btnSet === "btnSet-1") selectedItem.data.channel = $("#inputParamValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.cChange = $("#inputParamValue-2").val();
      if (btnSet === "btnSet-3") selectedItem.data.min = $("#inputParamValue-3").val();
      if (btnSet === "btnSet-4") selectedItem.data.max = $("#inputParamValue-4").val();
      break;
    case "Knob":
      if (btnSet === "btnSet-1") selectedItem.data.channel = $("#inputParamValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.cChangeTeta = $("#inputParamValue-2").val();
      if (btnSet === "btnSet-3") selectedItem.data.min_t = $("#inputParamValue-3").val();
      if (btnSet === "btnSet-4") selectedItem.data.max_t = $("#inputParamValue-4").val();
      if (btnSet === "btnSet-5") selectedItem.data.cChangeRadius = $("#inputParamValue-5").val();
      if (btnSet === "btnSet-6") selectedItem.data.min_r = $("#inputParamValue-6").val();
      if (btnSet === "btnSet-7") selectedItem.data.max_r = $("#inputParamValue-7").val();
      //...
      break;
  }
}