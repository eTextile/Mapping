/*
  This fie256_exportParamsle is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function e256_exportParams() {
  let JSONconfig = ({});
  JSONconfig["mapping"] = {};
  JSONconfig["mapping"]["triggers"] = listLayerParams("triggers");
  JSONconfig["mapping"]["switch"] = listLayerParams("switch");
  JSONconfig["mapping"].push(listLayerParams("sliders"));
  JSONconfig["mapping"].push(listLayerParams("knobs"));
  JSONconfig["mapping"].push(listLayerParams("touchpads"));
  console.log("PARAMS: ");
  console.log(JSON.stringify(JSONconfig));
}

function listLayerParams(layerName) {
  let layerParams = [];

  console.log(paper.project.layers, layerName);

  for (let i = 0; i < paper.project.layers[layerName].children.length; i++) {
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
    
    layerParams.push(itemParams);
  }
  return layerParams;
}
