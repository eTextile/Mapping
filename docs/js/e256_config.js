/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.12";

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;

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
const CALIBRATE_REQUEST = 0;   // Calibrate the e256 matrix sensor 
const CONFIG_FILE_REQUEST = 1; // Look if there is loaded CONFIG file in the ETEXTILE_SYNTH

// LEVELS CONSTANTS (MIDI_LEVELS_CHANNEL)
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |

// E256 MIDI I/O CONSTANTS
const NOTE_ON = 0x90;          // DEC: 144 (fon channel 1) -> + 1 for channel two... 
const NOTE_OFF = 0x80;         // DEC: 128 (fon channel 1) -> + 1 for channel two... 
const CONTROL_CHANGE = 0xB0;   // DEC: 176 (fon channel 1) -> + 1 for channel two... 
const PROGRAM_CHANGE = 0xC0;   // DEC: 192
const SYSTEM_EXCLUSIVE = 0xF0; // DEC: 240
const SYSEX_BEGIN = 0xF0;      // DEC: 240
const SYSEX_END = 0xF7;        // DEC: 247
const SYSEX_DEVICE_ID = 0x7D;  // DEC: 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF = 0x7C;       // DEC: 124
const SYSEX_SOUND = 0x6C;      // DEC: 108

const SYNC_MODE_TIMEOUT = 4000;
const MAX_PARAMS = 15;

const PENDING_MODE_DONE = "PENDING_MODE_DONE";
const SYNC_MODE_DONE = "SYNC_MODE_DONE";
const MATRIX_MODE_RAW_DONE = "MATRIX_MODE_RAW_DONE";
const MATRIX_MODE_INTERP_DONE = "MATRIX_MODE_INTERP_DONE";
const EDIT_MODE_DONE = "EDIT_MODE_DONE";
const PLAY_MODE_DONE = "PLAY_MODE_DONE";
const FLASH_CONFIG_ALLOC_DONE = "FLASH_CONFIG_ALLOC_DONE";
const FLASH_CONFIG_LOAD_DONE = "FLASH_CONFIG_LOAD_DONE";
const FLASH_CONFIG_WRITE_DONE = "FLASH_CONFIG_WRITE_DONE";
const USBMIDI_CONFIG_ALLOC_DONE = "USBMIDI_CONFIG_ALLOC_DONE";
const USBMIDI_CONFIG_LOAD_DONE = "USBMIDI_CONFIG_LOAD_DONE";
const CONFIG_APPLY_DONE = "CONFIG_APPLY_DONE";
const USBMIDI_SOUND_LOAD_DONE = "USBMIDI_SOUND_LOAD_DONE";
const USBMIDI_LEVEL_SET_DONE = "USBMIDI_LEVEL_SET_DONE";
const CALIBRATE_DONE = "CALIBRATE_DONE";
const DONE_ACTION = "DONE_ACTION";

// VERBOSITY CODES CONSTANTS
const VERBOSITY_CODES = [
  PENDING_MODE_DONE,
  SYNC_MODE_DONE,
  MATRIX_MODE_RAW_DONE,
  MATRIX_MODE_INTERP_DONE,
  EDIT_MODE_DONE,
  PLAY_MODE_DONE,
  FLASH_CONFIG_ALLOC_DONE,
  FLASH_CONFIG_LOAD_DONE,
  FLASH_CONFIG_WRITE_DONE,
  USBMIDI_CONFIG_ALLOC_DONE,
  USBMIDI_CONFIG_LOAD_DONE,
  CONFIG_APPLY_DONE,
  USBMIDI_SOUND_LOAD_DONE,
  USBMIDI_LEVEL_SET_DONE,
  CALIBRATE_DONE,
  DONE_ACTION
];

const WAITING_FOR_CONFIG = "WAITING_FOR_CONFIG";
const CONNECTING_FLASH = "CONNECTING_FLASH";
const FLASH_FULL = "FLASH_FULL";
const FILE_TO_BIG = "FILE_TO_BIG";
const NO_CONFIG_FILE = "NO_CONFIG_FILE";
const WHILE_OPEN_FLASH_FILE = "WHILE_OPEN_FLASH_FILE";
const USBMIDI_CONFIG_LOAD_FAILED = "USBMIDI_CONFIG_LOAD_FAILED";
const FLASH_CONFIG_LOAD_FAILED = "FLASH_CONFIG_LOAD_FAILED";
const CONFIG_APPLY_FAILED = "CONFIG_APPLY_FAILED";
const UNKNOWN_SYSEX = "UNKNOWN_SYSEX";
const TOO_MANY_BLOBS = "TOO_MANY_BLOBS";

// ERROR CODES CONSTANTS
const ERROR_CODES = [
  WAITING_FOR_CONFIG,
  CONNECTING_FLASH,
  FLASH_FULL,
  FILE_TO_BIG,
  NO_CONFIG_FILE,
  WHILE_OPEN_FLASH_FILE,
  USBMIDI_CONFIG_LOAD_FAILED,
  FLASH_CONFIG_LOAD_FAILED,
  CONFIG_APPLY_FAILED,
  UNKNOWN_SYSEX,
  TOO_MANY_BLOBS
];

// MAPPING_LIB CONSTANTS
const H_SLIDER = 0;
const V_SLIDER = 1;
