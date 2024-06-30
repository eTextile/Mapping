/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_current_mode = PENDING_MODE;
var e256_draw_mode = null;

console.log("PROJECT: " + PROJECT);
console.log("NAME: " + NAME + ": " + VERSION);
console.log("MODE: " + MODE_CODES[e256_current_mode]);

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
  e256_current_mode = eval(event.target.id);
  if (midi_device_connected) {
    send_midi_msg(new program_change(MIDI_MODES_CHANNEL, e256_current_mode));
    console.log("REQUEST: " + MODE_CODES[e256_current_mode]);
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$(".mapingTool").click(function (event) {
  e256_draw_mode = event.target.id;
  create_once = false;
});

$("#calibrate").click(function () {
  if (midi_device_connected) {
    send_midi_msg(new program_change(MIDI_MODES_CHANNEL, CALIBRATE_MODE));
    console.log("REQUEST: CALIBRATE_MODE");
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#uploadConfig").click(function () {
  if (midi_device_connected) {
    send_midi_msg(new program_change(MIDI_MODES_CHANNEL, ALLOCATE_MODE));
    console.log("REQUEST: ALLOCATE_MODE");
  } else {
    alert("e256 NOT CONNECTED!");
  }
});

$("#saveConfig").click(function () {
  e256_export_params();
  console.log(JSON.stringify(e256_config));
  var file = new File([JSON.stringify(e256_config)], { type: "text/plain;charset=utf-8" });
  // TODO: add file name!
  saveAs(file, "e256_mapping.json");
});

$("#fetchConfig").click(function () {
  if (midi_device_connected) {
    send_midi_msg(new program_change(MIDI_MODES_CHANNEL, LOAD_MODE));
    console.log("REQUEST: LOAD_MODE");
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
