/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_JSONconfig = ({}); // empty JSON declaration

function e256_exportParams() {
  e256_JSONconfig["mappings"] = {};
  e256_JSONconfig["mappings"]["grids"] = listLayerParams("GRID");
  e256_JSONconfig["mappings"]["touchpads"] = listLayerParams("TOUCHPAD");
  e256_JSONconfig["mappings"]["sliders"] = listLayerParams("SLIDER");
  e256_JSONconfig["mappings"]["switchs"] = listLayerParams("SWITCH");
  e256_JSONconfig["mappings"]["knobs"] = listLayerParams("KNOB");
  e256_JSONconfig["mappings"]["paths"] = listLayerParams("PATH");

  console.log(JSON.stringify(e256_JSONconfig));
}

function listLayerParams(itemName) {

  var e256_params = [];
  var items = paper.project.getItems({
    "name": itemName
  });

  for (const item of items) {

    item.save_params();

    switch (item.name) {
      case "GRID":
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

      case "TOUCHPAD":
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

        case "SLIDER":
          delete item.value;
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

      case "SWITCH":
        delete item.value;
        let switch_params = {};
        for (const param in item.data) {
          if (param === "from" || param === "to") {
            // TODO: mapping with matrix size!
            switch_params[param] =  [Math.round(item.data[param].x), Math.round(item.data[param].y)];
          }
          else {
            switch_params[param] = item.data[param];
          }
        }
        e256_params.push(switch_params);
        break;

      case "KNOB":
        delete item_copy.data.type;
        delete item_copy.data.theta_val;
        delete item_copy.data.radius_val;
        for (const param in item_copy.data) {
          item_copy.data[param] = parseInt(item_copy.data[param]);
        }
        e256_params.push(item_copy.data);
        break;

      case "PATH":
        delete item_copy.data.type;
        delete item_copy.data.value;
        e256_params.push(item_copy.data);
        break;

      case "POLYGON":
        delete item_copy.data.type;
        delete item_copy.data.value;
        e256_params.push(item_copy.data);
        break;
    }
  }
  return e256_params;
}
