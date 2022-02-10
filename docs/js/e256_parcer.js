const MIDI_INPUT_CHANNEL = 1; // [1:15] Set the HARDWARE MIDI_INPUT channel
const MIDI_OUTPUT_CHANNEL = 1; // [1:15] Set the HARDWARE MIDI_OUTPUT channel
// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;
// MODES
const MATRIX = 0; //
const BLOBS_PLAY = 2; // Get all blobs values over USB using MIDI format
const MAPPING = 3; //
// STATES
const CALIBRATE = 10; //
const DONE_ACTION = 11; //
const ERROR = 12; //
const CONFIG = 13; //
// LEVELS
const SIG_IN = 0; // E256-LEDs: | 1 | 0 |
const SIG_OUT = 1; // E256-LEDs: | 0 | 1 |
const LINE_OUT = 2; // E256-LEDs: | 0 | 0 |
const THRESHOLD = 3; // E256-LEDs: | 1 | 1 |
// MIDI CONSTANTS
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
// VERBOSITY
const DONE_FLASH_CONFIG_ALLOC = 16;
const DONE_FLASH_CONFIG_LOAD = 17;
const DONE_FLASH_CONFIG_WRITE = 18;
const DONE_USBMIDI_CONFIG_ALLOC = 19;
const DONE_USBMIDI_CONFIG_LOAD = 20;
const DONE_USBMIDI_SOUND_LOAD = 21;
// ERROR CODES
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
let playMode = null;
var fileType = "";
var config = "";

async function e256_MIDIConnect() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("No MIDI support in your browser!");
  }
}

function onMIDISuccess(midiAccess) {
  //listInputsAndOutputs(midiAccess);
  for (var entry of midiAccess.inputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      MIDIInput = entry;
      MIDIInput.onmidimessage = onMIDIMessage;
      //MIDIInput.open();
      connectButton.innerHTML = 'E256_CONNECTED';
      connectButton.style.background = "rgb(10,180,0)";
      connected = true;
    }
  }
  for (var entry of midiAccess.outputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      MIDIIoutput = entry;
    }
  }
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

function onMIDIFailure(error) {
  alert("eTextile-Synthesizer NOT CONNECTED! || No MIDI support in your browser! " + error);
}

//export { Matrix };
function Matrix(width, height) {
  this.matrix = [width * height];
  for (var i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = 0;
  }
}
Matrix.prototype.update = function(sysExMsg) {
  for (var i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = sysExMsg[i + 1] / 10;
  }
}
Matrix.prototype.getZ = function(index) {
  var val = this.matrix[index];
  if (val != null) {
    return val;
  }
  else {
    return 0;
  }
}

let e256_matrix = new Matrix(RAW_COLS, RAW_ROWS);

//export { Blob };
function Blob(id, x, y, z, w, h) {
  this.uid = id;
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  this.h = h;
}

Blob.prototype.update = function(sysExMsg) {
  this.x = sysExMsg[2];
  this.y = sysExMsg[3];
  this.z = sysExMsg[4];
  this.w = sysExMsg[5];
  this.h = sysExMsg[6];
  //console.log("BLOB_UPDATE: " + sysExMsg[1]);
}

Blob.prototype.print = function() {
  console.log(
    `ID:` + this.uid +
    ` X:` + this.x +
    ` Y:` + this.y +
    ` Z:` + this.z +
    ` W:` + this.w +
    ` H:` + this.h
  );
}

// Blobs array management
function Blobs() {
  this.blobs = [];
}

Blobs.prototype.add = function(noteOn, callback) {
  if (this.blobs.findIndex(blob => blob.uid === noteOn[1]) === -1){
    var blob = new Blob(noteOn[1], 0, 0, 0, 0, 0);
    this.blobs.push(blob);
    //console.log("BLOB_ADD: " + noteOn[1]);
    callback();
  } else {
    console.log("BLOB_EXIST: " + noteOn[1]);
    return;
  }
}

