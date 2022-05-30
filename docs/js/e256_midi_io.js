/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var MIDIInput = null;
var MIDIoutput = null;
var connected = false;
var fileType = null;
var config = null;
var confSize = 0;

async function MIDIrequest() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("No MIDI support in this browser!");
  }
}

function onMIDISuccess(midiAccess) {
  var inputSetup = false;
  var outputSetup = false;

  /*
  for (var entry of midiAccess.inputs.values()) {
    if (entry.name === "ETEXTILE_SYNTH MIDI 1") {
      MIDIInput = entry;
      MIDIInput.onmidimessage = onMIDIMessage;
      inputSetup = true;
    }
    for (var entry of midiAccess.outputs.values()) {
      if (entry.name === "ETEXTILE_SYNTH MIDI 1") {
        MIDIoutput = entry;
        outputSetup = true;
      }
    }
    if (inputSetup && outputSetup) {
      connected = true;
      sendProgramChange(SYNC_MODE, MIDI_MODES_CHANNEL);
      setTimeout(isConnected, SYNC_MODE_TIMEOUT);
      console.log("SYNC_MODE_REQUEST_A - CODE:" + SYNC_MODE + " CHANNEL:" + MIDI_MODES_CHANNEL);
    }
  }
  */

  midiAccess.onstatechange = function (msg) {
    switch (msg.port.state) {
      case "connected":
        for (var entry of midiAccess.inputs.values()) {
          if (entry.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDIInput = entry;
            MIDIInput.onmidimessage = onMIDIMessage;
            inputSetup = true;
          }
        }
        for (var entry of midiAccess.outputs.values()) {
          if (entry.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDIoutput = entry;
            outputSetup = true;
          }
        }
        if (inputSetup && outputSetup) {
          connected = true;
          console.log("E256_CONNECTED");
          console.log("REQUEST: SYNC_MODE");
          sendProgramChange(SYNC_MODE, MIDI_MODES_CHANNEL);
          setTimeout(updateMenu, SYNC_MODE_TIMEOUT);
        }
        break;
      case "disconnected":
        MIDIInput = null;
        MIDIoutput = null;
        currentMode = PENDING_MODE;
        console.log("MODE: " + MODES_CODES[currentMode]);
        connected = false;
        updateMenu();
        break;
    }
  }
}

function onMIDIFailure(error) {
  alert("e256 NOT CONNECTED! " + error);
}

function updateMenu() {
  if (connected) {
    connectSwitch.checked = true;
    $("#connectSwitch").removeClass("btn-danger").addClass("btn-success");
    $("#summaryAction").html("CONNECTED").removeClass("alert-warning").addClass("alert-success");
    $("#startMenu").collapse("show");
  }
  else {
    connectSwitch.checked = false;
    $("#startMenu").collapse("hide");
    $("#calibrateMenu").collapse("hide");
    $("#matrixMenu").collapse("hide");
    $("#mappingMenu").collapse("hide");
    $("#loadingCanvas").collapse("show");
    $("#matrixCanvas").collapse("hide");
    $("#mappingCanvas").collapse("hide");
    $("#summaryAction").html("DISCONNECTED").removeClass("alert-success").addClass("alert-warning");
    $("#summaryContent").html("This is the web app made for loading graphic & audio modules in to your eTextile-Synthesizer.");
    $("#connectSwitch").removeClass("btn-success").addClass("btn-danger");
    $(".param").collapse("hide");
  }
}

