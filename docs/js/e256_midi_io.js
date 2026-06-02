/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var midi_input = null;
var midi_output = null;
var midi_device_connected = false;
var loaded_file = null; // From user desktop
var fetch_config_file = null; // From e256 flash memory

var current_controller = { "id": null };
var previous_controller = { "id": null };
var current_touch = { "id": null };
var previous_touch = { "id": null };
var current_part = { "id": null };
// Prevents hover (onMouseEnter) from overriding the selected touch's highlight colour while
// the user holds/drags on a touch circle in EDIT mode. Set true in each mapping's onMouseDown,
// cleared whenever the active touch or mapping changes.
var touch_selection_locked = false;

// Generator: cycles MIDI CC values 0–127 to auto-assign defaults for new mappings.
function* default_midi_index() {
  let index = 0;
  while (true) {
    index = (index + 1) % 128;
    yield index;
  }
};

const midi_index = default_midi_index();

// MIDI struct
// https://www.midi.org/specifications-old/item/table-2-expanded-messages-list-status-bytes
function midi_msg_status_pack(channel, type) {
  return(channel - 1) | type;
};

function midi_msg_status_unpack(status) {
  return {
    "type": status & 0xF0,
    "channel": (status & 0xF) + 1 // Save the 4 LSB bits [0000 === chan 1]
  }
};

function note_on(chan, note, velo) {
  let status = midi_msg_status_pack(chan, MIDI_TYPE.NOTE_ON);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  };
};

function note_off(chan, note, velo) {
  let status = midi_msg_status_pack(chan, MIDI_TYPE.NOTE_OFF);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  }
};

function control_change(chan, ctr, val) {
  let status = midi_msg_status_pack(chan, MIDI_TYPE.CONTROL_CHANGE);
  return {
    "status": status,
    "data1": ctr,
    "data2": val
  }
};

function polyphonic_aftertouch(chan, note, press) {
  let status = midi_msg_status_pack(chan, MIDI_TYPE.AFTERTOUCH_POLY);
  return {
    "status": status,
    "data1": note,
    "data2": press
  }
};

function program_change(chan, pgm) {
  let status = midi_msg_status_pack(chan, MIDI_TYPE.PROGRAM_CHANGE);
  return {
    "status": status,
    "data1": pgm,
    "data2": null
  }
};

function pitch_bend(chan, pitch) {
  let status = midi_msg_status_pack(chan, MIDI_TYPE.PITCH_BEND);
  let data1 = pitch & 0x7F // Lsb
  let data2 = pitch >> 7 // Msb
  return {
    "status": status,
    "data1": data1,
    "data2": data2
  }
};

function limit(min, max) {
  return {
    "min": min, // [0:127]
    "max": max  // [0:127]
  }
};

// MIDI MESSAGE BUILDER
//    -> MIDI_TYPE.NOTE_OFF - N/A
//    -> MIDI_TYPE.NOTE_ON
//    -> MIDI_TYPE.AFTERTOUCH_POLY
//    -> MIDI_TYPE.CONTROL_CHANGE
//    MIDI_TYPE.PROGRAM_CHANGE
//    MIDI_TYPE.C_AFTERTOUCH
//    MIDI_TYPE.PITCH_BEND

function midi_msg_builder(midi_msg_type) {
  let msg = {};

  switch (midi_msg_type) {

    case MIDI_TYPE.NOTE_ON:
      msg.midi = new note_on(
        MIDI_DEFAULT.OUTPUT_CHANNEL,
        midi_index.next().value,
        MIDI_DEFAULT.VELOCITY
      )
      msg.limit = new limit(
        MIDI_DEFAULT.MIN_VAL,
        MIDI_DEFAULT.MAX_VAL
      )
      break;

    case MIDI_TYPE.CONTROL_CHANGE:
      msg.midi = new control_change(
        MIDI_DEFAULT.OUTPUT_CHANNEL,
        midi_index.next().value,
        MIDI_DEFAULT.VELOCITY
      )
      msg.limit = new limit(
        MIDI_DEFAULT.MIN_VAL,
        MIDI_DEFAULT.MAX_VAL
      )
      break;

    case MIDI_TYPE.AFTERTOUCH_POLY:
      msg.midi = new polyphonic_aftertouch(
        MIDI_DEFAULT.OUTPUT_CHANNEL,
        midi_index.next().value,
        midi_index.next().value
      );
      msg.limit = new limit(
        MIDI_DEFAULT.MIN_VAL,
        MIDI_DEFAULT.MAX_VAL
      );
      break;

    case MIDI_TYPE.PITCH_BEND:
      msg.midi = new pitch_bend(
        MIDI_DEFAULT.OUTPUT_CHANNEL,
        MIDI_DEFAULT.VELOCITY
      )
      msg.limit = new limit(
        MIDI_DEFAULT.MIN_VAL,
        MIDI_DEFAULT.MAX_VAL
      );
      break;
    case MIDI_TYPE.CHORD:
      msg.chord = 1;   // default: Major
      msg.note = 60;   // default: C4 (middle C)
      break;
    case MIDI_TYPE.CLOCK:
      msg.midi = new note_on(MIDI_DEFAULT.OUTPUT_CHANNEL, 0, 0);
      msg.limit = new limit(MIDI_DEFAULT.MIN_VAL, MIDI_DEFAULT.MAX_VAL);
      break;
    default:
      break;
  };
  return msg;
};

