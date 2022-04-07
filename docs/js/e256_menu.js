/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var currentMode = EDIT_MODE;
var e256_drawMode = null;

window.onload = function () {

  console.log("PROJECT: " + PROJECT);
  console.log("NAME: " + NAME);
  console.log("VERSION: " + VERSION);
  console.log("CurrentMode: " + currentMode);
  $("#PROJECT").html(PROJECT);
  $("#NAME").html(NAME);
  $("#VERSION").html(VERSION);

  $(".btn").addClass("shadow-none");
  $(".input-group").addClass("input-group-sm");
  $(".form-control").addClass("shadow-none");
  $(".btn-group").addClass("btn-group-sm");
  $(".btn").addClass("btn-sm");
  $(".btn-group > .btn").click(function () {
    $(this).addClass("active").siblings().removeClass("active");
  });

  $("#connectSwitch").on("change", function () {
    $("#startMenu").collapse("show");
  });

  $(".e256_setMode").click(function (event) {
    e256_setMode(event.target.id);
  });

  $("#calibrate").on("click", function () {
    if (connected) {
      e256_calibrate();
    } else {
      alert("e256 NOT CONNECTED!");
    };
  });

  $("#getConfig").click(function () {
    // TODO
  });

  $("#loadConfigFile").change(function (event) {
    loadFile(event);
  });

  $("#setConfig").click(function () {
    if (connected) {
      setConfig();
    } else {
      alert("e256 NOT CONNECTED!");
    }
  });

  $(".mapingTool").click(function (event) {
    $(".param").collapse("hide");
    e256_drawMode = event.target.id;
    console.log("e256_drawMode: " + e256_drawMode);
  });

  // Update item parameters using the txt input fields
  $(".btnSet").click(function (event) {
    updateParams(event.target.id);
  });

  function e256_setMode(event) {
    switch (event) {
      case "matrixMode":
        currentMode = MATRIX_MODE_RAW;
        //currentMode = MATRIX_MODE_INTERP; // TODO
        $("#calibrateMenu").collapse("show");
        $("#mappingMenu").collapse("hide");
        $("#mappingCanvas").collapse("hide");
        $("#matrixMenu").collapse("show");
        $("#matrixCanvas").collapse("show");
        $("#summary_title").html("3D-VISUALISATION");
        $("#summaryContent").html("This 3D visualisation is made to check all the eTextile matrix piezoresistive pressure sensors");
        $(".param").collapse("hide");
        break;
      case "mappingMode":
        // Look if there is loaded CONFIG file in the ETEXTILE_SYNTH
        $("#calibrateMenu").collapse("show");
        $("#matrixMenu").collapse("hide");
        $("#matrixCanvas").collapse("hide");
        $("#mappingMenu").collapse("show");
        $("#mappingCanvas").collapse("show");
        $("#summary_title").html("2D-MAPPING");
        $("#summaryContent").html("This 2D graphic user interface is made to draw your own eTextile custom interfaces !");
        $(".param").collapse("hide");
        break;
      case "editMode":
        currentMode = EDIT_MODE;
        $("#editMenu").collapse("show");
        $("#playMenu").collapse("hide");
        $("#loadMenu").collapse("hide");
        $("#summary_title").html("2D-MAPPING / EDIT");
        $("#summaryContent").html("Add new components");
        break;
      case "playMode":
        currentMode = PLAY_MODE;
        $("#editMenu").collapse("hide");
        $("#playMenu").collapse("show");
        $("#loadMenu").collapse("show");
        $("#summary_title").html("2D-MAPPING / PLAY");
        $("#summaryContent").html("Evaluate what you have made");
        $(".param").collapse("hide");
        break;
    }
    programChange(currentMode, CHAN1);
  }
}


function e256_setState(event) {
  switch (event) {
    case "mappingMode":
      programChange(GET_CONFIG, CHAN2);
      break;
    case "calibrate":
      programChange(GET_CONFIG, CHAN2);
      break;
  }
}