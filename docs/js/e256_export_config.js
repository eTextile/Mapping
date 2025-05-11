/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_config = ({}); // empty JSON declaration

function e256_export_params() {
  e256_config["mappings"] = {};
  for (const layer of paper.project.layers) {
    //console.log("LAYER: " + layer.name);
    if (layer.hasChildren()) {
      e256_config["mappings"][layer.name] = list_layer_params(layer);
    }
  }
  conf_size = Object.keys(JSON.stringify(e256_config)).length;
};

function list_layer_params(layer) {
  var e256_params = [];
  for (const item of layer.children) {
    if (item.name === null) return;
    console.log("ITEM: " + item.name);
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
          if (item.data[param].constructor.name === "Point") {
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
          if (item.data[param].constructor.name === "Point") {
            slider_params[param] = [
              round2(mapp(item.data[param].x, 0, canvas_width, 0, NEW_COLS)),
              round2(mapp(item.data[param].y, 0, canvas_height, 0, NEW_ROWS))
            ];
          }
          else {
            slider_params[param] = item.data[param];
          }
        }
        e256_params.push(slider_params);
        break;

      case "switch":
        let switch_params = {};
        for (const param in item.data) {
          /*
          if (param === "mode_z") {
            // This parameter could be removed!
          }
          */
          if (item.data[param].constructor.name === "Point") {
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
          if (item.data[param].constructor.name === "Point") {
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
          //path_params.data[param] = parseInt(item.data[param]);
          path_params.data[param] = parseFloat(item.data[param]);
        }
        e256_params.push(path_params);
        break;

      case "polygon":
        let polygon_params = {};
        for (const param in item.data) {
          //polygon_params.data[param] = parseInt(item.data[param]);
          polygon_params.data[param] = parseFloat(item.data[param]);
        }
        e256_params.push(polygon_params);
        break;
      default:
        console.log("ITEM_NOT_SUPORTED: " + item.name);
        break;
    }
  }
  return e256_params;
};