function onMIDIMessage(midiMsg) {
  let channel = (midiMsg.data[0] & 0xF) + 1; // lowByte
  let status = midiMsg.data[0] & 0xF0; // highByte
  let value = midiMsg.data[1];
  //console.log("CHANNEL: ", channel);
  //console.log("STATUS: ", status);
  //console.log("VALUE: ", value);
  switch (status) {
    case NOTE_ON:
      e256_blobs.add(midiMsg.data, onBlobDown);
      console.log(midiMsg.data);
      break;
    case NOTE_OFF:
      e256_blobs.remove(midiMsg.data, onBlobRelease);
      break;
    case CONTROL_CHANGE:
      // NA
      break;
    case PROGRAM_CHANGE:
      switch (channel) {
        case MIDI_VERBOSITY_CHANNEL:
          if (VERBOSITY_CODES[value] === PENDING_MODE_DONE) {
            console.log("RECEIVED: " + VERBOSITY_CODES[value]);
            sendProgramChange(SYNC_MODE, MIDI_MODES_CHANNEL);
            console.log("REQUEST: SYNC_MODE");
          }
          else if (VERBOSITY_CODES[value] === SYNC_MODE_DONE) {
            console.log("RECEIVED: " + VERBOSITY_CODES[value]);
            currentMode = SYNC_MODE;
            sendProgramChange(CONFIG_FILE_REQUEST, MIDI_STATES_CHANNEL);
            console.log("REQUEST: CONFIG_FILE");
          }
          else if (VERBOSITY_CODES[value] === USBMIDI_CONFIG_ALLOC_DONE) {
            console.log("RECEIVED: " + VERBOSITY_CODES[value]);
            sysex_upload(string_to_bytes(JSON.stringify(config))); // JSON serialization
          }
          else if (VERBOSITY_CODES[value] === USBMIDI_CONFIG_ALLOC_DONE) {
            console.log("RECEIVED: " + VERBOSITY_CODES[value]);
            // Graph config
          }
          else {
            console.log("RECEIVED: " + VERBOSITY_CODES[value]);
          }
          break;
        case MIDI_ERROR_CHANNEL:
          console.log("RECEIVED: " + ERROR_CODES[value]);
          break;
      }
      break;
    case SYSTEM_EXCLUSIVE:
      switch (currentMode) {
        case SYNC_MODE:
          console.log("RECEIVED: CONFIG_FILE");
          // JSON deserialization
          var string = new TextDecoder().decode(midiMsg.data);
          console.log(string);
          var e256_jsonFile = string.slice(1, -1);
          config = JSON.parse(e256_jsonFile);
          //drawFromParams(config.mapping);
          currentMode = EDIT_MODE;
          break;
        case MATRIX_MODE_RAW:
          e256_matrix.update(midiMsg.data);
          break;
        case MATRIX_MODE_INTERP:
          // TODO
          break;
        case EDIT_MODE:
          e256_blobs.update(midiMsg.data, onBlobUpdate);
          break;
        case PLAY_MODE:
          e256_blobs.update(midiMsg.data, onBlobUpdate);
          break;
      }
      break;
    default:
      break;
  }
}

function sendNoteOn(note, velocity, channel) {
  var status = NOTE_ON | (channel - 1);
  MIDIoutput.send([status, note, velocity]);
}

function sendNoteOff(note, velocity, channel) {
  var status = NOTE_OFF | (channel - 1);
  MIDIoutput.send([status, note, velocity]);
}

function sendControlChange(control, value, channel) {
  var status = CONTROL_CHANGE | (channel - 1);
  MIDIoutput.send([status, control, value]);
}

function sendProgramChange(program, channel) {
  var status = PROGRAM_CHANGE | (channel - 1);
  MIDIoutput.send([status, program]);
}

// Send data via MIDI system exclusive message
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_IDENTIFIER, SYSEX_SIZE_MSB, SYSEX_SIZE_LSB, SYSEX_END ] 
// Recive: USBMIDI_CONFIG_ALLOC_DONE
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_DATA, SYSEX_END ]
// Recive: USBMIDI_CONFIG_LOAD_DONE
function sysex_alloc(identifier, size) {
  var size_msb = size >> 7;
  var size_lsb = size & 0x7F;
  let midiMsg = [SYSEX_BEGIN, SYSEX_DEVICE_ID, identifier, size_msb, size_lsb, SYSEX_END];
  MIDIoutput.send(midiMsg);
}

function sysex_upload(data) {
  let header = [SYSEX_BEGIN, SYSEX_DEVICE_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDIoutput.send(midiMsg);
  //let midiMsg = [SYSEX_BEGIN, SYSEX_DEVICE_ID, data, SYSEX_END];
  //MIDIoutput.send(midiMsg);
}

function e256_alocate_memory() {
  if (fileType === "application/json") {
    sysex_alloc(SYSEX_CONF, confSize);
  }
  else if (fileType === "application/wav") {
    //sysex_alloc(SYSEX_SOUND, sound.length); // TODO
  } else {
    alert("MISSING FILE!");
  }
}

$(document).ready(function () {
  $("#loadingCanvas").collapse("show");
  $("#loadingCanvas").css("background", "white");
  MIDIrequest();
});

function string_to_bytes(str) {
  var bytes = [];
  for (var i = 0, n = str.length; i < n; i++) {
    var char = str.charCodeAt(i);
    bytes.push(char);
  }
  return bytes;
}
