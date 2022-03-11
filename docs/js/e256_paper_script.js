/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

//Cool snap: https://gist.github.com/willismorse/d2a291d20d7a4419e732b9f1679eb3e3

let currentMode = "editMode";

var myWidth;
var myHeight;
var x_scaleFactor;
var y_scaleFactor;

let activeLayer;
let selectedItem;
let lastSelectedItem;

let selectedtPath;
let selectSegment;

var translate = false;
let blobTouch = [];
let blobPath = [];
let blobPathSmooth = [];

var shapeMode;

var triggerGroup;
var toggleGroup;
var sliderGroup;
var knobGroup;

var hitOptions = {
  "segments": true,
  "stroke": true,
  "fill": true,
  "tolerance": 2
}

e256_blobs = new Blobs();

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

  triggerGroup = new Group();
  toggleGroup = new Group();
  sliderGroup = new Group();
  knobGroup = new Group();

  tool.onMouseDown = function (event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (currentMode === "editMode") {
      if (!hitResult) {
        if (selectedItem != null) {
          lastSelectedItem = selectedItem;
          lastSelectedItem.selected = false;
        }
        drawShape(event.point);
        setMenuParams(selectedItem);
        return;
      } else {
        lastSelectedItem = selectedItem;
        lastSelectedItem.selected = false;
        selectedItem = hitResult.item;
        selectedItem.selected = true;

        setMenuParams(selectedItem);

        selectedtPath = hitResult.type;
        switch (selectedtPath) {
          case "fill":
            selectSegment = null;
            break;
          case "stroke" || "segment":
            selectSegment = hitResult.location.index;
            break;
        }
      }
    }
    else if (currentMode === "playMode") {
      // TODO
    }
  }

  tool.onMouseUp = function (event) {
    //setMenuParams(selectedItem);
  }

  tool.onMouseDrag = function (event) {
    if (selectedItem != null) {
      if (currentMode === "editMode") {
        switch (selectedtPath) {
          case 'fill':
            selectedItem.setPos(event);
            break;
          case 'stroke' || 'segment':
            selectedItem.resize(event);
            break;
        }
      } else if (currentMode === "playMode") {
        // TODO
      }
    }
  }

  //////////////////////////////////// TODO
  tool.onKeyDown = function (event) {
    //console.log(event.key);
    if (event.modifiers.shift) {
      if (Key.isDown("backspace")) {
        //selectedItem.remove(); //FIXME!
      }
    }
  }
}

function setMenuParams(item) {
  $('#summaryContent').html("Parameters");
  var paramsIndex = 0;
  for (const param in item.data) {
    $("#paramInputAtribute-" + paramsIndex).html(param);
    $("#paramInputValue-" + paramsIndex).val(item.data[param]);
    $("#param-" + paramsIndex).collapse("show");
    paramsIndex++;
  }
  for (var i = 15 ; i > paramsIndex; i--) {
    $("#param-" + i).collapse("hide");
  }
}

////////////// ADD_CONTROL_GUI
// TODO: create the shapes using the mouse point (event.point)
function drawShape(mousePos) {
  switch (shapeMode) {
    case "Trigger":
      var e256_trigger = triggerFactory(mousePos);
      e256_trigger.darw();
      triggerGroup.addChild(e256_trigger);
      selectedItem = e256_trigger;
      selectedItem.selected = true;
      break;
    case "Toggle":
      var e256_toggle = toggleFactory(mousePos);
      e256_toggle.darw();
      toggleGroup.addChild(e256_toggle);
      selectedItem = e256_toggle;
      selectedItem.selected = true;
      break;
    case "Slider":
      var e256_slider = sliderFactory(mousePos);
      e256_slider.darw();
      sliderGroup.addChild(e256_slider);
      selectedItem = e256_slider;
      selectedItem.selected = true;
      break;
    case "Knob":
      var e256_knob = knobFactory(mousePos);
      e256_knob.darw();
      knobGroup.addChild(e256_knob);
      selectedItem = e256_knob;
      selectedItem.selected = true;
      break;
  }
}

////////////// BLOB_INPUT
function onBlobDown() {
  let circle = new Path.Circle({
    center: [0, 0],
    radius: 10,
    fillColor: "red"
  });
  blobTouch.push(circle);
  path = new Path();
  path.strokeColor = "#00000";
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

/*
function playModeInit() {
  selectedItem = selectedtPath = selectSegment = null;
  project.selectedItems = false;
}
*/

function toolSelector(event) {
  shapeMode = event;
}

// Update item parameters using the txt input fields //FIXME!
function updateParams(btnSet) {

  console.log("buttonSetValue: " + $("#paramInputValue-1").val());   // FIXME
  console.log("selectedItem_channel: " + selectedItem.data.chan); // FIXME
  console.log("selectedItem_id: " + selectedItem.id);                // FIXME

  switch (selectedItem.data.name) {
    case "Trigger":
      //selectedItem.data.length // TODO
      if (btnSet === "btnSet-1") selectedItem.data.chan = $("#paramInputValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.note = $("#paramInputValue-2").val();
      break;
    case "Toggel":
      if (btnSet === "btnSet-1") selectedItem.data.chan = $("#paramInputValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.note = $("#paramInputValue-2").val();
      break;
    case "Slider":
      if (btnSet === "btnSet-1") selectedItem.data.chan = $("#paramInputValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.cChange = $("#paramInputValue-2").val();
      if (btnSet === "btnSet-3") selectedItem.data.min = $("#paramInputValue-3").val();
      if (btnSet === "btnSet-4") selectedItem.data.max = $("#paramInputValue-4").val();
      break;
    case "Knob":
      if (btnSet === "btnSet-1") selectedItem.data.chan = $("#paramInputValue-1").val();
      if (btnSet === "btnSet-2") selectedItem.data.ccTeta = $("#paramInputValue-2").val();
      if (btnSet === "btnSet-3") selectedItem.data.tMin = $("#paramInputValue-3").val();
      if (btnSet === "btnSet-4") selectedItem.data.tMax = $("#paramInputValue-4").val();
      if (btnSet === "btnSet-5") selectedItem.data.ccRad = $("#paramInputValue-5").val();
      if (btnSet === "btnSet-6") selectedItem.data.rMin = $("#paramInputValue-6").val();
      if (btnSet === "btnSet-7") selectedItem.data.rMax = $("#paramInputValue-7").val();
      break;
  }
}
