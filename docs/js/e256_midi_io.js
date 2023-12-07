/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var MIDIInput = null;
var MIDIOutput = null;
var midi_device_connected = false;
var fileType = null;
var confSize = 0;

/*
// MIDI struct
function MidiMsg(status, channel, data1, data2) {
  this.status = status;     // Set the MIDI status
  this.channel = channel;   // Set the MIDI channel
  this.data1 = data1;       // Set the MIDI note
  this.data2 = data2;       // Set the MIDI velocity
};
*/

async function MIDIrequest() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
    //console.log("WEBMIDI.JS: " + WebMidi.version); // FIXME!
  } else {
    alert("No MIDI support in this browser!");
  }
}

function onMIDISuccess(midiAccess) {
  let inputSetup = false;
  let outputSetup = false;

  /*
  for (var entry of midiAccess.inputs.values()) {
    if (entry.name === "ETEXTILE_SYNTH MIDI 1") {
      MIDIInput = entry;
      MIDIInput.onmidimessage = onMIDIMessage;
      inputSetup = true;
    }
    for (var entry of midiAccess.outputs.values()) {
      if (entry.name === "ETEXTILE_SYNTH MIDI 1") {
        MIDIOutput = entry;
        outputSetup = true;
      }
    }
    if (inputSetup && outputSetup) {
      midi_device_connected = true;
      sendProgramChange(SYNC_MODE, MIDI_MODES_CHANNEL);
      setTimeout(isConnected, SYNC_MODE_TIMEOUT);
      console.log("SYNC_MODE_REQUEST_A - CODE:" + SYNC_MODE + " CHANNEL:" + MIDI_MODES_CHANNEL);
    }
  }
  */

  midiAccess.onstatechange = function (msg) {
    switch (msg.port.state) {
      case "connected":
        for (let input of midiAccess.inputs.values()) {
          if (input.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDIInput = input;
            MIDIInput.onmidimessage = onMIDIMessage;
            inputSetup = true;
          }
        }
        for (let output of midiAccess.outputs.values()) {
          if (output.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDIOutput = output;
            outputSetup = true;
          }
        }
        if (inputSetup && outputSetup) {
          midi_device_connected = true;
          console.log("E256_CONNECTED");
          console.log("REQUEST: SYNC_MODE");
          sendProgramChange(SYNC_MODE, MIDI_MODES_CHANNEL);
          setTimeout(updateMenu, SYNC_MODE_TIMEOUT);
        }
        break;
      case "disconnected":
        MIDIInput = null;
        MIDIOutput = null;
        e256_current_mode = PENDING_MODE;
        console.log("MODE: " + MODES_CODES[e256_current_mode]);
        midi_device_connected = false;
        updateMenu();
        break;
    }
  }
}

function onMIDIFailure(error) {
  alert("e256 NOT CONNECTED! " + error);
}

function updateMenu() {
  if (midi_device_connected) {
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
    $("#contextualContent").html("This is the web app made for loading graphic & audio modules in to your eTextile-Synthesizer.");
    $("#connectSwitch").removeClass("btn-success").addClass("btn-danger");
    $(".param").collapse("hide");
  }
}

