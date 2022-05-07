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
      programChange(SYNC_MODE, MIDI_MODES_CHANNEL);
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
          setTimeout(updateMenu, SYNC_MODE_TIMEOUT);
          programChange(SYNC_MODE, MIDI_MODES_CHANNEL);
          console.log("SYNC_MODE_REQUEST");
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
  var channel = midiMsg.data[0] & 0xF; // lowByte
  var status = midiMsg.data[0] & 0xF0; // highByte
  var value = midiMsg.data[1];
  //console.log("PROGRAM_CHANGE_CHANNEL: ", channel);
  //console.log("PROGRAM_CHANGE_STATUS: ", status);
  //console.log("PROGRAM_CHANGE_VALUE: ", value);
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
          if (value == PENDING_MODE_DONE) {
            programChange(SYNC_MODE, MIDI_MODES_CHANNEL);
            console.log("SYNC_MODE_REQUEST");
          }
          else if (value == SYNC_MODE_DONE) {
            currentMode = SYNC_MODE;
            console.log("MODE: " + MODES_CODES[currentMode]);
            programChange(CONFIG_FILE_REQUEST, MIDI_STATES_CHANNEL);
            console.log("CONFIG_FILE_REQUEST"); 
          }
          else if (value == USBMIDI_CONFIG_ALLOC_DONE) {
            // JSON serialization
            sysex_upload(stringToBytes(JSON.stringify(config)));
          }
          else {
            console.log("RECIVED: " + VERBOSITY_CODES[value]);
          }
          break;
        case MIDI_ERROR_CHANNEL:
          console.log("RECIVED: " + ERROR_CODES[value]);
          break;
      }
      break;
    case SYSTEM_EXCLUSIVE:
      switch (currentMode) {
        case SYNC_MODE:
          console.log("CONFIG_FILE_RECIVED");
          // JSON deserialization
          var string = new TextDecoder().decode(midiMsg.data);
          console.log(string); // FIXME: recived file is not consistent!?
          //config = JSON.parse(string);
          //console.log("NAME:" + config.NAME + " " + config.PROJECT + " " + config.VERSION);
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

function noteOn(note, velocity, channel) {
  var status = NOTE_ON | channel;
  MIDIoutput.send([status, note, velocity]);
}

function noteOff(note, velocity, channel) {
  var status = NOTE_OFF | channel;
  MIDIoutput.send([status, note, velocity]);
}

function controlChange(control, value, channel) {
  var status = CONTROL_CHANGE | channel;
  MIDIoutput.send([status, control, value]);
}

function programChange(program, channel) {
  var status = PROGRAM_CHANGE | channel;
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

function setConfig() {
  e256_alocate_memory();
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

function onReaderLoad(event) {
  try {
    config = JSON.parse(event.target.result);
    confSize = Object.keys(JSON.stringify(config)).length;
    console.log("NAME:" + config.NAME + " " + config.PROJECT + " " + config.VERSION);
    console.log("CONFIG_SIZE: " + confSize);
  } catch (e) {
    alert(e);
  }
}

function e256_alocate_memory() {
  if (fileType === "json") {
    sysex_alloc(SYSEX_CONF, confSize);
  }
  else if (fileType === "wav") {
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

function stringToBytes(str) {
  var bytes = [];
  for(var i = 0, n = str.length; i < n; i++) {
      var char = str.charCodeAt(i);
      bytes.push(char);
  }
  return bytes;
}