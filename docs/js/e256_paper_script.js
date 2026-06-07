/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var canvas_height = $("#loading_canvas").height();
var canvas_width = canvas_height;

var conf_size = 0;

// true while a path/polygon is being drawn point-by-point: subsequent empty-canvas clicks
// call draw_next_point() to append vertices instead of starting a new mapping.
// Reset to false when drawing is finalised (Space key) or a different tool is selected.
var shape_drawing_in_progress = false;
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

// Default: hit-test whole items (fill/stroke/bounds) without exposing individual vertices.
// Used for all mapping types so the user selects/moves the entire shape.
const hit_opts_item = {
  "segments": false,
  "stroke": true,
  "bounds": true,
  "fill": true,
  "tolerance": 10
};

// Switched to for path/polygon mappings so individual vertices can be grabbed and moved.
const hit_opts_vertex = {
  "segments": true,
  "stroke": true,
  "bounds": false,
  "fill": true,
  "tolerance": 10
};

var hit_options = hit_opts_item;

paper_tool.onMouseDown = function (mouseEvent) {

  current_part = paper.project.hitTest(mouseEvent.point, hit_options);

  if (e256_current_mode === MODE.EDIT) {
    if (current_part) { // Clicking on an existing item — always handled
      previous_controller = current_controller;
      let current_item = current_part.item;
      while (current_item.parent && !(current_item instanceof paper.Layer)) {
        current_controller = current_item;
        current_item = current_item.parent;
      }

      e256_draw_mode = current_controller.name;

      if (e256_draw_mode === "polygon" || e256_draw_mode === "path") {
        hit_options = hit_opts_vertex;
      }
      else {
        hit_options = hit_opts_item;
      }

      const target_layer = paper.project.layers[current_controller.name]
        || paper.project.layers.find(l => l.name === current_controller.name);
      if (target_layer) {
        target_layer.activate();
        target_layer.bringToFront();
      }
      current_controller.bringToFront();

      if (previous_controller) {
        if (current_controller.id != previous_controller.id) {
          item_menu_params(previous_controller, "hide");
          touch_selection_locked = false;
          const first_touch = find_first_touch(current_controller);
          if (first_touch) show_only_touch(first_touch);
        }
      }
      $(".maping_tool").removeClass("active");
      item_menu_params(current_controller, "show");
      $("#" + current_controller.name).addClass("active");

      show_only_touch(current_touch);
    }
    else { // Clicking on empty space
      if (e256_draw_mode) {
        if (!shape_drawing_in_progress) {
          create_mapping_from_mouse(mouseEvent);
        }
        else {
          current_controller.draw_next_point(mouseEvent); // path/polygon: append next vertex
        }
      }
      else {
        alert_msg("SELECT A MAPPING!", "danger");
      }
    }
  }
}

