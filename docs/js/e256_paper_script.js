/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;

var tmp_selector = null;

var highlight_item = null;
var last_highlight_item = null;

var highlight_part = null;
var last_highlight_part = null;

var selected_item = null;
var last_selected_item = null;

var selected_part = null;
var last_selected_part = null;

/*
var hitOptions = {
  stroke: true, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  bounds: true, // hit-test the corners and side-centers of the bounding rectangle of items
  fill: true,
  tolerance: 5,
}
*/

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

  paper.settings.handleSize = 15;
  paper.settings.selectionLineWidth = 20; // FIXME!

  var paperTool = new paper.Tool();
  var newShape = true;

  paperTool.onMouseDown = function (mouseEvent) {
    var hitResult = paper.project.hitTest(mouseEvent.point);
    
    if (e256_current_mode === EDIT_MODE) {
      if (e256_draw_mode) {
        if (!hitResult) {
          selected_item = drawControlerFromMouse(mouseEvent);
        } else {
          switch (selected_item.name) {
            case "grid":
              selected_item.bringToFront();
              break;
            case "key":
              selected_item.parent.bringToFront();
              break;
            default:
              break;
          }
        }
      } else {
        alert("SELECT A GUI!");
      }
    }
    if (e256_current_mode === PLAY_MODE) {
      if (hitResult) {
        if (selected_item && !last_selected_item) {
          //selected_item.drawMenuParams();
        }
        else {
          /*
          if (selected_item.data.type != last_selected_item.data.type) {
            selected_item.drawMenuParams();
          }
          */
        }
        selected_item.activate(mouseEvent);
      } else {
        selected_item = null;
        hideMenuParams();
      }
    }
  }

  paperTool.onKeyDown = function (keyEvent) {
    if (e256_current_mode === EDIT_MODE) {
      if (keyEvent.modifiers.shift) {
        switch (keyEvent.key) {
          case "backspace":
            switch (selected_item.name) {
              case "grid":
                selected_item.remove();
                break;
              case "key":
                selected_item.parent.remove();
                break;
              default:
                break;
            }
            hideMenuParams();
            newShape = true;
            break;
          case "enter":
            if (e256_draw_mode === "path") {
              newShape = true;
            }
            break;
        }
      }
    }
  }

  /*
  function hideMenuParams() {
    $(".params").collapse("hide");
  }
  */

  paper.onFrame = function (mouseEvent) {
    // Every frame
  }

  ////////////// ADD_GUI
  function drawControlerFromMouse(mouseEvent) {
    let newItem = null;
    switch (e256_draw_mode) {
      case "trigger":
        newItem = triggerFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        newItem.createMenuParams();
        triggerLayer.addChild(newItem);
        //triggerLayer.activate();
        break;
      case "switch":
        newItem = switchFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        newItem.createMenuParams();
        switchLayer.addChild(newItem);
        //switchLayer.activate();
        break;
      case "slider":
        newItem = sliderFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        newItem.createMenuParams();
        sliderLayer.addChild(newItem);
        //sliderLayer.activate();
        break;
      case "knob":
        newItem = knobFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        newItem.createMenuParams();
        knobLayer.addChild(newItem);
        //knobLayer.activate();
        break;
      case "touchpad":
        newItem = touchpadFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        newItem.createMenuParams();
        touchpadLayer.addChild(newItem);
        //touchpadLayer.activate();
        break;
      case "grid":
        newItem = gridFactory();
        newItem.setupFromMouseEvent(mouseEvent);
        newItem.create();
        newItem.createMenuParams();
        gridLayer.addChild(newItem);
        //gridLayer.activate();
        break;
      case "path":
        if (newShape) {
          newShape = false;
          newItem = pathFactory();
          newItem.setupFromMouseEvent(mouseEvent);
          newItem.create(mouseEvent);
          newItem.createMenuParams();
          pathLayer.addChild(newItem);
        } else {
          newItem.addPoint(mouseEvent);
          updateMenuParams(newItem);
          //console.log("NEW_POINT");
        }
        break;
    }
    //console.log("NEW_ITEM: " + newItem.name);
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
      var e256_grid = gridFactory();
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

  // FIXME: whenever the view is resized
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