async function MIDIsetup() {
  navigator.permissions.query({name: "midi"}).then((permissionStatus) => {
    if (permissionStatus.state === "prompt" || permissionStatus.state === "granted") {
      navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess);
    }
    if (permissionStatus.state === "denied") {
      alert_msg("This browser does not support MIDI!", "danger");
    }
  });
};

function onMIDISuccess(midiAccess) {
  let input_setup = false;
  let output_setup = false;

  function try_connect() {
    for (let input of midiAccess.inputs.values()) {
      if (input.name === "ETEXTILE_SYNTH MIDI 1") { midi_input = input; input_setup = true; }
    }
    for (let output of midiAccess.outputs.values()) {
      if (output.name === "ETEXTILE_SYNTH MIDI 1") { midi_output = output; output_setup = true; }
    }
    if (input_setup && output_setup && !midi_device_connected) {
      midi_device_connected = true;
      midi_input.onmidimessage = on_midi_message;
      updateMenu();
      if (DEBUG) console.log("MIDI_IN: " + midi_input.name);
      if (DEBUG) console.log("MIDI_OUT: " + midi_output.name);
      setTimeout(function () {
        send_sysex_cmd(MODE.SYNC);
        if (DEBUG) console.log("REQUEST: SYNC");
      }, 1000);
    }
  }

  try_connect(); // handle already-connected device on page load / refresh

  midiAccess.onstatechange = function (msg) {
    switch (msg.port.state) {
      case "connected":
        try_connect();
        break;
      case "disconnected":
        midi_input = null;
        midi_output = null;
        input_setup = false;
        output_setup = false;
        midi_device_connected = false;
        e256_current_mode = MODE.PENDING;
        updateMenu();
        break;
    }
  }
};

/*
function onMIDIFailure(error) {
  alert("MIDI ERROR :" + error);
};
*/

function updateMenu() {
  if (midi_device_connected) {
    connect_switch.checked = true;
    $("#connect_switch").removeClass("btn-danger").addClass("btn-success");
    $("#connection_status").html("CONNECTED").removeClass("alert-warning").addClass("alert-success");
    $("#start_menu").collapse("show");
    $("#e256_params").collapse("show");
    $("#calibrate_menu").collapse("show");
    $("#matrix_menu").collapse("show");
    $("#mapping_menu").collapse("hide");
    $("#loading_canvas").collapse("hide");
    $("#matrix_canvas").collapse("show");
    $("#mapping_canvas").collapse("hide");
    $("#connection_status").html("CONNECTED");
    $("#mode_explanation").html("Check if all the eTextile matrix piezoresistive pressure sensors are working properly");
    $("#MATRIX_RAW").addClass("active");
    $("#MAPPING").removeClass("active");
  }
  else {
    connect_switch.checked = false;
    $("#start_menu").collapse("hide");
    $("#calibrate_menu").collapse("hide");
    $("#matrix_menu").collapse("hide");
    $("#mapping_menu").collapse("hide");
    $("#loading_canvas").collapse("show");
    $("#matrix_canvas").collapse("hide");
    $("#mapping_canvas").collapse("hide");
    $("#connection_status").html("DISCONNECTED").removeClass("alert-success").addClass("alert-warning");
    $("#mode_explanation").html("Configure the MIDI tactile commands of your eTextile-Synthesizer");
    $("#midi_term").collapse("hide");
    $("#connect_switch").removeClass("btn-success").addClass("btn-danger");
    $("#e256_params").collapse("hide"); $("#upload_section").hide(); $("#synth_profile_section").hide();
    $("#MAPPING").removeClass("active");
    $("#MATRIX_RAW").removeClass("active");
  }
};

