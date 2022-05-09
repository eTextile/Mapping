/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var currentMode = PENDING_MODE;
var currentState = null;
var e256_drawMode = null;

console.log("PROJECT: " + PROJECT);
console.log("NAME: " + NAME + ": " + VERSION);
console.log("MODE: " + MODES_CODES[currentMode]);

$("#PROJECT").html(PROJECT);
$("#NAME").html(NAME + " - " + VERSION);
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
  switch (event.target.id) {
    case "matrixMode":
      currentMode = MATRIX_MODE_RAW;
      $("#calibrateMenu").collapse("show");
      $("#matrixMenu").collapse("show");
      $("#mappingMenu").collapse("hide");
      $("#loadingCanvas").collapse("hide");
      $("#matrixCanvas").collapse("show");
      $("#mappingCanvas").collapse("hide");
      $("#summaryAction").html("CONNECTED");
      $("#summaryContent").html("This 3D visualisation is made to check all the eTextile matrix piezoresistive pressure sensors");
      $(".param").collapse("hide");
      break;
    case "mappingMode":
      currentMode = EDIT_MODE;
      $("#calibrateMenu").collapse("show");
      $("#matrixMenu").collapse("hide");
      $("#mappingMenu").collapse("show");
      $("#loadingCanvas").collapse("hide");
      $("#matrixCanvas").collapse("hide");
      $("#mappingCanvas").collapse("show");
      $("#summaryAction").html("CONNECTED");
      $("#summaryContent").html("This 2D graphic user interface is made to draw your own eTextile custom interfaces !");
      $(".param").collapse("hide");
      break;
    case "editMode":
      currentMode = EDIT_MODE;
      $("#editMenu").collapse("show");
      $("#playMenu").collapse("hide");
      $("#loadMenu").collapse("hide");
      $("#summaryAction").html("CONNECTED / EDIT_MODE");
      $("#summaryContent").html("Add new components");
      break;
    case "playMode":
      currentMode = PLAY_MODE;
      $("#editMenu").collapse("hide");
      $("#playMenu").collapse("show");
      $("#loadMenu").collapse("show");
      $("#summaryAction").html("CONNECTED / PLAY_MODE");
      $("#summaryContent").html("Evaluate what you have made");
      $(".param").collapse("hide");
      break;
  }
  if (connected) {
    programChange(currentMode, MIDI_MODES_CHANNEL);
    console.log("REQUEST: " + MODES_CODES[currentMode]);
  } else {
    //alert("e256 NOT CONNECTED!");
  }
});

$(".e256_setState").click(function (event) {
  e256_setState(event.target.id);
});

$("#loadConfigFile").change(function (event) {
  loadFile(event);
});

$("#uploadConfig").click(function () {
  if (connected) {
    e256_alocate_memory();
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#exportConfig").click(function () {
  if (connected) {
    e256_exportParams();
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$(".mapingTool").click(function (event) {
  $("#optionsMenu").collapse("show");
  $(".param").collapse("hide");
  e256_drawMode = event.target.id;
  console.log("DRAW_MODE: " + e256_drawMode);
});

// Update item parameters using the txt input fields
$(".btnSet").click(function (event) {
  var paramsIndex = 0;
  if (event.target.id === "btnSet-" + paramsIndex) {
    for (const param in selectedItem.data) {
      selectedItem.data[param] = $("#paramInputValue-" + paramsIndex).val();
      paramsIndex++;
    }
  }
});

function e256_setState(event) {
  switch (event) {
    case "calibrate":
      programChange(CALIBRATE_REQUEST, MIDI_STATES_CHANNEL);
      console.log("REQUEST: CALIBRATE");
      break;
    case "getConfig":
      currentMode = SYNC_MODE;
      programChange(CONFIG_FILE_REQUEST, MIDI_STATES_CHANNEL);
      console.log("REQUEST: CONFIG_FILE");
      break;
  }
};