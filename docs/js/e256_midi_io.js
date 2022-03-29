/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var MIDIInput
var MIDIoutput;
var connected = false;
var fileType = null;
let config = null;
var confSize = 0;

e256_blobs = new Blobs();

async function MIDIrequest() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("No MIDI support in your browser!");
    connectSwitch.checked = false;
    connected = false;
  }
}

function onMIDISuccess(midiAccess) {
  //listInputsAndOutputs(midiAccess);
  var MIDIin = false;
  var MIDIout = false;
  for (var entry of midiAccess.inputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      MIDIInput = entry;
      MIDIInput.onmidimessage = onMIDIMessage;
      MIDIin = true;
    }
    for (var entry of midiAccess.outputs.values()) {
      if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
        MIDIoutput = entry;
        MIDIout = true;
      }
    }
    if (MIDIin && MIDIout) {
      connected = true;
      connectSwitch.checked = true;
    }
    else {
      connected = false;
      connectSwitch.checked = false;
    }
  }

  midiAccess.onstatechange = function (e) {
    switch (e.port.state) {
      case "connected":
        for (var entry of midiAccess.inputs.values()) {
          if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
            MIDIInput = entry;
            MIDIInput.onmidimessage = onMIDIMessage;
            MIDIin = true;
          }
        }
        for (var entry of midiAccess.outputs.values()) {
          if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
            MIDIoutput = entry;
            MIDIout = true;
          }
        }
        if (MIDIin && MIDIout) {
          connected = true;
          connectSwitch.checked = true;
          programChange(SYNC_MODE, CHAN1);
          console.log("REQUEST_SYNC_MODE - Prog:" + SYNC_MODE + " Chan:" + CHAN1);
        } else {
          connected = false;
          connectSwitch.checked = false;
        }
        break;
      case "disconnected":
        //MIDIoutput.close(); // FIXME!
        //MIDIInput.close();  // FIXME!
        MIDIInput = null;
        MIDIoutput = null;
        connected = false;
        connectSwitch.checked = false;
        $("#startMenu").collapse("hide");
        $("#calibrateMenu").collapse("hide");
        $("#matrixMenu").collapse("hide");
        $("#mappingMenu").collapse("hide");
        $("#matrixCanvas").collapse("hide");
        $("#mappingCanvas").collapse("hide");
        $("#summaryAction").html("DISCONNECTED").removeClass("badge-success").addClass("badge-danger");
        $("#summaryContent").html("This is the web app made for loading graphic & audio modules in to your eTextile-Synthesizer.");
        $(".param").collapse("hide");
        break;
    }
  }
}

function onMIDIFailure(error) {
  connected = false;
  connectSwitch.checked = false;
  alert("e256 NOT CONNECTED! " + error);
}

/*
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
*/

function onMIDIMessage(midiMsg) {
  var channel = midiMsg.data[0] & 0xF;
  var status = midiMsg.data[0];
  //var value = midiMsg.data[1];
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
        case MATRIX_MODE_RAW:
          console.log("RECIVE_MATRIX_MODE_RAW - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          $("#startMenu").collapse("show");
          $("#summaryAction").html("CONNECTED").removeClass("badge-danger").addClass("badge-success");
          break;
        // VERBOSITY CONSTANTS
        case DONE_ACTION:
          console.log("RECIVE_DONE_ACTION - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case FLASH_CONFIG_ALLOC_DONE:
          console.log("RECIVE_FLASH_CONFIG_ALLOC_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case FLASH_CONFIG_LOAD_DONE:
          console.log("RECIVE_FLASH_CONFIG_LOAD_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case FLASH_CONFIG_WRITE_DONE:
          console.log("RECIVE_FLASH_CONFIG_WRITE_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case USBMIDI_CONFIG_ALLOC_DONE:
          console.log("RECIVE_USBMIDI_CONFIG_ALLOC_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          sysex_upload(Array.from(JSON.stringify(config)).map(letter => letter.charCodeAt(0)));
          break;
        case USBMIDI_CONFIG_UPLOAD_DONE:
          console.log("RECIVE_USBMIDI_CONFIG_UPLOAD_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case USBMIDI_SOUND_UPLOAD_DONE:
          console.log("RECIVE_USBMIDI_SOUND_UPLOAD_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case USBMIDI_SET_LEVEL_DONE:
          console.log("RECIVE_USBMIDI_SET_LEVEL_DONE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        // ERROR CODES CONSTANTS
        case ERROR_WAITING_FOR_GONFIG:
          alert("RECIVE_ERROR_WAITING_FOR_GONFIG - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_LOADING_GONFIG_FAILED:
          alert("RECIVE_ERROR_LOADING_GONFIG_FAILED - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_CONNECTING_FLASH:
          alert("RECIVE_ERROR_CONNECTING_FLASH - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_WHILE_OPEN_FLASH_FILE:
          alert("RECIVE_ERROR_WHILE_OPEN_FLASH_FILE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_FLASH_FULL:
          alert("RECIVE_ERROR_FLASH_FULL - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_FILE_TO_BIG:
          alert("RECIVE_ERROR_FILE_TO_BIG - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_NO_CONFIG_FILE:
          alert("RECIVE_ERROR_NO_CONFIG_FILE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        case ERROR_UNKNOWN_SYSEX:
          alert("RECIVE_ERROR_UNKNOWN_SYSEX - Prog:" + midiMsg.data[1] + " Chan:" + channel);
          break;
        default:
          alert("RECIVE_ERROR_UNKNOW_MIDI_MSSGAGE - Prog:" + midiMsg.data[1] + " Chan:" + channel);
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

function noteOn(note, velocity, channel) {
  var status = NOTE_ON | channel;
  MIDIoutput.send([status, note, velocity]);
  //console.log("SEND_NOTEON: " + note + " " + velocity + " " + channel);
}

function noteOff(note, velocity, channel) {
  var status = NOTE_OFF | channel;
  MIDIoutput.send([status, note, velocity]);
  //console.log("SEND_NOTEOFF: " + note + " " + velocity + " " + channel);
}

//sendControlChange(control, value, channel);
function controlChange(control, value, channel) {
  var status = CONTROL_CHANGE | channel;
  MIDIoutput.send([status, control, value]);
  //console.log("SEND_CONTROL_CHANGE: " + control + " " + value + " " + channel);
}

function programChange(program, channel) {
  var status = PROGRAM_CHANGE | channel;
  MIDIoutput.send([status, program]);
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
  MIDIoutput.send(midiMsg);
}

function sysex_upload(data) {
  let header = [SYSEX_BEGIN, SYSEX_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDIoutput.send(midiMsg);
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
    programChange(CALIBRATE, CHAN2);
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

$(document).ready(function () {
  MIDIrequest();
});