paper_tool.onKeyDown = function (keyEvent) {
  if ($(document.activeElement).is("input, select, textarea")) return;
  if (e256_current_mode === MODE.EDIT) {
    if (keyEvent.modifiers.shift) {
      // keyEvent.key with Shift produces shifted chars ("!", "@"…); use event.code instead.
      const digit_match = keyEvent.event?.code?.match(/^Digit(\d)$/);
      if (digit_match) {
        const digit = parseInt(digit_match[1]);
        if (digit >= 1) {
          // Shift+N selects touch N-1 of the current controller (1-indexed for ergonomics).
          const touchs_group = current_controller.children["touchs-group"];
          if (touchs_group) {
            const touch_group = touchs_group.children[digit - 1];
            if (touch_group && touch_group.msg) {
              show_only_touch(touch_group, true);
              touch_selection_locked = true;
            }
          }
        }
      } else {
        switch (keyEvent.key) {
          case "backspace":
            remove_item_menu_params(current_controller);
            current_controller.remove();
            invalidate_midi_play_cache();
            current_controller = previous_controller;
            previous_controller = null;
            break;
          case "enter":
            if (e256_draw_mode === "path") {
              // TODO: remove last path point
              current_controller.back();
            }
            break;
          default:
            break;
        }
      }
    }
    else {
      switch (keyEvent.key) {
        case "space":
          shape_drawing_in_progress = false;
          break;
        case "tab": {
          keyEvent.preventDefault();
          const blob_layer = paper.project.layers.find(l => l.name === "blob");
          const FAMILY_ORDER = ["switch", "slider", "knob", "touchpad", "grid", "path", "polygon"];
          const all_items = [];
          for (const type of FAMILY_ORDER) {
            const layer = paper.project.layers[type];
            if (!layer) continue;
            const type_items = [];
            for (const item of layer.children) {
              if (item.name === type) type_items.push(item);
            }
            type_items.sort((a, b) => a.id - b.id);
            all_items.push(...type_items);
          }
          if (all_items.length === 0) break;
          const cur_idx = all_items.findIndex(item => item.id === current_controller.id);
          const target = all_items[(cur_idx + 1) % all_items.length];
          target.parent.bringToFront();
          previous_controller = current_controller;
          if (previous_controller?.children) {
            const prev_frame = find_mapping_frame(previous_controller);
            if (prev_frame) prev_frame.selected = false;
            item_menu_params(previous_controller, "hide");
          }
          current_controller = target;
          current_controller.bringToFront();
          if (blob_layer) blob_layer.bringToFront();
          e256_draw_mode = target.name;
          const cur_frame = find_mapping_frame(current_controller);
          if (cur_frame) cur_frame.selected = true;
          item_menu_params(current_controller, "show");
          $(".maping_tool").removeClass("active");
          $("#" + current_controller.name).addClass("active");
          touch_selection_locked = false;
          document.activeElement?.blur();
          const first_touch = find_first_touch(current_controller);
          if (first_touch) show_only_touch(first_touch);
          break;
        }
        case "up":
        case "down":
        case "left":
        case "right":
          keyEvent.preventDefault();
          if (current_controller?.handle_arrow_key) current_controller.handle_arrow_key(keyEvent.key);
          break;
        case "a": {
          if (!current_controller) break;
          const inner_group_names = ["slider-group", "pad-group", "switch-group", "knob-group", "path-group", "polygon-group", "grid-group"];
          for (const name of inner_group_names) {
            const inner = current_controller.children[name];
            if (inner && inner.fit_to_canvas) {
              inner.fit_to_canvas();
              break;
            }
          }
          break;
        }
        default:
          break;
      }
    }
  }
};

paper.onFrame = function () {};

function find_first_touch(item) {
  for (const part of item.children) {
    for (const sub_part of part.children) {
      if (sub_part.msg) return sub_part;
    }
  }
  return null;
}

// Returns the frame element of a mapping (name contains "frame"), used for hover-style selection.
function find_mapping_frame(item) {
  for (const part of item.children) {
    if (part.name && part.name.includes("frame")) return part;
    for (const child of part.children) {
      if (child.name && child.name.includes("frame")) return child;
    }
  }
  return null;
}

// Shared blob-tracking helper for all mapping types in PLAY/THROUGH mode.
// Decodes centroid, resolves touch slot via UID, updates arc + color.
// Mirrors firmware slot_mask assignment: first free slot wins, freed slots are recycled
// immediately so a lifted-and-replaced finger always gets a valid slot.
// move_fn(touch_group, cx, cy, active) → true if in bounds and handled, false to skip.
// When active=false (RELEASED/FREE): caller should skip position update and return true.
function blob_update_touch_visual(sysExMsg, touchs_group, move_fn) {
  if (!touchs_group || !touchs_group.children.length) return;

  const blob_status = sysExMsg[BLOB_PARAM_CODE.STATUS];
  const touch_slot  = sysExMsg[BLOB_PARAM_CODE.TOUCH_SLOT];

  if (touch_slot === undefined || touch_slot === TOUCH_SLOT_NONE) return;

  const touch_idx = touch_slot;
  const releasing = blob_status === BLOB_STATUS.RELEASED || blob_status === BLOB_STATUS.FREE;

  const touch_group = touchs_group.children[touch_idx];
  if (!touch_group) return;

  const cx = mapp(
    sysExMsg[BLOB_PARAM_CODE.CENTROID_X_WHOLE_PART] + sysExMsg[BLOB_PARAM_CODE.CENTROID_X_FRACTIONAL_PART] / 100,
    0, NEW_COLS, 0, canvas_width
  );
  const cy = mapp(
    sysExMsg[BLOB_PARAM_CODE.CENTROID_Y_WHOLE_PART] + sysExMsg[BLOB_PARAM_CODE.CENTROID_Y_FRACTIONAL_PART] / 100,
    0, NEW_ROWS, 0, canvas_height
  );
  const active = !releasing;

  if (!move_fn(touch_group, cx, cy, active)) return;
  const touch_el  = touch_group.children["knob-touch"] || touch_group.children["touch-circle"];
  const touch_txt = touch_group.children["touch-txt"];
  const needle    = touch_group.children["knob-needle"];
  if (touch_el)  { touch_el.visible = active; if (active) touch_el.style.fillColor = "red"; }
  if (touch_txt) touch_txt.visible = active;
  if (needle)    needle.visible    = active;
  const press_midi = touch_group.msg?.press?.midi;
  const is_note_on = press_midi && midi_msg_status_unpack(press_midi.status).type === MIDI_TYPE.NOTE_ON;
  const depth = active
    ? (is_note_on ? sysExMsg[BLOB_PARAM_CODE.ATTACK_Z] : sysExMsg[BLOB_PARAM_CODE.DEPTH])
    : 0;
  touch_group.last_press_value = depth;
  update_touch_arc(touch_group, depth, touch_el ? touch_el.name : undefined);
  paper.view.update();
}