// RAW MIDI MESSAGES (MIDI 1.0)
function on_midi_message(midi_msg) {
  let msg = {};
  msg.status = midi_msg.data[0];
  msg.data1 = midi_msg.data[1];
  msg.data2 = midi_msg.data[2];

  //console.log("MIDI IN:", msg.status.toString(16), msg.data1, msg.data2);

  let status = midi_msg_status_unpack(msg.status);
  switch (status.type) {

    case MIDI_SYSEX.START:
      // Control packets from firmware have DEVICE_ID at byte[1].
      if (midi_msg.data[1] === MIDI_SYSEX.DEVICE_ID) {
        const pkt_type = midi_msg.data[2];
        const payload  = midi_msg.data[3];
        if (pkt_type === SYSEX_PKT.ACK) {
          handle_sysex_ack(payload);
        } else if (pkt_type === SYSEX_PKT.ERR) {
          alert_msg("ERROR: " + ERROR_CODES[payload], "danger");
        } else if (pkt_type === SYSEX_PKT.PARAM) {
          handle_sysex_param(payload, midi_msg.data[4]);
        } else if (pkt_type === SYSEX_PKT.MIDI_IN && e256_current_mode === MODE.PLAY) {
          const type_nibble    = midi_msg.data[3];
          const channel_0based = midi_msg.data[4];
          const msg = {
            status: (type_nibble << 4) | channel_0based,
            data1:  midi_msg.data[5],
            data2:  midi_msg.data[6]
          };
          midi_term_in.push(msg);
        }
        break;
      }
      // Data packets (blobs, matrix, JSON fetch) — dispatch by current mode.
      switch (e256_current_mode) {
        case MODE.FETCH_CONFIG: {
          const decoder = new TextDecoder();
          let conf_str = decoder.decode(midi_msg.data);
          fetch_config_file = conf_str.slice(1, -1);
          alert_msg("FETCH CONFIG DONE", "success");
          break;
        }
        case MODE.MATRIX_RAW:
          e256_matrix.update(midi_msg.data);
          break;
        case MODE.MATRIX_INTERP:
          e256_matrix.updateChunk(midi_msg.data);
          break;
        case MODE.EDIT: {
          let blob_data = midi_msg.data.subarray(1, -1);
          if (blob_data.length < 14) {
            console.warn("BLOB_SYSEX_TRUNCATED: length=" + blob_data.length + " (expected 14) — UID byte may have exceeded 127, reflash firmware");
            break;
          }
          e256_blobs.update(blob_data);
          break;
        }
        case MODE.PENDING:
          break;
        case MODE.THROUGH: {
          let blob_data = midi_msg.data.subarray(1, -1);
          if (blob_data.length >= 14) midi_play_blob_update_all(blob_data);
          break;
        }
        case MODE.PLAY: {
          let blob_data = midi_msg.data.subarray(1, -1);
          if (blob_data.length >= 14) midi_play_blob_update_all(blob_data);
          break;
        }
        default:
          alert_msg("SYSEX_TYPE_NOT_HANDLED: " + MODE_CODES[e256_current_mode], "warning");
          break;
      }
      break;

    case MIDI_TYPE.CONTROL_CHANGE:
      if (e256_current_mode === MODE.PLAY) {
        try { midi_play_update_all(msg); } catch(e) { console.warn("midi_play_update:", e); }
        midi_term_out.push(msg);
      } else {
        midi_term_in.push(msg);
      }
      break;

    default:
      if (e256_current_mode === MODE.PLAY) {
        try { midi_play_update_all(msg); } catch(e) { console.warn("midi_play_update:", e); }
        midi_term_out.push(msg);
      } else {
        midi_term_in.push(msg);
      }
      break;
  }
};

