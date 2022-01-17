/*Define the elements*/
let connectButton = document.getElementById("connectButton");
let calibrateButton = document.getElementById("calibrateButton");
let getBlobsButton = document.getElementById("getBlobsButton");
let getRawButton = document.getElementById("getRawButton");
let loadFileButton = document.getElementById("loadFileButton");
let sendFileButton = document.getElementById("sendFileButton");

/*Couple the elements to the Events*/
connectButton.addEventListener('click', e256_MIDIConnect);
calibrateButton.addEventListener('click', e256_calibrate);
getBlobsButton.addEventListener('click', e256_getBlobs);
getRawButton.addEventListener('click', e256_getRawMatriw);
loadFileButton.addEventListener('change', e256_loadFile);
sendFileButton.addEventListener('click', e256_sendFile);

const MIDI_CHANNEL                = 1;

const NOTE_ON                     = 0x90; // 
const NOTE_OFF                    = 0x80; //
const CONTROL_CHANGE              = 0xB0; //
const PROGRAM_CHANGE              = 0xC0; //

const FLASH_SIZE                  = 4096;

const SYSTEM_EXCLUSIVE            = 0xF0; // 240
const SYSEX_BEGIN                 = 0xF0; // 240
const SYSEX_END                   = 0xF7; // 247
const SYSEX_ID                    = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm

const SYSEX_CONF                  = 0x7C; // 124
const SYSEX_SOUND                 = 0x6C; // 108

const ERROR_WAITING_FOR_GONFIG    = 33;
const ERROR_LOADING_GONFIG_FAILED = 34;
const ERROR_CONNECTING_FLASH      = 35;
const ERROR_WHILE_OPEN_FLASH_FILE = 36;
const ERROR_FLASH_FULL            = 37;
const ERROR_FILE_TO_BIG           = 38;
const ERROR_NO_CONFIG_FILE        = 39;
const ERROR_UNKNOWN_SYSEX         = 40;

const DONE_CONFIG_LOAD_FLASH      = 15;
const DONE_CONFIG_ALLOC           = 16;
const DONE_CONFIG_LOAD_USBMIDI    = 17;
const DONE_SOUND_LOAD_USBMIDI     = 18;
const DONE_CONFIG_FLASH           = 19;

const CALIBRATE                   = 2; //
const BLOBS_PLAY                  = 3; // Send all blobs values over USB using MIDI format
const MAPPING_LIB                 = 4; //
const RAW_MATRIX                  = 5; //
const INTERP_MATRIX               = 6; //

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
    this.x = x; // Blob X centroid position
    this.y = y; // Blob Y centroid position
    this.z = z; // Blob Depth
    this.w = w; // Blob width
    this.h = h; // Blob Height
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
      if (this.blobs[i].id === id) {
        this.blobs.splice(i, 1);
        //console.log("REMOVE_BLOB " + id);
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
  };
};

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
      switch(midiMsg.data[1]){
        case ALLOC_DONE:
          sysex_load(Array.from(JSON.stringify(config)).map(letter => letter.charCodeAt(0)));
          break;
        case LOAD_DONE:
          alert("eTextile-Synthesizer LOAD_CONFIG DONE!");
          break;
        default:
          //
          break;
      }
      break;
    case SYSTEM_EXCLUSIVE:
      //TODO: fetch the config file!?
      for (var i = 1; i < midiMsg.data.length - 1; i++) {
        e256_matrix.update(i - 1, midiMsg.data[i]);
      };
      break;
  };
};

function noteOn(note, volume) {
  if (connected){
    output.send([NOTE_ON, note, volume]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

function noteOff(note) {
  if (connected){
    output.send([NOTE_OFF, note, 0]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

function controlChange(value) {
  if (connected){
    output.send([CONTROL_CHANGE, value]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

function programChange(value) {
  if (connected){
    output.send([PROGRAM_CHANGE, value]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

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
  output.send(midiMsg);
};

function sysex_load(data) {
  let header = [SYSEX_BEGIN, SYSEX_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  output.send(midiMsg);
};

function e256_calibrate() {
  programChange(CALIBRATE);
};

function e256_getRawMatriw() {
  programChange(RAW_MATRIX);
};

function e256_getBlobs() {
  programChange(BLOBS_PLAY);
};

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
  };
};

function onReaderLoad(event){
  try {
    config = JSON.parse(event.target.result);
    //console.log("NAME:" + config.NAME + " " + config.PROJECT + " " + config.VERSION);
  } catch(e) {
    alert(e); // error in the above string!
  };
};

function e256_sendFile() {
  if (connected){
    if (fileType === 'json'){
      sysex_alloc(SYSEX_CONF, Object.keys(JSON.stringify(config)).length);
    }
    else if (fileType === 'wav'){
      //sysex_alloc(SYSEX_SOUND, sound.length);
    } else {
      alert("CONFIG FILE MISSING!");
    };
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};