Blobs.prototype.remove = function(noteOff, callback) {
  let index = this.blobs.findIndex(blob => blob.uid === noteOff[1]);
  if (index !== -1){
    this.blobs.splice(index, 1);
    //console.log("BLOB_REMOVE: " + noteOff[1]);
    callback(index);
  } else {
    console.log("BLOB_NOT_FOUND: " + noteOff[1]);
    return;
  }
}

Blobs.prototype.update = function(sysExMsg, callback) {
//Blobs.prototype.update = function(sysExMsg) {
  let index = this.blobs.findIndex(blob => blob.uid === sysExMsg[1]);
  if (index != -1){
    this.blobs[index].update(sysExMsg);
    callback(index);
  } else {
    console.log("BLOB_NOT_FOUND: " + sysExMsg[1]);
    return;
  }
}

Blobs.prototype.get = function(index) {
  return this.blobs[index];
}

Blobs.prototype.size = function() {
  return this.blobs.length;
}

let e256_blobs = new Blobs();

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
        case DONE_USBMIDI_CONFIG_ALLOC:
          sysex_load(Array.from(JSON.stringify(config)).map(letter => letter.charCodeAt(0)));
          break;
        case DONE_USBMIDI_CONFIG_LOAD:
          alert("eTextile-Synthesizer: LOAD CONFIG DONE!");
          break;
        default:
          //console.log("midiMsg: " + midiMsg.data[1]);
          break;
      }
      break;
    case SYSTEM_EXCLUSIVE:
      switch (playMode) {
        case MATRIX:
          e256_matrix.update(midiMsg.data);
          break;
        case BLOBS_PLAY:
          e256_blobs.update(midiMsg.data, onBlobUpdate);
          break;
        case CONFIG:
          // TODO: fetch config file
          break;
        default:
          //console.log("Unknown_playMode: " + playMode);
          break;
      }
      break;
    default:
      break;
  }
}

function noteOn(note, volume) {
  MIDIIoutput.send([NOTE_ON, note, volume]);
}

function noteOff(note) {
  MIDIIoutput.send([NOTE_OFF, note, 0]);
}

function controlChange(value) {
  MIDIIoutput.send([CONTROL_CHANGE, value]);
}

function programChange(value) {
  MIDIIoutput.send([PROGRAM_CHANGE, value]);
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

function sysex_load(data) {
  let header = [SYSEX_BEGIN, SYSEX_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDIIoutput.send(midiMsg);
}

function e256_sendParams() {
  if (connected) {
    switch (this.id) {
      case 'getRawButton':
        playMode = MATRIX;
        programChange(MATRIX);
        getRawButton.style.background = "rgb(10,180,0)";
        break;
      case 'getBlobsButton':
        playMode = BLOBS_PLAY;
        programChange(BLOBS_PLAY);
        getBlobsButton.style.background = "rgb(10,180,0)";
        break;
      case 'getConfigButton':
        playMode = GET_CONFIG;
        programChange(GET_CONFIG);
        break;
      case 'setMappingButton':
        playMode = MAPPING;
        programChange(MAPPING);
        break;
      case 'calibrateButton':
        programChange(CALIBRATE);
        //calibrateButton.onclick = "rgb(255,0,0)"; // FIXME!
        break;
      default:
        break;
    }
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  }
}

function e256_loadFile(event) {
  var uploadedFile = event.target.files[0];
  if (uploadedFile.type === "application/json") {
    fileType = 'json';
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
  }
  else if (uploadedFile.type === "application/wav") {
    fileType = 'wav';
    //TODO
  } else {
    alert("Wrong file type!");
  }
}

function onReaderLoad(event) {
  try {
    config = JSON.parse(event.target.result);
    //console.log("NAME:" + config.NAME + " " + config.PROJECT + " " + config.VERSION);
  } catch (e) {
    alert(e); // error in the above string!
  }
}

function e256_sendFile() {
  if (connected) {
    if (fileType === 'json') {
      sysex_alloc(SYSEX_CONF, Object.keys(JSON.midiMsg(config)).length);
    }
    else if (fileType === 'wav') {
      //sysex_alloc(SYSEX_SOUND, sound.length);
    } else {
      alert("CONFIG FILE MISSING!");
    }
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  }
}