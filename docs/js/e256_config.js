/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.20";

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;
const MATRIX_RESOLUTION_X = 64;
const MATRIX_RESOLUTION_Y = 64;

// E256 MIDI I/O CHANNELS CONSTANTS [1:15]
// QUICK_FIX: if sending on channel 1, eTextile-synth is receiving on channel 2
const MIDI_INPUT_CHANNEL = 1;
const MIDI_OUTPUT_CHANNEL = 2;

const MIDI_MODES_CHANNEL = 3;
const MIDI_STATES_CHANNEL = 4;
const MIDI_LEVELS_CHANNEL = 5;
const MIDI_VERBOSITY_CHANNEL = 6;
const MIDI_ERROR_CHANNEL = 7;

// E256 MODES CONSTANTS (MIDI_MODES_CHANNEL)
const PENDING_MODE = 0;        // Waiting mode
const SYNC_MODE = 1;           // Hand chake mode
const STANDALONE_MODE = 2;     // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const MATRIX_MODE_RAW = 3;     // Get matrix analog sensor values (16x16) over USB using MIDI format
const MATRIX_MODE_INTERP = 4;  // Get matrix analog sensor values (16x16) over USB using MIDI format
const EDIT_MODE = 5;           // Get all blobs values over USB using MIDI format
const PLAY_MODE = 6;           // Get mappings values over USB using MIDI format
const ERROR_MODE = 7;          // Unexpected behaviour

// VERBOSITY MODES CONSTANTS
const MODES_CODES = {
  0: "PENDING_MODE",
  1: "SYNC_MODE",
  2: "STANDALONE_MODE",
  3: "MATRIX_MODE_RAW",
  4: "MATRIX_MODE_INTERP",
  5: "EDIT_MODE",
  6: "PLAY_MODE",
  7: "ERROR_MODE"
};

// STATES CONSTANTS (MIDI_STATES_CHANNEL)
const CALIBRATE_REQUEST = 0;   // Calibrate the ETEXTILE_SYNTH 
const CONFIG_FILE_REQUEST = 1; // Check if there is a config file loaded in the ETEXTILE_SYNTH

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

const SYSEX_BEGIN = 0xF0;      // DEC: 240
const SYSEX_END = 0xF7;        // DEC: 247
const SYSEX_DEVICE_ID = 0x7D;  // DEC: 253 http://midi.teragonaudio.com/tech/midispec/id.html
const SYSEX_CONF = 0x7C;       // DEC: 124
const SYSEX_SOUND = 0x6C;      // DEC: 108

const DATA1 = {
  0x8: "note",
  0x9: "note",
  0xA: "press",
  0xB: "cc", // val ==> cc
  0xC: "pgm",
  0xD: "lsb",
  0xF: "press"
};

const DATA2 = {
  0x8: "velo",
  0x9: "velo",
  0xA: "null",
  0xB: "null",
  0xC: "null",
  0xD: "msb",
  0xF: "null"
};

const SYNC_MODE_TIMEOUT = 4000;

// VERBOSITY CODES CONSTANTS
const PENDING_MODE_DONE = 0;
const SYNC_MODE_DONE = 1;
const MATRIX_MODE_RAW_DONE = 2;
const MATRIX_MODE_INTERP_DONE = 3;
const EDIT_MODE_DONE = 4;
const PLAY_MODE_DONE = 5;
const FLASH_CONFIG_ALLOC_DONE = 6;
const FLASH_CONFIG_LOAD_DONE = 7;
const FLASH_CONFIG_WRITE_DONE = 8;
const USBMIDI_CONFIG_ALLOC_DONE = 9;
const USBMIDI_CONFIG_LOAD_DONE = 10;
const CONFIG_APPLY_DONE = 11;
const USBMIDI_SOUND_LOAD_DONE = 12;
const USBMIDI_LEVEL_SET_DONE = 13;
const CALIBRATE_DONE = 14;
const DONE_ACTION = 15;

const VERBOSITY_CODES = {
  0: "PENDING_MODE_DONE",
  1: "SYNC_MODE_DONE",
  2: "MATRIX_MODE_RAW_DONE",
  3: "MATRIX_MODE_INTERP_DONE",
  4: "EDIT_MODE_DONE",
  5: "PLAY_MODE_DONE",
  6: "FLASH_CONFIG_ALLOC_DONE",
  7: "FLASH_CONFIG_LOAD_DONE",
  8: "FLASH_CONFIG_WRITE_DONE",
  9: "USBMIDI_CONFIG_ALLOC_DONE",
  10: "USBMIDI_CONFIG_LOAD_DONE",
  11: "CONFIG_APPLY_DONE",
  12: "USBMIDI_SOUND_LOAD_DONE",
  13: "USBMIDI_LEVEL_SET_DONE",
  14: "CALIBRATE_DONE",
  15: "DONE_ACTION"
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
const CONFIG_APPLY_FAILED = 8;
const UNKNOWN_SYSEX = 9;
const TOO_MANY_BLOBS = 10;

const ERROR_CODES = {
  0: "WAITING_FOR_CONFIG",
  1: "CONNECTING_FLASH",
  2: "FLASH_FULL",
  3: "FILE_TO_BIG",
  4: "NO_CONFIG_FILE",
  5: "WHILE_OPEN_FLASH_FILE",
  6: "USBMIDI_CONFIG_LOAD_FAILED",
  7: "FLASH_CONFIG_LOAD_FAILED",
  8: "CONFIG_APPLY_FAILED",
  9: "UNKNOWN_SYSEX",
  10: "TOO_MANY_BLOBS"
};

const DEFAULT_TOUCH_RADIUS = 25;
const DEFAULT_FONT_SIZE = 20;
