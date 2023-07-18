/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_config = ({}); // empty JSON declaration

function e256_exportParams() {
  e256_config["mappings"] = {};
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      e256_config["mappings"][layer.name] = listLayerParams(layer);
    }
  }
}

function listLayerParams(layer) {
  var e256_params = [];
  
  for (const item of layer.children) {
    item.save_params();
    switch (item.name) {
      case "grid":
        let grid_params = {};
        for (const param in item.data) {
          if (param === "from" || param === "to") {
            // TODO: mapping with matrix size!
            grid_params[param] = [Math.round(item.data[param].x), Math.round(item.data[param].y)];
          } else {
            grid_params[param] = item.data[param];
          }
        }
        e256_params.push(grid_params);
        break;

      case "touchpad":
        let touchpad_params = {};
        for (const param in item.data) {
          console.log("PARAM: " + param);
          if (param === "from" || param === "to") {
            // TODO: mapping with matrix size!
            touchpad_params[param] = [Math.round(item.data[param].x), Math.round(item.data[param].y)];
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
          if (param === "from" || param === "to") {
            // TODO: mapping with matrix size!
            slider_params[param] = [Math.round(item.data[param].x), Math.round(item.data[param].y)];
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
          if (param === "from" || param === "to") {
            // TODO: mapping with matrix size!
            switch_params[param] = [Math.round(item.data[param].x), Math.round(item.data[param].y)];
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
          if (param === "from" || param === "to") {
            // TODO: mapping with matrix size!
            knob_params[param] = [Math.round(item.data[param].x), Math.round(item.data[param].y)];
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
          path_params.data[param] = parseInt(item.data[param]);
        }
        e256_params.push(path_params);
        break;

      case "polygon":
        let polygon_params = {};
        for (const param in item.data) {
          polygon_params.data[param] = parseInt(item.data[param]);
        }
        e256_params.push(polygon_params);
        break;
    }
  }
  return e256_params;
}
