/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.27";

const DEBUG = false;

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
const BLOB_MAX_SIZE = 500;
const TOUCH_RADIUS = 25;
const FONT_SIZE = 20;
const TOUCH_IDLE_COLOR = "cornflowerblue";

const MIDI_CHANNEL_MASK = 0x0F; // lower 4 bits of a MIDI status byte → channel (0-indexed)
const MIDI_TYPE_MASK    = 0xF0; // upper 4 bits of a MIDI status byte → message type

const MIDI_DEFAULT = {
  INPUT_CHANNEL: 1,
  OUTPUT_CHANNEL: 1,
  NOTE_ON: 64,
  VELOCITY: 127,
  CONTROL_CHANGE: 23,
  AFTERTOUCH_POLY: 24,
  MIN_VAL: 0,
  MAX_VAL: 127
};

// E256 MIDI TYPES CONSTANTS
const MIDI_TYPE = {
  NOTE_OFF: 0x80,
  NOTE_ON_ONLY: 0x91,
  NOTE_ON_OFF: 0x90,
  NOTE_ON: 0x90,
  AFTERTOUCH_POLY: 0xA0,
  CONTROL_CHANGE: 0xB0,
  PROGRAM_CHANGE: 0xC0,
  AFTERTOUCH_CHANNEL: 0xD0,
  PITCH_BEND: 0xE0,
  CLOCK: 0xF8,
  CHORD: 0xFE,
  NONE: 0xFF
};

const MIDI_BY_NAME = Object.fromEntries(
  Object.entries(MIDI_TYPE).map(([k, v]) => [v, k])
);

const MIDI_SHORT_NAME = {
  [MIDI_TYPE.NOTE_OFF]:           "NOFF",
  [MIDI_TYPE.NOTE_ON]:            "NON",
  [MIDI_TYPE.AFTERTOUCH_POLY]:    "AT",
  [MIDI_TYPE.CONTROL_CHANGE]:     "CC",
  [MIDI_TYPE.PROGRAM_CHANGE]:     "PC",
  [MIDI_TYPE.AFTERTOUCH_CHANNEL]: "CAT",
  [MIDI_TYPE.PITCH_BEND]:         "PB",
};

// E256 MIDI INPUT CHANNELS [1:15]
const MIDI_INPUT_CHAN = Object.fromEntries(
  Array.from({ length: 15 }, (_, i) => [i + 1, String(i + 1)])
);

// E256 MIDI SYSEX CONSTANTS
const MIDI_SYSEX = {
  START: 0xF0,
  END: 0xF7,
  DEVICE_ID: 0x7D
};

// SysEx packet types  (byte[2] after F0 + DEVICE_ID)
const SYSEX_PKT = {
  CMD:     0x01,  // web → firmware: mode command
  ACK:     0x02,  // firmware → web: mode acknowledgment
  ERR:     0x03,  // firmware → web: error
  PARAM:   0x04,  // firmware → web: level parameter value
  MIDI_IN: 0x05   // firmware → web: hardware MIDI IN forwarded message
};

// SysEx PARAM IDs (mirrors MIDI_CC / level_code_t in firmware)
const SYSEX_PARAM = {
  THRESHOLD: 0,
  SIG_IN:    1,
  SIG_OUT:   2,
  LINE_OUT:  3
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

const PRESSURE = [
  [MIDI_TYPE.NONE,            "None"],           // NO PRESS MIDI OUTPUT
  [MIDI_TYPE.NOTE_ON_ONLY,    "Trigger"],        // TRIGGER NOTE — NO RELEASE
  [MIDI_TYPE.NOTE_ON_OFF,     "Gate"],           // TRIGGER NOTE WITH VELOCITY GATE
  [MIDI_TYPE.CONTROL_CHANGE,  "ControlChange"],  // PRESSURE ONLY
  [MIDI_TYPE.AFTERTOUCH_POLY, "AfterTouchPoly"], // TRIGGER NOTE AND MODULATE
  [MIDI_TYPE.CHORD,           "Chord"],          // SEND A CHORD (switch only)
  [MIDI_TYPE.CLOCK,           "TapTempo"]        // TAP TEMPO — firmware sends MIDI Clock, no MIDI msg
];

const PRESSURE_CODES = Object.fromEntries(
  PRESSURE.map(([k, v]) => [v, k])
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

const CHORD_NAMES = {
  1: "Major",
  2: "Minor",
  3: "Diminished",
  4: "Augmented",
  5: "Maj7",
  6: "Min7",
  7: "Dom7",
  8: "Sus2",
  9: "Sus4"
};

const CHORD_INTERVALS = {
  1: [0, 4, 7],       // Major
  2: [0, 3, 7],       // Minor
  3: [0, 3, 6],       // Diminished
  4: [0, 4, 8],       // Augmented
  5: [0, 4, 7, 11],   // Maj7
  6: [0, 3, 7, 10],   // Min7
  7: [0, 4, 7, 10],   // Dom7
  8: [0, 2, 7],       // Sus2
  9: [0, 5, 7]        // Sus4
};

const NOTE_CLASSES = {
  0:  "C",
  1:  "C#",
  2:  "D",
  3:  "D#",
  4:  "E",
  5:  "F",
  6:  "F#",
  7:  "G",
  8:  "G#",
  9:  "A",
  10: "A#",
  11: "B"
};

const POPULATE_CODES = Object.fromEntries(
  Object.entries(POPULATE).map(([k, v]) => [v, Number(k)])
);

const GRID_LAYOUT = {
  0: "Sequential",
  1: "Fourths",
  2: "Thirds",
  3: "Fifths",
  4: "Omnichord",
};

const GRID_LAYOUT_ROW_STEP = { 0: null, 1: 5, 2: 4, 3: 7, 4: 5 };

const GRID_LAYOUT_DIMS = {
  0: { cols: 8, rows: 6 },
  1: { cols: 8, rows: 6 },
  2: { cols: 8, rows: 6 },
  3: { cols: 8, rows: 6 },
  4: { cols: 9, rows: 3 },
};

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

// TODO adding :
  // DESERIALIZATION_ERROR
// E256 ERROR CODES CONSTANTS
const ERROR = {
  CONFIG_FILE_MISSING: 0,
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
  TOO_MANY_BLOBS: 11,
  TOO_MANY_TOUCHS: 12
};

const ERROR_CODES = Object.fromEntries(
  Object.entries(ERROR).map(([k, v]) => [v, k])
);