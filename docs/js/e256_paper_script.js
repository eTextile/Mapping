/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var mapping = [{}]; // empty JSON declaration

var canvasWidth = null;
var canvasHeight = null;
var scaleFactor = null;
var selectedItem = null;

var hitOptions = {
  "segments": true,
  "stroke": true,
  "fill": true,
  "tolerance": 3
}

canvasHeight = $("#loadingCanvas").height();
canvasWidth = canvasHeight;
console.log("PAPER_WIDTH: " + canvasWidth + " PAPER_HEIGHT: " + canvasHeight);
scaleFactor = canvasHeight / 127;

var triggerLayer = new paper.Layer();
var switchLayer = new paper.Layer();
var sliderLayer = new paper.Layer();
var knobLayer = new paper.Layer();
var touchpadLayer = new paper.Layer();

triggerLayer.name = "triggers";
switchLayer.name = "switchs";
sliderLayer.name = "sliders";
knobLayer.name = "knobs";
touchpadLayer.name = "touchpads";

function paperInit() {
  paper.setup(document.getElementById("canvas-2D"));
  console.log("PAPER_VERSION: " + paper.version);

  paper.view.viewSize.width = canvasWidth;
  paper.view.viewSize.height = canvasHeight;
  paper.view.setZoom(canvasWidth / canvasHeight);
  paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);

  var paperTool = new paper.Tool();
  //paperTool.minDistance = 5;

  paperTool.onMouseDown = function (event) {
    var hitResult = paper.project.hitTest(event.point, hitOptions);
    //console.log("hitResult: " + hitResult);
    if (currentMode === EDIT_MODE) {
      if (!hitResult) {
        drawControler(event);
      } else {
        // NA
      }
    }
    if (currentMode === PLAY_MODE) {
      if (!hitResult) {
        // TODO
      } else {
        // TODO
      }
    }
  }

  paperTool.onKeyDown = function (event) {
    // TODO
  }

  paper.onFrame = function (event) {
    // Every frame
  }

  ////////////// ADD_GUI
  function drawControler(event) {
    switch (e256_drawMode) {
      case "trigger":
        var e256_trigger = triggerFactory().init(event);
        triggerLayer.addChild(e256_trigger);
        triggerLayer.activate();
        break;
      case "switch":
        var e256_switch = switchFactory(event);
        switchLayer.addChild(e256_switch);
        switchLayer.activate();
        break;
      case "slider":
        var e256_slider = sliderFactory(event)
        sliderLayer.addChild(e256_slider);
        sliderLayer.activate();
        break;
      case "knob":
        var e256_knob = knobFactory(event)
        knobLayer.addChild(e256_knob);
        knobLayer.activate();
        break;
      case "touchpad":
        var e256_touchpad = touchpadFactory().init(event);
        touchpadLayer.addChild(e256_touchpad);
        touchpadLayer.activate();
        break;
      case "polygon":
        //var e256_polygon = polygonFactory().init(event);
        //polygonLayer.addChild(e256_polygon);
        //polygonLayer.activate();
      break;
    }
  }

  // Whenever the view is resized - FIXME!
  paper.view.onResize = function () {
    canvasHeight = $("#loadingCanvas").height();
    canvasWidth = canvasHeight;
    console.log("WIDTH: " + canvasWidth + " HEIGHT: " + canvasHeight);
    scaleFactor = canvasHeight / 127;
    paper.view.viewSize.width = canvasWidth;
    paper.view.viewSize.height = canvasHeight;
    paper.view.setZoom(canvasWidth / canvasHeight);
    paper.view.center = new paper.Point(canvasWidth / 2, canvasHeight / 2);
  }

}

window.onload = function () {
  paperInit();
}