function handle_sysex_ack(ack) {
  if (DEBUG) console.log("ACK: " + MODE_ACK_CODES[ack]);
  switch (ack) {
    case MODE_ACK.MATRIX_RAW:
      updateMenu(); $("#e256_params").hide(); $("#upload_section").hide(); $("#synth_profile_section").hide(); e256_current_mode = MODE.MATRIX_RAW;
      $("#connection_status").html("CONNECTED / MATRIX_RAW");
      alert_msg("MODE: MATRIX_RAW", "success");
      break;
    case MODE_ACK.MATRIX_INTERP:
      updateMenu(); $("#e256_params").hide(); $("#upload_section").hide(); $("#synth_profile_section").hide(); e256_current_mode = MODE.MATRIX_INTERP;
      $("#connection_status").html("CONNECTED / MATRIX_INTERP");
      alert_msg("MODE: MATRIX_INTERP", "success");
      break;
    case MODE_ACK.MAPPING:
      $("#calibrate_menu").collapse("show"); $("#matrix_menu").collapse("hide");
      $("#mapping_menu").collapse("show"); $("#loading_canvas").collapse("hide");
      $("#matrix_canvas").collapse("hide"); $("#mapping_canvas").collapse("show");
      $("#connection_status").html("CONNECTED / MAPPING");
      $("#mode_explanation").html("Define your custom MIDI interface onto the eTextile device");
      $("#MATRIX_RAW").removeClass("active"); $("#MAPPING").addClass("active");
      e256_current_mode = MODE.MAPPING;
      alert_msg("MODE: MAPPING", "success");
      if (e256_pending_mode !== null) {
        const pending_id = MODE_CODES[e256_pending_mode];
        e256_pending_mode = null;
        $("#" + pending_id).trigger("click");
      } else {
        $("#EDIT").trigger("click");
      }
      break;
    case MODE_ACK.EDIT:
      $("#edit_menu").collapse("show"); $("#load_menu").collapse("show");
      $("#connection_status").html("CONNECTED / EDIT");
      $("#mode_explanation").html("Add tactile commands to the eTextile device");
      $("#midi_term").collapse("hide"); $("#e256_params").show(); $("#upload_section").show(); $("#synth_profile_section").show();
      item_menu_params(current_controller, "show");
      item_menu_params(current_touch, "show");
      $("#PLAY").removeClass("active"); $("#THROUGH").removeClass("active"); $("#EDIT").addClass("active");
      set_all_touch_visuals_visible(true);
      e256_current_mode = MODE.EDIT;
      alert_msg("MODE: EDIT", "success");
      break;
    case MODE_ACK.THROUGH:
      $("#calibrate_menu").collapse("show"); $("#matrix_menu").collapse("hide");
      $("#mapping_menu").collapse("show"); $("#loading_canvas").collapse("hide");
      $("#matrix_canvas").collapse("hide"); $("#mapping_canvas").collapse("show");
      $("#edit_menu").collapse("hide"); $("#load_menu").collapse("hide");
      $("#connection_status").html("CONNECTED / THROUGH");
      $("#mode_explanation").html("Send Midi msg to the external synth");
      $("#e256_params").hide(); $("#midi_term").collapse("show"); $("#upload_section").hide(); $("#synth_profile_section").hide();
      item_menu_params(current_controller, "hide"); item_menu_params(current_touch, "hide");
      $("#EDIT").removeClass("active"); $("#THROUGH").addClass("active"); $("#PLAY").removeClass("active");
      e256_blobs.clear(); midi_term_in.clear(); midi_term_out.clear(); e256_current_mode = MODE.THROUGH;
      alert_msg("MODE: THROUGH", "success");
      break;
    case MODE_ACK.PLAY:
      $("#calibrate_menu").collapse("show"); $("#matrix_menu").collapse("hide");
      $("#mapping_menu").collapse("show"); $("#loading_canvas").collapse("hide");
      $("#matrix_canvas").collapse("hide"); $("#mapping_canvas").collapse("show");
      $("#edit_menu").collapse("hide"); $("#load_menu").collapse("hide");
      $("#connection_status").html("CONNECTED / PLAY");
      $("#mode_explanation").html("Evaluate what you have made");
      $("#e256_params").hide(); $("#midi_term").collapse("show"); $("#upload_section").hide(); $("#synth_profile_section").hide();
      item_menu_params(current_controller, "hide"); item_menu_params(current_touch, "hide");
      $("#EDIT").removeClass("active"); $("#THROUGH").removeClass("active"); $("#PLAY").addClass("active");
      e256_blobs.clear(); midi_term_in.clear(); midi_term_out.clear();
      set_all_touch_visuals_visible(false);
      e256_current_mode = MODE.PLAY;
      alert_msg("MODE: PLAY", "success");
      break;
    case MODE_ACK.PENDING:
      break;
    case MODE_ACK.SYNC:
      send_sysex_cmd(MODE.MATRIX_RAW);
      if (DEBUG) console.log("REQUEST: MATRIX_RAW");
      break;
    case MODE_ACK.CALIBRATE:
      e256_blobs.clear(); e256_current_mode = e256_previous_mode;
      $("#CALIBRATE").removeClass("active");
      alert_msg("MODE: CALIBRATE", "success");
      break;
    case MODE_ACK.LOAD_CONFIG:
      e256_current_mode = MODE.FETCH_CONFIG;
      send_sysex_cmd(MODE.FETCH_CONFIG);
      if (DEBUG) console.log("REQUEST: FETCH_CONFIG");
      break;
    case MODE_ACK.FETCH_CONFIG:
      $("#fetch_config").removeClass("active");
      if (current_controller) {
        $("#" + current_controller.name).removeClass("active");
        previous_controller = current_controller; current_controller = null;
      }
      if (fetch_config_file !== null && fetch_config_file.length !== 15) {
        load_mappings_from_config(fetch_config_file);
      } else {
        alert_msg("NO CONFIG FILE LOADED IN THE E256 FLASH MEMORY!", "danger");
      }
      send_sysex_cmd(MODE.EDIT);
      if (DEBUG) console.log("REQUEST: EDIT MODE");
      break;
    case MODE_ACK.ALLOCATE_CONFIG:
      e256_export_params();
      sysex_alloc(conf_size);
      alert_msg("ALLOCATE_CONFIG_SIZE: " + conf_size, "success");
      break;
    case MODE_ACK.ALLOCATE_DONE:
      send_sysex_cmd(MODE.UPLOAD_CONFIG);
      if (DEBUG) console.log("REQUEST: UPLOAD CONFIG");
      break;
    case MODE_ACK.UPLOAD_CONFIG:
      sysex_upload(string_to_bytes(JSON.stringify(e256_config)));
      if (DEBUG) console.log("UPLOADING_CONFIG: " + JSON.stringify(e256_config));
      break;
    case MODE_ACK.UPLOAD_DONE:
      send_sysex_cmd(MODE.APPLY_CONFIG);
      if (DEBUG) console.log("REQUEST: APPLY CONFIG");
      break;
    case MODE_ACK.APPLY_CONFIG:
      $("#upload_config").removeClass("active");
      alert_msg("RECEIVED: CONFIG_APPLY", "success");
      alert_msg("PRESS THE ETEXTILE-SYNTHESIZER LEFT PUSH BUTTON TO SAVE THE CONFIG IN THE FLASH MEMORY!", "warning");
      send_sysex_cmd(MODE.EDIT);
      if (DEBUG) console.log("REQUEST: EDIT MODE");
      break;
    case MODE_ACK.WRITE_CONFIG:
      alert_msg("NOW THE ETEXTILE-SYNTHESIZER CAN BE USED IN STANDALONE MODE!", "success");
      break;
    default:
      if (DEBUG) console.log("NOT_HANDLED_ACK: " + MODE_ACK_CODES[ack]);
      break;
  }
};

