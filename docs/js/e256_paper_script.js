/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;

var selectedItem = null;
var lastSelectedItem = null;

var selectedPath = null;
var selectedSegment = null;

var hitOptions = {
  segments: true,
  stroke: true,
  position: true,
  fill: true,
  tolerance: 7,
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
  gridLayer.name = "gridLayer";

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  var paperTool = new paper.Tool();

  var newShape = true;

  paperTool.onMouseDown = function (mouseEvent) {
    let hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);
    console.log("SELECT_GLOBAL");
    if (currentMode === EDIT_MODE) {
      if (e256_drawMode) {
        if (!hitResult) {
          drawControlerFromMouse(mouseEvent);
        } else {
          lastSelectedItem = selectedItem;
          selectedItem = hitResult.item;
          
          //console.log("ITEM_STROCKE: " + selectedItem.isSelected());
          //this.selectedItem.stroke = false;
          //console.log("ITEM_STROCKE: " + selectedItem.hasStroke());

          selectedPath = hitResult.type;
          switch (selectedPath) {
            case "fill":
              selectedSegment = null;
              break;
            case "stroke":
              selectedSegment = hitResult.location.index;
              break;
            case "segment":
              selectedSegment = hitResult.segment.index;
              break;
          }
          //console.log("ITEM: " + selectedItem);
          //console.log("PART: " + selectedPath);
          if (selectedItem.parent.data.type != lastSelectedItem.parent.data.type) {
            drawMenuParams(selectedItem.parent);
            console.log("drawMenuParams: " + selectedItem.parent);
          }
          updateMenuParams(selectedItem.parent);
        }
      } else {
        alert("SELECT A GUI!");
      }
    }
    if (currentMode === PLAY_MODE) {
      if (hitResult) {
        let lastSelectedItem = selectedItem;
        selectedItem = hitResult.item;
        if (selectedItem && !lastSelectedItem) {
          //console.log("NEW_ITEM_A: " + selectedItem);
          drawMenuParams(selectedItem.parent);
        }
        else {
          if (selectedItem.parent.data.type != lastSelectedItem.parent.data.type) {
            //console.log("NEW_ITEM_B: " + selectedItem);
            drawMenuParams(selectedItem.parent);
          }
        }
        //console.log("ITEM: " + selectedItem);
        selectedItem.parent.activate(mouseEvent);
      } else {
        selectedItem = null;
        hideMenuParams();
      }
    }
  }

  paperTool.onMouseDrag = function (mouseEvent) {
    if (currentMode === EDIT_MODE) {
      if (selectedPath === "fill" || selectedSegment) {
        updateMenuParams(selectedItem.parent);
      }
    }
    if (currentMode === PLAY_MODE) {
      if (selectedPath === "fill" || selectedSegment) {
        updateMenuParams(selectedItem.parent);
      }
    }
  }

  function drawMenuParams(item) {
    let paramsIndex = 0;
    if (item.data.type != null) {
      $("#summaryContent").html("Parameters");
      for (const param in item.data) {
        $("#param-" + paramsIndex).collapse("show");
        $("#paramInputAtribute-" + paramsIndex).html(param);
        $("#paramInputValue-" + paramsIndex).val(item.data[param]);
        paramsIndex++;
      }
      for (let i = MAX_PARAM; i >= paramsIndex; i--) {
        $("#param-" + i).collapse("hide");
      }
      $("#updateParams").collapse("show");
      console.log("DRAW_MENU: " + item.data.type);
    }
  }

  paperTool.onKeyDown = function (keyEvent) {
    if (currentMode === EDIT_MODE) {
      if (keyEvent.modifiers.shift) {
        switch (keyEvent.key) {
          case "backspace":
            selectedItem.parent.removeChildren();
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
    switch (e256_drawMode) {
      case "trigger":
        selectedItem = triggerFactory();
        selectedItem.setupFromMouseEvent(mouseEvent);
        selectedItem.create();
        triggerLayer.addChild(selectedItem);
        drawMenuParams(selectedItem);
        break;
      case "switch":
        selectedItem = switchFactory();
        selectedItem.setupFromMouseEvent(mouseEvent);
        selectedItem.create();
        switchLayer.addChild(selectedItem);
        drawMenuParams(selectedItem);
        break;
      case "slider":
        selectedItem = sliderFactory();
        selectedItem.setupFromMouseEvent(mouseEvent);
        selectedItem.create();
        sliderLayer.addChild(selectedItem);
        drawMenuParams(selectedItem);
        break;
      case "knob":
        selectedItem = knobFactory();
        selectedItem.setupFromMouseEvent(mouseEvent);
        selectedItem.create();
        knobLayer.addChild(selectedItem);
        drawMenuParams(selectedItem);
        break;
      case "touchpad":
        selectedItem = touchpadFactory();
        selectedItem.setupFromMouseEvent(mouseEvent);
        selectedItem.create();
        touchpadLayer.addChild(selectedItem);
        drawMenuParams(selectedItem);
        break;
      case "grid":
        selectedItem = gridFactory();
        selectedItem.setupFromMouseEvent(mouseEvent);
        selectedItem.create();
        gridLayer.addChild(selectedItem);
        drawMenuParams(selectedItem);
        break;
      case "path":
        if (newShape) {
          newShape = false;
          selectedItem = pathFactory();
          selectedItem.setupFromMouseEvent(mouseEvent);
          selectedItem.create(mouseEvent);
          pathLayer.addChild(selectedItem);
          drawMenuParams(selectedItem);
        } else {
          selectedItem.addPoint(mouseEvent);
          updateMenuParams(selectedItem);
          console.log("NEW_POINT");
        }
        break;
    }
    console.log("ITEM: " + selectedItem.data.type);
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
