/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.24";

const DEBUG = true; ///////////////////////////////

var current_controleur = { "id": null };
var previous_controleur = { "id": null };
var current_touch = { "id": null };
var previous_touch = { "id": null };
var current_part = { "id": null };

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 16777216; // 128 Mb
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;
const SCALE_X = 4;
const SCALE_Y = 4;
const NEW_COLS = (RAW_COLS * SCALE_X);
const NEW_ROWS = (RAW_ROWS * SCALE_Y);
const NEW_FRAME = (NEW_COLS * NEW_ROWS);

//const X_PADDING_LEFT = 1;
//const X_PADDING_REIGHT = 1;
//const Y_PADDING_TOP = 1;
//const Y_PADDING_BOTTOM = 1;

//const MATRIX_RESOLUTION_X = NEW_FRAME - X_PADDING_LEFT - X_PADDING_REIGHT;
//const MATRIX_RESOLUTION_Y = NEW_FRAME - Y_PADDING_TOP - Y_PADDING_BOTTOM;

// E256 SOFTWARE CONSTANTS
const TOUCH_RADIUS = 25;
const FONT_SIZE = 20;

// E256 MIDI I/O CHANNELS CONSTANTS [1:15]
const MIDI_LEVELS_CHANNEL = 3;
const MIDI_MODES_CHANNEL = 4;
const MIDI_VERBOSITY_CHANNEL = 5;
const MIDI_ERROR_CHANNEL = 6;

// E256 LEVELS CONSTANTS (MIDI_LEVELS_CHANNEL)
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |

// E256 MIDI TYPES CONSTANTS
const NOTE_OFF = 0x80;           // NOTE_OFF // 1 0 0 0  // OFF to ON = OFF | ON
const NOTE_ON = 0x90;            // NOTE_ON // 1 0 0 1  // ON to OFF = ON & OFF
const AFTERTOUCH_POLY = 0xA0;    // POLYPHONIC_AFTERTOUCH
const C_CHANGE = 0xB0;           // CONTROL_CHANGE
const P_CHANGE = 0xC0;           // PROGRAM_CHANGE
const AFTERTOUCH_CHANNEL = 0xD0; // CHANNEL_AFTERTOUCH
const PITCH_BEND = 0xE0;         // PITCH_BEND
const SYS_EX = 0xF0;             // SYSTEM_EXCLUSIVE

// const TIMECODEQUARTERFRAME = 0xF1;
// const SONGPOSITION = 0xF2;
// const SONGSELECT = 0xF3;
// const TUNEREQUEST = 0xF6;
// const CLOCK = 0xF8;
// const START = 0xFA;
// const CONTINUE = 0xFB;
// const STOP = 0xFC;
// const ACTIVESENSING = 0xFE;
// const SYSTEMRESET = 0xFF;

// const 0xF8-0xFF - if more specific handler not configured

const SYSEX_BEGIN = 0xF0;      // DEC: 240
const SYSEX_END = 0xF7;        // DEC: 247
const SYSEX_DEVICE_ID = 0x7D;  // DEC: 253 http://midi.teragonaudio.com/tech/midispec/id.html

const SYSEX_CONF = 0x7C;       // DEC: 124
//const SYSEX_SOUND = 0x6C;    // DEC: 108
//const SYSEX_VOLUMES = ;      //

const MIDI_TYPES = {
  0x80: "NOTE_OFF",           // NOTE_OFF
  0x90: "NOTE_ON",            // NOTE_ON
  0xA0: "AFTERTOUCH_POLY",    // POLYPHONIC_AFTERTOUCH
  0xB0: "C_CHANGE",           // CONTROL_CHANGE
  0xC0: "P_CHANGE",           // PROGRAM_CHANGE
  0xD0: "AFTERTOUCH_CHANNEL", // CHANNEL_AFTERTOUCH
  0xE0: "P_BEND",             // PITCH_BEND
  0xF0: "SYS_EX"              // SYSTEM_EXCLUSIVE
};

const DATA1 = {
  0x80: "note",
  0x90: "note",
  0xA0: "note",
  0xB0: "cc",
  0xC0: "pgm",
  0xD0: "lsb",
  0xE0: "lsb",
  0xF0: "press"
};

const DATA2 = {
  0x80: "velo",
  0x90: "velo",
  0xA0: "ctr",
  0xB0: null,
  0xC0: null,
  0xD0: "msb",
  0xE0: "msb",
  0xF0: null
};

