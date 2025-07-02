/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var MIDI_input = null;
var MIDI_output = null;

var midi_device_connected = false;
var loaded_file = null; // From user desktop
var fetch_config_file = null; // From e256 flash memory

const DEFAULT_MIDI_CHANNEL = 1;    // [1:16]
const DEFAULT_MIDI_NOTE = 64;      // [0:127]
const DEFAULT_MIDI_VELOCITY = 127; // [0:127]
const DEFAULT_MIDI_VALUE = 0;      // [0:127]
const DEFAULT_MIDI_CC = 23;        //
const DEFAULT_MIDI_AFT = 24;       //
const DEFAULT_MIDI_PGM = 10;       //
const DEFAULT_MIDI_MIN = 0;        // [0:127]
const DEFAULT_MIDI_MAX = 127;      // [0:127]

const BLOB_FREE = 0;
const BLOB_NEW = 1;
const BLOB_PRESENT = 2;
const BLOB_MISSING = 3;
const BLOB_RELEASED = 4;

function* midi_index() {
  let index = 1;
  while (true) {
    index = index++;
    index = index % 128;
    yield index++;
  }
};

const default_midi_index = midi_index();

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
  let status = midi_msg_status_pack(chan, NOTE_ON);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  };
};

function note_off(chan, note, velo) {
  let status = midi_msg_status_pack(chan, NOTE_OFF);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  }
};

function control_change(chan, ctr, val) {
  let status = midi_msg_status_pack(chan, C_CHANGE);
  return {
    "status": status,
    "data1": ctr,
    "data2": val
  }
};

function polyphonic_aftertouch(chan, note, press) {
  let status = midi_msg_status_pack(chan, AFTERTOUCH_POLY);
  return {
    "status": status,
    "data1": note,
    "data2": press
  }
};

function program_change(chan, pgm) {
  let status = midi_msg_status_pack(chan, P_CHANGE);
  return {
    "status": status,
    "data1": pgm,
    "data2": null
  }
};

function pitch_bend(chan, pitch) {
  let status = midi_msg_status_pack(chan, PITCH_BEND);
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
// NOTE_OFF
// -> NOTE_ON
// AFTERTOUCH_POLY
// -> C_CHANGE
// P_CHANGE
// C_AFTERTOUCH
// -> P_BEND
// SYS_EX

function midi_msg_builder(midi_msg_type) {
  let msg = {};

  switch (midi_msg_type) {

    case NOTE_ON:
      msg.midi = new note_on(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        DEFAULT_MIDI_VELOCITY
      )
      break;

    case C_CHANGE:
      msg.midi = new control_change(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        DEFAULT_MIDI_VELOCITY
      )
      msg.limit = new limit(
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      )
      break;

    case AFTERTOUCH_POLY:
      msg.midi = new polyphonic_aftertouch(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        DEFAULT_MIDI_VELOCITY
      );
      msg.limit = new limit(
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      );
      break;

    case PITCH_BEND:
      msg.midi = new pitch_bend(
        DEFAULT_MIDI_CHANNEL,
        DEFAULT_MIDI_VELOCITY
      )
      msg.limit = new limit(
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      );
      break;
    default:
      break;
  };
  return msg;
};

async function MIDIsetup() {
  navigator.permissions.query({name: "midi"}).then((permissionStatus) => {
    if (permissionStatus.state === "granted") {
      navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess);
    }
    if (permissionStatus.state === "prompt") {
      alert_msg("no_midi_support", "This browser does not support MIDI!", "danger");
    }
  });
};

