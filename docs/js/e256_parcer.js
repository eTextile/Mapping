var configFile = "";

// Define the elements
let connectButton = document.getElementById("connectButton");
let calibrateButton = document.getElementById("calibrateButton");
let getBlobsButton = document.getElementById("getBlobsButton");
let getRawButton = document.getElementById("getRawButton");
let loadConfigButton = document.getElementById("loadConfigButton");
let sendConfigButton = document.getElementById("sendConfigButton");
let receiveText = document.getElementById("receiveText");

// Couple the elements to the Events
connectButton.addEventListener('click', e256_MIDIConnect);
calibrateButton.addEventListener('click', e256_calibrate);
getBlobsButton.addEventListener('click', e256_getBlobs);
getRawButton.addEventListener('click', e256_getRawMatriw);
loadConfigButton.addEventListener('change', loadConfig);
sendConfigButton.addEventListener('click', e256_sendConfig);

const MIDI_CHANNEL = 1;

const NOTE_ON = 9;
const NOTE_OFF = 8;
const CONTROL_CHANGE = 11;
const PROGRAM_CHANGE = 12;
const SYSTEM_EXCLUSIVE = 15

const CALIBRATE = 2;      //
const BLOBS_PLAY = 3;     // Send all blobs values over USB using MIDI format
const MAPPING_LIB = 4;    //
const RAW_MATRIX = 5;     //
const INTERP_MATRIX = 6;  //

const BI = 0; // [0] Blob UIDconst
const BS = 1; // [1] Blob State
const BL = 2; // [2] Blob Last State
const BX = 3; // [3] Blob X centroid position
const BY = 4; // [4] Blob Y centroid position
const BZ = 5; // [5] Blob Depth
const BW = 6; // [6] Blob width
const BH = 7; // [7] Blob Height

async function e256_MIDIConnect() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex: true}).then(onMIDISuccess, onMIDIFailure);
    } else {
        alert("No MIDI support in your browser.");
    }
}

var output;

function onMIDISuccess(midiAccess) {
    //listInputsAndOutputs(midiAccess);
    for (var entry of midiAccess.inputs.values()) {
        if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
            input = entry;
            input.onmidimessage = (onMIDIMessage);
            //console.log('INPUT_OK');
        }
    }
    for (var entry of midiAccess.outputs.values()) {
        if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
            output = entry;
            //console.log('OUTPUT_OK');
        }
    }
    connectButton.innerHTML = 'E256_CONNECTED';
}

function listInputsAndOutputs(midiAccess) {
    for (var entry of midiAccess.inputs) {
        var input = entry[1];
        console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
        "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
        "' version:'" + input.version + "'" );
    }
    for (var entry of midiAccess.outputs) {
        var output = entry[1];
        console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
        "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
        "' version:'" + output.version + "'" );
    }
}

function onMIDIFailure(error) {
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + error);
}

class matrix {
    constructor(size) {
        this.matrix = [size];
    }
    update(index, val) {
        this.matrix[index] = val / 10;
    }
    getZ(index){
        return this.matrix[index];
    }
}

class blob {
    constructor(id, x, y, z, w, h) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
    }
}

class blobs {
    constructor() {
      this.blobs = [];
    }

    add(id) {
      let newBlob = new blob(id);
      this.blobs.push(newBlob);
      //console.log("ADD_BLOB " + id);
    }

    remove(id) {
      for (var i = 0; i < this.blobs.length; i++) {
        if (this.blobs[i].uid === id) {
          this.blobs.splice(i, 1);
          //console.log("REMOVED_BLOB " + id);
          break;
        }
      }
    }
    
    update(id, param, val) {
        for (var i = 0; i < this.blobs.length; i++) {
            if (this.blobs[i].uid === id) {
                switch (param) {
                    case BX:
                        this.blobs[i].x = val;
                        break;
                    case BY:
                        this.blobs[i].y = val;
                        break;
                    case BZ:
                        this.blobs[i].z = val;
                        break;
                    case BW:
                        this.blobs[i].w = val;
                        break;
                    case BH:
                        this.blobs[i].h = val;
                        break;
                }
                break;
            }
        }

    }
    get(id) {
        return  this.blobs;
    }
}

let e256_matrix = new matrix(256);
let e256_blobs = new blobs();

function onMIDIMessage(midiMsg) {
  var status = midiMsg.data[0] >> 4;
  var channel = midiMsg.data[0] & 0xF;
  switch (status) {
    case NOTE_ON:
      //console.log("NOTE_ON " + midiMsg.data[1] + "\tVAL " + midiMsg.data[2]);
      e256_blobs.add(midiMsg.data[1]);
      break;
    case NOTE_OFF:
      //console.log("NOTE_OFF " + midiMsg.data[1] + "\tVAL " + midiMsg.data[2]);
      e256_blobs.remove(midiMsg.data[1]);
      break;
    case CONTROL_CHANGE:
      e256_blobs.update(channel, midiMsg.data[1], midiMsg.data[2]);
      break;
    case PROGRAM_CHANGE:
      console.log("PROGRAM_CHANGE " + midiMsg.data[1]);
      break;
    case SYSTEM_EXCLUSIVE:
      //console.log("SYSTEM_EXCLUSIVE " + midiMsg.data.length);
      for(var i=1; i<midiMsg.data.length - 1; i++) {
          e256_matrix.update(i-1, midiMsg.data[i]);
        }
      break;
  }
}

function noteOn(note, volume) {
  var cmd = NOTE_ON << 4;
  output.send([cmd, note, volume])
}

function noteOff(note, volume) {
  var cmd = NOTE_OFF << 4;
  output.send([cmd, note, volume]);
}

function controlChange(value) {
  var cmd = CONTROL_CHANGE << 4;
  output.send([cmd, value]);
}

function programChange(value) {
  var cmd = PROGRAM_CHANGE << 4;
  output.send([cmd, value]);
}

function sysex(data) {
  output.send(data);
}

function e256_calibrate() {
  programChange(CALIBRATE);
}

function e256_getRawMatriw() {
  programChange(RAW_MATRIX);
}

function e256_getBlobs() {
  programChange(BLOBS_PLAY);
}

function e256_sendConfig(data) {
  sysex(data);
}

async function loadConfig(event) {
  configFile = event.target.files[0];
  console.log(configFile);
  //configFile.value = "";
}