// RAW MIDI MESSAGES!
// MIDI 1.0
//
function onMIDIMessage(midiMsg) {
  let channel = (midiMsg.data[0] & 0xF) + 1; // lowByte
  let status = midiMsg.data[0] & 0xF0;       // highByte
  let value = midiMsg.data[1];
  // midiMsg -> Input row MIDI mesages!
  //console.log("CHANNEL: ", channel); // []
  //console.log("STATUS: ", status);   // []
  //console.log("VALUE: ", value);     // []
  switch (status) {
    case NOTE_ON: // 144	[han-1], 145 [chan-1], ...
      e256_blobs.add(midiMsg.data);
      console.log(midiMsg.data);
      break;
    case NOTE_OFF: // 128	[han-1], 129 [chan-1], ...
      e256_blobs.remove(midiMsg.data);
      break;
    case CONTROL_CHANGE: // 176 [chan-1], 177 [chan-1], ...
      // NOT USE IN THIS BRANCHE OF THE PROJECT! 
      break;
    case PROGRAM_CHANGE: // 192 [chan-1], 193 [chan-2], ...
      switch (channel) {
        case MIDI_VERBOSITY_CHANNEL:
          switch (VERBOSITY_CODES[value]) {
            case PENDING_MODE_DONE:
              console.log("RECEIVED: " + VERBOSITY_CODES[value]);
              sendProgramChange(SYNC_MODE, MIDI_MODES_CHANNEL);
              console.log("REQUEST: SYNC_MODE");
              break;
            case SYNC_MODE_DONE:
              console.log("RECEIVED: " + VERBOSITY_CODES[value]);
              e256_current_mode = SYNC_MODE;
              sendProgramChange(CONFIG_FILE_REQUEST, MIDI_STATES_CHANNEL);
              console.log("REQUEST: CONFIG_FILE");
              break;
            case USBMIDI_CONFIG_ALLOC_DONE:
              console.log("RECEIVED: " + VERBOSITY_CODES[value]);
              sysex_upload(string_to_bytes(JSON.stringify(e256_config)));
              break;
            case USBMIDI_CONFIG_LOAD_DONE:
              console.log("RECEIVED: " + VERBOSITY_CODES[value]);
              break;
            default:
              console.log("RECEIVED: " + VERBOSITY_CODES[value]);
              break;
          }
          break;
        case MIDI_ERROR_CHANNEL:
          console.log("RECEIVED: " + ERROR_CODES[value]);
          break;
      }
      break;
    case SYSTEM_EXCLUSIVE:
      switch (e256_current_mode) {
        case SYNC_MODE:
          console.log("RECEIVED: CONFIG_FILE");
          let string = new TextDecoder().decode(midiMsg.data);
          let conf_file = string.slice(1, -1);
          let e256_json_conf = JSON.parse(conf_file);
          draw_controler_from_config(e256_json_conf);
          e256_current_mode = EDIT_MODE;
          break;
        case MATRIX_MODE_RAW:
          e256_matrix.update(midiMsg.data);
          break;
        case MATRIX_MODE_INTERP:
          // TODO
          break;
        case EDIT_MODE:
          e256_blobs.update(midiMsg.data);
          break;
        case PLAY_MODE:
          e256_blobs.update(midiMsg.data);
          break;
      }
      break;
    default:
      break;
  }
}

function sendNoteOn(midiMsg) {
  let status = NOTE_ON | (midiMsg.channel - 1);
  MIDIOutput.send([status, midiMsg.note, midiMsg.velocity]);
}

function sendNoteOff(midiMsg) {
  let status = NOTE_OFF | (midiMsg.chan - 1);
  MIDIOutput.send([status, midiMsg.note, midiMsg.velo]);
}

function sendControlChange(midiMsg) {
  let status = CONTROL_CHANGE | (midiMsg.chan - 1);
  MIDIOutput.send([status, midiMsg.ctr, midiMsg.val]);
}

function sendAftertouch(midiMsg) { // FIXME!
  let status = AFTER_TOUCH | (midiMsg.chan - 1);
  MIDIOutput.send([status, midiMsg.aft, midiMsg.val]);
}

function sendProgramChange(midiMsg) {
  let status = PROGRAM_CHANGE | (midiMsg.chan - 1);
  MIDIOutput.send([status, midiMsg.pgm]);
}

// Send data via MIDI system exclusive message
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_IDENTIFIER, SYSEX_SIZE_MSB, SYSEX_SIZE_LSB, SYSEX_END ] 
// Recive: USBMIDI_CONFIG_ALLOC_DONE
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_DATA, SYSEX_END ]
// Recive: USBMIDI_CONFIG_LOAD_DONE
function sysex_alloc(identifier, size) {
  let size_msb = size >> 7;
  let size_lsb = size & 0x7F;
  let midiMsg = [SYSEX_BEGIN, SYSEX_DEVICE_ID, identifier, size_msb, size_lsb, SYSEX_END];
  MIDIOutput.send(midiMsg);
}

function sysex_upload(data) {
  let header = [SYSEX_BEGIN, SYSEX_DEVICE_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDIOutput.send(midiMsg);
  //let midiMsg = [SYSEX_BEGIN, SYSEX_DEVICE_ID, data, SYSEX_END];
  //MIDIOutput.send(midiMsg);
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
  $("#loadingCanvas").css("background", "black");
  $("#matrixCanvas").css("background", "black");
  $("#mappingCanvas").css("background", "black");
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
