/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_JSONconfig = ({}); // empty JSON declaration

function e256_exportParams() {
  e256_JSONconfig["mappings"] = {};
  e256_JSONconfig["mappings"]["triggers"] = listLayerParams("TRIGGER");
  e256_JSONconfig["mappings"]["switchs"] = listLayerParams("SWITCH");
  e256_JSONconfig["mappings"]["sliders"] = listLayerParams("SLIDER");
  e256_JSONconfig["mappings"]["knobs"] = listLayerParams("KNOB");
  e256_JSONconfig["mappings"]["paths"] = listLayerParams("PATH");
  e256_JSONconfig["mappings"]["touchpads"] = listLayerParams("TOUCHPAD");
  e256_JSONconfig["mappings"]["grids"] = listLayerParams("GRID");

  console.log(JSON.stringify(e256_JSONconfig));
}

function listLayerParams(itemName) {
  var params = [];
  var items = paper.project.getItems({
    "name": itemName
  });

  for (const item of items) {
    //console.log("ITEM_NAME: " + item.name);
    switch (item.name) {
      case "GRID":
        let grid_params = {};
        for (const param in item.data) {
          if (typeof param === "string") {
            if (param === "from" || param === "to") {
              // TODO: mapping with matrix size!
              grid_params[param] = [item.data[param].x, item.data[param].y];
            }
            grid_params[param] = item.data[param];
          } else {
            //this.grid[param] = parseInt(item_copy.data[param]);
            grid_params[param] = JSON.parse(item_copy.data[param]);
          }
        }
        params.push(grid_params);
        break;

      case "TRIGGER":
        delete item_copy.data.value;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to") {
            // Nothing to do. params are already "int"
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        break;

      case "SWITCH":
        delete item_copy.data.type;
        delete item_copy.data.value;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to") {
            // Nothing to do (param is already an int)
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        break;

      case "SLIDER":
        delete item_copy.data.type;
        delete item_copy.data.value;
        delete item_copy.data.dir;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to") {
            // Nothing to do. params are already "int"
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        break;

      case "KNOB":
        delete item_copy.data.type;
        delete item_copy.data.theta_val;
        delete item_copy.data.radius_val;
        for (const param in item_copy.data) {
          item_copy.data[param] = parseInt(item_copy.data[param]);
        }
        params.push(item_copy.data);
        break;

      case "TOUCHPAD":
        delete item_copy.data.type;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to") {
            // Nothing to do. params are already "int"
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        var touchsParams = [];
        for (let j = 1; j <= items[item].data.touchs; j++) {
          let touch_params = items[item].children[j].data;
          delete touch_params.name;
          delete touch_params.value;
          touchsParams.push([touch_params]);
        }
        params.push(touchsParams);
        break;

      case "PATH":
        delete item_copy.data.type;
        delete item_copy.data.value;
        params.push(item_copy.data);
        break;

      case "POLYGON":
        delete item_copy.data.type;
        delete item_copy.data.value;
        params.push(item_copy.data);
        break;
    }
  }
  return params;
}