function onMIDISuccess(midiAccess) {
  let inputSetup = false;
  let outputSetup = false;
  
  midiAccess.onstatechange = function (msg) {
    switch (msg.port.state) {
      case "connected":
        for (let input of midiAccess.inputs.values()) {
          if (input.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDI_input = input;
            inputSetup = true;
          }
        }
        for (let output of midiAccess.outputs.values()) {
          if (output.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDI_output = output;
            outputSetup = true;
          }
        }
        if (inputSetup && outputSetup && !midi_device_connected) {
          midi_device_connected = true;
          MIDI_input.onmidimessage = onMIDIMessage;
          if (DEBUG) console.log("MIDI_IN: " + MIDI_input.name);
          if (DEBUG) console.log("MIDI_OUT: " + MIDI_output.name);
          setTimeout(function () {
            send_midi_msg(new program_change(MIDI_MODES_CHANNEL, SYNC_MODE));
            if (DEBUG) console.log("REQUEST: SYNC_MODE");
          }, 1000);
        }
        break;
      case "disconnected":
        MIDI_input = null;
        MIDI_output = null;
        inputSetup = false;
        outputSetup = false;
        midi_device_connected = false;
        //e256_current_mode = PENDING_MODE;
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
    $("#MATRIX_RAW_MODE").addClass("active");
    $("#MAPPING_MODE").removeClass("active");
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
    $("#e256_params").collapse("hide");
    $("#set_button_params").collapse("hide");
    $("#MAPPING_MODE").removeClass("active");
    $("#MATRIX_RAW_MODE").removeClass("active");
  }
};

// RAW MIDI MESSAGES (MIDI 1.0)
function onMIDIMessage(midiMsg) {
  let msg = {};
  msg.status = midiMsg.data[0];
  msg.data1 = midiMsg.data[1];
  msg.data2 = midiMsg.data[2];

  let status = midi_msg_status_unpack(midiMsg.data[0]);
  switch (status.type) {
    case P_CHANGE:
      switch (status.channel) {
        case MIDI_VERBOSITY_CHANNEL:
          //console.log("RECEIVED: " + VERBOSITY_CODES[msg.data1]);
          switch (msg.data1) {
  
            case MATRIX_RAW_MODE_DONE:
              $("#set_button_params").collapse("hide");
              updateMenu();
              e256_current_mode = MATRIX_RAW_MODE;
              $("#connection_status").html("CONNECTED / MATRIX_MODE");
              alert_msg("matrix_mode", "MATRIX MODE DONE", "success");
              break;

            case MAPPING_MODE_DONE:
              $("#calibrate_menu").collapse("show");
              $("#matrix_menu").collapse("hide");
              $("#mapping_menu").collapse("show");
              $("#loading_canvas").collapse("hide");
              $("#matrix_canvas").collapse("hide");
              $("#mapping_canvas").collapse("show");
              $("#set_button_params").collapse("hide");
              $("#connection_status").html("CONNECTED / MAPPING_MODE");
              $("#mode_explanation").html("Define your custom MIDI interface onto the eTextile device");
              $("#MATRIX_RAW_MODE").removeClass("active");
              $("#MAPPING_MODE").addClass("active");
              e256_current_mode = MAPPING_MODE;
              alert_msg("mapping_mode", "MAPPING MODE DONE", "success");
              break;

            case EDIT_MODE_DONE:
              $("#edit_menu").collapse("show");
              $("#load_menu").collapse("show");
              $("#set_button_params").collapse("show");
              $("#connection_status").html("CONNECTED / EDIT_MODE");
              $("#mode_explanation").html("Add tactile commands to the eTextile device");
              $("#midi_term").collapse("hide");
              item_menu_params(current_controleur, "show");
              item_menu_params(current_touch, "show");
              $("#PLAY_MODE").removeClass("active");
              $("#THROUGH_MODE").removeClass("active");
              $("#EDIT_MODE").addClass("active");
              e256_current_mode = EDIT_MODE;
              alert_msg("edit_mode", "EDIT MODE DONE", "success");
              break;

            case THROUGH_MODE_DONE:
              $("#calibrate_menu").collapse("show");
              $("#matrix_menu").collapse("hide");
              $("#mapping_menu").collapse("show");
              $("#loading_canvas").collapse("hide");
              $("#matrix_canvas").collapse("hide");
              $("#mapping_canvas").collapse("show");
              $("#edit_menu").collapse("hide");
              $("#load_menu").collapse("hide");
              $("#set_button_params").collapse("hide");
              $("#connection_status").html("CONNECTED / THROUGH_MODE");
              $("#mode_explanation").html("Send Midi msg to the external synth");
              $("#midi_term").collapse("show");
              item_menu_params(current_controleur, "hide");
              item_menu_params(current_touch, "hide");
              $("#EDIT_MODE").removeClass("active");
              $("#THROUGH_MODE").addClass("active");
              $("#PLAY_MODE").removeClass("active");
              e256_current_mode = THROUGH_MODE;
              alert_msg("through_mode", "THROUGH MODE DONE", "success");
              break;

            case PLAY_MODE_DONE:
              $("#calibrate_menu").collapse("show");
              $("#matrix_menu").collapse("hide");
              $("#mapping_menu").collapse("show");
              $("#loading_canvas").collapse("hide");
              $("#matrix_canvas").collapse("hide");
              $("#mapping_canvas").collapse("show");
              $("#edit_menu").collapse("hide");
              $("#load_menu").collapse("hide");
              $("#set_button_params").collapse("hide");
              $("#connection_status").html("CONNECTED / PLAY_MODE");
              $("#mode_explanation").html("Evaluate what you have made");
              $("#midi_term").collapse("show");
              item_menu_params(current_controleur, "hide");
              item_menu_params(current_touch, "hide");
              $("#EDIT_MODE").removeClass("active");
              $("#THROUGH_MODE").removeClass("active");
              $("#PLAY_MODE").addClass("active");
              e256_current_mode = PLAY_MODE;
              alert_msg("play_mode", "PLAY MODE DONE", "success");
              break;
  
            case PENDING_MODE_DONE:
              //send_midi_msg(new program_change(MIDI_MODES_CHANNEL, SYNC_MODE));
              //if (DEBUG) console.log("REQUEST: SYNC_MODE");
              break;
  
            case SYNC_MODE_DONE:
              updateMenu();
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MATRIX_RAW_MODE));
              if (DEBUG) console.log("REQUEST: MATRIX_RAW_MODE");
              break;

            case CALIBRATE_MODE_DONE:
              e256_current_mode = e256_previous_mode;
              alert_msg("calibrate_mode", "CALIBRATE MODE DONE", "success");
              break;

            case LOAD_MODE_DONE:
              e256_current_mode = FETCH_MODE;
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, FETCH_MODE));
              if (DEBUG) console.log("REQUEST: FETCH_MODE");
              break;

            case FETCH_MODE_DONE:
              if (current_controleur) {
                $("#" + current_controleur.name).removeClass("active");
                previous_controleur = current_controleur;
                current_controleur = null;
              }
              
              if (fetch_config_file.length != 15) {
                draw_controlers_from_config(fetch_config_file);
              }
              else {
                alert_msg("no_config_file", "NO CONFIG FILE LOADED IN THE E256 FLASH MEMORY!", "danger");
              }
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, EDIT_MODE));
              if (DEBUG) console.log("REQUEST: EDIT_MODE");
              break;

            case ALLOCATE_MODE_DONE:
              e256_export_params();
              sysex_alloc(conf_size);
              alert_msg("allocate_done", "ALLOCATE_CONFIG_SIZE: " + conf_size, "success");
              break;

            case ALLOCATE_DONE:
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, UPLOAD_MODE));
              if (DEBUG) console.log("REQUEST: UPLOAD_MODE");
              break;

            case UPLOAD_MODE_DONE:
              sysex_upload(string_to_bytes(JSON.stringify(e256_config)));
              if (DEBUG) console.log("UPLOAD_CONFIG: " + JSON.stringify(e256_config));
              break;

            case UPLOAD_DONE:
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, APPLY_MODE));
              if (DEBUG) console.log("REQUEST: APPLY_MODE");
              break;
            
            case CONFIG_APPLY_DONE:
              alert_msg("config_apply", "RECEIVED: CONFIG_APPLY_DONE", "success");
              alert_msg("config_save", "PRESS THE ETEXTILE-SYNTHESIZER LEFT PUSH BUTTON TO SAVE THE CONFIG IN THE FLASH MEMORY!", "warning");
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, EDIT_MODE));
              if (DEBUG) console.log("REQUEST: EDIT_MODE");
              break;

            case WRITE_MODE_DONE:
              alert_msg("config_saved", "NOW THE ETEXTILE-SYNTHESIZER CAN BE USED IN STANDALONE MODE!", "success");
              break;
            
            default:
              if (DEBUG) console.log("NOT_HANDLED_MODE: " + VERBOSITY_CODES[msg.data1]);
              break;
          }
          break;

        case MIDI_ERROR_CHANNEL:
          alert_msg("config_saved", "ERROR: " + ERROR_CODES[msg.data1], "danger");
          break;
      }
      break;

    case SYS_EX:
      switch (e256_current_mode) {
        case FETCH_MODE:
          const decoder = new TextDecoder();
          let conf_str = decoder.decode(midiMsg.data);
          fetch_config_file = conf_str.slice(1, -1);
          alert_msg("fetch_config", "FETCH CONFIG DONE", "success");
          break;
        case MATRIX_RAW_MODE:
          e256_matrix.update(midiMsg.data);
          break;
        case EDIT_MODE:
          e256_blobs.update(midiMsg.data);
          break;
        case THROUGH_MODE:
          // N/A
          break;
        case PLAY_MODE:
          // N/A
          break;
        default:
          alert_msg("wrong_sysex", "SYSEX_TYPE_NOT_HANDLED: " +  MODE_CODES[e256_current_mode], "warning");
          break;
      }
      break;

    default:
      // TODO: update the mappings controleurs using the input MIDI values
      alert_msg("wrong_sysex", "MIDI_TYPE_NOT_HANDLED: " +  JSON.stringify(msg), "danger");
      break;
  }
};

