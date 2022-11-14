/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
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
  e256_JSONconfig["mappings"]["grids"] = listLayerParams("grids");

  console.log(JSON.stringify(e256_JSONconfig));
}

function listLayerParams(itemType) {
  var params = [];
  var items = paper.project.getItems({
    data: {
      type: itemType
    }
  });
  for (let i = 0; i < items.length; i++) { // for (const item in items) -> dose not work!?
    var itemCopy = items[i].clone();
    var itemParams = itemCopy.data;
    itemCopy.remove();
    switch (itemParams.type) {
      case "trigger":
        delete itemParams.type;  
        delete itemParams.value;
        for (const param in itemParams) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            itemParams[param] = parseInt(itemParams[param]);
          }
        }
        params.push(itemParams);
        break;
      case "switch":
        delete itemParams.type;
        delete itemParams.value;
        for (const param in itemParams) {
          if (param === "from" || param === "to"){
            // Nothing to do (param is already an int)
          }
          else {
            itemParams[param] = parseInt(itemParams[param]);
          }
        }
        params.push(itemParams);
        break;
      case "slider":
        delete itemParams.type;
        delete itemParams.value;
        delete itemParams.dir;
        for (const param in itemParams) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            itemParams[param] = parseInt(itemParams[param]);
          }
        }
        params.push(itemParams);
        break;
      case "knob":
        delete itemParams.type;  
        delete itemParams.theta_val;
        delete itemParams.radius_val;
        for (const param in itemParams) {
          itemParams[param] = parseInt(itemParams[param]);
        }
        params.push(itemParams);
        break;
      case "touchpad":
        delete itemParams.type;
        for (const param in itemParams) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            itemParams[param] = parseInt(itemParams[param]);
          }
        }
        params.push(itemParams);
        var touchsParams = [];
        for (let j = 1; j <= items[i].data.touchs; j++) {
          let touchParams = items[i].children[j].data;
          delete touchParams.name;
          delete touchParams.value;
          touchsParams.push([touchParams]);
        }
        params.push(touchsParams);
        break;
      case "path":
        delete itemParams.type;
        delete touchParams.value;
        params.push(itemParams);
        break;  
      case "polygon":
        delete itemParams.type;
        delete touchParams.value;
        params.push(itemParams);
        break;
      case "grid":
        delete itemParams.type;
        //delete touchParams.value;
        for (const param in itemParams) {
          if (param === "from" || param === "to"){
            // Nothing to do. params are already "int"
          }
          else {
            itemParams[param] = parseInt(itemParams[param]);
          }
        }
        params.push(itemParams);
        break;
    }
  }
  return params;
}
