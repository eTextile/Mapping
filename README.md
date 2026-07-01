# eTextile-Synthesizer — Mapping Toolkit

A browser-based application to configure tactile mapping on the **e256** matrix sensor. It lets you draw control zones directly over the sensor's pressure field, assign MIDI messages to each zone, and upload the configuration to the device — all over USB MIDI.

**Live app:** https://mapping.etextile.org/ *(requires Chrome)*  
**Version:** 1.0.28  
**License:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

## Overview

The e256 is a 16×16 resistive textile matrix. This app connects to it via the Web MIDI API and provides three main views:

| Mode | Description |
|------|-------------|
| **MATRIX** | Live 3D visualisation of raw sensor pressure values |
| **CALIBRATE** | Adjust sensor baseline |
| **MAPPING** | Draw and configure tactile controls over the sensor surface |

Within **MAPPING** mode, three sub-modes are available:

- **EDIT** — place and adjust control zones, set their MIDI parameters
- **THROUGH** — interact directly with the mapping; MIDI messages are sent to the connected synth
- **PLAY** — firmware drives the mapping live from sensor data; canvas updates in real time

Blob overlays (visible in EDIT mode) are automatically cleared when switching to THROUGH, PLAY, or CALIBRATE.

---

## Control types

| Control | Description |
|---------|-------------|
| **Touchpad** | Free XY pressure surface |
| **Slider** | Linear fader (horizontal or vertical) |
| **Knob** | Circular rotary control |
| **Switch** | Binary on/off toggle |
| **Grid** | Note grid (polyphonic pad layout) |
| **Path** | Freeform path control |
| **Polygon** | Custom polygon zone |

Each control can be assigned any standard MIDI message type: Note On/Off, Control Change, Program Change, Poly Aftertouch, Channel Aftertouch, or Pitch Bend.

---

## MIDI features

- **Pressure modes:** NoteOn (velocity), ControlChange (pressure only), AfterTouchPoly (note + modulation)
- **Movement curves:** Linear, Logarithmic, Roller (step sequencer)
- **Roller (ROL) sliders:**
  - Steps are displayed with their note name label inside each cell
  - Active step is highlighted red on press and drag in THROUGH mode
  - Step notes are configurable via the populate system
- **Grid populate modes:** Off, Up, Down, As Played, Octave, Ping-Pong
- **Tap Tempo:** any Switch control can be set to `TapTempo` mode — each touch sends MIDI TimingClock (0xF8) at the tapped BPM instead of a note or CC
- **PLAY mode feedback:** incoming MIDI from the device animates the canvas in real time — slider steps colour red/grey on NoteOn/NoteOff; touch cursors move on CC
- **MIDI terminal:** displays incoming and outgoing messages
- **SysEx:** used for fetching and uploading the full configuration blob
- **Config channels:** levels (ch 3), modes (ch 4), verbosity (ch 5), errors (ch 6)
- **Auto-reconnect:** the app reconnects automatically to the device on page refresh

---

## Keyboard shortcuts

Press **`h`** at any time to display the help overlay.

| Key | Action |
|-----|--------|
| `h` | Toggle this help |
| `d` | Toggle DEV MODE (no hardware needed) |
| `p` | PLAY mode |
| `e` | EDIT mode |
| `t` | THROUGH mode |
| `r` | MATRIX RAW mode |
| `i` | MATRIX INTERP mode |
| `m` | Toggle MAPPING / MATRIX mode |
| `c` | CALIBRATE |
| `u` | UPLOAD config |
| `s` | SAVE config |
| `f` | FETCH config |
| `Space` | Finish path/polygon drawing (EDIT mode) |
| `Tab` | Cycle through mappings one by one (EDIT, THROUGH, PLAY) |
| `a` | Fit selected mapping to full canvas (EDIT mode) |
| `Shift` + `1…N` | Select touch N of current mapping (EDIT mode) |
| `Esc` | Close this help |

Shortcuts are ignored when an input field is focused.

---

## Workflow