function handle_sysex_param(param_id, value) {
  switch (param_id) {
    case SYSEX_PARAM.THRESHOLD: {
      const slider  = document.getElementById("threshold_slider");
      const display = document.getElementById("threshold_display");
      if (slider)  slider.value = value;
      if (display) display.textContent = value;
      if (typeof set_threshold_plane === "function") set_threshold_plane(value);
      break;
    }
    default:
      if (DEBUG) console.log("SYSEX_PARAM_NOT_HANDLED: " + param_id);
      break;
  }
};

// Cache of items that expose midi_play_update(). Built lazily on first PLAY message,
// invalidated (set to null) whenever items are added or removed from the canvas.
let _midi_play_items = null;

function invalidate_midi_play_cache() {
  _midi_play_items = null;
}

// Dispatch an incoming MIDI message to all canvas items that expose midi_play_update().
// Called in PLAY mode so each mapping can move its touch(es) from firmware data.
function midi_play_update_all(msg) {
  if (_midi_play_items === null) {
    _midi_play_items = [];
    for (const layer of paper.project.layers) {
      for (const item of layer.children) {
        if (typeof item.midi_play_update === "function") _midi_play_items.push(item);
      }
    }
  }
  for (const item of _midi_play_items) {
    item.midi_play_update(msg);
  }
}

