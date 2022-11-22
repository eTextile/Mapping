/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;

var selectedItem = null;
//var lastSelectedItem = null;
var selectedPart = null;

var selectedPath = null;
var selectedSegment = null;

var hitOptions = {
  segments: true,
  stroke: true,
  position: true,
  fill: true,
  tolerance: 5,
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
  var pathLayer = new paper.Layer();
  var gridLayer = new paper.Layer();

  triggerLayer.name = "triggers";
  switchLayer.name = "switchs";
  sliderLayer.name = "sliders";
  knobLayer.name = "knobs";
  touchpadLayer.name = "touchpads";
  pathLayer.name = "paths";
  gridLayer.name = "grids";

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  var paperTool = new paper.Tool();

  var newShape = true;

  paperTool.onMouseDown = function (mouseEvent) {
    var hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);
    if (currentMode === EDIT_MODE) {
      if (e256_drawMode) {
        if (!hitResult) {
          if (selectedItem !== null) selectedItem.free();
          selectedItem = drawControlerFromMouse(mouseEvent);
          selectedItem.select();
        } else {
          selectedPart = hitResult.item;
          selectedPath = hitResult.type;
          console.log("selectedPart_A : " + selectedPart.name);
          switch (selectedPath) {
            case "fill":
              //if (selectedItem !== null) selectedItem.free(); // NOT WORKING WITH SLIDER!
              selectedItem = hitResult.item.parent;
              //selectedItem.select();
              selectedSegment = null;
              break;
            case "stroke":
              selectedSegment = hitResult.location.index;
              break;
            case "segment":
              selectedSegment = hitResult.segment.index;
              break;
          }
        }
        drawMenuParams(selectedItem);
        updateMenuParams(selectedItem);
      } else {
        alert("SELECT A GUI!");
      }
    }
    if (currentMode === PLAY_MODE) {
      if (hitResult) {
        let lastSelectedItem = selectedItem;
        selectedItem = hitResult.item.parent;
        selectedPart = hitResult.item;
        if (selectedItem && !lastSelectedItem) {
          drawMenuParams(selectedItem);
        }
        else {
          /*
          if (selectedItem.data.type != lastSelectedItem.data.type) {
            drawMenuParams(selectedItem);
          }
          */
        }
        selectedItem.activate(mouseEvent);
      } else {
        selectedItem = null;
        hideMenuParams();
      }
    }
  }

  paperTool.onMouseDrag = function () {
    if (currentMode === EDIT_MODE || currentMode === PLAY_MODE) {
      if (selectedPath === "fill" || selectedSegment) {
        //updateMenuParams(selectedItem);
      }
    }
  }

  paperTool.onKeyDown = function (keyEvent) {
    if (currentMode === EDIT_MODE) {
      if (keyEvent.modifiers.shift) {
        switch (keyEvent.key) {
          case "backspace":
            selectedItem.removeChildren();
            hideMenuParams();
            newShape = true;
            break;
          case "enter":
            if (e256_drawMode === "path") {
              newShape = true;
            }
            break;
        }
      }
    }
  }

  function hideMenuParams() {
    $(".param").collapse("hide");
  }

  paper.onFrame = function (mouseEvent) {
    // Every frame
  }

  ////////////// ADD_GUI
  function drawControlerFromMouse(mouseEvent) {
    //var newItem = null;
    switch (e256_drawMode) {
      case "trigger":
        newItem = triggerFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        triggerLayer.addChild(newItem);
        drawMenuParams(newItem);
        break;
      case "switch":
        newItem = switchFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        switchLayer.addChild(newItem);
        drawMenuParams(newItem);
        break;
      case "slider":
        newItem = sliderFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        sliderLayer.addChild(newItem);
        drawMenuParams(newItem);
        break;
      case "knob":
        newItem = knobFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        knobLayer.addChild(newItem);
        drawMenuParams(newItem);
        break;
      case "touchpad":
        newItem = touchpadFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        touchpadLayer.addChild(newItem);
        drawMenuParams(newItem);
        break;
      case "grid":
        newItem = gridFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        gridLayer.addChild(newItem);
        drawMenuParams(newItem);
        break;
      case "path":
        if (newShape) {
          newShape = false;
          newItem = pathFactory();
          newItem.setupFromMouseEvent(mouseEvent);
          newItem.create(mouseEvent);
          pathLayer.addChild(newItem);
          drawMenuParams(newItem);
        } else {
          newItem.addPoint(mouseEvent);
          updateMenuParams(newItem);
          console.log("NEW_POINT");
        }
        break;
    }
    console.log("ITEM: " + newItem.data.type);
    return newItem;
  }

  function drawControlerFromConfig(configFile) {
    let conf = configFile.mappings;
    clearLayers();
    for (var i = 0; i < conf.triggers.length; i++) {
      var e256_trigger = triggerFactory();
      e256_trigger.setupFromConfig(conf.triggers[i]);
      e256_trigger.create();
      triggerLayer.addChild(e256_trigger);
    }
    for (var i = 0; i < conf.switchs.length; i++) {
      var e256_switch = switchFactory();
      e256_switch.setupFromConfig(conf.switchs[i]);
      e256_switch.create();
      switchLayer.addChild(e256_switch);
    }
    for (var i = 0; i < conf.sliders.length; i++) {
      var e256_slider = sliderFactory();
      e256_slider.setupFromConfig(conf.sliders[i]);
      e256_slider.create();
      sliderLayer.addChild(e256_slider);
    }
    for (var i = 0; i < conf.knobs.length; i++) {
      var e256_knob = knobFactory();
      e256_knob.setupFromConfig(conf.knobs[i]);
      e256_knob.create();
      knobLayer.addChild(e256_knob);
    }
    for (var i = 0; i < conf.touchpads.length; i++) {
      var e256_touchpad = touchpadFactory();
      e256_touchpad.setupFromConfig(conf.touchpads[i]);
      e256_touchpad.create();
      touchpadLayer.addChild(e256_touchpad);
    }
    for (var i = 0; i < conf.grids.length; i++) {
      var e256_grid = touchpadFactory();
      e256_grid.setupFromConfig(conf.grids[i]);
      e256_grid.create();
      gridLayer.addChild(e256_grid);
    }
    for (var i = 0; i < conf.path.length; i++) {
      var e256_path = pathFactory();
      e256_path.setupFromConfig(conf.polygons[i]);
      e256_path.create();
      pathLayer.addChild(e256_path);
    }
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
    clearLayer(gridLayer);
    clearLayer(pathLayer);
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
    config = JSON.parse(event.target.result);
    confSize = Object.keys(JSON.stringify(config)).length;
    clearLayers();
    drawControlerFromConfig(config);
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
