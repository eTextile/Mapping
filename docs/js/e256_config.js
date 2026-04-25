/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.26";

const DEBUG = false;

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
const INTERP_CHUNK_SIZE = 256;
const INTERP_NUM_CHUNKS = NEW_FRAME / INTERP_CHUNK_SIZE;

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
const MIDI = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  AFTERTOUCH_POLY: 0xA0,
  CONTROL_CHANGE: 0xB0,
  PROGRAM_CHANGE: 0xC0,
  AFTERTOUCH_CHANNEL: 0xD0,
  PITCH_BEND: 0xE0,
};

const MIDI_BY_NAME = Object.fromEntries(
  Object.entries(MIDI).map(([k, v]) => [v, k])
);

const MIDI_SYSEX = {
  START: 0xF0,
  END: 0xF7,
  DEVICE_ID: 0x7D,
  CONFIG: 0x7C
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

const PRESSURE = {
  0x90: "NoteOn",        // TRIGGER NOTE WITH VELOCITY
  0xB0: "ControlChange", // PRESSURE ONLY
  0xA0: "AfterTouchPoly" // TRIGGER NOTE AND MODULATE
}

const PRESSURE_CODES = Object.fromEntries(
  Object.entries(PRESSURE).map(([k, v]) => [v, Number(k)])
);

const MOVE = {
  0: "LIN",
  1: "LOG",
  2: "ROL"
};

const MOVE_CODES = Object.fromEntries(
  Object.entries(MOVE).map(([k, v]) => [v, Number(k)])
);

const POPULATE = {
  0: "OFF",
  1: "UP",
  2: "DOWN",
  3: "AS_PLAYED",
  4: "OCTAVE",
  5: "PING_PONG"
};

const POPULATE_CODES = Object.fromEntries(
  Object.entries(POPULATE).map(([k, v]) => [v, Number(k)])
);

const MODE = {
  PENDING: 0,
  SYNC: 1,
  CALIBRATE: 2,
  MATRIX_RAW: 3,
  MATRIX_INTERP: 4,
  MAPPING: 5,
  EDIT: 6,
  THROUGH: 7,
  PLAY: 8,
  ALLOCATE_CONFIG: 9,
  UPLOAD_CONFIG: 10,
  APPLY_CONFIG: 11,
  WRITE_CONFIG: 12,
  LOAD_CONFIG: 13,
  FETCH_CONFIG: 14,
  STANDALONE: 15,
  ERROR: 16
};

const MODE_CODES = Object.fromEntries(
  Object.entries(MODE).map(([k, v]) => [v, k])
);

// E256 MODE_ACKNOWLEDGMENT CONSTANTS MODES
const MODE_ACK = {
  PENDING: 0,
  SYNC: 1,
  CALIBRATE: 2,
  MATRIX_RAW: 3,
  MATRIX_INTERP: 4,
  MAPPING: 5,
  EDIT: 6,
  THROUGH: 7,
  PLAY: 8,
  ALLOCATE_CONFIG: 9,
  ALLOCATE_DONE: 10,
  UPLOAD_CONFIG: 11,
  UPLOAD_DONE: 12,
  APPLY_CONFIG: 13,
  WRITE_CONFIG: 14,
  LOAD_CONFIG: 15,
  FETCH_CONFIG: 16,
  STANDALONE: 17,
  DONE_ACTION: 18
};

const MODE_ACK_CODES = Object.fromEntries(
  Object.entries(MODE_ACK).map(([k, v]) => [v, k])
);

// E256 ERROR CODES CONSTANTS
const ERROR = {
  WAITING_FOR_CONFIG: 0,
  CONNECTING_FLASH: 1,
  FLASH_FULL: 2,
  FILE_TOO_BIG: 3,
  NO_CONFIG_FILE: 4,
  WHILE_OPEN_FLASH_FILE: 5,
  USBMIDI_CONFIG_LOAD_FAILED: 6,
  FLASH_CONFIG_LOAD_FAILED: 7,
  FLASH_CONFIG_WRITE_FAILED: 8,
  CONFIG_APPLY_FAILED: 9,
  UNKNOWN_SYSEX: 10,
  TOO_MANY_BLOBS: 11
};

const ERROR_CODES = Object.fromEntries(
  Object.entries(ERROR).map(([k, v]) => [v, k])
);