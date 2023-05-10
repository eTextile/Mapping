/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;

var tmp_selector = null;

var highlight_part = null;
var last_highlight_part = null;

var hitResult = null;
var lastHitResult = null;

var current_controleur = null;
var last_controleur = null;
var current_item = null;
var last_item = null;
var current_part = null;
var last_part = null;

var hitOptions = {
  stroke: true, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  bounds: true, // hit-test the corners and side-centers of the bounding rectangle of items
  fill: true,
  tolerance: 5,
}

canvasHeight = $("#loadingCanvas").height();
canvasWidth = canvasHeight;
console.log("PAPER_WIDTH: " + canvasWidth + " PAPER_HEIGHT: " + canvasHeight);
scaleFactor = canvasHeight / 127;

function paperInit() {

  console.log("BOOTSTRAP_VERSION: " + bootstrap.Tooltip.VERSION);

  paper.setup(document.getElementById("canvas-2D"));
  console.log("PAPER_VERSION: " + paper.version);

  var triggerLayer = new paper.Layer();
  var switchLayer = new paper.Layer();
  var sliderLayer = new paper.Layer();
  var knobLayer = new paper.Layer();
  var touchpadLayer = new paper.Layer();
  var pathLayer = new paper.Layer();
  var gridLayer = new paper.Layer();

  triggerLayer.name = "Triggers";
  switchLayer.name = "Switchs";
  sliderLayer.name = "Sliders";
  knobLayer.name = "Knobs";
  touchpadLayer.name = "Touchpads";
  pathLayer.name = "Paths";
  gridLayer.name = "Grids";

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  paper.settings.handleSize = 15;
  paper.settings.selectionLineWidth = 20; // FIXME!

  var paperTool = new paper.Tool();
  var newShape = true;
  
  paperTool.onMouseDown = function (mouseEvent) {

    hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);

    switch (e256_current_mode) {
      case EDIT_MODE:
        if (e256_draw_mode) {
          if (!hitResult) {
            last_controleur = current_controleur;
            drawControlerFromMouse(mouseEvent);
            item_menu_params(last_controleur, "hide");
            item_menu_params(last_item, "hide");
            item_create_menu_params(current_controleur);
            item_menu_params(current_controleur, "show");
            update_menu_params(current_controleur);
          }
          else {
            //console.log("ITEM: " + current_item.name);
            if (current_controleur !== last_controleur) {
              //console.log("CTL: " + current_controleur.name);
              item_menu_params(last_controleur, "hide");
              item_menu_params(last_item, "hide");
              item_menu_params(current_controleur, "show");
              update_menu_params(current_controleur);
            }
            else if (current_item !== null && current_item !== last_item){
              //console.log("ITEM: " + current_item.id);
              item_menu_params(last_item, "hide");
              item_menu_params(current_item, "show");
              update_menu_params(current_item);
            }
          }
          //console.log("PART: " + current_part);
        } else {
          alert("SELECT A GUI!");
        }
        break;
      case PLAY_MODE:
        if (hitResult) {
          current_controleur.activate(mouseEvent);
        }
        break;
    }
  }

  paperTool.onKeyDown = function (keyEvent) {
    if (e256_current_mode === EDIT_MODE) {
      if (keyEvent.modifiers.shift) {
        switch (keyEvent.key) {
          case "backspace":
            item_delate_menu_params(current_controleur);
            current_controleur.remove();
            current_controleur = last_controleur;
            break;
          case "enter":
            if (e256_draw_mode === "Path") {
              newShape = true;
            }
            break;
          default:
            break;
        }
      }
      else {
        switch (keyEvent.key) {
          case "space":
            console.log("SPACE")
            break;
          default:
            break;
        }
      }
    }
  }

  paper.onFrame = function (mouseEvent) {
    // Every frame
  }

  ////////////// ADD_GUI
  function drawControlerFromMouse(mouseEvent) {
    switch (e256_draw_mode) {
      case "Trigger":
        current_controleur = triggerFactory();
        current_controleur.setup_from_mouse_event(mouseEvent);
        current_controleur.create_item();
        triggerLayer.addChild(current_controleur);
        triggerLayer.activate();
        break;
      case "Switch":
        current_controleur = switchFactory();
        current_controleur.setup_from_mouse_event(mouseEvent);
        current_controleur.create();
        switchLayer.addChild(current_controleur);
        switchLayer.activate();
        break;
      case "Slider":
        current_controleur = sliderFactory();
        current_controleur.setup_from_mouse_event(mouseEvent);
        current_controleur.create();
        sliderLayer.addChild(current_controleur);
        sliderLayer.activate();
        break;
      case "Knob":
        current_controleur = knobFactory();
        current_controleur.setup_from_mouse_event(mouseEvent);
        current_controleur.create();
        knobLayer.addChild(current_controleur);
        knobLayer.activate();
        break;
      case "Touchpad":
        current_controleur = touchpadFactory();
        current_controleur.setup_from_mouse_event(mouseEvent);
        current_controleur.create();
        touchpadLayer.addChild(current_controleur);
        touchpadLayer.activate();
        break;
      case "Grid": ///////////////////////////////////////////
        current_controleur = gridFactory();
        current_controleur.setup_from_mouse_event(mouseEvent);
        current_controleur.create();
        gridLayer.addChild(current_controleur);
        gridLayer.activate();
        break;
      case "Path":
        if (newShape) {
          newShape = false;
          current_controleur = pathFactory();
          current_controleur.setup_from_mouse_event(mouseEvent);
          current_controleur.create(mouseEvent);
          pathLayer.addChild(current_controleur);
        } else {
          newItem.addPoint(mouseEvent);
          update_menu_params(newItem);
          //console.log("NEW_POINT");
        }
        break;
      default:
        console.log("UNKNOWN_ITEM: " + newItem.name);
        break;
    }
    //console.log("NEW_ITEM: " + newItem.name);
  }

  function drawControlerFromConfig(configFile) {
    let conf = configFile.mappings;
    clearLayers();

    // TODO: Refactoring
    /*
    for (const mapping in conf) {
      console.log(mapping);
    }
    */

    for (var i = 0; i < conf.triggers.length; i++) {
      var e256_trigger = triggerFactory();
      e256_trigger.setup_from_config(conf.triggers[i]);
      e256_trigger.create();
      triggerLayer.addChild(e256_trigger);
    }
    for (var i = 0; i < conf.switchs.length; i++) {
      var e256_switch = switchFactory();
      e256_switch.setup_from_config(conf.switchs[i]);
      e256_switch.create();
      switchLayer.addChild(e256_switch);
    }
    for (var i = 0; i < conf.sliders.length; i++) {
      var e256_slider = sliderFactory();
      e256_slider.setup_from_config(conf.sliders[i]);
      e256_slider.create();
      sliderLayer.addChild(e256_slider);
    }
    for (var i = 0; i < conf.knobs.length; i++) {
      var e256_knob = knobFactory();
      e256_knob.setup_from_config(conf.knobs[i]);
      e256_knob.create();
      knobLayer.addChild(e256_knob);
    }
    for (var i = 0; i < conf.touchpads.length; i++) {
      var e256_touchpad = touchpadFactory();
      e256_touchpad.setup_from_config(conf.touchpads[i]);
      e256_touchpad.create();
      touchpadLayer.addChild(e256_touchpad);
    }
    for (var i = 0; i < conf.grids.length; i++) {
      var e256_grid = gridFactory();
      e256_grid.setup_from_config(conf.grids[i]);
      e256_grid.create();
      gridLayer.addChild(e256_grid);
    }
    for (var i = 0; i < conf.path.length; i++) {
      var e256_path = pathFactory();
      e256_path.setup_from_config(conf.polygons[i]);
      e256_path.create();
      pathLayer.addChild(e256_path);
    }
  }

  function clearLayer(layer) {
    if (layer.hasChildren()) {
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
