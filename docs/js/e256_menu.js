/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_current_mode = MODE.PENDING;
var e256_previous_mode = null;
var e256_draw_mode = null;
var e256_previous_draw_mode = null;

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

$(".btn-group > .btn").click (
  function () {
    $(this).addClass("active").siblings().removeClass("active");
  }
);

$("#connect_switch").on ("change", 
  function () {
    $("#start_menu").collapse("show");
  }
);

$(".e256_set_mode").click (
  function (event) {
    e256_previous_mode = e256_current_mode;
    e256_current_mode = MODE[event.target.id];
    if (midi_device_connected) {
      if(e256_current_mode != e256_previous_mode) {
        if (event.target.id === "CALIBRATE") $("#CALIBRATE").addClass("active");
        send_midi_msg(new program_change(MIDI_CHANNEL.MODES, e256_current_mode));
        if (DEBUG) console.log("REQUEST: " + MODE_CODES[e256_current_mode]);
      }
    } else {
      alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$(".mapingTool").click (
  function (event) {
    e256_previous_draw_mode = e256_draw_mode; ///////////////////////////////// FIXME!
    e256_draw_mode = event.target.id;
    
    switch (e256_draw_mode) {
      case "path":
        hit_options = hit_options_B;
        break;
      case "polygon":
        hit_options = hit_options_B;
        break;
      default:
        hit_options = hit_options_A;
        break;
    }
    create_once = false;
  }
);

$("#uploadConfig").click (
  function () {
    if (midi_device_connected) {
      $("#uploadConfig").addClass("active");
      send_midi_msg(new program_change(MIDI_CHANNEL.MODES, MODE.ALLOCATE_CONFIG));
      if (DEBUG) console.log("REQUEST: ALLOCATE CONFIG");
    } else {
      alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$("#saveConfig").click(function () {
  e256_export_params();
  if (DEBUG) console.log(JSON.stringify(e256_config));

  let filename = prompt("Enter file name:", "e256_mapping.json");
  if (filename === null) return;

  filename = filename.trim();
  if (filename === "") filename = "e256_mapping.json";
  if (!filename.toLowerCase().endsWith(".json")) filename += ".json";

  $("#saveConfig").addClass("active");

  var file = new File(
    [JSON.stringify(e256_config, null, 2)],
    filename,
    { type: "application/json;charset=utf-8" }
  );

  saveAs(file, filename);
  $("#saveConfig").removeClass("active");
});

$("#fetchConfig").click (
  function () {
    if (midi_device_connected) {
      $("#fetchConfig").addClass("active");
      send_midi_msg(new program_change(MIDI_CHANNEL.MODES, MODE.LOAD_CONFIG));
      if (DEBUG) console.log("REQUEST: LOAD CONFIG");
    } else {
      alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);
