# eTextile-Synthesizer — Mapping Toolkit

A browser-based application to configure tactile mapping on the **e256** matrix sensor. It lets you draw control zones directly over the sensor's pressure field, assign MIDI messages to each zone, and upload the configuration to the device — all over USB MIDI_TYPE.

**Live app:** https://mapping.etextile.org/ *(requires Chrome)*  
**Version:** 1.0.26  
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
- **THROUGH** — pass raw blob data through as MIDI without any mapping
- **PLAY** — run the current mapping live

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
- **Movement curves:** Linear, Logarithmic, Roller
- **Grid populate modes:** Off, Up, Down, As Played, Octave, Ping-Pong
- **Tap Tempo:** any Switch control can be set to `TapTempo` mode — each touch sends MIDI TimingClock (0xF8) at the tapped BPM instead of a note or CC
- **PLAY mode feedback:** incoming MIDI from the device animates the canvas in real time — slider steps colour red/grey on NoteOn/NoteOff; touch cursors move on CC
- **MIDI terminal:** displays incoming messages; NoteOn with velocity 0 is shown as NOTE_OFF per standard MIDI convention
- **SysEx:** used for fetching and uploading the full configuration blob
- **Config channels:** levels (ch 3), modes (ch 4), verbosity (ch 5), errors (ch 6)

---

## Workflow

1. Connect the e256 to your computer via USB.
2. Open the app in Chrome and click **CONNECT**.
3. Select **MATRIX** to verify the sensor is reading correctly.
4. Switch to **MAPPING → EDIT** to design your control layout.
5. Add controls from the toolbar (Touchpad, Slider, Knob, Switch, Grid, Path, Polygon).
6. For each control, set the MIDI message type, channel, note/CC, min/max values, and pressure mode in the right panel.
7. Click **UPLOAD CONFIG** to send the mapping to the device.
8. Click **SAVE CONFIG** to write it to the e256's flash memory permanently.
9. Use **FETCH CONFIG** to retrieve the current configuration stored on the device.

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
