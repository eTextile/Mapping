/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_current_mode = MODE.PENDING;
var e256_previous_mode = null;
var e256_pending_mode = null;
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
    const btn_id = event.currentTarget.id;
    let requested_mode = MODE[btn_id];
    if (midi_device_connected) {
      if (requested_mode !== e256_current_mode) {
        e256_previous_mode = e256_current_mode;
        if ((requested_mode === MODE.PLAY || requested_mode === MODE.EDIT || requested_mode === MODE.THROUGH) &&
            (e256_current_mode === MODE.MATRIX_RAW || e256_current_mode === MODE.MATRIX_INTERP)) {
          e256_pending_mode = requested_mode;
          send_sysex_cmd(MODE.MAPPING);
          if (DEBUG) console.log("REQUEST: MAPPING (pending " + MODE_CODES[requested_mode] + ")");
        } else {
          e256_pending_mode = null;
          if (btn_id === "CALIBRATE") $("#CALIBRATE").addClass("active");
          send_sysex_cmd(requested_mode);
          if (DEBUG) console.log("REQUEST: " + MODE_CODES[requested_mode]);
        }
      }
    } else {
      alert_msg("ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$(".maping_tool").click (
  function (event) {
    $(".maping_tool").removeClass("active");
    $(this).addClass("active");
    e256_draw_mode = event.target.id;
    
    switch (e256_draw_mode) {
      case "path":
        hit_options = hit_opts_vertex;
        break;
      case "polygon":
        hit_options = hit_opts_vertex;
        break;
      default:
        hit_options = hit_opts_item;
        break;
    }
    shape_drawing_in_progress = false;
  }
);

$("#upload_config").click (
  function () {
    if (midi_device_connected) {
      $("#upload_config").addClass("active");
      send_sysex_cmd(MODE.ALLOCATE_CONFIG);
      if (DEBUG) console.log("REQUEST: ALLOCATE CONFIG");
    } else {
      alert_msg("ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$("#save_config").click(function () {
  e256_export_params();
  if (DEBUG) console.log(JSON.stringify(e256_config));

  let filename = prompt("Enter file name:", "e256_mapping.json");
  if (filename === null) return;

  filename = filename.trim();
  if (filename === "") filename = "e256_mapping.json";
  if (!filename.toLowerCase().endsWith(".json")) filename += ".json";

  $("#save_config").addClass("active");

  var file = new File(
    [JSON.stringify(e256_config, null, 2)],
    filename,
    { type: "application/json;charset=utf-8" }
  );

  saveAs(file, filename);
  $("#save_config").removeClass("active");
});


$("#fetch_config").click (
  function () {
    if (midi_device_connected) {
      $("#fetch_config").addClass("active");
      send_sysex_cmd(MODE.LOAD_CONFIG);
      if (DEBUG) console.log("REQUEST: LOAD CONFIG");
    } else {
      alert_msg("ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
    }
  }
);

$(document).on("keydown", function (event) {
  if ($(event.target).is("input, select, textarea")) return;
  switch (event.key) {
    case "h":      $("#help-overlay").toggleClass("active"); break;
    case "Escape": $("#help-overlay").removeClass("active"); break;
    case "p": $("#EDIT, #THROUGH").removeClass("active"); $("#PLAY").trigger("click");   break;
    case "e": $("#PLAY, #THROUGH").removeClass("active"); $("#EDIT").trigger("click");   break;
    case "t": $("#EDIT, #PLAY").removeClass("active");    $("#THROUGH").trigger("click"); break;
    case "r": $("#matrix_raw_btn").trigger("click");    break;
    case "i": $("#matrix_interp_btn").trigger("click"); break;
    case "m":
      if (e256_current_mode === MODE.MATRIX_RAW || e256_current_mode === MODE.MATRIX_INTERP)
        $("#MAPPING").trigger("click");
      else if (window.set_matrix_resolution)
        window.set_matrix_resolution(RAW_COLS, RAW_ROWS);
      break;
    case "c": $("#CALIBRATE").trigger("click");     break;
    case "u": $("#upload_config").trigger("click"); break;
    case "s": $("#save_config").trigger("click");   break;
    case "f": $("#fetch_config").trigger("click");  break;
  }
});

$("#help-overlay").on("click", function (event) {
  if (event.target === this) $(this).removeClass("active");
});
