/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

//Cool snap: https://gist.github.com/willismorse/d2a291d20d7a4419e732b9f1679eb3e3

var myWidth;
var myHeight;
var x_scaleFactor;
var y_scaleFactor;

var currentMode = EDIT_MODE;
var shapeMode = "";

var selectedItem = "";

e256_blobs = new Blobs();

var hitOptions = {
  "segments": true,
  "stroke": true,
  "fill": true,
  "tolerance": 3
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

  var touchpadLayer = new Layer();
  var triggerLayer = new Layer();
  var toggleLayer = new Layer();
  var sliderLayer = new Layer();
  var knobLayer = new Layer();

  tool.onMouseDown = function (event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (currentMode === EDIT_MODE) {
      if (!hitResult) {
        drawShape(event);
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

  tool.onKeyDown = function (event) {
    // TODO
  }

  ////////////// ADD_CONTROL_GUI
  // TODO: create the shapes using the mouse point (event.point)
  function drawShape(event) {
    switch (shapeMode) {
      case "Touchpad":
        touchpadLayer.activate();
        var e256_touchpad = touchpadFactory(event).onCreate();
        touchpadLayer.addChild(e256_touchpad);
        break;
      case "Trigger":
        triggerLayer.activate();
        var e256_trigger = triggerFactory(event);
        triggerLayer.addChild(e256_trigger);
        break;
      case "Toggle":
        toggleLayer.activate();
        var e256_toggle = toggleFactory(event);
        toggleLayer.addChild(e256_toggle);
        break;
      case "Slider":
        sliderLayer.activate();
        var e256_slider = sliderFactory(event);
        sliderLayer.addChild(e256_slider);
        break;
      case "Knob":
        knobLayer.activate();
        var e256_knob = knobFactory(event);
        knobLayer.addChild(e256_knob);
        break;
    }
  }
}

function toolSelector(event) {
  shapeMode = event;
}

// Update item parameters using the txt input fields
function updateParams(event) {
  var paramsIndex = 0;
  for (const param in selectedItem.data) {
    if (event == "btnSet-" + paramsIndex) selectedItem.data[param] = $("#paramInputValue-" + paramsIndex).val();
    paramsIndex++;
  }
}