// Redraws the NoteOn velocity arc at the blob-updated touch position.
// Only fires when press type is NoteOn and a velocity is active.
function touch_note_on_arc_update(touch_group, touch_el_name) {
  const press_midi = touch_group.msg?.press?.midi;
  if (press_midi && midi_msg_status_unpack(press_midi.status).type === MIDI_TYPE.NOTE_ON && touch_group.last_press_value > 0)
    update_touch_arc(touch_group, touch_group.last_press_value, touch_el_name);
}

// Hides all touch visuals and resets blob state on NoteOff.
function touch_note_off_reset(touch_group, element_names, touch_el_name) {
  touch_group._blob_positioned = false;
  for (const name of element_names) {
    const el = touch_group.children[name];
    if (el) el.visible = false;
  }
  update_touch_arc(touch_group, 0, touch_el_name);
}

// Set visibility of every touch visual in every mapping layer.
// Called on PLAY entry (false) and EDIT return (true).
// Also resets blob→slot tracking state when hiding so the next PLAY session starts clean.
function set_all_touch_visuals_visible(visible) {
  for (const layer of paper.project.layers) {
    for (const item of layer.children) {
      const touchs_group = item.children && item.children["touchs-group"];
      if (!touchs_group) continue;
      for (const touch_group of touchs_group.children) {
        touch_group._blob_positioned = false;
        const touch_el   = touch_group.children["knob-touch"] || touch_group.children["touch-circle"];
        const touch_txt  = touch_group.children["touch-txt"];
        const needle     = touch_group.children["knob-needle"];
        const touch_line = touch_group.children["touch-line"];
        const line_x     = touch_group.children["touch-line-x"];
        const line_y     = touch_group.children["touch-line-y"];
        if (touch_el)   { touch_el.visible = visible; if (visible) touch_el.style.fillColor = TOUCH_IDLE_COLOR; }
        if (touch_txt)  touch_txt.visible  = visible;
        if (needle)     needle.visible     = visible;
        if (touch_line) touch_line.visible = visible;
        if (line_x)     line_x.visible     = visible;
        if (line_y)     line_y.visible     = visible;
        const arc = touch_group.children["touch-arc"];
        if (arc) { arc.removeSegments(); arc.visible = visible; }
      }
    }
  }
  paper.view.update();
}

function show_only_touch(touch_group, select = false) {
  if (!touch_group || !touch_group.parent) return;
  for (const sibling of touch_group.parent.children) {
    if (!sibling.msg) continue;
    const active = sibling.id === touch_group.id;
    const el = document.getElementById(sibling.name + "_" + sibling.id);
    if (el) {
      el.style.display = active ? "" : "none";
    }
    const visual = sibling.children["touch-circle"] || sibling.children["knob-touch"] || sibling.children["key-frame"];
    if (visual) {
      if (active && select)  visual.style.fillColor = "red";
      else if (!active)      visual.style.fillColor = visual.name === "key-frame" ? "pink" : TOUCH_IDLE_COLOR;
    }
  }
  previous_touch = current_touch;
  current_touch = touch_group;
  paper.view.update();
}

