/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
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

$(".btn-group > .btn").click(
  function () {
    $(this).addClass("active").siblings().removeClass("active");
  }
);

$("#connect_switch").on("change", 
  function () {
    $("#start_menu").collapse("show");
  }
);

$(".e256_setMode").click(
  function (event) {
    e256_previous_mode = e256_current_mode;
    e256_current_mode = eval(event.target.id);
    if (midi_device_connected) {
      if(e256_current_mode != e256_previous_mode) {
        send_midi_msg(new program_change(MIDI_MODES_CHANNEL, e256_current_mode));
        //console.log("REQUEST: " + MODE_CODES[e256_current_mode]);
        //alert_msg("request_" + MODE_CODES[e256_current_mode], "REQUEST_" + MODE_CODES[e256_current_mode], "warning");
      }
    } else {
      alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$(".mapingTool").click(
  function (event) {
    //e256_last_draw_mode = e256_draw_mode; ///////////////////////////////// FIXME!
    e256_draw_mode = event.target.id;
    create_once = false;
  }
);

$("#uploadConfig").click(
  function () {
    if (midi_device_connected) {
      send_midi_msg(new program_change(MIDI_MODES_CHANNEL, ALLOCATE_MODE));
      console.log("REQUEST: ALLOCATE_MODE");
    } else {
      alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$("#saveConfig").click(
  function () {
    e256_export_params();
    console.log(JSON.stringify(e256_config));
    var file = new File([JSON.stringify(e256_config)], { type: "text/plain;charset=utf-8" });
    // TODO: add file name!
    saveAs(file, "e256_mapping.json");
  }
);

$("#fetchConfig").click(
  function () {
    if (midi_device_connected) {
      send_midi_msg(new program_change(MIDI_MODES_CHANNEL, LOAD_MODE));
      console.log("REQUEST: LOAD_MODE");
    } else {
      alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

// Update graphic item using form params
$("#btnSet").click(
  function () {
    re_create_item(current_controleur);
  }
);
