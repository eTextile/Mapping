/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_config = {};

const EXPORT_TYPES = new Set(["grid", "touchpad", "slider", "switch", "knob", "path", "polygon"]);

function point_to_grid(val) {
  return [
    round2(mapp(val.x, 0, canvas_width,  0, NEW_COLS)),
    round2(mapp(val.y, 0, canvas_height, 0, NEW_ROWS))
  ];
}

function item_data_to_params(data) {
  const out = {};
  for (const param in data) {
    const val = data[param];
    if (val && val.constructor?.name === "Point") {
      out[param] = point_to_grid(val);
    } else if (param === "segments" && Array.isArray(val)) {
      out[param] = val.map(seg => {
        let x, y;
        if (Array.isArray(seg) && typeof seg[0] === "number") {
          x = seg[0]; y = seg[1];
        } else if (Array.isArray(seg) && seg[0] && typeof seg[0] === "object") {
          x = seg[0].x; y = seg[0].y;
        } else if (seg && typeof seg === "object" && seg.x !== undefined) {
          x = seg.x; y = seg.y;
        }
        return [
          round2(mapp(x, 0, canvas_width,  0, NEW_COLS)),
          round2(mapp(y, 0, canvas_height, 0, NEW_ROWS))
        ];
      });
    } else {
      out[param] = val;
    }
  }
  return out;
}

function e256_export_params() {
  const profile_sel = document.getElementById("synth_profile_select");
  if (profile_sel && profile_sel.value) e256_config["synth_profile"] = profile_sel.value;
  else delete e256_config["synth_profile"];

  e256_config["mappings"] = {};
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      e256_config["mappings"][layer.name] = list_layer_params(layer);
    }
  }
  conf_size = JSON.stringify(e256_config).length;
}

function list_layer_params(layer) {
  const e256_params = [];
  for (const item of layer.children) {
    if (item.name === null) return e256_params;
    if (!EXPORT_TYPES.has(item.name)) {
      if (DEBUG) console.log("ITEM_NOT_SUPORTED: " + item.name);
      continue;
    }
    if (DEBUG) console.log("ITEM: " + item.name);
    item.save_params();
    const params = item_data_to_params(item.data);
    if (item.name === "slider") params.dir = (item.dir === "V_SLIDER") ? 0 : 1;
    e256_params.push(params);
  }
  return e256_params;
}
