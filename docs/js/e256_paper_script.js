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
//paper.settings.hitTolerance = 20;

new paper.Layer({ project: paper.project, name: "blob", insert: true });

new paper.Layer({ project: paper.project, name: "switch", insert: true });
new paper.Layer({ project: paper.project, name: "slider", insert: true });
new paper.Layer({ project: paper.project, name: "knob", insert: true });
new paper.Layer({ project: paper.project, name: "touchpad", insert: true });
new paper.Layer({ project: paper.project, name: "grid", insert: true }); // TO REMOVE!?
new paper.Layer({ project: paper.project, name: "path", insert: true });
new paper.Layer({ project: paper.project, name: "polygon", insert: true});

var paper_tool = new paper.Tool();

let hit_options_A = {
  "segments": false,
  "stroke": true, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  "bounds": true, // hit-test the corners and side-centers of the bounding rectangle of items
  "fill": true,
  "tolerance": 10
};

let hit_options_B = {
  "segments": true,
  "stroke": true, // hit-test the stroke of path items, taking into account the setting of stroke color and width
  "bounds": false, // hit-test the corners and side-centers of the bounding rectangle of items
  "fill": true,
  "tolerance": 10
};

var hit_options = hit_options_A;

paper_tool.onMouseDown = function (mouseEvent) {

  //console.log("hit_options: " + JSON.stringify(hit_options));

  current_part = paper.project.hitTest(mouseEvent.point, hit_options);

  //console.log("draw_mode: " + e256_draw_mode);
  //console.log("hit_test: " + current_part);

  if (e256_current_mode === EDIT_MODE) {
    if (e256_draw_mode) {
      if (!current_part) { // Create_ctl if cliking any umpty screen space
        if (!create_once) { // Check if the controleur needs to be draw with more that one clic
          draw_controler_from_mouse(mouseEvent);
        }
        else {
          current_controleur.graw(mouseEvent); // Used by mapping path()
        }
      }
      else { // If cliking on item
        previous_controleur = current_controleur;
        let current_item = current_part.item;
        while (current_item.parent) {
          current_controleur = current_item;
          current_item = current_item.parent;
        }

        if (DEBUG) console.log("CTR_CUR: " + current_controleur.id + " PREV: " + previous_controleur.id);
        e256_draw_mode = current_controleur.name;

        if (e256_draw_mode === "polygon" || e256_draw_mode === "path") {
          hit_options = hit_options_B;
        }
        else {
          hit_options = hit_options_A;
        }

        paper.project.layers[current_controleur.name].activate();
        paper.project.layers[current_controleur.name].bringToFront();
        current_controleur.bringToFront();

        if (previous_controleur) {
          if (current_controleur.id != previous_controleur.id) {
            item_menu_params(previous_controleur, "hide");
            $("#" + previous_controleur.name).removeClass("active");
          }
        }
        item_menu_params(current_controleur, "show");
        $("#" + current_controleur.name).addClass("active");

        if (DEBUG) console.log("CUR_TOUCH: " + current_touch.id + " PREV_TOUCH: " + previous_touch.id);

        if (previous_touch) {
          if (current_touch.id != previous_touch.id) {
            item_menu_params(previous_touch, "hide");
          }
        }
        item_menu_params(current_touch, "show");
      }
    }
    else {
      alert_msg("select_mapping", "SELECT A MAPPING!", "danger");
    }
  }
}

paper_tool.onKeyDown = function (keyEvent) {
  if (e256_current_mode === EDIT_MODE) {
    if (keyEvent.modifiers.shift) {
      switch (keyEvent.key) {
        case "backspace":
          remove_item_menu_params(current_controleur);
          current_controleur.remove();
          current_controleur = previous_controleur;
          previous_controleur = null; // TODO: add linked list controleur managment
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

  previous_controleur = current_controleur;
  current_controleur = controleur_factory(e256_draw_mode);
  current_controleur.setup_from_mouse_event(mouseEvent);
  current_controleur.create();
  current_controleur.bringToFront();

  if (previous_controleur != null) item_menu_params(previous_controleur, "hide");
  if (previous_touch != null) item_menu_params(previous_touch, "hide");
  create_item_menu_params(current_controleur);
  update_item_main_params(current_controleur);
  update_item_touchs_menu_params(current_controleur);
  item_menu_params(current_controleur, "show");
};

function draw_controlers_from_config(raw_configFile) {
  let configFile = null;
  try {
    configFile = JSON.parse(raw_configFile);
    //console.log("CONFIG: " + raw_configFile); // PROB!
  } catch (err) {
    alert_msg("json_error", "NOT VALID JSON!", "danger");
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
      current_controleur = controleur_factory(_ctl_type);
      current_controleur.setup_from_config(configFile.mappings[_ctl_type][_ctl_index]);
      current_controleur.create();
      create_item_menu_params(current_controleur);
      update_item_main_params(current_controleur);
      update_item_touchs_menu_params(current_controleur);
      item_menu_params(current_controleur, "hide");
    }
  }
};

function re_create_item(item) {
  item.save_params();
  remove_item_menu_params(item);
  item.removeChildren();
  item.create();
  create_item_menu_params(item);
  update_item_main_params(item);
  update_item_touchs_menu_params(item);
  item_menu_params(item, "show");
};

function controleur_factory(item_type) {
  switch (item_type) {
    case "switch":
      current_controleur = new switch_factory();
      break;
    case "slider":
      current_controleur = new slider_factory();
      break;
    case "knob":
      current_controleur = new knob_factory();
      break;
    case "touchpad":
      current_controleur = new touchpad_factory();
      break;
    case "grid":
      current_controleur = new grid_factory();
      break;
    case "path":
      current_controleur = new path_factory();
      create_once = true;
      break;
    case "polygon":
      current_controleur = new polygon_factory();
      break;
    }
    return current_controleur;
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
  if (DEBUG) console.log("INPUT_CONF_SIZE: " + conf_size);
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
