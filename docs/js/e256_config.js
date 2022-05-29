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
const ERROR_MODE = 7;          //

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
const NOTE_ON = 0x90; // 
const NOTE_OFF = 0x80; //
const CONTROL_CHANGE = 0xB0; //
const PROGRAM_CHANGE = 0xC0; //
const SYSTEM_EXCLUSIVE = 0xF0; // 240
const SYSEX_BEGIN = 0xF0; // 240
const SYSEX_END = 0xF7; // 247
const SYSEX_DEVICE_ID = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF = 0x7C; // 124
const SYSEX_SOUND = 0x6C; // 108

const SYNC_MODE_TIMEOUT = 2000;
const MAX_PARAMS = 15;

const PENDING_MODE_DONE = 0;
const SYNC_MODE_DONE = 1;
const USBMIDI_CONFIG_ALLOC_DONE = 9;

// VERBOSITY CODES CONSTANTS
const VERBOSITY_CODES = {
  0:  "PENDING_MODE_DONE",
  1:  "SYNC_MODE_DONE",
  2:  "MATRIX_MODE_RAW_DONE",
  3:  "MATRIX_MODE_INTERP_DONE",
  4:  "EDIT_MODE_DONE",
  5:  "PLAY_MODE_DONE",
  6:  "FLASH_CONFIG_ALLOC_DONE",
  7:  "FLASH_CONFIG_LOAD_DONE",
  8:  "FLASH_CONFIG_WRITE_DONE",
  9: "USBMIDI_CONFIG_ALLOC_DONE",
  10: "USBMIDI_CONFIG_LOAD_DONE",
  11: "CONFIG_APPLY_DONE",
  12: "USBMIDI_SOUND_LOAD_DONE",
  13: "USBMIDI_LEVEL_SET_DONE",
  14: "CALIBRATE_DONE",
  15: "DONE_ACTION"
};

// ERROR CODES CONSTANTS
const ERROR_CODES = {
  0: "WAITING_FOR_CONFIG",
  1: "CONNECTING_FLASH",
  2: "FLASH_FULL",
  3: "FILE_TO_BIG",
  4: "NO_CONFIG_FILE",
  5: "WHILE_OPEN_FLASH_FILE",
  6: "USBMIDI_CONFIG_LOAD_FAILED" ,
  7: "FLASH_CONFIG_LOAD_FAILED",
  8: "CONFIG_APPLY_FAILED",
  9: "UNKNOWN_SYSEX",
  10: "TOO_MANY_BLOBS"
};