function drawFromParams(configFile) {
  console.log("DRAW_CONFIG_SIZE: " + confSize);
  if (confSize != 0) {

    var triggerCount = configFile.mapping.triggers.length;
    if (triggerCount != 0) {
      for (var i=0; i<triggerCount; i++) {
        console.log("PING");
        let _trigger = triggerFactory();
        console.log("PONG");
        _trigger.data.x = configFile.mapping.triggers[i].x;
        _trigger.data.y = configFile.mapping.triggers[i].y;
        _trigger.data.size = configFile.mapping.triggers[i].s;
        _trigger.data.chan = configFile.mapping.triggers[i].c;
        _trigger.data.note = configFile.mapping.triggers[i].n;
        _trigger.data.velocity = configFile.mapping.triggers[i].v;
        triggerLayer.addChild(_trigger);
      }
      //triggerLayer.activate();
      console.log("TRIGGERS_PARAMS_LOADED");
    }

    var switchCount = configFile.mapping.switchs.length;
    if (switchCount != 0) {
      for (var i=0; i<switchCount; i++) {
        let _switch = switchFactory();
        _switch.data.x = e256_switch.x;
        _switch.data.y = e256_switch.y;
        _switch.data.size = e256_switch.s;
        _switch.data.chan = e256_switch.c;
        _switch.data.note = e256_switch.n;
        _switch.data.velocity = e256_switch.v;
        switchLayer.addChild(_switch);
      }
      //switchLayer.activate();
      console.log("SWITCHS_PARAMS_LOADED");
    }

    var sliderCount = configFile.mapping.sliders.length;
    if (sliderCount != 0) {
      for (var i=0; i<sliderCount; i++) {
        let _slider = sliderFactory();
        _slider.data.x = e256_slider.x;
        _slider.data.y = e256_slider.y;
        _slider.data.width = e256_slider.w;
        _slider.data.height = e256_slider.h;
        _slider.data.chan = e256_slider.c;
        _slider.data.cc = e256_slider.o;
        _slider.data.min = e256_slider.i;
        _slider.data.max = e256_slider.a;
        sliderLayer.addChild(_slider);
      }
      //sliderLayer.activate();
      console.log("SLIDERS_PARAMS_LOADED");
    }

    var knobCount = configFile.mapping.knobs.length;
    if (knobCount != 0) {
      for (var i=0; i<knobCount; i++) {
        let _knob = knobFactory();
        _knob.data.x = e256_knob.x;
        _knob.data.y = e256_knob.y;
        _knob.data.radius = e256_knob.d;
        _knob.data.offset = e256_knob.o;
        _knob.data.tChan = e256_knob.t;
        _knob.data.tCc = e256_knob.tc;
        _knob.data.tMin = e256_knob.ti;
        _knob.data.tMax = e256_knob.ta;
        _knob.data.rChan = e256_knob.r;
        _knob.data.rCc = e256_knob.rc;
        _knob.data.rMin = e256_knob.ri;
        _knob.data.rMax = e256_knob.ra;
        knobLayer.addChild(_slider);
      }
      //knobLayer.activate();
      console.log("KNOBS_PARAMS_LOADED");
    }

    touchpadCount = configFile.mapping.touchpads.length;
    if (touchpadCount != 0) {
      for (var i=0; i<touchpadCount; i++) {
        let _touchpad = touchpadFactory();
        _touchpad.data.touchs = e256_touchpad.t;
        _touchpad.data.x = e256_touchpad.x;
        _touchpad.data.y = e256_touchpad.y;
        _touchpad.data.width = e256_touchpad.w;
        _touchpad.data.height = e256_touchpad.h;
        _touchpad.data.min = e256_touchpad.i;
        _touchpad.data.max = e256_touchpad.a;
        touchpadLayer.addChild(_touchpad);
        // ...
      }
      //touchpadLayer.activate();
      console.log("TOUCHPADS_PARAMS_LOADED");
    }

  }
}

function loadFile(event) {
  var file = event.target.files[0];
  fileType = file.type;
  if (fileType === "application/json") {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
  }
  else if (fileType === "application/wav") {
    //TODO
  }
  else {
    alert("WRONG FILE TYPE!");
  }
}

function onReaderLoad(event) {
  try {
    config = JSON.parse(event.target.result);
    confSize = Object.keys(JSON.stringify(config)).length;
    drawFromParams(config);
  } catch (e) {
    alert(e);
  }
}