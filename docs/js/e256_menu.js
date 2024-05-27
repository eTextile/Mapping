/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
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
      $("#contextualContent").html("MATRIX is 3D visualisation made for checking all the eTextile matrix piezoresistive pressure sensors");
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
      $("#contextualContent").html("MAPPING is 2D graphic user interface made for drawing your own eTextile custom interfaces");
      //$(".param").collapse("hide");
      break;
    case "editMode":
      e256_current_mode = EDIT_MODE;
      $("#editMenu").collapse("show");
      $("#loadMenu").collapse("show");
      $("#set_button_params").collapse("show");
      $("#summaryAction").html("CONNECTED / EDIT_MODE");
      $("#contextualContent").html("Using EDIT MODE you can add components to the matrix controler");
      $("#midi_term").collapse("hide");
      item_menu_params(current_controleur, "show");
      item_menu_params(current_touch, "show");
      break;
    case "playMode":
      e256_current_mode = PLAY_MODE;
      $("#editMenu").collapse("hide");
      $("#loadMenu").collapse("hide");
      $("#set_button_params").collapse("hide");
      $("#summaryAction").html("CONNECTED / PLAY_MODE");
      $("#contextualContent").html("Using PLAY MODE you can evaluate what you have made");
      $(".param").collapse("hide");
      $("#midi_term").collapse("show");
      item_menu_params(current_controleur, "hide");
      item_menu_params(current_touch, "hide");
      break;
  }

  send_midi_msg(new program_change(MIDI_MODES_CHANNEL, e256_current_mode));
  console.log("REQUEST: " + MODES_CODES[e256_current_mode]);
});

$("#uploadConfig").click(function () {
  if (midi_device_connected) {
    e256_alocate_memory();
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#saveConfig").click(function () {
  e256_export_params();
  console.log(JSON.stringify(e256_config));
  var file = new File([JSON.stringify(e256_config)], { type: "text/plain;charset=utf-8" });
  // Naming the file!!!!!
  saveAs(file, "e256_mapping.json");
});

$(".mapingTool").click(function (event) {
  e256_draw_mode = event.target.id;
  create_once = false;
});

$("#calibrate").click(function () {
  if (midi_device_connected) {
    send_midi_msg(new program_change(MIDI_STATES_CHANNEL, CALIBRATE_REQUEST));
    console.log("REQUEST: CALIBRATE");
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#fetchConfig").click(function () {
  if (midi_device_connected) {
    e256_current_mode = FETCH_MODE;
    send_midi_msg(new program_change(MIDI_STATES_CHANNEL, CONFIG_FILE_REQUEST));
    console.log("REQUEST: CONFIG_FILE");
  } else {
    alert("e256 NOT CONNECTED!");
  }

});

// Update graphic item using form params
$("#btnSet").click(
  function () {
    re_create_item(current_controleur);
  }
);
