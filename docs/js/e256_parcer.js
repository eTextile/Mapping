/*Define the elements*/
let connectButton = document.getElementById("connectButton");
let calibrateButton = document.getElementById("calibrateButton");
let getBlobsButton = document.getElementById("getBlobsButton");
let getRawButton = document.getElementById("getRawButton");
let loadFileButton = document.getElementById("loadFileButton");
let sendFileButton = document.getElementById("sendFileButton");
let receiveText = document.getElementById("receiveText");

/*Couple the elements to the Events*/
connectButton.addEventListener('click', e256_MIDIConnect);
calibrateButton.addEventListener('click', e256_calibrate);
getBlobsButton.addEventListener('click', e256_getBlobs);
getRawButton.addEventListener('click', e256_getRawMatriw);
loadFileButton.addEventListener('change', e256_loadFile);
sendFileButton.addEventListener('click', e256_sendFile);

const MIDI_CHANNEL = 1;

const NOTE_ON           = 0x90; // 
const NOTE_OFF          = 0x80; //
const CONTROL_CHANGE    = 0xB0; //
const PROGRAM_CHANGE    = 0xC0; //

const SYSTEM_EXCLUSIVE  = 0xF0; // 240
const SYSEX_BEGIN       = 0xF0; // 240
const SYSEX_END         = 0xF7; // 247
const SYSEX_ID          = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF        = 0x7C; // 124
const SYSEX_SOUND       = 0x6C; // 108

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

var connected = false;
var fileType = "";
var config = "";

async function e256_MIDIConnect() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({sysex: true}).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("No MIDI support in your browser!");
  }
}

var output;

function onMIDISuccess(midiAccess) {
  listInputsAndOutputs(midiAccess);
  for (var entry of midiAccess.inputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      input = entry;
      input.onmidimessage = (onMIDIMessage);
      connectButton.innerHTML = 'E256_CONNECTED';
      connectButton.style.background = "rgb(10,180,0)";
      connected = true;
    }
  }
  for (var entry of midiAccess.outputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      output = entry;
    }
  }
}

//TODO: need a drop down menu!
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
  alert("eTextile-Synthesizer NOT CONNECTED! || No MIDI support in your browser! " + error);
}

class matrix {
  constructor(size) {
    this.matrix = [size];
  }
  update(index, val) {
    this.matrix[index] = val / 10;
  }
  getZ(index) {
    let val = this.matrix[index];
    if (val != null) {
      return val;
    }
    else {
      return 0;
    }
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
    console.log("ADD_BLOB " + id);
  }

  remove(id) {
    for (var i = 0; i < this.blobs.length; i++) {
      if (this.blobs[i].id === id) {
        this.blobs.splice(i, 1);
        console.log("REMOVE_BLOB " + id);
        break;
      }
    }
  }

  update(id, param, val) {
    for (var i = 0; i < this.blobs.length; i++) {
      if (this.blobs[i].id === id) {
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
  get() {
    return this.blobs;
  }
}

let e256_matrix = new matrix(256);
let e256_blobs = new blobs();

function onMIDIMessage(midiMsg) {
  var status = midiMsg.data[0];
  var channel = midiMsg.data[0] & 0xF;
  switch (status) {
    case NOTE_ON:
      e256_blobs.add(midiMsg.data[1]);
      break;
    case NOTE_OFF:
      e256_blobs.remove(midiMsg.data[1]);
      break;
    case CONTROL_CHANGE:
      e256_blobs.update(channel, midiMsg.data[1], midiMsg.data[2]);
      break;
    case PROGRAM_CHANGE:
      //console.log("PROGRAM_CHANGE " + midiMsg.data[1]);
      //256_mode.select(midiMsg.data[1]); //TODO 
      break;
    case SYSTEM_EXCLUSIVE:
      //TODO: fetch the config file!?
      for (var i = 1; i < midiMsg.data.length - 1; i++) {
        e256_matrix.update(i - 1, midiMsg.data[i]);
      }
      break;
  }
}

function noteOn(note, volume) {
  output.send([NOTE_ON, note, volume])
}

function noteOff(note) {
  output.send([NOTE_OFF, note, 0]);
}

function controlChange(value) {
  if (connected){
    output.send([CONTROL_CHANGE, value]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  }
}

function programChange(value) {
  if (connected){
    output.send([PROGRAM_CHANGE, value]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  }
}

//Must provides the data in chunks!
//TODO: https://github.com/PaulStoffregen/cores/pull/17
function sysex(identifier, data) {
  console.log(data.size);
  let header = [SYSEX_BEGIN, SYSEX_ID, identifier];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  output.send(midiMsg);
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

function e256_loadFile(event) {
  var uploadedFile = event.target.files[0];
  if (uploadedFile.type === "application/json"){
    fileType = 'json';
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
  }
  else if (uploadedFile.type === "application/wav"){
    fileType = 'wav';
    //TODO
  } else {
    alert("Wrong file type!"); 
  }
}

function onReaderLoad(event){
  try {
    config = JSON.parse(event.target.result);
    console.log("NAME:" + config.NAME + " " + config.PROJECT + " " + config.VERSION);
  } catch(e) {
    alert(e); // error in the above string!
  }
}

function e256_sendFile() {
  if (connected){
    if (fileType === 'json'){    
      sysex(SYSEX_CONF, Array.from(JSON.stringify(config)).map(letter => letter.charCodeAt(0)));
    }
    else if (fileType === 'wav'){
      //sysex(SYSEX_SOUND, sound);
    } else {
      alert("CONFIG FILE MISSING!");
    }
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  }
}
