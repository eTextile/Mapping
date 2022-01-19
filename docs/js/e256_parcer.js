
const MIDI_INPUT_CHANNEL          = 1; // [1:15] Set the HARDWARE MIDI_INPUT channel
const MIDI_OUTPUT_CHANNEL         = 1; // [1:15] Set the HARDWARE MIDI_OUTPUT channel
// E256 HARDWARE CONSTANTS
const FLASH_SIZE                  = 4096;
const RAW_COLS                    = 16;
const RAW_ROWS                    = 16;
const RAW_FRAME                   = RAW_COLS * RAW_ROWS;
// MODES
const RAW_MATRIX                  = 0; //
const INTERP_MATRIX               = 1; //
const BLOBS                       = 2; // Send all blobs values over USB using MIDI format
const MAPPING                     = 3; //
// STATES
const CALIBRATE                   = 10; //
const DONE_ACTION                 = 11; //
const ERROR                       = 12; //
const GET_CONFIG                  = 13; //
// LEVELS
const SIG_IN                      = 0; // E256-LEDs: | 1 | 0 |
const SIG_OUT                     = 1; // E256-LEDs: | 0 | 1 |
const LINE_OUT                    = 2; // E256-LEDs: | 0 | 0 |
const THRESHOLD                   = 3; // E256-LEDs: | 1 | 1 |
// MIDI CONSTANTS
const NOTE_ON                     = 0x90; // 
const NOTE_OFF                    = 0x80; //
const CONTROL_CHANGE              = 0xB0; //
const PROGRAM_CHANGE              = 0xC0; //
const SYSTEM_EXCLUSIVE            = 0xF0; // 240
const SYSEX_BEGIN                 = 0xF0; // 240
const SYSEX_END                   = 0xF7; // 247
const SYSEX_ID                    = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF                  = 0x7C; // 124
const SYSEX_SOUND                 = 0x6C; // 108
// VERBOSITY
const DONE_FLASH_CONFIG_ALLOC     = 16;
const DONE_FLASH_CONFIG_LOAD      = 17;
const DONE_FLASH_CONFIG_WRITE     = 18;
const DONE_USBMIDI_CONFIG_ALLOC   = 19;
const DONE_USBMIDI_CONFIG_LOAD    = 20;
const DONE_USBMIDI_SOUND_LOAD     = 21;
// ERROR CODES
const ERROR_WAITING_FOR_GONFIG    = 33;
const ERROR_LOADING_GONFIG_FAILED = 34;
const ERROR_CONNECTING_FLASH      = 35;
const ERROR_WHILE_OPEN_FLASH_FILE = 36;
const ERROR_FLASH_FULL            = 37;
const ERROR_FILE_TO_BIG           = 38;
const ERROR_NO_CONFIG_FILE        = 39;
const ERROR_UNKNOWN_SYSEX         = 40;

const BI  = 0; // [0] Blob UID
const BS  = 1; // [1] Blob State
const BL  = 2; // [2] Blob Last State
const BX  = 3; // [3] Blob X centroid position
const BY  = 4; // [4] Blob Y centroid position
const BZ  = 5; // [5] Blob Depth
const BW  = 6; // [6] Blob width
const BH  = 7; // [7] Blob Height

var MIDIInput
var MIDIIoutput;
var connected = false;
var sysEx_mode;
var fileType = "";
var config = "";

async function e256_MIDIConnect() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({sysex: true}).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("No MIDI support in your browser!");
  };
};

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
    };
  };
  for (var entry of midiAccess.outputs.values()) {
    if (entry.name === 'ETEXTILE_SYNTH MIDI 1') {
      MIDIIoutput = entry;
    };
  };
};

// TODO: need a drop down menu!
function listInputsAndOutputs(midiAccess) {
  for (var entry of midiAccess.inputs) {
    var input = entry[1];
    console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
                 "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
                 "' version:'" + input.version + "'" );
  };
  for (var entry of midiAccess.outputs) {
    var output = entry[1];
    console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
                 "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
                 "' version:'" + output.version + "'" );
  };
};

function onMIDIFailure(error) {
  alert("eTextile-Synthesizer NOT CONNECTED! || No MIDI support in your browser! " + error);
};

class matrix {
  constructor(size) {
    this.matrix = [size];
  };
  update(sysExMsg) {
    for (var i = 0; i < RAW_FRAME; i++) {
      this.matrix[i] = sysExMsg[i + 1] / 10;
    };
  };
  Z(index) {
    var val = this.matrix[index];
    if (val != null) {
      return val;
    }
    else {
      return 0;
    };
  };
};

class blob {
  constructor(id, x, y, z, w, h) {
    this.id = id;
    this.x = x; // Blob X centroid position
    this.y = y; // Blob Y centroid position
    this.z = z; // Blob Depth
    this.w = w; // Blob width
    this.h = h; // Blob Height
  };
};

