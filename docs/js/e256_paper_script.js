/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var paperWidth = null;
var paperHeight = null;
var scaleFactorX = null;
var scaleFactorY = null;
var selectedItem = null;
//var popupWindow = null;

var hitOptions = {
  "segments": true,
  "stroke": true,
  "fill": true,
  "tolerance": 3
}

//window.onload = function () {
$(document).ready(function () {
  "use strict";

  var paperWindow = document.getElementById("canvas-2D");
  //paper.install(paperWindow); // Setup paper scope
  paper.setup(paperWindow); // Setup paper window size
  //paper.activate();

  var paperTool = new paper.Tool();
  paperTool.minDistance = 5;

  var touchpadLayer = new paper.Layer();
  var triggerLayer = new paper.Layer();
  var switchLayer = new paper.Layer();
  var sliderLayer = new paper.Layer();
  var knobLayer = new paper.Layer();

  console.log("PixelRatio_A: " + paper.view.pixelRatio);
  console.log("Version: " + paper.version);
  console.log("Settings: " + paper.settings);

  paperWidth = paper.view.size.width;
  paperHeight = paper.view.size.height;

  console.log("PaperWidth: " + paperWidth + " PaperHeight: " + paperHeight);

  //paper.view.size.width = paperWidth;
  //paper.view.size.height = paperHeight;
  //paper.view.setSize(new paper.Point(paperWidth, paperHeight));
  //paper.view.viewSize.width = paperWidth;
  //paper.view.viewSize.height = paperHeight;
  //paper.view.setViewSize(paper.DomElement.getSize(paperWindow));
  //var toto = paper.DomElement.getSize(paperWindow);
  //paper.view.zoom = paper.view.viewSize.width / paperWidth;
  //paper.view.setZoom(paperWidth / paperHeight);
  //paper.view.center = new paper.Point(paperWidth / 2, paperHeight / 2);
  //paper.view.setCenter(new paper.Point(paperWidth / 2, paperHeight / 2));

  //paper.settings.handleSize = 5;
  //paper.settings.hitTolerance = 5;

  //paper.view.resize = true;
  //paper.view.update();
  //paper.view.requestUpdate();

  // Whenever the view is resized, move the path to its center
  
  paper.view.onResize = function (event) {
    var aspectRatio = paperWidth / paperHeight;
    var newAspectRatio = paper.view.viewSize.width / paper.view.viewSize.height;
    if (newAspectRatio > aspectRatio) {
      paper.view.zoom = paper.view.viewSize.width / paperWidth;
    } else {
      paper.view.zoom = paper.view.viewSize.height / paperHeight;
    }
    paper.view.center = new paper.Point(paperWidth / 2, paperHeight / 2);
    console.log("OnResize: " + paper.view.zoom);
    console.log("PixelRatio_B: " + paper.view.pixelRatio);
  }

  scaleFactorX = (paperWidth / 127);
  scaleFactorY = (paperHeight / 127);

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

  console.log("Tools: " + paperTool.tools);

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
});

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
