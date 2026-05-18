# eTextile-Synthesizer — Mapping Toolkit

A browser-based application to configure tactile mapping on the **e256** matrix sensor. It lets you draw control zones directly over the sensor's pressure field, assign MIDI messages to each zone, and upload the configuration to the device — all over USB MIDI.

**Live app:** https://mapping.etextile.org/ *(requires Chrome)*  
**Version:** 1.0.27  
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
| `p` | PLAY mode |
| `e` | EDIT mode |
| `t` | THROUGH mode |
| `m` | MATRIX mode |
| `shift` + `m` | MAPPING mode |
| `c` | CALIBRATE |
| `u` | UPLOAD config |
| `s` | SAVE config |
| `f` | FETCH config |
| `h` | Toggle help overlay |
| `Esc` | Close help overlay |

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
