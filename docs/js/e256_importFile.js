/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function e256_exportParams() {
  console.log("PIG"); /////////////////////////////////////////////
  var JSONconfig = ({});
  JSONconfig["mapping"] = [];
  JSONconfig["mapping"].push(listLayerParams("triggers"));
  JSONconfig["mapping"].push(listLayerParams("switchs"));
  JSONconfig["mapping"].push(listLayerParams("sliders"));
  JSONconfig["mapping"].push(listLayerParams("knobs"));
  JSONconfig["mapping"].push(listLayerParams("touchpads"));
  console.log(JSON.stringify(JSONconfig));
}

function listLayerParams(layerName) {
  console.log(paper.project.layers); //////////////////////////////////////
  var layerParams = {};
  layerParams[layerName] = [];
  for (var i = 0; i < paper.project.layers[layerName].children.length; i++) {
    let itemParams = paper.project.layers[layerName].children[i].data;
    switch (layerName) {
      case "triggers":
        delete itemParams.name;
        delete itemParams.value;
        break;
      case "switchs":
        delete itemParams.name;
        delete itemParams.value;
        break;
      case "sliders":
        delete itemParams.name;
        delete itemParams.value;
        break;
      case "knobs":
        delete itemParams.name;
        delete itemParams.rVal;
        delete itemParams.tVal;
        break;
      case "touchpads":
        delete itemParams.name;
      // TODO: add Touch params
    }
    return layerParams;
  }
}