// E256 MODES CONSTANTS (MIDI_MODES_CHANNEL)
const PENDING_MODE = 0;     // Waiting mode
const SYNC_MODE = 1;        // Hand chake mode
const CALIBRATE_MODE = 2;   //
const MATRIX_RAW_MODE = 3;  // Get matrix analog sensor values (16x16) over USB using MIDI format
const MAPPING_MODE = 4;     // 
const EDIT_MODE = 5;        // Get all blobs values over USB using MIDI format
const THROUGH_MODE = 6;     // 
const PLAY_MODE = 7;        // Get mappings values over USB using MIDI format
const ALLOCATE_MODE = 8;    //
const UPLOAD_MODE = 9;      //
const APPLY_MODE = 10;      //
const WRITE_MODE = 11;      //
const LOAD_MODE = 12;       //
const FETCH_MODE = 13;      // Request mapping config file
const STANDALONE_MODE = 14; // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const ERROR_MODE = 15;      // Unexpected behaviour

// VERBOSITY MODES CONSTANTS
const MODE_CODES = {
  0: "PENDING_MODE",
  1: "SYNC_MODE",
  2: "CALIBRATE_MODE",
  3: "MATRIX_RAW_MODE",
  4: "MAPPING_MODE",
  5: "EDIT_MODE",
  6: "THROUGH_MODE",
  7: "PLAY_MODE",
  8: "ALLOCATE_MODE",
  9: "UPLOAD_MODE",
  10: "APPLY_MODE",
  11: "WRITE_MODE",
  12: "LOAD_MODE",
  13: "FETCH_MODE",
  14: "STANDALONE_MODE",
  15: "ERROR_MODE"
};

// E256 VERBOSITY MODES CONSTANTS ACKNOWLEDGMENT
const PENDING_MODE_DONE = 0;
const SYNC_MODE_DONE = 1;
const CALIBRATE_MODE_DONE = 2;
const MATRIX_RAW_MODE_DONE = 3;
const MAPPING_MODE_DONE = 4
const EDIT_MODE_DONE = 5;
const THROUGH_MODE_DONE = 6;
const PLAY_MODE_DONE = 7;
const ALLOCATE_MODE_DONE = 8;
const ALLOCATE_DONE = 9;
const UPLOAD_MODE_DONE = 10;
const UPLOAD_DONE = 11;
const CONFIG_APPLY_DONE = 12;
const WRITE_MODE_DONE = 13;
const LOAD_MODE_DONE = 14;
const FETCH_MODE_DONE = 15;
const STANDALONE_MODE_DONE = 16;
const DONE_ACTION = 17;

const VERBOSITY_CODES = {
  0: "PENDING_MODE_DONE",
  1: "SYNC_MODE_DONE",
  2: "CALIBRATE_MODE_DONE",
  3: "MATRIX_RAW_MODE_DONE",
  4: "MAPPING_MODE_DONE",
  5: "EDIT_MODE_DONE",
  6: "THROUGH_MODE_DONE",
  7: "PLAY_MODE_DONE",
  8: "ALLOCATE_MODE_DONE",
  9: "ALLOCATE_DONE",
  10: "UPLOAD_MODE_DONE",
  11: "UPLOAD_DONE",
  12: "CONFIG_APPLY_DONE",
  13: "WRITE_MODE_DONE",
  14: "LOAD_MODE_DONE",
  15: "FETCH_MODE_DONE",
  16: "STANDALONE_MODE_DONE",
  17: "DONE_ACTION"
};

// E256 ERROR CODES CONSTANTS
const WAITING_FOR_CONFIG = 0;
const CONNECTING_FLASH = 1;
const FLASH_FULL = 2;
const FILE_TO_BIG = 3;
const NO_CONFIG_FILE = 4;
const WHILE_OPEN_FLASH_FILE = 5;
const USBMIDI_CONFIG_LOAD_FAILED = 6;
const FLASH_CONFIG_LOAD_FAILED = 7;
const FLASH_CONFIG_WRITE_FAILED = 8;
const CONFIG_APPLY_FAILED = 9;
const UNKNOWN_SYSEX = 10;
const TOO_MANY_BLOBS = 11;

const ERROR_CODES = {
  0: "WAITING_FOR_CONFIG",
  1: "CONNECTING_FLASH",
  2: "FLASH_FULL",
  3: "FILE_TO_BIG",
  4: "NO_CONFIG_FILE",
  5: "WHILE_OPEN_FLASH_FILE",
  6: "USBMIDI_CONFIG_LOAD_FAILED",
  7: "FLASH_CONFIG_LOAD_FAILED",
  8: "FLASH_CONFIG_WRITE_FAILED",
  9: "CONFIG_APPLY_FAILED",
  10: "UNKNOWN_SYSEX",
  11: "TOO_MANY_BLOBS"
};
