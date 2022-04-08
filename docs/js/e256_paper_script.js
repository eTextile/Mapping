/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;
var selectedItem = null;
//var popupWindow = null;

var hitOptions = {
  "segments": true,
  "stroke": true,
  "fill": true,
  "tolerance": 3
}

canvasHeight = $("#loadingCanvas").height();
canvasWidth = canvasHeight;
console.log("PAPER_WIDTH: " + canvasWidth + " PAPER_HEIGHT: " + canvasHeight);
scaleFactor = canvasHeight / 127;

function paperInit() {
  paper.setup(document.getElementById("canvas-2D"));
  console.log("PAPER_VERSION: " + paper.version);

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  var touchpadLayer = new paper.Layer();
  var triggerLayer = new paper.Layer();
  var switchLayer = new paper.Layer();
  var sliderLayer = new paper.Layer();
  var knobLayer = new paper.Layer();

  var paperTool = new paper.Tool();
  //paperTool.minDistance = 5;

  paperTool.onMouseDown = function (event) {
    var hitResult = paper.project.hitTest(event.point, hitOptions);
    //console.log("hitResult: " + hitResult);
    if (currentMode === EDIT_MODE) {
      if (!hitResult) {
        drawControler(event);
      } else {
        // NA
      }
    }
    if (currentMode === PLAY_MODE) {
      if (!hitResult) {
        // TODO
      } else {
        // TODO
      }
    }
  }

  paperTool.onKeyDown = function (event) {
    // TODO
  }

  paper.onFrame = function (event) {
    // Every frame
  }

  ////////////// ADD_CONTROL_GUI
  // TODO: create the shapes using the mouse point (event.point)
  function drawControler(event) {
    switch (e256_drawMode) {
      case "Touchpad":
        //var url = "../setup.html"
        //popUp(url, "Touchpad", 300, 100);
        var e256_touchpad = touchpadFactory(event).onCreate();
        touchpadLayer.activate();
        touchpadLayer.addChild(e256_touchpad);
        break;
      case "Trigger":
        var e256_trigger = triggerFactory(event);
        triggerLayer.activate();
        triggerLayer.addChild(e256_trigger);
        break;
      case "Switch":
        var e256_switch = switchFactory(event);
        switchLayer.activate();
        switchLayer.addChild(e256_switch);
        break;
      case "Slider":
        var e256_slider = sliderFactory(event);
        sliderLayer.activate();
        sliderLayer.addChild(e256_slider);
        break;
      case "Knob":
        var e256_knob = knobFactory(event);
        knobLayer.activate();
        knobLayer.addChild(e256_knob);
        break;
    }
  }

  // Whenever the view is resized - FIXME!
  paper.view.onResize = function() {
    canvasHeight = $("#loadingCanvas").height();
    canvasWidth = canvasHeight;
    console.log("WIDTH: " + canvasWidth + " HEIGHT: " + canvasHeight);
    scaleFactor = canvasHeight / 127;
    paper.view.viewSize.width = canvasWidth;
    paper.view.viewSize.height = canvasHeight;
    paper.view.setZoom(canvasWidth / canvasHeight);
    paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);
  }
}

//$(document).ready(function () {
window.onload = function () {
  //"use strict";
  paperInit();
}
//});

// Update item parameters using the txt input fields
function updateParams(event) {
  var paramsIndex = 0;
  if (event === "btnSet-" + paramsIndex) {
    for (const param in selectedItem.data) {
      selectedItem.data[param] = $("#paramInputValue-" + paramsIndex).val();
      paramsIndex++;
    }
  }
}

function popUp(url, winName, winWidth, winHeight) {
  var paddingLeft = (screen.width) ? (screen.width - winWidth) / 2 : 0;
  var paddingTop = (screen.height) ? (screen.height - winHeight) / 2 : 0;
  settings = "height=" + winHeight + ", width = " + winWidth + ", top=" + paddingTop + ", left=" + paddingLeft
  popupWindow = window.open(url, winName, settings)
}
