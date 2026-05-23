/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvas_height = $("#loading_canvas").height();
var canvas_width = canvas_height;
//.log("PAPER_WIDTH: " + canvas_width + " PAPER_HEIGHT: " + canvas_height);

var conf_size = 0;

var create_once = false;
var current_layer_index = 0;

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

//new paper.Layer({ project: paper.project, name: "text", insert: true});


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

  current_part = paper.project.hitTest(mouseEvent.point, hit_options);

  if (e256_current_mode === MODE.EDIT) {
    if (current_part) { // Clicking on an existing item — always handled
      previous_controleur = current_controleur;
      let current_item = current_part.item;
      while (current_item.parent && !(current_item instanceof paper.Layer)) {
        current_controleur = current_item;
        current_item = current_item.parent;
      }

      if (DEBUG) console.log("CUR_CTR_ID: " + current_controleur.id + " PREV_CTR_ID: " + previous_controleur.id);
      e256_draw_mode = current_controleur.name;

      if (e256_draw_mode === "polygon" || e256_draw_mode === "path") {
        hit_options = hit_options_B;
      }
      else {
        hit_options = hit_options_A;
      }

      const target_layer = paper.project.layers[current_controleur.name]
        || paper.project.layers.find(l => l.name === current_controleur.name);
      if (target_layer) {
        target_layer.activate();
        target_layer.bringToFront();
      }
      current_controleur.bringToFront();

      if (previous_controleur) {
        if (current_controleur.id != previous_controleur.id) {
          item_menu_params(previous_controleur, "hide");
          touch_selection_locked = false;
          const first_touch = find_first_touch(current_controleur);
          if (first_touch) show_only_touch(first_touch);
        }
      }
      $(".maping_tool").removeClass("active");
      item_menu_params(current_controleur, "show");
      $("#" + current_controleur.name).addClass("active");

      if (DEBUG) console.log("CUR_TOUCH: " + current_touch.id + " PREV_TOUCH: " + previous_touch.id);

      show_only_touch(current_touch);
    }
    else { // Clicking on empty space
      if (e256_draw_mode) {
        if (!create_once) {
          draw_controler_from_mouse(mouseEvent);
        }
        else {
          current_controleur.graw(mouseEvent); // Used by mapping path & polygon
        }
      }
      else {
        alert_msg("SELECT A MAPPING!", "danger");
      }
    }
  }
}

paper_tool.onKeyDown = function (keyEvent) {
  if (e256_current_mode === MODE.EDIT) {
    if (keyEvent.modifiers.shift) {
      switch (keyEvent.key) {
        case "backspace":
          remove_item_menu_params(current_controleur);
          current_controleur.remove();
          invalidate_midi_play_cache();
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
          const layers = paper.project.layers.filter(l => l.hasChildren());
          if (layers.length > 0) {
            current_layer_index = (current_layer_index + 1) % layers.length;
            layers[current_layer_index].bringToFront();
          }
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

function find_first_touch(item) {
  for (const part of item.children) {
    for (const sub_part of part.children) {
      if (sub_part.msg) return sub_part;
    }
  }
  return null;
}

function show_only_touch(touch_group, select = false) {
  if (!touch_group || !touch_group.parent) return;
  for (const sibling of touch_group.parent.children) {
    if (!sibling.msg) continue;
    const active = sibling.id === touch_group.id;
    const el = document.getElementById(sibling.name + "_" + sibling.id);
    if (el) {
      el.className = active ? "collapse show" : "collapse";
      el.style.height = "";
    }
    const visual = sibling.children["touch-circle"] || sibling.children["knob-touch"] || sibling.children["key-frame"];
    if (visual) {
      if (active && select)  visual.style.fillColor = "red";
      else if (!active)      visual.style.fillColor = visual.name === "key-frame" ? "pink" : "orange";
    }
  }
  previous_touch = current_touch;
  current_touch = touch_group;
  paper.view.update();
}

function draw_controler_from_mouse(mouseEvent) {

  paper.project.layers[e256_draw_mode].activate();

  previous_controleur = current_controleur;
  current_controleur = controleur_factory(e256_draw_mode);
  current_controleur.setup_from_mouse_event(mouseEvent);
  current_controleur.create();
  invalidate_midi_play_cache();
  current_controleur.bringToFront();

  if (previous_controleur != null) item_menu_params(previous_controleur, "hide");
  if (previous_touch != null) item_menu_params(previous_touch, "hide");
  create_item_menu_params(current_controleur);
  update_item_main_params(current_controleur);
  update_item_touchs_menu_params(current_controleur);
  item_menu_params(current_controleur, "show");

  touch_selection_locked = false;
  const first_touch = find_first_touch(current_controleur);
  if (first_touch) show_only_touch(first_touch);
};

function draw_controlers_from_config(raw_configFile) {
  let configFile = null;
  try {
    configFile = JSON.parse(raw_configFile);
    //console.log("CONFIG: " + raw_configFile); // PROB!
  } catch (err) {
    alert_msg("NOT VALID JSON!", "danger");
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
  invalidate_midi_play_cache();
};

// Create all controlers from config
function create_controlers_from_config(configFile) {
  for (const _ctl_type in configFile.mappings) {
    if (DEBUG) console.log("CTL_TYPE: " + _ctl_type);
    const layer = paper.project.layers[_ctl_type];
    if (!layer) { console.warn("UNKNOWN_LAYER: " + _ctl_type); continue; }
    layer.activate();
    for (const _ctl_index in configFile.mappings[_ctl_type]) {
      try {
        current_controleur = controleur_factory(_ctl_type);
        current_controleur.setup_from_config(configFile.mappings[_ctl_type][_ctl_index]);
        current_controleur.create();
        create_item_menu_params(current_controleur);
        update_item_main_params(current_controleur);
        update_item_touchs_menu_params(current_controleur);
        item_menu_params(current_controleur, "hide");
      } catch (e) {
        console.error("CREATE_CONTROLEUR_ERROR [" + _ctl_type + "][" + _ctl_index + "]:", e);
      }
    }
  }
  invalidate_midi_play_cache();
};

function re_create_item(item) {
  item.save_params();
  remove_item_menu_params(item);
  item.removeChildren();
  item.create();
  invalidate_midi_play_cache();
  create_item_menu_params(item);
  update_item_main_params(item);
  update_item_touchs_menu_params(item);
  item_menu_params(item, "show");
  touch_selection_locked = false;
  const first_touch = find_first_touch(item);
  if (first_touch) show_only_touch(first_touch);
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
      create_once = true;
      break;
    }
    return current_controleur;
};

paper.view.onResize = function () {
  canvas_height = $("#loading_canvas").height();
  canvas_width = canvas_height;
  console.log("WIDTH: " + canvas_width + " HEIGHT: " + canvas_height);
  paper.view.viewSize.width = canvas_width;
  paper.view.viewSize.height = canvas_height;
  paper.view.setZoom(canvas_width / canvas_height);
  paper.view.center = new paper.Point(canvas_width / 2, canvas_height / 2);
};

function onReaderLoad(event) {
  conf_size = event.target.result.length;
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
