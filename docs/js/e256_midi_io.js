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
  let status = midi_msg_status_pack(chan, MIDI.NOTE_ON);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  };
};

function note_off(chan, note, velo) {
  let status = midi_msg_status_pack(chan, MIDI.NOTE_OFF);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  }
};

function control_change(chan, ctr, val) {
  let status = midi_msg_status_pack(chan, MIDI.CONTROL_CHANGE);
  return {
    "status": status,
    "data1": ctr,
    "data2": val
  }
};

function polyphonic_aftertouch(chan, note, press) {
  let status = midi_msg_status_pack(chan, MIDI.AFTERTOUCH_POLY);
  return {
    "status": status,
    "data1": note,
    "data2": press
  }
};

function program_change(chan, pgm) {
  let status = midi_msg_status_pack(chan, MIDI.PROGRAM_CHANGE);
  return {
    "status": status,
    "data1": pgm,
    "data2": null
  }
};

function pitch_bend(chan, pitch) {
  let status = midi_msg_status_pack(chan, MIDI.PITCH_BEND);
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
//    -> MIDI.NOTE_OFF - N/A
//    -> MIDI.NOTE_ON
//    -> MIDI.AFTERTOUCH_POLY
//    -> MIDI.CONTROL_CHANGE
//    PROGRAM_CHANGE
//    C_AFTERTOUCH
//    PITCH_BEND

function midi_msg_builder(midi_msg_type) {
  let msg = {};

  switch (midi_msg_type) {

    case MIDI.NOTE_ON:
      msg.midi = new note_on(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        DEFAULT_MIDI_VELOCITY
      )
      break;

    case MIDI.CONTROL_CHANGE:
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

    case MIDI.AFTERTOUCH_POLY:
      msg.midi = new polyphonic_aftertouch(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        default_midi_index.next().value
      );
      msg.limit = new limit(
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      );
      break;

    case MIDI.PITCH_BEND:
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
    if (permissionStatus.state === "prompt" || permissionStatus.state === "granted") {
      navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess);
    }
    if (permissionStatus.state === "denied") {
      alert_msg("no_midi_support", "This browser does not support MIDI!", "danger");
    }
  });
};

