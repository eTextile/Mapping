/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.21";

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

const X_PADDING_LEFT = 1;
const X_PADDING_REIGHT = 1;
const Y_PADDING_TOP = 1;
const Y_PADDING_BOTTOM = 1;

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

// LEVELS CONSTANTS (MIDI_LEVELS_CHANNEL)
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |

// E256 MIDI TYPES CONSTANTS
const NOTE_OFF = 0x8;     // NOTE_OFF // 1 0 0 0  // OFF to ON = OFF | ON
const NOTE_ON = 0x9;      // NOTE_ON // 1 0 0 1  // ON to OFF = ON & OFF
const P_AFTERTOUCH = 0xA; // POLYPHONIC_AFTERTOUCH
const C_CHANGE = 0xB;     // CONTROL_CHANGE
const P_CHANGE = 0xC;     // PROGRAM_CHANGE
const C_AFTERTOUCH = 0xD; // CHANNEL_AFTERTOUCH
const P_BEND = 0xE;       // PITCH_BEND
const SYS_EX = 0xF;       // SYSTEM_EXCLUSIVE

// const TimeCodeQuarterFrame = 0xF1;
// const SongPosition = 0xF2;
// const SongSelect = 0xF3;
// const TuneRequest = 0xF6;
// const Clock = 0xF8;
// const Start = 0xFA;
// const Continue = 0xFB;
// const Stop = 0xFC;
// const ActiveSensing = 0xFE;
// const SystemReset = 0xFF;

// const 0xF8-0xFF - if more specific handler not configured

const SYSEX_BEGIN = 0xF0;      // DEC: 240
const SYSEX_END = 0xF7;        // DEC: 247
const SYSEX_DEVICE_ID = 0x7D;  // DEC: 253 http://midi.teragonaudio.com/tech/midispec/id.html

const SYSEX_CONF = 0x7C;       // DEC: 124
const SYSEX_SOUND = 0x6C;      // DEC: 108
//...

const MIDI_TYPES = {
  0x8: "NOTE_OFF",        // NOTE_OFF
  0x9: "NOTE_ON",         // NOTE_ON
  0xA: "P_AFTERTOUCH",    // POLYPHONIC_AFTERTOUCH
  0xB: "C_CHANGE",        // CONTROL_CHANGE
  0xC: "P_CHANGE",        // PROGRAM_CHANGE
  0xD: "C_AFTERTOUCH",    // CHANNEL_AFTERTOUCH
  0xE: "P_BEND",          // PITCH_BEND
  0xF: "SYS_EX"           // SYSTEM_EXCLUSIVE
};

const DATA1 = {
  0x8: "note",
  0x9: "note",
  0xA: "press",
  0xB: "cc",
  0xC: "pgm",
  0xD: "lsb",
  0xE: "lsb",
  0xF: "press"
};

const DATA2 = {
  0x8: "velo",
  0x9: "velo",
  0xA: null,
  0xB: null,
  0xC: null,
  0xD: "msb",
  0xE: "msb",
  0xF: null
};

// E256 MODES CONSTANTS (MIDI_MODES_CHANNEL)
const PENDING_MODE = 0;     // Waiting mode
const SYNC_MODE = 1;        // Hand chake mode
const CALIBRATE_MODE = 2;   //
const MATRIX_MODE = 3;      // Get matrix analog sensor values (16x16) over USB using MIDI format
const MAPPING_MODE = 4;     //
const EDIT_MODE = 5;        // Get all blobs values over USB using MIDI format
const PLAY_MODE = 6;        // Get mappings values over USB using MIDI format
const ALLOCATE_MODE = 7;    //
const UPLOAD_MODE = 8;      //
const APPLY_MODE = 9;       //
const WRITE_MODE = 10;      //
const LOAD_MODE = 11;       //
const FETCH_MODE = 12;      // Request mapping config file
const STANDALONE_MODE = 13; // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const ERROR_MODE = 14;      // Unexpected behaviour

// VERBOSITY MODES CONSTANTS
const MODE_CODES = {
  0: "PENDING_MODE",
  1: "SYNC_MODE",
  2: "CALIBRATE_MODE",
  3: "MATRIX_MODE",
  4: "MAPPING_MODE",
  5: "EDIT_MODE",
  6: "PLAY_MODE",
  7: "ALLOCATE_MODE",
  8: "UPLOAD_MODE",
  9: "APPLY_MODE",
  10: "WRITE_MODE",
  11: "LOAD_MODE",
  12: "FETCH_MODE",
  13: "STANDALONE_MODE",
  14: "ERROR_MODE"
};

// VERBOSITY CODES CONSTANTS
const PENDING_MODE_DONE = 0;
const SYNC_MODE_DONE = 1;
const CALIBRATE_MODE_DONE = 2;
const MATRIX_MODE_DONE = 3;
const MAPPING_MODE_DONE = 4
const EDIT_MODE_DONE = 5;
const PLAY_MODE_DONE = 6;
const ALLOCATE_MODE_DONE = 7;
const ALLOCATE_DONE = 8;
const UPLOAD_MODE_DONE = 9;
const UPLOAD_DONE = 10;
const APPLY_MODE_DONE = 11;
const WRITE_MODE_DONE = 12;
const LOAD_MODE_DONE = 13;
const FETCH_MODE_DONE = 14;
const STANDALONE_MODE_DONE = 15;
const DONE_ACTION = 16;

const VERBOSITY_CODES = {
  0: "PENDING_MODE_DONE",
  1: "SYNC_MODE_DONE",
  2: "CALIBRATE_MODE_DONE",
  3: "MATRIX_MODE_DONE",
  4: "MAPPING_MODE_DONE",
  5: "EDIT_MODE_DONE",
  6: "PLAY_MODE_DONE",
  7: "ALLOCATE_MODE_DONE",
  8: "ALLOCATE_DONE",
  9: "UPLOAD_MODE_DONE",
  10: "UPLOAD_DONE",
  11: "APPLY_MODE_DONE",
  12: "WRITE_MODE_DONE",
  13: "LOAD_MODE_DONE",
  14: "FETCH_MODE_DONE",
  15: "STANDALONE_MODE_DONE",
  16: "DONE_ACTION"
};

// ERROR CODES CONSTANTS
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
