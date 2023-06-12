/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvasHeight = $("#loadingCanvas").height();
var canvasWidth = canvasHeight;
var scaleFactor = canvasHeight / 127;

console.log("PAPER_WIDTH: " + canvasWidth + " PAPER_HEIGHT: " + canvasHeight);

var hitOptions = {
  stroke: false, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  bounds: true, // hit-test the corners and side-centers of the bounding rectangle of items
  fill: true,
  tolerance: 5
}

var current_controleur = null;
var previous_controleur = null;
var current_item = null;
var previous_item = null;

function paperInit() {

  //current_controleur = new paper.Item({ name: null });
  //previous_controleur = new paper.Item({ name: null });
  //current_item = new paper.Item({ name: null });
  //previous_item = new paper.Item({ name: null });

  console.log("BOOTSTRAP_VERSION: " + bootstrap.Tooltip.VERSION);
  console.log("JQUERY_VERSION: " + jQuery().jquery);
  
  paper.setup(document.getElementById("canvas-2D"));
  console.log("PAPER_VERSION: " + paper.version);

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  paper.settings.handleSize = 15;
  //paper.settings.selectionLineWidth = 20; // FIXME!

  new paper.Layer({ project: paper.project, name: "Triggers", insert: true });
  new paper.Layer({ project: paper.project, name: "Switchs", insert: true });
  new paper.Layer({ project: paper.project, name: "Sliders", insert: true });
  new paper.Layer({ project: paper.project, name: "Knobs", insert: true });
  new paper.Layer({ project: paper.project, name: "Touchpads", insert: true });
  new paper.Layer({ project: paper.project, name: "Grids", insert: true });
  new paper.Layer({ project: paper.project, name: "Paths", insert: true });

  var paperTool = new paper.Tool();

  paperTool.onMouseDown = function (mouseEvent) {

    let hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);
    //console.log("GLOBAL: " + hitResult);

    switch (e256_current_mode) {
      case EDIT_MODE:
        if (e256_draw_mode) {

          if (!hitResult) {
            previous_controleur = current_controleur;
            paper.project.layers[E256_LAYERS[e256_draw_mode]].activate();
            current_controleur = draw_controler_from_mouse(mouseEvent);
            item_menu_params(previous_controleur, "hide"); // if (previous_controleur != null)
            item_menu_params(previous_item, "hide");  // if (previous_item != null)
            item_create_menu_params(current_controleur);
            item_menu_params(current_controleur, "show");
            update_menu_params(current_controleur);
          }
          else {
            if (previous_controleur) {
              if (current_controleur.id !== previous_controleur.id) {
                //console.log("A_CTL_C: " + current_controleur.name + " " + current_controleur.id);
                //console.log("A_CTL_L: " + previous_controleur.name + " " + previous_controleur.id);
                item_menu_params(previous_controleur, "hide");
                item_menu_params(previous_item, "hide");
                item_menu_params(current_controleur, "show");
                update_menu_params(current_controleur);
              }
              else if (current_item !== previous_item) {
                item_menu_params(previous_item, "hide");
                item_menu_params(current_item, "show");
                //console.log("B_PONG_C: " + current_item.name + " " + current_item.id);
                //console.log("B_PONG_L: " + previous_item.name + " " + previous_item.id);
                update_menu_params(current_item);
              }
            }
          }
        } 
        else {
          alert("SELECT A GUI!");
        }
        break;
      case PLAY_MODE:
        if (hitResult) {
          //current_controleur.activate(mouseEvent);
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
            current_controleur = previous_controleur;
            previous_controleur = null; // TODO: add linked list...
            break;
          case "enter":
            /*
            if (e256_draw_mode === "PATH") {
              newShape = true;
            }
            */
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

  function draw_controler_from_mouse(mouseEvent) {
    let ctl = controleur_factory(e256_draw_mode);
    ctl.setup_from_mouse_event(mouseEvent);
    ctl.create();
    return ctl;
  }

  function draw_controler_from_config(configFile) {
    let ctl = null;
    clearLayers();
    for (const ctl_type in configFile.mappings) {
      paper.project.layers[E256_LAYERS[ctl_type]].activate();
      for (const ctl_conf in ctl_type) {
        ctl = controleur_factory(ctl_conf);
        ctl.setup_from_config(ctl_type[ctl_conf]);
        ctl.create();
      }
    }
  }

  function controleur_factory(item_type) {
    var controleur = null;
    switch (item_type) {
      case "SWITCH":
        controleur = switchFactory();
        break;
      case "SLIDER":
        controleur = sliderFactory();
        break;
      case "KNOB":
        controleur = knobFactory();
        break;
      case "TOUCHPAD":
        controleur = touchpadFactory();
        break;
      case "GRID":
        controleur = gridFactory();
        break;
      case "PATH":
        controleur = pathFactory();
        break;
    }
    return controleur;
  }

  // Not tested!
  function clearLayers() {
    for (const layer in paper.project.layers) {
      clearLayer(paper.project.layers[layer]);
    }
  }

  function clearLayer(layer) {
    if (layer.hasChildren()) {
      layer.removeChildren();
    }
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
    draw_controler_from_config(config);
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