function send_midi_msg(midiMsg) {
  
  if (midi_device_connected) {
    if (midiMsg.data2 === null) {
      MIDI_output.send([midiMsg.status, midiMsg.data1]);
    }
    else {
      MIDI_output.send([midiMsg.status, midiMsg.data1, midiMsg.data2]);
    }
    midi_term.push(midiMsg);
  }
  else {
    alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
  }
};

// Send data via MIDI system exclusive message
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_IDENTIFIER, SYSEX_SIZE_MSB, SYSEX_SIZE_LSB, SYSEX_END ] 
// Receive: USBMIDI_CONFIG_ALLOC_DONE
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_DATA, SYSEX_END ]
// Receive: USBMIDI_CONFIG_LOAD_DONE

function sysex_alloc(conf_size) {
  if (conf_size < FLASH_SIZE) {
    if (DEBUG) console.log("CONF_SIZE: " + conf_size);
    let size_lsb = conf_size & 0x7F; // 0x7F Mask -> 0111 1111
    let size_msb = (conf_size >> 7) & 0x7F; // 0x7F Mask -> 0111 1111
    let header = [SYSEX_BEGIN, SYSEX_DEVICE_ID];
    let midiMsg = header.concat(size_msb).concat(size_lsb).concat(SYSEX_END);
    MIDI_output.send(midiMsg);
  } else {
    alert("FILE TO BIG!");
  }
};