function onMIDISuccess(midiAccess) {
  let inputSetup = false;
  let output_setup = false;
  
  midiAccess.onstatechange = function (msg) {
    switch (msg.port.state) {
      case "connected":
        for (let input of midiAccess.inputs.values()) {
          if (input.name === "ETEXTILE_SYNTH MIDI 1") {
            midi_input = input;
            inputSetup = true;
          }
        }
        for (let output of midiAccess.outputs.values()) {
          if (output.name === "ETEXTILE_SYNTH MIDI 1") {
            midi_output = output;
            output_setup = true;
          }
        }
        if (inputSetup && output_setup && !midi_device_connected) {
          midi_device_connected = true;
          midi_input.onmidimessage = on_midi_message;
          if (DEBUG) console.log("MIDI_IN: " + midi_input.name);
          if (DEBUG) console.log("MIDI_OUT: " + midi_output.name);
          setTimeout(function () {
            send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.SYNC));
            if (DEBUG) console.log("REQUEST: SYNC");
          }, 1000);
        }
        break;
      case "disconnected":
        midi_input = null;
        midi_output = null;
        inputSetup = false;
        output_setup = false;
        midi_device_connected = false;
        //e256_current_mode = MODE.PENDING;
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
    $("#e256_params").collapse("hide");
    $("#set_button_params").collapse("hide");
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

  let status = midi_msg_status_unpack(midi_msg.data[0]);
  switch (status.type) {
    case MIDI.PROGRAM_CHANGE:
      switch (status.channel) {
        case MIDI_VERBOSITY_CHANNEL:
          console.log("RECEIVED: " + MODE_ACK_CODES[msg.data1]);
          switch (msg.data1) {
  
            case MODE_ACK.MATRIX_RAW:
              $("#set_button_params").collapse("hide");
              updateMenu();
              e256_current_mode = MODE.MATRIX_RAW;
              $("#connection_status").html("CONNECTED / MATRIX_MODE");
              alert_msg("matrix_mode", "MATRIX MODE DONE", "success");
              break;

            case MODE_ACK.MAPPING:
              $("#calibrate_menu").collapse("show");
              $("#matrix_menu").collapse("hide");
              $("#mapping_menu").collapse("show");
              $("#loading_canvas").collapse("hide");
              $("#matrix_canvas").collapse("hide");
              $("#mapping_canvas").collapse("show");
              $("#set_button_params").collapse("hide");
              $("#connection_status").html("CONNECTED / MAPPING");
              $("#mode_explanation").html("Define your custom MIDI interface onto the eTextile device");
              $("#MATRIX_RAW").removeClass("active");
              $("#MAPPING").addClass("active");
              e256_current_mode = MODE.MAPPING;
              alert_msg("mapping_mode", "MAPPING MODE DONE", "success");
              break;

            case MODE_ACK.EDIT:
              $("#edit_menu").collapse("show");
              $("#load_menu").collapse("show");
              $("#set_button_params").collapse("show");
              $("#connection_status").html("CONNECTED / EDIT");
              $("#mode_explanation").html("Add tactile commands to the eTextile device");
              $("#midi_term").collapse("hide");
              item_menu_params(current_controleur, "show");
              item_menu_params(current_touch, "show");
              $("#PLAY").removeClass("active");
              $("#THROUGH").removeClass("active");
              $("#EDIT").addClass("active");
              e256_current_mode = MODE.EDIT;
              alert_msg("edit_mode", "EDIT MODE DONE", "success");
              break;

            case MODE_ACK.THROUGH:
              $("#calibrate_menu").collapse("show");
              $("#matrix_menu").collapse("hide");
              $("#mapping_menu").collapse("show");
              $("#loading_canvas").collapse("hide");
              $("#matrix_canvas").collapse("hide");
              $("#mapping_canvas").collapse("show");
              $("#edit_menu").collapse("hide");
              $("#load_menu").collapse("hide");
              $("#set_button_params").collapse("hide");
              $("#connection_status").html("CONNECTED / THROUGH");
              $("#mode_explanation").html("Send Midi msg to the external synth");
              $("#midi_term").collapse("show");
              item_menu_params(current_controleur, "hide");
              item_menu_params(current_touch, "hide");
              $("#EDIT").removeClass("active");
              $("#THROUGH").addClass("active");
              $("#PLAY").removeClass("active");
              e256_current_mode = MODE.THROUGH;
              alert_msg("through_mode", "THROUGH MODE DONE", "success");
              break;

            case MODE_ACK.PLAY:
              $("#calibrate_menu").collapse("show");
              $("#matrix_menu").collapse("hide");
              $("#mapping_menu").collapse("show");
              $("#loading_canvas").collapse("hide");
              $("#matrix_canvas").collapse("hide");
              $("#mapping_canvas").collapse("show");
              $("#edit_menu").collapse("hide");
              $("#load_menu").collapse("hide");
              $("#set_button_params").collapse("hide");
              $("#connection_status").html("CONNECTED / PLAY");
              $("#mode_explanation").html("Evaluate what you have made");
              $("#midi_term").collapse("show");
              item_menu_params(current_controleur, "hide");
              item_menu_params(current_touch, "hide");
              $("#EDIT").removeClass("active");
              $("#THROUGH").removeClass("active");
              $("#PLAY").addClass("active");
              e256_current_mode = MODE.PLAY;
              alert_msg("play_mode", "PLAY MODE DONE", "success");
              break;
  
            case MODE_ACK.PENDING:
              //send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.SYNC));
              //if (DEBUG) console.log("REQUEST: SYNC");
              break;
  
            case MODE_ACK.SYNC:
              updateMenu();
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.MATRIX_RAW));
              if (DEBUG) console.log("REQUEST: MATRIX_RAW");
              break;

            case MODE_ACK.CALIBRATE:
              e256_current_mode = e256_previous_mode;
              alert_msg("calibrate_mode", "CALIBRATE MODE DONE", "success");
              break;

            case MODE_ACK.LOAD_CONFIG:
              e256_current_mode = MODE.FETCH_CONFIG;
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.FETCH_CONFIG));
              if (DEBUG) console.log("REQUEST: FETCH_CONFIG");
              break;

            case MODE_ACK.FETCH_CONFIG:
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
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.EDIT));
              if (DEBUG) console.log("REQUEST: EDIT MODE");
              break;

            case MODE_ACK.ALLOCATE_CONFIG:
              e256_export_params();
              sysex_alloc(conf_size);
              alert_msg("allocate_done", "ALLOCATE_CONFIG_SIZE: " + conf_size, "success");
              break;

            case MODE_ACK.ALLOCATE_DONE:
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.UPLOAD_CONFIG));
              if (DEBUG) console.log("REQUEST: UPLOAD CONFIG");
              break;

            case MODE_ACK.UPLOAD_CONFIG:
              sysex_upload(string_to_bytes(JSON.stringify(e256_config)));
              if (DEBUG) console.log("UPLOADING_CONFIG: " + JSON.stringify(e256_config));
              break;

            case MODE_ACK.UPLOAD_DONE:
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.APPLY_CONFIG));
              if (DEBUG) console.log("REQUEST: APPLY CONFIG");
              break;
            
            case MODE_ACK.APPLY_CONFIG:
              alert_msg("config_apply", "RECEIVED: CONFIG_APPLY", "success");
              alert_msg("config_save", "PRESS THE ETEXTILE-SYNTHESIZER LEFT PUSH BUTTON TO SAVE THE CONFIG IN THE FLASH MEMORY!", "warning");
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, MODE.EDIT));
              if (DEBUG) console.log("REQUEST: EDIT MODE");
              break;

            case MODE_ACK.WRITE_CONFIG:
              alert_msg("config_saved", "NOW THE ETEXTILE-SYNTHESIZER CAN BE USED IN STANDALONE MODE!", "success");
              break;
            
            default:
              if (DEBUG) console.log("NOT_HANDLED_MODE: " + MODE_ACK_CODES[msg.data1]);
              break;
          }
          break;

        case MIDI_ERROR_CHANNEL:
          alert_msg("config_saved", "ERROR: " + ERROR_CODES[msg.data1], "danger");
          break;
      }
      break;

    case MIDI_SYSEX.START:
      switch (e256_current_mode) {
        case MODE.FETCH_CONFIG:
          const decoder = new TextDecoder();
          let conf_str = decoder.decode(midi_msg.data); // Change with msg!?
          fetch_config_file = conf_str.slice(1, -1);
          alert_msg("fetch_config", "FETCH CONFIG DONE", "success");
          break;
        case MODE.MATRIX_RAW:
          e256_matrix.update(midi_msg.data); // Change with msg!?
          break;
        case MODE.EDIT:
          e256_blobs.update(midi_msg.data); // Change with msg!?
          break;
        case MODE.THROUGH:
          // N/A
          break;
        case MODE.PLAY:
          // N/A
          break;
        default:
          alert_msg("wrong_sysex", "SYSEX_TYPE_NOT_HANDLED: " +  MODE_CODES[e256_current_mode], "warning");
          break;
      }
      break;

    default:
      midi_term.push(msg);
      // TODO: update the mappings controleurs using the input MIDI values
      break;
  }
};