function midi_play_blob_update_all(blob_data) {
  if (_midi_play_items === null) {
    _midi_play_items = [];
    for (const layer of paper.project.layers) {
      for (const item of layer.children) {
        if (typeof item.midi_play_update === "function") _midi_play_items.push(item);
      }
    }
  }
  for (const item of _midi_play_items) {
    if (typeof item.midi_play_blob_update === "function") item.midi_play_blob_update(blob_data);
  }
}

// Send a control SysEx packet:  F0  DEVICE_ID  PKT_TYPE  byte  [extra...]  F7
function send_sysex_cmd(cmd) {
  if (midi_device_connected) {
    midi_output.send([MIDI_SYSEX.START, MIDI_SYSEX.DEVICE_ID, SYSEX_PKT.CMD, cmd, MIDI_SYSEX.END]);
  } else {
    alert_msg("ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
  }
};

function send_midi_msg(msg) {
  if (midi_device_connected) {
    if (msg.data2 === null) {
      midi_output.send([msg.status, msg.data1]);
    }
    else {
      midi_output.send([msg.status, msg.data1, msg.data2]);
    }
    midi_term_out.push(msg);
    if (e256_current_mode === MODE.THROUGH) midi_term_in.push(msg);
  }
  else {
    alert_msg("ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
  }
};

// Send data via MIDI system exclusive message
// Send: [ SystemExclusive, SysexDeviceId, SYSEX_IDENTIFIER, SYSEX_SIZE_MSB, SYSEX_SIZE_LSB, SysexEnd ] 
// Receive: MODE_ACK.USBMIDI_CONFIG_ALLOC
// Send: [ SystemExclusive, SysexDeviceId, SYSEX_DATA, SysexEnd ]
// Receive: MODE_ACK.USBMIDI_CONFIG_LOAD

function sysex_alloc(conf_size) {
  if (conf_size < FLASH_SIZE) {
    if (DEBUG) console.log("CONF_SIZE: " + conf_size);
    let size_lsb = conf_size & 0x7F; // 0x7F Mask -> 0111 1111
    let size_msb = (conf_size >> 7) & 0x7F; // 0x7F Mask -> 0111 1111
    let header = [MIDI_SYSEX.START, MIDI_SYSEX.DEVICE_ID];
    let msg = header.concat(size_msb).concat(size_lsb).concat(MIDI_SYSEX.END);
    midi_output.send(msg);
  } else {
    alert("FILE TO BIG!");
  }
};

function sysex_upload(data) {
  let header = [MIDI_SYSEX.START, MIDI_SYSEX.DEVICE_ID];
  let msg = header.concat(data).concat(MIDI_SYSEX.END);
  midi_output.send(msg);
};

/*
function e256_alocate_memory() {
  switch (loaded_file.type) {
    case "application/json":
        sysex_alloc(SysexConf, conf_size);
      break;
    case "application/wav":
      //sysex_alloc(SysexSound, sound.length); // TODO
      break;
    default:
      alert("MISSING FILE!");
      break;
  }
};
*/

$(document).ready(
  function () {
    $("#loading_canvas").collapse("show");
    MIDIsetup();
  }
);

function string_to_bytes(str) {
  return Array.from(new TextEncoder().encode(str));
};

function midi_msg_as_txt(msg) {
  let key_msg_txt = null;
  let status = midi_msg_status_unpack(msg.midi.status);

  switch (status.type) {
    case MIDI_TYPE.NOTE_ON:
      key_msg_txt =
      MIDI_BY_NAME[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "note: " + msg.midi.data1 + "\n" +
      "velo: " + msg.midi.data2 + "\n";
      break;
    case MIDI_TYPE.CONTROL_CHANGE:
      key_msg_txt =
      MIDI_BY_NAME[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "ctr: " + msg.midi.data1 + "\n" +
      "val: " + msg.midi.data2 + "\n";
      break;
    case MIDI_TYPE.AFTERTOUCH_POLY:
      key_msg_txt =
      MIDI_BY_NAME[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "note: " + msg.midi.data1 + "\n" +
      "ctr: " + msg.midi.data2 + "\n";
      break;
  }
  return key_msg_txt;
};
