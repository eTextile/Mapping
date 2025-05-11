/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvas_height = $("#loading_canvas").height();
var canvas_width = canvas_height;
//.log("PAPER_WIDTH: " + canvas_width + " PAPER_HEIGHT: " + canvas_height);
//var scaleFactor = canvas_height / 127; // FEXME!

var conf_size = 0;

var hitOptions = {
  "segments": true,
  "stroke": true, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  "bounds": true, // hit-test the corners and side-centers of the bounding rectangle of items
  "fill": true,
  "tolerance": 10
}

var create_once = false;

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

new paper.Layer({ project: paper.project, name: "blob", insert: true });

new paper.Layer({ project: paper.project, name: "switch", insert: true });
new paper.Layer({ project: paper.project, name: "slider", insert: true });
new paper.Layer({ project: paper.project, name: "knob", insert: true });
new paper.Layer({ project: paper.project, name: "touchpad", insert: true });
new paper.Layer({ project: paper.project, name: "grid", insert: true }); // TO REMOVE
new paper.Layer({ project: paper.project, name: "path", insert: true });

var paperTool = new paper.Tool();

paperTool.onMouseDown = function (mouseEvent) {

  let hitResult = paper.project.hitTest(mouseEvent.point, hitOptions);
  current_part = hitResult;

  switch (e256_current_mode) {
    case EDIT_MODE:
      if (!hitResult) { // Create_ctl if cliking any umty screen space
        if (e256_draw_mode) {
          if (!create_once) { // Check if the controleur needs to be draw with more that one clic
            if (e256_draw_mode === "path") {
              create_once = true;
            }
            previous_controleur = current_controleur;
            draw_controler_from_mouse(mouseEvent);
            item_menu_params(previous_controleur, "hide"); // if (previous_controleur != null)
            item_menu_params(previous_touch, "hide"); // if (previous_touch != null)
            create_item_menu_params(current_controleur);
            update_item_main_params(current_controleur);
            update_item_touchs_menu_params(current_controleur);
            item_menu_params(current_controleur, "show");
          }
          else {
            current_controleur.graw(mouseEvent); // Used by mapping path()
          }
        }
        else {
          alert("SELECT A MAPPING!");
        }
      }
      else { // If cliking on item
        if (current_controleur) previous_controleur = current_controleur;
        
        let current_item = current_part.item;
        while (current_item.parent) {
          current_controleur = current_item;
          current_item = current_item.parent;
        }
        //console.log(current_controleur.name);

        paper.project.layers[current_controleur.name].bringToFront();
        current_controleur.bringToFront();

        e256_draw_mode = current_controleur.name;

        if (previous_controleur) {
          if (current_controleur.id != previous_controleur.id) {
            item_menu_params(previous_controleur, "hide");
            $("#" + previous_controleur.name).removeClass("active");
          }
        }
        item_menu_params(current_controleur, "show");
        $("#" + current_controleur.name).addClass("active");

        if (previous_touch) {
          if (current_touch.id != previous_touch.id) {
            item_menu_params(previous_touch, "hide");
          }
        }
        item_menu_params(current_touch, "show");
      }
      break;
    case PLAY_MODE:
      // N/A
      break;
  };
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
  paper.project.layers[e256_draw_mode].activate();
  controleur_factory(e256_draw_mode);
  current_controleur.setup_from_mouse_event(mouseEvent);
  //console.log(e256_draw_mode); // PROB!
  current_controleur.create();
  current_controleur.bringToFront();
};

function draw_controlers_from_config(raw_configFile) {
  let configFile = null;
  try {
    configFile = JSON.parse(raw_configFile);
    //console.log("CONFIG: " + raw_configFile); // PROB!
  } catch (err) {
    alert("NOT VALID JSON!");
    return;
  }
  clear_all_meunu_params();
  clear_all_layers();
  create_controlers_from_config(configFile);
};

// Clear all meunu params
function clear_all_meunu_params() {
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      for (item of layer.children) {
        remove_item_menu_params(item);
      }
    }
  }
};

// Clear all layers
function clear_all_layers() {
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      layer.removeChildren();
    }
  }
};

// Create all controlers from config
function create_controlers_from_config(configFile) {
  for (const _ctl_type in configFile.mappings) {
    //console.log("CTL_TYPE: " + _ctl_type);
    paper.project.layers[_ctl_type].activate();
    for (const _ctl_index in configFile.mappings[_ctl_type]) {
      controleur_factory(_ctl_type);
      current_controleur.setup_from_config(configFile.mappings[_ctl_type][_ctl_index]);
      current_controleur.create();
      create_item_menu_params(current_controleur);
      update_item_main_params(current_controleur);
      update_item_touchs_menu_params(current_controleur);
      item_menu_params(current_controleur, "hide");
    }
  }
};

function controleur_factory(item_type) {
  switch (item_type) {
    case "switch":
      current_controleur = switch_factory();
      break;
    case "slider":
      current_controleur = slider_factory();
      break;
    case "knob":
      current_controleur = knob_factory();
      break;
    case "touchpad":
      current_controleur = touchpad_factory();
      break;
    case "grid":
      current_controleur = grid_factory();
      break;
    case "path":
      current_controleur = path_factory();
      break;
  }
};

// FIXME: whenever the view is resized
paper.view.onResize = function () {
  canvas_height = $("#loading_canvas").height();
  canvas_width = canvas_height;
  console.log("WIDTH: " + canvas_width + " HEIGHT: " + canvas_height);
  //scaleFactor = canvas_height / 127; // FIXME!
  paper.view.viewSize.width = canvas_width;
  paper.view.viewSize.height = canvas_height;
  paper.view.setZoom(canvas_width / canvas_height);
  paper.view.center = new paper.Point(canvas_width / 2, canvas_height / 2);
};

function onReaderLoad(event) {
  conf_size = Object.keys(event.target.result).length;
  console.log("INPUT_CONF_SIZE: " + conf_size);
  draw_controlers_from_config(event.target.result);
};

function loadFile(event) {
  let loaded_file = event.target.files[0]; // File loaded from user desktop
  switch (loaded_file.type) {
    case "application/json":
      var reader = new FileReader();
      reader.onload = onReaderLoad; // Arg?
      reader.readAsText(event.target.files[0]);
      break;
    case "application/wav":
      // TODO
      break;
    default:
      alert("WRONG FILE TYPE!");
      break;
  }
};

$("#loadConfig").change(function (event) {
  loadFile(event);
});
