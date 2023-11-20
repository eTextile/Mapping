/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvas_height = $("#loadingCanvas").height();
var canvas_width = canvas_height;
var scaleFactor = canvas_height / 127;

//.log("PAPER_WIDTH: " + canvas_width + " PAPER_HEIGHT: " + canvas_height);

var hitOptions = {
  "segments": true,
  "stroke": true, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  "bounds": true, // hit-test the corners and side-centers of the bounding rectangle of items
  "fill": true,
  "tolerance": 5
}

var current_controleur = { "id": null };
var previous_controleur = { "id": null };

var current_item = { "id": null };
var previous_item = { "id": null };

var current_part = { "id": null };

var create_once = false;
var global_midi_chan_index = 1;

function paperInit() {

  console.log("BOOTSTRAP: " + bootstrap.Tooltip.VERSION);
  console.log("JQUERY: " + jQuery().jquery);

  paper.setup(document.getElementById("canvas-2D"));
  console.log("PAPER.JS: " + paper.version);

  paper.view.viewSize.width = canvas_width;
  paper.view.viewSize.height = canvas_height;
  paper.view.setZoom(canvas_width / canvas_height);
  paper.view.center = new paper.Point(canvas_width / 2, canvas_height / 2);

  paper.settings.handleSize = 20;
  //paper.settings.selectionLineWidth = 20; // FIXME!

  new paper.Layer({ project: paper.project, name: "switch", insert: true });
  new paper.Layer({ project: paper.project, name: "slider", insert: true });
  new paper.Layer({ project: paper.project, name: "knob", insert: true });
  new paper.Layer({ project: paper.project, name: "touchpad", insert: true });
  new paper.Layer({ project: paper.project, name: "grid", insert: true });
  new paper.Layer({ project: paper.project, name: "path", insert: true });

  var paperTool = new paper.Tool();

  paperTool.onMouseDown = function (mouseEvent) {

    let hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);
    //console.log("SELECT_LOCAL: " + hitResult);
    current_part = hitResult;
    
    switch (e256_current_mode) {
      case EDIT_MODE:
        if (e256_draw_mode) {
          if (!hitResult) { // Create_ctl if cliking any umty screen space.
            if (!create_once) { // Check if the controleur needs to be draw with more that one clic.
              if (e256_draw_mode === "path") {
                create_once = true;
              }
              previous_controleur = current_controleur;
              paper.project.layers[e256_draw_mode].activate();
              current_controleur = draw_controler_from_mouse(mouseEvent);
              item_menu_params(previous_controleur, "hide"); // if (previous_controleur !== null)
              item_menu_params(previous_item, "hide"); // if (previous_item !== null)
              create_item_menu_params(current_controleur);
              update_item_menu_params(current_controleur);
              update_item_touch_menu_params(current_controleur);
              item_menu_params(current_controleur, "show");
            }
            else {
              current_controleur.graw(mouseEvent); // Used by path() & ...
            }
          }
          else {
            let controleur = null;
            while (hitResult.item.parent){ // Get current_controleur
              controleur = hitResult.item
              hitResult.item = hitResult.item.parent;
            }
            previous_controleur = current_controleur;
            current_controleur = controleur;           
            if (current_controleur.id !== previous_controleur.id) {
              current_controleur.bringToFront();
              if (previous_controleur) {
                item_menu_params(previous_controleur, "hide");
              }
              item_menu_params(current_controleur, "show");
            }
            else if (current_item.id !== previous_item.id) {
              item_menu_params(previous_item, "hide");
              item_menu_params(current_item, "show");
            }
          }
        }
        else {
          alert("SELECT A GUI!");
        }
        break;
      case PLAY_MODE:
        // NA
        break;
    }
  };

  paperTool.onKeyDown = function (keyEvent) {
    if (e256_current_mode === EDIT_MODE) {
      if (keyEvent.modifiers.shift) {
        switch (keyEvent.key) {
          case "backspace":
            remove_item_menu_params(current_controleur);
            current_controleur.remove();
            current_controleur = previous_controleur;
            previous_controleur = null; // TODO: add linked list controleur managment.
            break;
          case "enter":
            if (e256_draw_mode === "path") {
              // TODO: remove last path point
              current_controleur.back();
            }
            break;
          default:
            break;
        }
      }
      else {
        switch (keyEvent.key) {
          case "space":
            console.log("SPACE");
            create_once = false;
            break;
          default:
            break;
        }
      }
    }
  };

  paper.onFrame = function () {
    // Every frame
  };

  function draw_controler_from_mouse(mouseEvent) {
    let _ctl = controleur_factory(e256_draw_mode);
    _ctl.setup_from_mouse_event(mouseEvent);
    _ctl.create();
    _ctl.bringToFront();
    return _ctl;
  };

  function draw_controler_from_config(configFile) {
    // Clear all meunu params
    for (const layer of paper.project.layers) {
      if (layer.hasChildren()) {
        for (item of layer.children) {
          remove_item_menu_params(item);
        }
      }
    }
    // Clear all layers
    for (const layer of paper.project.layers) {
      if (layer.hasChildren()) {
        layer.removeChildren();
      }
    }
    for (const _ctl_type in configFile.mappings) {
      paper.project.layers[_ctl_type].activate();
      for (const _ctl_conf of configFile.mappings[_ctl_type]) {
        let _ctl = controleur_factory(_ctl_type);
        _ctl.setup_from_config(_ctl_conf);
        _ctl.create();
        create_item_menu_params(_ctl);
        update_item_menu_params(_ctl);
        item_menu_params(_ctl, "hide");
      }
    }
  };

  function controleur_factory(item_type) {
    var controleur = null;
    switch (item_type) {
      case "switch":
        controleur = switchFactory();
        break;
      case "slider":
        controleur = sliderFactory();
        break;
      case "knob":
        controleur = knobFactory();
        break;
      case "touchpad":
        controleur = touchpadFactory();
        break;
      case "grid":
        controleur = gridFactory();
        break;
      case "path":
        controleur = pathFactory();
        break;
    }
    return controleur;
  };

  /*
  // NOT WORKING!  :-(
  const controleur_factory = {
    "switch": switchFactory(),
    "slider": sliderFactory(),
    "knob": knobFactory(),
    "touchpad": touchpadFactory(),
    "grid": gridFactory(),
    "path": pathFactory()
  };
  */

  // FIXME: whenever the view is resized
  paper.view.onResize = function () {
    canvas_height = $("#loadingCanvas").height();
    canvas_width = canvas_height;
    console.log("WIDTH: " + canvas_width + " HEIGHT: " + canvas_height);
    scaleFactor = canvas_height / 127;
    paper.view.viewSize.width = canvas_width;
    paper.view.viewSize.height = canvas_height;
    paper.view.setZoom(canvas_width / canvas_height);
    paper.view.center = new paper.Point(canvas_width / 2, canvas_height / 2);
  };

  function onReaderLoad(event) {
    let config_import = JSON.parse(event.target.result);
    confSize = Object.keys(JSON.stringify(config_import)).length;
    draw_controler_from_config(config_import);
  };

  function loadFile(event) {
    var file = event.target.files[0];
    fileType = file.type;
    if (fileType === "application/json") {
      var reader = new FileReader();
      reader.onload = onReaderLoad;
      reader.readAsText(event.target.files[0]);
    }
    else if (fileType === "application/wav") {
      // TODO
    }
    else {
      alert("WRONG FILE TYPE!");
    }
  };

  $("#loadConfig").change(function (event) {
    loadFile(event);
  });

}

window.onload = function () {
  paperInit();
}