function create_mapping_from_mouse(mouseEvent) {

  paper.project.layers[e256_draw_mode].activate();

  previous_controller = current_controller;
  current_controller = mapping_factory(e256_draw_mode);
  current_controller.setup_from_mouse_event(mouseEvent);
  current_controller.create();
  invalidate_midi_play_cache();
  current_controller.bringToFront();

  if (previous_controller != null) item_menu_params(previous_controller, "hide");
  if (previous_touch != null) item_menu_params(previous_touch, "hide");
  create_item_menu_params(current_controller);
  update_item_main_params(current_controller);
  update_item_touchs_menu_params(current_controller);
  item_menu_params(current_controller, "show");

  touch_selection_locked = false;
  const first_touch = find_first_touch(current_controller);
  if (first_touch) show_only_touch(first_touch);
};

function load_mappings_from_config(raw_configFile) {
  let configFile = null;
  try {
    configFile = JSON.parse(raw_configFile);
  } catch (err) {
    alert_msg("NOT VALID JSON!", "danger");
    return;
  }
  clear_all_menu_params();
  clear_all_layers();
  create_mappings_from_config(configFile);
};

function clear_all_menu_params() {
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      for (item of layer.children) {
        remove_item_menu_params(item);
      }
    }
  }
};

function clear_all_layers() {
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      layer.removeChildren();
    }
  }
  invalidate_midi_play_cache();
};

function create_mappings_from_config(configFile) {
  const profile_sel = document.getElementById("synth_profile_select");
  if (profile_sel) {
    const key = configFile.synth_profile || "";
    profile_sel.value = key;
    _set_synth_profile(key || null);
  }

  for (const _ctl_type in configFile.mappings) {
    if (DEBUG) console.log("CTL_TYPE: " + _ctl_type);
    const layer = paper.project.layers[_ctl_type];
    if (!layer) { console.warn("UNKNOWN_LAYER: " + _ctl_type); continue; }
    layer.activate();
    for (const _ctl_index in configFile.mappings[_ctl_type]) {
      try {
        current_controller = mapping_factory(_ctl_type);
        current_controller.setup_from_config(configFile.mappings[_ctl_type][_ctl_index]);
        current_controller.create();
        create_item_menu_params(current_controller);
        update_item_main_params(current_controller);
        update_item_touchs_menu_params(current_controller);
        item_menu_params(current_controller, "hide");
      } catch (e) {
        console.error("CREATE_CONTROLLER_ERROR [" + _ctl_type + "][" + _ctl_index + "]:", e);
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
  document.activeElement?.blur();
};

function re_create_touch_params(item) {
  item.save_params();
  const touchs_group = item.children["touchs-group"];
  if (touchs_group) {
    for (let i = 0; i < touchs_group.children.length; i++) {
      touchs_group.children[i].msg = item.data.msg[i];
    }
  }
  const container = document.getElementById(item.name + "_" + item.id);
  if (!container) return;
  container.querySelectorAll(".touch-params-section").forEach(el => el.remove());
  for (const part of item.children) {
    for (const sub_part of part.children) {
      if (sub_part.msg) container.appendChild(create_item_touchs_menu_params(sub_part));
    }
  }
  update_item_touchs_menu_params(item);
  invalidate_midi_play_cache();
  const target = (current_touch && current_touch.parent?.parent === item) ? current_touch : find_first_touch(item);
  if (target) show_only_touch(target);
  document.activeElement?.blur();
};

function mapping_factory(item_type) {
  switch (item_type) {
    case "switch":   current_controller = new switch_factory();   break;
    case "slider":   current_controller = new slider_factory();   break;
    case "knob":     current_controller = new knob_factory();     break;
    case "touchpad": current_controller = new touchpad_factory(); break;
    case "grid":     current_controller = new grid_factory();     break;
    case "path":
      current_controller = new path_factory();
      shape_drawing_in_progress = true; // vertex-by-vertex drawing mode
      break;
    case "polygon":
      current_controller = new polygon_factory();
      shape_drawing_in_progress = true; // vertex-by-vertex drawing mode
      break;
  }
  return current_controller;
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
  load_mappings_from_config(event.target.result);
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
