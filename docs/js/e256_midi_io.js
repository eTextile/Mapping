/*
  **Mapping-app V0.1**
  This file is part of the e256 project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;
// E256 MODES CONSTANTS (MIDI_CHANNEL 1)
const STANDALONE_MODE = 0; // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const MATRIX_MODE_RAW = 1; // Get matrix analog sensor values (16x16) over USB using MIDI format
const MATRIX_MODE_INTERP = 2; // Get matrix analog sensor values (16x16) over USB using MIDI format
const EDIT_MODE = 3; // Get all blobs values over USB using MIDI format
const PLAY_MODE = 4; // Get mappings values over USB using MIDI format
const GET_CONFIG = 5; // TODO: Fetch the e256 CONFIG file
// STATES CONSTANTS (MIDI_CHANNEL 2)
const CALIBRATE = 0;
const DONE_ACTION = 2;
const ERROR = 3;
// LEVELS CONSTANTS
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |
// MIDI CONSTANTS
const MIDI_INPUT_CHANNEL = 1; // [1:15] Set the HARDWARE MIDI_INPUT channel
const MIDI_OUTPUT_CHANNEL = 1; // [1:15] Set the HARDWARE MIDI_OUTPUT channel
const NOTE_ON = 0x90; // 
const NOTE_OFF = 0x80; //
const CONTROL_CHANGE = 0xB0; //
const PROGRAM_CHANGE = 0xC0; //
const SYSTEM_EXCLUSIVE = 0xF0; // 240
const SYSEX_BEGIN = 0xF0; // 240
const SYSEX_END = 0xF7; // 247
const SYSEX_ID = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF = 0x7C; // 124
const SYSEX_SOUND = 0x6C; // 108
// VERBOSITY CONSTANTS
const FLASH_CONFIG_ALLOC_DONE = 16;
const FLASH_CONFIG_LOAD_DONE = 17;
const FLASH_CONFIG_WRITE_DONE = 18;
const USBMIDI_CONFIG_ALLOC_DONE = 19;
const USBMIDI_CONFIG_UPLOAD_DONE = 20;
const USBMIDI_SOUND_UPLOAD_DONE = 21;
// ERROR_CODES CONSTANTS
const ERROR_WAITING_FOR_GONFIG = 33;
const ERROR_LOADING_GONFIG_FAILED = 34;
const ERROR_CONNECTING_FLASH = 35;
const ERROR_WHILE_OPEN_FLASH_FILE = 36;
const ERROR_FLASH_FULL = 37;
const ERROR_FILE_TO_BIG = 38;
const ERROR_NO_CONFIG_FILE = 39;
const ERROR_UNKNOWN_SYSEX = 40;

const BI = 0; // [0] Blob UID
const BS = 1; // [1] Blob State
const BL = 2; // [2] Blob Last State
const BX = 3; // [3] Blob X centroid position
const BY = 4; // [4] Blob Y centroid position
const BZ = 5; // [5] Blob Depth
const BW = 6; // [6] Blob width
const BH = 7; // [7] Blob Height

var MIDIInput
var MIDIIoutput;
var connected = false;
var fileType = "";

let config = "";

async function MIDIConnect() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("No MIDI support in your browser!");
    connect.checked = false;
  }
}

function onMIDISuccess(midiAccess) {
  //listInputsAndOutputs(midiAccess);
  for (var entry of midiAccess.inputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      MIDIInput = entry;
      MIDIInput.onmidimessage = onMIDIMessage;
      connected = true;
    }
  }
  for (var entry of midiAccess.outputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      MIDIIoutput = entry;
    }
  }
  if (connected) {
    $("#summaryAction").html("CONNECTED").removeClass("badge-danger").addClass("badge-success");
  } else {
    $("#summaryAction").html("DISCONNECTED").removeClass("badge-success").addClass("badge-danger");
    connect.checked = false;
  }
}

function onMIDIFailure(error) {
  alert("e256 NOT CONNECTED! " + error);
  connect.checked = false;
}

// TODO: need a drop down menu!
function listInputsAndOutputs(midiAccess) {
  for (var entry of midiAccess.inputs) {
    var input = entry[1];
    console.log("Input port [type:'" + input.type + "'] id:'" + input.id +
      "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
      "' version:'" + input.version + "'");
  }
  for (var entry of midiAccess.outputs) {
    var output = entry[1];
    console.log("Output port [type:'" + output.type + "'] id:'" + output.id +
      "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
      "' version:'" + output.version + "'");
  }
}

function onMIDIMessage(midiMsg) {
  //let status = midiMsg.data[0] >> 4;
  let status = midiMsg.data[0];
  switch (status) {
    case NOTE_ON:
      e256_blobs.add(midiMsg.data, onBlobDown);
      break;
    case NOTE_OFF:
      e256_blobs.remove(midiMsg.data, onBlobRelease);
      break;
    case CONTROL_CHANGE:
      //e256_parcer.update(midiMsg.data); // Deprecated
      break;
    case PROGRAM_CHANGE:
      switch (midiMsg.data[1]) {
        // VERBOSITY CONSTANTS
        case FLASH_CONFIG_ALLOC_DONE:
          console.log("e256: FLASH_CONFIG_ALLOC_DONE: " + midiMsg.data[1]);
          break;
        case FLASH_CONFIG_LOAD_DONE:
          console.log("e256: FLASH_CONFIG_LOAD_DONE: " + midiMsg.data[1]);
          break;
        case FLASH_CONFIG_WRITE_DONE:
          console.log("e256: FLASH_CONFIG_WRITE_DONE: " + midiMsg.data[1]);
          break;
        case USBMIDI_CONFIG_ALLOC_DONE:
          console.log("e256: USBMIDI_CONFIG_ALLOC_DONE: " + midiMsg.data[1]);
          sysex_upload(Array.from(JSON.stringify(config)).map(letter => letter.charCodeAt(0)));
          break;
        case USBMIDI_CONFIG_UPLOAD_DONE:
          console.log("e256: USBMIDI_CONFIG_UPLOAD_DONE");
          break;
        case USBMIDI_SOUND_UPLOAD_DONE:
          console.log("e256: USBMIDI_SOUND_UPLOAD_DONE");
          break;
        // ERROR CODES CONSTANTS
        case ERROR_WAITING_FOR_GONFIG:
          alert("e256: ERROR_WAITING_FOR_GONFIG: " + midiMsg.data[1]);
          break;
        case ERROR_LOADING_GONFIG_FAILED:
          alert("e256: ERROR_LOADING_GONFIG_FAILED: " + midiMsg.data[1]);
          break;
        case ERROR_CONNECTING_FLASH:
          alert("e256: ERROR_CONNECTING_FLASH: " + midiMsg.data[1]);
          break;
        case ERROR_WHILE_OPEN_FLASH_FILE:
          alert("e256: ERROR_WHILE_OPEN_FLASH_FILE: " + midiMsg.data[1]);
          break;
        case ERROR_FLASH_FULL:
          alert("e256: ERROR_FLASH_FULL: " + midiMsg.data[1]);
          break;
        case ERROR_FILE_TO_BIG:
          alert("e256: ERROR_FILE_TO_BIG: " + midiMsg.data[1]);
          break;
        case ERROR_NO_CONFIG_FILE:
          alert("e256: ERROR_NO_CONFIG_FILE: " + midiMsg.data[1]);
          break;
        case ERROR_UNKNOWN_SYSEX:
          alert("e256: ERROR_UNKNOWN_SYSEX: " + midiMsg.data[1]);
          break;
        default:
          alert("e256: ERROR_UNKNOW_MIDI_MSSGAGE: " + midiMsg.data[1]);
          break;
      }
      break;
    case SYSTEM_EXCLUSIVE:
      switch (currentMode) {
        case MATRIX_MODE_RAW:
          e256_matrix.update(midiMsg.data);
          break;
        case MATRIX_MODE_INTERP:
          // TODO
          break;
        case PLAY_MODE:
          e256_blobs.update(midiMsg.data, onBlobUpdate);
          break;
        case EDIT_MODE:
          e256_blobs.update(midiMsg.data, onBlobUpdate);
          break;
        case GET_CONFIG:
          // TODO: fetch the e256 CONFIG file
          break;
      }
      break;
    default:
      break;
  }
}

function noteOn(note, volume) {
  MIDIIoutput.send([NOTE_ON, note, volume]);
  console.log("MIDIIoutput.send noteOn: " + note + " volume: " + volume);
}

function noteOff(note) {
  MIDIIoutput.send([NOTE_OFF, note, 0]);
  console.log("MIDIIoutput.send noteOff: " + note + " volume: " + 0);
}

function controlChange(value) {
  MIDIIoutput.send([CONTROL_CHANGE, value]);
  console.log("MIDIIoutput.send controlChange: " + value);
}

function programChange(value) {
  //var status = PROGRAM_CHANGE | channel; // FIXME! bug is on the Arduino side! Open issue: https://github.com/PaulStoffregen/cores/issues/636
  //MIDIIoutput.send([status, value]);
  MIDIIoutput.send([PROGRAM_CHANGE, value]); // Quick FIX
  console.log("MIDIIoutput.send programChange: " + value);
}

// Send data via MIDI system exclusive message
// Must provides the data in chunks!
// [ SYSEX_BEGIN, SYSEX_ID, SYSEX_IDENTIFIER, SYSEX_SIZE_MSB, SYSEX_SIZE_LSB, SYSEX_END ] 
// ALLOC_DONE
// [ SYSEX_BEGIN, SYSEX_ID, SYSEX_DATA, SYSEX_END ]
// LOAD_DONE
function sysex_alloc(identifier, size) {
  var size_msb = size >> 7;
  var size_lsb = size & 0x7F;
  let midiMsg = [SYSEX_BEGIN, SYSEX_ID, identifier, size_msb, size_lsb, SYSEX_END];
  MIDIIoutput.send(midiMsg);
}

function sysex_upload(data) {
  let header = [SYSEX_BEGIN, SYSEX_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDIIoutput.send(midiMsg);
}

function e256_setMode(event) {
  switch (event) {
    case "matrixMode":
      currentMode = MATRIX_MODE_RAW;
      if (connected) programChange(MATRIX_MODE_RAW, 1);
      //programChange(MATRIX_MODE_INTERP, 1); // TODO
      //currentMode = MATRIX_MODE_INTERP;
      break;
    case "mappingMode":
      // Look if a CONFIG file is already existing on the e256
      if (connected) programChange(GET_CONFIG, 1);
      break;
    case "editMode":
      currentMode = EDIT_MODE;
      if (connected) programChange(EDIT_MODE, 1);
      break;
    case "playMode":
      currentMode = PLAY_MODE;
      if (connected) programChange(PLAY_MODE, 1);
      break;
  }
}

function setConfig() {
  if (connected) {
    e256_alocate_memory();
  } else {
    alert("e256 NOT CONNECTED!");
  }
}

function calibrate() {
  if (connected) {
    programChange(CALIBRATE, 2);
  } else {
    alert("e256 NOT CONNECTED!");
  }
}

function loadFile(event) {
  var file = event.target.files[0];
  if (file.type === "application/json") {
    fileType = "json";
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
  }
  else if (file.type === "application/wav") {
    fileType = "wav";
    //TODO
  }
  else {
    alert("WRONG FILE TYPE!");
  }
}
var confSize = 0;

function onReaderLoad(event) {
  try {
    config = JSON.parse(event.target.result);
    confSize = Object.keys(JSON.stringify(config)).length;
    //console.log("NAME:" + config.NAME + " " + config.PROJECT + " " + config.VERSION);
    //console.log(confSize);
  } catch (e) {
    alert(e);
  }
}

function e256_alocate_memory() {
  if (fileType === "json") {
    sysex_alloc(SYSEX_CONF, confSize);
    console.log("SYSEX_CONF");
  }
  else if (fileType === "wav") {
    //sysex_alloc(SYSEX_SOUND, sound.length); // TODO
  } else {
    alert("CONFIG FILE MISSING!");
  }
}