function sysex_upload(data) {
  let header = [SYSEX_BEGIN, SYSEX_DEVICE_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDI_output.send(midiMsg);
};

/*
function e256_alocate_memory() {
  switch (loaded_file.type) {
    case "application/json":
        sysex_alloc(SYSEX_CONF, conf_size);
      break;
    case "application/wav":
      //sysex_alloc(SYSEX_SOUND, sound.length); // TODO
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
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    bytes.push(char);
  }
  return bytes;
};

function midi_msg_as_txt(midi_msg) {
  let key_msg_txt = null;
  let status = midi_msg_status_unpack(midi_msg.midi.status);

  switch (status.type) {
    case NOTE_ON:
      key_msg_txt =
      "type: " + MIDI_TYPES[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "note: " + midi_msg.midi.data1 + "\n" +
      "velo: " + midi_msg.midi.data2 + "\n";
      break;
    case C_CHANGE:
      key_msg_txt =
      "type: " + MIDI_TYPES[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "cc: " + midi_msg.midi.data1 + "\n" +
      "val: " + midi_msg.midi.data2 + "\n";
      break;
    case AFTERTOUCH_POLY:
      key_msg_txt =
      "type: " + MIDI_TYPES[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "note: " + midi_msg.midi.data1 + "\n" +
      "press: " + midi_msg.midi.data2 + "\n";
      break;
  }
  return key_msg_txt;
};
