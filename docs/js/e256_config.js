/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;
// E256 MODES CONSTANTS (MIDI_CHANNEL 1)
const SYNC_MODE = 0           // Read incoming setup
const STANDALONE_MODE = 1;    // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const MATRIX_MODE_RAW = 2;    // Get matrix analog sensor values (16x16) over USB using MIDI format
const MATRIX_MODE_INTERP = 3; // Get matrix analog sensor values (16x16) over USB using MIDI format
const EDIT_MODE = 4;          // Get all blobs values over USB using MIDI format
const PLAY_MODE = 5;          // Get mappings values over USB using MIDI format
const GET_CONFIG = 6;         // TODO: Fetch the e256 CONFIG file
// STATES CONSTANTS (MIDI_CHANNEL 2)
const CALIBRATE = 0;
const DONE_ACTION = 2;
const ERROR = 3;
// LEVELS CONSTANTS
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |
// MIDI CONSTANTS
const MIDI_INPUT_CHANNEL = 1; // [1:15] Set the HARDWARE MIDI_INPUT channel
const MIDI_OUTPUT_CHANNEL = 1; // [1:15] Set the HARDWARE MIDI_OUTPUT channel
const NOTE_ON = 0x90; // 
const NOTE_OFF = 0x80; //
const CONTROL_CHANGE = 0xB0; //
const PROGRAM_CHANGE = 0xC0; //
const SYSTEM_EXCLUSIVE = 0xF0; // 240
const SYSEX_BEGIN = 0xF0; // 240
const SYSEX_END = 0xF7; // 247
const SYSEX_ID = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF = 0x7C; // 124
const SYSEX_SOUND = 0x6C; // 108
// VERBOSITY CONSTANTS
const FLASH_CONFIG_ALLOC_DONE = 16;
const FLASH_CONFIG_LOAD_DONE = 17;
const FLASH_CONFIG_WRITE_DONE = 18;
const USBMIDI_CONFIG_ALLOC_DONE = 19;
const USBMIDI_CONFIG_UPLOAD_DONE = 20;
const USBMIDI_SOUND_UPLOAD_DONE = 21;
const USBMIDI_SET_LEVEL_DONE = 22;
// ERROR_CODES CONSTANTS
const ERROR_WAITING_FOR_GONFIG = 33;
const ERROR_LOADING_GONFIG_FAILED = 34;
const ERROR_CONNECTING_FLASH = 35;
const ERROR_WHILE_OPEN_FLASH_FILE = 36;
const ERROR_FLASH_FULL = 37;
const ERROR_FILE_TO_BIG = 38;
const ERROR_NO_CONFIG_FILE = 39;
const ERROR_UNKNOWN_SYSEX = 40;

const CHAN1 = 0;
const CHAN2 = 1;
const CHAN3 = 2;
const CHAN4 = 3;
const CHAN5 = 4;
const CHAN6 = 5;
const CHAN7 = 6;
const CHAN8 = 7;

const BI = 0; // [0] Blob UID
const BS = 1; // [1] Blob State
const BL = 2; // [2] Blob Last State
const BX = 3; // [3] Blob X centroid position
const BY = 4; // [4] Blob Y centroid position
const BZ = 5; // [5] Blob Depth
const BW = 6; // [6] Blob width
const BH = 7; // [7] Blob Height
