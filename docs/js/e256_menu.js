/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_current_mode = PENDING_MODE;
var e256_draw_mode = null;

console.log("PROJECT: " + PROJECT);
console.log("NAME: " + NAME + ": " + VERSION);
console.log("MODE: " + MODES_CODES[e256_current_mode]);

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
      e256_current_mode = MATRIX_MODE_RAW;
      $("#calibrateMenu").collapse("show");
      $("#matrixMenu").collapse("show");
      $("#mappingMenu").collapse("hide");
      $("#loadingCanvas").collapse("hide");
      $("#matrixCanvas").collapse("show");
      $("#mappingCanvas").collapse("hide");
      $("#summaryAction").html("CONNECTED");
      $("#summaryContent").html("This 3D visualisation is made to check all the eTextile matrix piezoresistive pressure sensors");
      //$(".param").collapse("hide");
      break;
    case "mappingMode":
      e256_current_mode = EDIT_MODE;
      $("#calibrateMenu").collapse("show");
      $("#matrixMenu").collapse("hide");
      $("#mappingMenu").collapse("show");
      $("#loadingCanvas").collapse("hide");
      $("#matrixCanvas").collapse("hide");
      $("#mappingCanvas").collapse("show");
      $("#summaryAction").html("CONNECTED");
      $("#summaryContent").html("This 2D graphic user interface is made to draw your own eTextile custom interfaces !");
      //$(".param").collapse("hide");
      break;
    case "editMode":
      e256_current_mode = EDIT_MODE;
      $("#editMenu").collapse("show");
      $("#playMenu").collapse("hide");
      $("#loadMenu").collapse("show");

      $("#summaryAction").html("CONNECTED / EDIT_MODE");
      $("#summaryContent").html("Add new components");
      break;
    case "playMode":
      e256_current_mode = PLAY_MODE;
      $("#editMenu").collapse("hide");
      $("#playMenu").collapse("show");
      $("#loadMenu").collapse("hide");

      $("#summaryAction").html("CONNECTED / PLAY_MODE");
      $("#summaryContent").html("Evaluate what you have made");
      //$(".param").collapse("hide");
      break;
  }
  if (MIDI_device_connected) {
    sendProgramChange(e256_current_mode, MIDI_MODES_CHANNEL);
    console.log("REQUEST: " + MODES_CODES[e256_current_mode]);
  } else {
    //alert("e256 NOT CONNECTED!");
  }
});

$("#uploadConfig").click(function () {
  if (MIDI_device_connected) {
    e256_alocate_memory();
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#saveConfig").click(function () {
  e256_exportParams();
  console.log(JSON.stringify(e256_config));
  var file = new File([JSON.stringify(e256_config)], { type: "text/plain;charset=utf-8" });
  saveAs(file, "e256_mapping.json");
});

$(".mapingTool").click(function (event) {
  $("#optionsMenu").collapse("show");
  //$(".param").collapse("hide");
  e256_draw_mode = event.target.id;
  console.log("DRAW_MODE: " + e256_draw_mode);
  create_once = false;
});

$("#calibrate").click(function () {
  if (MIDI_device_connected) {
    sendProgramChange(CALIBRATE_REQUEST, MIDI_STATES_CHANNEL);
    console.log("REQUEST: CALIBRATE");
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#getConfig").click(function () {
  if (MIDI_device_connected) {
    //e256_current_mode = SYNC_MODE;
    sendProgramChange(CONFIG_FILE_REQUEST, MIDI_STATES_CHANNEL);
    console.log("REQUEST: CONFIG_FILE");
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#exportConfig").click(function () {
  e256_exportParams();
});

// Update graphic item using form params
$("#btnSet").click(function () {
  current_controleur.save_params();
  item_remove_menu_params(current_controleur);
  current_controleur.removeChildren();
  current_controleur.create();
  item_create_menu_params(current_controleur);
  update_menu_params(current_controleur);
  item_menu_params(current_controleur, "show");
});