class blobs {
  constructor() {
    this.blobs = [];
  }
  set add(noteOn) {
    let newBlob = new blob(noteOn[1]);
    this.blobs.push(newBlob);
    console.log("ADD_BLOB: " + noteOn[1]);
  };
  set remove(noteOff) {
    for (var i = 0; i < this.blobs.length; i++) {
      if (this.blobs[i].id === noteOff[1]) {
        this.blobs.splice(i, 1);
        console.log("REMOVE_BLOB: " + noteOff[1]);
        break;
      };
    };
  };
  set update(sysEx) {
    for (var i = 0; i < this.blobs.length; i++) {
      if (this.blobs[i].id === sysEx.data[1]) {
        this.blobs[i].x = sysEx[2];
        this.blobs[i].y = sysEx[3];
        this.blobs[i].z = sysEx[4];
        this.blobs[i].w = sysEx[5];
        this.blobs[i].h = sysEx[6];
        console.log("BLOB_X: " + this.blobs[i].x);       
      };
    };
  };
  /*
  update(controlChange) {
    for (var i = 0; i < this.blobs.length; i++) {
      if (this.blobs[i].id === (controlChange[0] & 0xf)) {
        switch (controlChange[1]) {
          case BX:
            this.blobs[i].x = val;
            //console.log("BLOB_X " + this.blobs[i].x);
            break;
          case BY:
            this.blobs[i].y = controlChange[2];
            break;
          case BZ:
            this.blobs[i].z = controlChange[2];
            break;
          case BW:
            this.blobs[i].w = controlChange[2];
            break;
          case BH:
            this.blobs[i].h = controlChange[2];
            break;
        };
        break;
      };
    };
  };
  */
  get all() {
    return this.blobs;
  };
  get size() {
    return this.blobs.length;
  };
};

//let e256_matrix = new matrix(256);
//let e256_blobs = new blobs();

function onMIDIMessage(midiMsg) {
  //let status = midiMsg.data[0] >> 4;
  let status = midiMsg.data[0];
  switch (status) {
    case NOTE_ON:
      e256_blobs.add(midiMsg.data);
      break;
    case NOTE_OFF:
      e256_blobs.remove(midiMsg.data);
      break;
    case CONTROL_CHANGE:
      //e256_blobs.update(midiMsg.data);
      break;
    case PROGRAM_CHANGE:
      switch(midiMsg.data[1]){
        case DONE_USBMIDI_CONFIG_ALLOC:
          sysex_load(Array.from(JSON.stringify(config)).map(letter => letter.charCodeAt(0)));
          break;
        case DONE_USBMIDI_CONFIG_LOAD:
          alert("eTextile-Synthesizer: LOAD CONFIG DONE!");
          break;
        default:
          //console.log("midiMsg: " + midiMsg.data[1]);
          break;
      };
      break;
    case SYSTEM_EXCLUSIVE:
      switch(sysEx_mode){
        case BLOBS:
          e256_blobs.update(midiMsg.data); // FIXME!
          break;
        case GET_CONFIG:
          // TODO: fetch config file
          break;
        case RAW_MATRIX:
          e256_matrix.update(midiMsg.data);
          break;
        default:
          //console.log("midiMsg: " + midiMsg.data[1]);
          break;
      };
      break;
    default:
      break;
  };
};

function noteOn(note, volume) {
  if (connected){
    MIDIIoutput.send([NOTE_ON, note, volume]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

function noteOff(note) {
  if (connected){
    MIDIIoutput.send([NOTE_OFF, note, 0]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

function controlChange(value) {
  if (connected){
    MIDIIoutput.send([CONTROL_CHANGE, value]);
  } else {
    alert("eTextile-Synthesizer NOT CONNECTED!");
  };
};

function programChange(value) {
  if (connected){
    MIDIIoutput.send([PROGRAM_CHANGE, value]);
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
  MIDIIoutput.send(midiMsg);
};

function sysex_load(data) {
  let header = [SYSEX_BEGIN, SYSEX_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  MIDIIoutput.send(midiMsg);
};

function e256_sendParams(){
  switch(this.id){
    case 'getRawButton':
      programChange(RAW_MATRIX);
      sysEx_mode = RAW_MATRIX;
      break;
    case 'getBlobsButton':
      programChange(BLOBS);
      sysEx_mode = BLOBS;
      break;
    case 'getConfigButton':
      programChange(GET_CONFIG);
      sysEx_mode = GET_CONFIG;
    break;
    case 'setMappingButton':
      programChange(MAPPING);
      sysEx_mode = MAPPING;
      break;
    case 'calibrateButton':
      programChange(CALIBRATE);
      break;
    default:
      break;
  };
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
      sysex_alloc(SYSEX_CONF, Object.keys(JSON.midiMsg(config)).length);
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