1. Connect the e256 to your computer via USB.
2. Open the app in Chrome and click **CONNECT**.
3. Select **MATRIX** to verify the sensor is reading correctly.
4. Switch to **MAPPING → EDIT** to design your control layout.
5. Add controls from the toolbar (Touchpad, Slider, Knob, Switch, Grid, Path, Polygon).
6. For each control, set the MIDI message type, channel, note/CC, min/max values, and pressure mode in the right panel.
7. Click **UPLOAD CONFIG** (or press `u`) to send the mapping to the device.
   All communication uses USB MIDI SysEx (`[F0, 0x7D, ...]`). The upload handshake:
   - **ALLOCATE** — app tells the firmware the JSON size; firmware allocates a RAM buffer.
   - **UPLOAD** — app sends the full JSON in one SysEx packet; firmware stores it in RAM.
   - **APPLY** — firmware parses and applies the new mapping immediately (`mappings_apply_config()`).
   - Back in **EDIT** mode — the device is already running the new mapping.
8. Click **SAVE CONFIG** (or press `s`) to write it to the e256's flash memory permanently.
   This requires a physical **long-press on the LEFT BUTTON** on the device.
   Without this step the mapping is lost on power-off.
9. Use **FETCH CONFIG** (or press `f`) to retrieve the current configuration stored on the device.

---

## Firmware update

The web app and the e256 firmware are versioned together (currently **1.0.28**).
The app checks the firmware version automatically on every connection — no manual action required.

### How version checking works

On every successful USB connection the firmware sends its version string as a SysEx packet (`SYSEX_PKT_VERSION = 0x06`) immediately after the SYNC handshake:

```
F0  7D  06  '1' '.' '0' '.' '2' '8'  F7
```

The app compares this string against its own `VERSION` constant (`docs/js/e256_config.js`).  
If they differ **and** a bundled firmware file exists at `docs/firmware/e256_firmware.hex`, the update dialog appears.  
If the versions match, or no HEX file is present, nothing happens.

### Automatic update (recommended)

When the firmware version does not match the app, a **Firmware Update Available** dialog appears automatically.  
It shows the device version and the app version, then offers two choices: **Skip** or **Update Firmware**.

Clicking **Update Firmware**:

1. The app sends a `BOOTLOADER_MODE` reboot command over USB MIDI.
2. The Teensy reboots immediately into the HalfKay USB HID bootloader (VID `0x16C0` / PID `0x0478`).
3. After ~1.5 s, Chrome opens a WebHID device-picker — select **HalfKay** and confirm.
4. The app flashes `docs/firmware/e256_firmware.hex` block by block (1024-byte blocks, 64-byte HID reports).
5. The device reboots automatically and reconnects as a MIDI device.

> Requires **Chrome** (or any Chromium-based browser). Firefox does not support WebHID.

### Symptoms of a version mismatch

If you dismiss the dialog or flashing fails, you may observe:

- `UNKNOWN_SYSEX` errors in the MIDI terminal
- Config upload silently rejected (ALLOCATE/UPLOAD/APPLY handshake fails)
- Controls not responding despite a successful-looking upload

### Manual update (fallback)

If the automatic path fails, flash with PlatformIO directly:

```bash
git clone https://github.com/eTextile/Synth
cd Synth/Firmware
pio run -e USB_MIDI -t upload   # builds and flashes in one step
```

The Teensy enters bootloader automatically when the upload starts; no button press needed.

### Bundling a new firmware release

When the firmware source changes, regenerate the bundled HEX and update both repos:

```bash
# 1. Bump VERSION in both files to the same string (e.g. "1.0.29"):
#    Firmware/include/config.h  →  #define VERSION "1.0.29"
#    Synth_web/docs/js/e256_config.js  →  const VERSION = "1.0.29";

# 2. Build
cd Synth/Firmware
pio run -e USB_MIDI

# 3. Copy HEX into the web app
cp .pio/build/USB_MIDI/firmware.hex ../Synth_web/docs/firmware/e256_firmware.hex

# 4. Commit and push both repos
```

The web app will now automatically propose the update to any device running an older version.

---

## Technical stack

| Role | Library |
|------|---------|
| UI framework | [Bootstrap 5](https://getbootstrap.com/) |
| 2D mapping canvas | [Paper.js](http://paperjs.org/) |
| 3D sensor visualisation | [Three.js](https://threejs.org/) |
| MIDI I/O | [Web MIDI API](https://www.w3.org/TR/webmidi/) |

---

## Repository

https://github.com/eTextile/Mapping

## Hardware

https://github.com/eTextile/Synth — e256 Teensy 4.0 firmware and hardware files
