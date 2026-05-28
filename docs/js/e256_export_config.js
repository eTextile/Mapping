/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_config = ({}); // empty JSON declaration

function e256_export_params() {
  const profile_sel = document.getElementById("synth_profile_select");
  if (profile_sel && profile_sel.value) e256_config["synth_profile"] = profile_sel.value;
  else delete e256_config["synth_profile"];

  e256_config["mappings"] = {};
  for (const layer of paper.project.layers) {
    //console.log("LAYER: " + layer.name);
    if (layer.hasChildren()) {
      e256_config["mappings"][layer.name] = list_layer_params(layer);
    }
  }
  conf_size = JSON.stringify(e256_config).length;
};

function list_layer_params(layer) {
  var e256_params = [];
  for (const item of layer.children) {
    if (item.name === null) return;
    if (DEBUG) console.log("ITEM: " + item.name);
    item.save_params();
    switch (item.name) {

      case "grid":
        let grid_params = {};
        for (const param in item.data) {
          if (item.data[param].constructor.name === "Point") {
            grid_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          } else {
            grid_params[param] = item.data[param];
          }
        }
        e256_params.push(grid_params);
        break;

      case "touchpad":
        let touchpad_params = {};
        for (const param in item.data) {
          //if (item.data[param].constructor.name === "Point") {
          if (item.data[param] && item.data[param].constructor?.name === "Point") {
            touchpad_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          }
          else {
            touchpad_params[param] = item.data[param];
          }
        }
        e256_params.push(touchpad_params);
        break;

      case "slider":
        let slider_params = {};
        for (const param in item.data) {
          if (item.data[param] && item.data[param].constructor?.name === "Point") {
            slider_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          }
          else {
            slider_params[param] = item.data[param];
          }
        }
        slider_params["dir"] = (item.dir === "V_SLIDER") ? 0 : 1;
        e256_params.push(slider_params);
        break;

      case "switch":
        let switch_params = {};
        for (const param in item.data) {
          if (item.data[param] && item.data[param].constructor?.name === "Point") {
            switch_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          }
          else {
            switch_params[param] = item.data[param];
          }
        }
        e256_params.push(switch_params);
        break;

      case "knob":
        let knob_params = {};
        for (const param in item.data) {
          if (item.data[param] && item.data[param].constructor?.name === "Point") {
            knob_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          }
          else {
            knob_params[param] = item.data[param];
          }
        }
        e256_params.push(knob_params);
        break;

      case "path":
        let path_params = {};
        for (const param in item.data) {
          if (item.data[param] && item.data[param].constructor?.name === "Point") {
            path_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          } else {
            path_params[param] = item.data[param];
          }
        }
        e256_params.push(path_params);
        break;

      case "polygon":
        let polygon_params = {};
        for (const param in item.data) {
          if (param === "segments") {
            polygon_params["segments"] = item.data.segments.map(seg => {
              let x, y;
              if (Array.isArray(seg) && typeof seg[0] === "number") {
                x = seg[0]; y = seg[1];
              } else if (Array.isArray(seg) && seg[0] && typeof seg[0] === "object") {
                x = seg[0].x; y = seg[0].y;
              } else if (seg && typeof seg === "object" && seg.x !== undefined) {
                x = seg.x; y = seg.y;
              }
              return [
                round2(mapp(x, 0, canvas_width, 0, NEW_COLS)),
                round2(mapp(y, 0, canvas_height, 0, NEW_ROWS))
              ];
            });
          } else if (item.data[param] && item.data[param].constructor?.name === "Point") {
            polygon_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          } else {
            polygon_params[param] = item.data[param];
          }
        }
        e256_params.push(polygon_params);
        break;
        
      default:
        if (DEBUG) console.log("ITEM_NOT_SUPORTED: " + item.name);
        break;
    }
  }
  return e256_params;
};
