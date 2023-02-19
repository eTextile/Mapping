/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_JSONconfig = ({}); // empty JSON declaration

function e256_exportParams() {
  e256_JSONconfig["mappings"] = {};
  e256_JSONconfig["mappings"]["triggers"] = listLayerParams("trigger");
  e256_JSONconfig["mappings"]["switchs"] = listLayerParams("switch");
  e256_JSONconfig["mappings"]["sliders"] = listLayerParams("slider");
  e256_JSONconfig["mappings"]["knobs"] = listLayerParams("knob");
  e256_JSONconfig["mappings"]["paths"] = listLayerParams("path");
  e256_JSONconfig["mappings"]["touchpads"] = listLayerParams("touchpad");
  e256_JSONconfig["mappings"]["grids"] = listLayerParams("grid");

  console.log(JSON.stringify(e256_JSONconfig));
}

function listLayerParams(itemType) {
  var params = [];
  var items = paper.project.getItems({
    data: {
      type: itemType
    }
  });

  for (const item in items) {
    var item_copy = items[item].clone();
    //console.log("ITEM_TYPE: " + item_copy.data);

    switch (item_copy.data.type) {

      case "trigger":
        delete item_copy.data.type;  
        delete item_copy.data.value;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        break;

      case "switch":
        delete item_copy.data.type;
        delete item_copy.data.value;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to"){
            // Nothing to do (param is already an int)
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        break;

      case "slider":
        delete item_copy.data.type;
        delete item_copy.data.value;
        delete item_copy.data.dir;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        break;

      case "knob":
        delete item_copy.data.type;  
        delete item_copy.data.theta_val;
        delete item_copy.data.radius_val;
        for (const param in item_copy.data) {
          item_copy.data[param] = parseInt(item_copy.data[param]);
        }
        params.push(item_copy.data);
        break;

      case "touchpad":
        delete item_copy.data.type;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to"){
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

      case "path":
        delete item_copy.data.type;
        delete item_copy.data.value;
        params.push(item_copy.data);
        break;

      case "polygon":
        delete item_copy.data.type;
        delete item_copy.data.value;
        params.push(item_copy.data);
        break;

      case "grid":
        delete item_copy.data.type;
        for (const param in item_copy.data) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            item_copy.data[param] = parseInt(item_copy.data[param]);
          }
        }
        params.push(item_copy.data);
        var keys_params = [];
        for (const child in item_copy.children) {
          if (item_copy.children[child].name === "key 1"){
            //console.log("KEY: " + item_copy.children[child].data.name);
            delete item_copy.children[child].data.name;
            delete item_copy.children[child].data.value;
            keys_params.push(item_copy.children[child].data);
          }
        }
        params.push([keys_params]);
        break;
    }
  }
  return params;
}