function send_midi_msg(midi_msg) {
  
  if (midi_device_connected) {
    if (midi_msg.data2 === null) {
      midi_output.send([midi_msg.status, midi_msg.data1]);
    }
    else {
      midi_output.send([midi_msg.status, midi_msg.data1, midi_msg.data2]);
    }
    midi_term.push(midi_msg);
  }
  else {
    alert_msg("not_connected", "ETEXTILE-SYNTHESIZER IS NOT CONNECTED!", "danger");
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
    let midi_msg = header.concat(size_msb).concat(size_lsb).concat(MIDI_SYSEX.END);
    midi_output.send(midi_msg);
  } else {
    alert("FILE TO BIG!");
  }
};

function sysex_upload(data) {
  let header = [MIDI_SYSEX.START, MIDI_SYSEX.DEVICE_ID];
  let midi_msg = header.concat(data).concat(MIDI_SYSEX.END);
  midi_output.send(midi_msg);
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
    case MIDI.NOTE_ON:
      key_msg_txt =
      MIDI_BY_NAME[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "note: " + midi_msg.midi.data1 + "\n" +
      "velo: " + midi_msg.midi.data2 + "\n";
      break;
    case MIDI.CONTROL_CHANGE:
      key_msg_txt =
      MIDI_BY_NAME[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "ctr: " + midi_msg.midi.data1 + "\n" +
      "val: " + midi_msg.midi.data2 + "\n";
      break;
    case MIDI.AFTERTOUCH_POLY:
      key_msg_txt =
      MIDI_BY_NAME[status.type] + "\n" +
      "chan: " + status.channel + "\n" +
      "note: " + midi_msg.midi.data1 + "\n" +
      "ctr: " + midi_msg.midi.data2 + "\n";
      break;
  }
  return key_msg_txt;
};
