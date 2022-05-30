/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

//var mapping = [{}]; // empty JSON declaration

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;
var selectedItem = null;

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

  var triggerLayer = new paper.Layer();
  var switchLayer = new paper.Layer();
  var sliderLayer = new paper.Layer();
  var knobLayer = new paper.Layer();
  var touchpadLayer = new paper.Layer();
  var polygonLayer = new paper.Layer();

  triggerLayer.name = "triggers";
  switchLayer.name = "switchs";
  sliderLayer.name = "sliders";
  knobLayer.name = "knobs";
  touchpadLayer.name = "touchpads";
  touchpadLayer.name = "polygons";

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  var paperTool = new paper.Tool();
  //paperTool.minDistance = 5;

  paperTool.onMouseDown = function (mouseEvent) {
    var hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);
    //console.log("hitResult: " + hitResult);
    if (currentMode === EDIT_MODE) {
      if (!hitResult) {
        drawControlerFromMouse(mouseEvent);
      } else {

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

  paperTool.onKeyDown = function (keyEvent) {
    if (currentMode === EDIT_MODE) {
      if (keyEvent.modifiers.shift && keyEvent.Key === "backspace") {
        console.log(selectedItem.parent);
        selectedItem.parent.layer.removeChildren();
      }
    }
  }

  paper.onFrame = function (event) {
    // Every frame
  }

  ////////////// ADD_GUI
  function drawControlerFromMouse(mouseEvent) {
    switch (e256_drawMode) {
      case "trigger":
        var e256_trigger = triggerFactory();
        e256_trigger.setupFromMouseEvent(mouseEvent);
        triggerLayer.addChild(e256_trigger);
        triggerLayer.activate();
        break;
      case "switch":
        var e256_switch = switchFactory();
        e256_switch.setupFromMouseEvent(mouseEvent);
        switchLayer.addChild(e256_switch);
        switchLayer.activate();
        break;
      case "slider":
        var e256_slider = sliderFactory();
        e256_slider.setupFromMouseEvent(mouseEvent);
        sliderLayer.addChild(e256_slider);
        sliderLayer.activate();
        break;
      case "knob":
        var e256_knob = knobFactory();
        e256_knob.setupFromMouseEvent(mouseEvent);
        knobLayer.addChild(e256_knob);
        knobLayer.activate();
        break;
      case "touchpad":
        var e256_touchpad = touchpadFactory();
        e256_touchpad.setupFromMouseEvent(mouseEvent);
        touchpadLayer.addChild(e256_touchpad);
        touchpadLayer.activate();
        break;
      /*
        case "polygon":
        var e256_polygon = polygonFactory();
        e256_polygon.init(mouseEvent);
        polygonLayer.addChild(e256_polygon);
        polygonLayer.activate();
        break;
      */
    }
  }

  function drawControlerFromConfig(configFile) {
    let conf = configFile.mapping;
    clearLayers();

    for (var i = 0; i < conf.triggers.length; i++) {
      var e256_trigger = triggerFactory();
      e256_trigger.setupFromConfig(conf.triggers[i]);
      triggerLayer.addChild(e256_trigger);
    }
    for (var i = 0; i < conf.switchs.length; i++) {
      var e256_switch = switchFactory();
      e256_switch.setupFromConfig(conf.switchs[i]);
      switchLayer.addChild(e256_switch);
    }
    for (var i = 0; i < conf.sliders.length; i++) {
      var e256_slider = sliderFactory();
      e256_slider.setupFromConfig(conf.sliders[i]);
      sliderLayer.addChild(e256_slider);
    }
    for (var i = 0; i < conf.knobs.length; i++) {
      var e256_knob = knobFactory();
      e256_knob.setupFromConfig(conf.knobs[i]);
      knobLayer.addChild(e256_knob);
    }
    for (var i = 0; i < conf.touchpads.length; i++) {
      var e256_touchpad = touchpadFactory();
      e256_touchpad.setupFromConfig(conf.touchpads[i]);
      touchpadLayer.addChild(e256_touchpad);
    }
    /*
    for (var i = 0; i < conf.polygons.length; i++) {
      var e256_polygon = polygonFactory();
      e256_polygon.setupFromConfig(conf.polygons[i]);
      polygonLayer.addChild(e256_polygon);
    }
    */
  }

  function clearLayer(layer) {
    if (layer.hasChildren() != false) {
      layer.removeChildren();
    }
  }

  function clearLayers() {
    clearLayer(triggerLayer);
    clearLayer(switchLayer);
    clearLayer(sliderLayer);
    clearLayer(knobLayer);
    clearLayer(touchpadLayer);
    clearLayer(polygonLayer);
  }

  // Whenever the view is resized - FIXME!
  paper.view.onResize = function () {
    canvasHeight = $("#loadingCanvas").height();
    canvasWidth = canvasHeight;
    console.log("WIDTH: " + canvasWidth + " HEIGHT: " + canvasHeight);
    scaleFactor = canvasHeight / 127;
    paper.view.viewSize.width = canvasWidth;
    paper.view.viewSize.height = canvasHeight;
    paper.view.setZoom(canvasWidth / canvasHeight);
    paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);
  }

  function onReaderLoad(event) {
    try {
      config = JSON.parse(event.target.result);
      confSize = Object.keys(JSON.stringify(config)).length;
      clearLayers();
      drawControlerFromConfig(config);
    } catch (e) {
      alert(e);
    }
  }

  function loadFile(event) {
    var file = event.target.files[0];
    fileType = file.type;
    if (fileType === "application/json") {
      var reader = new FileReader();
      reader.onload = onReaderLoad;
      reader.readAsText(event.target.files[0]);
    }
    else if (fileType === "application/wav") {
      //TODO
    }
    else {
      alert("WRONG FILE TYPE!");
    }
  }

  $("#loadConfig").change(function (event) {
    loadFile(event);
  });

}

window.onload = function () {
  paperInit();
}
