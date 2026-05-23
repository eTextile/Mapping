/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// Rebuild a pie-sector pressure arc on an existing Paper.js Path.
// angle in radians, 0 = empty, 2π = full circle, sweeping clockwise from 12 o'clock.
function _rebuild_pressure_arc(arc, cx, cy, r, angle) {
  arc.removeSegments();
  arc.closed = false;
  if (angle <= 0) return;
  angle = Math.min(angle, 2 * Math.PI * 0.9999);
  const start = -Math.PI / 2;
  arc.add(new paper.Point(cx, cy));
  arc.add(new paper.Point(cx + Math.cos(start) * r, cy + Math.sin(start) * r));
  const N = Math.ceil(angle / Math.PI);
  const seg = angle / N;
  let a = start;
  for (let i = 0; i < N; i++) {
    const a_mid = a + seg * 0.5;
    const a_end = a + seg;
    arc.arcTo(
      new paper.Point(cx + Math.cos(a_mid) * r, cy + Math.sin(a_mid) * r),
      new paper.Point(cx + Math.cos(a_end) * r, cy + Math.sin(a_end) * r)
    );
    a = a_end;
  }
  arc.closed = true;
}

// Create an empty pressure arc path (to be inserted before the touch-circle).
function make_touch_arc(center) {
  let arc = new paper.Path({
    "name": "touch-arc",
    "closed": false,
    "locked": true
  });
  arc.style = {
    "strokeWidth": 0,
    "strokeColor": null,
    "fillColor": new paper.Color(1, 1, 1, 0.75)
  };
  return arc;
}

// Update the touch-arc of a touch_group from a normalised value [0–127].
// Uses the current position of touch-circle as the arc centre.
function update_touch_arc(touch_group, value, circle_name) {
  const arc = touch_group.children["touch-arc"];
  const circle = touch_group.children[circle_name || "touch-circle"];
  if (!arc || !circle) return;
  _rebuild_pressure_arc(arc, circle.position.x, circle.position.y, TOUCH_RADIUS, (value / 127) * 2 * Math.PI);
  if (e256_current_mode === MODE.PLAY) circle.style.fillColor = value > 0 ? "red" : "orange";
}

function touch_press_down(mapping, touch_group) {
  switch (mapping.data.press) {
    case MIDI_TYPE.NOTE_ON:
      touch_group.msg.press.midi.status = (touch_group.msg.press.midi.status | MIDI_TYPE.NOTE_ON);
      touch_group.msg.press.midi.data2 = 127;
      send_midi_msg(touch_group.msg.press.midi);
      break;
    case MIDI_TYPE.CONTROL_CHANGE:
      touch_group.msg.press.midi.data2 = get_random_int(64, 127);
      send_midi_msg(touch_group.msg.press.midi);
      break;
    case MIDI_TYPE.AFTERTOUCH_POLY:
      touch_group.msg.press.midi.data2 = get_random_int(64, 127);
      send_midi_msg(touch_group.msg.press.midi);
      break;
    case MIDI_TYPE.CHORD: {
      const intervals = CHORD_INTERVALS[touch_group.msg.press.chord] || CHORD_INTERVALS[1];
      const note_on_status = ((mapping.data.chan.out - 1) & 0x0F) | MIDI_TYPE.NOTE_ON;
      for (const interval of intervals) {
        send_midi_msg({ status: note_on_status, data1: touch_group.msg.press.note + interval, data2: 127 });
      }
      break;
    }
  }
}

function touch_press_up(mapping, touch_group) {
  switch (mapping.data.press) {
    case MIDI_TYPE.NOTE_ON:
      touch_group.msg.press.midi.status = (touch_group.msg.press.midi.status & MIDI_TYPE.NOTE_OFF);
      touch_group.msg.press.midi.data2 = 0;
      send_midi_msg(touch_group.msg.press.midi);
      break;
    case MIDI_TYPE.CONTROL_CHANGE:
      touch_group.msg.press.midi.data2 = 0;
      send_midi_msg(touch_group.msg.press.midi);
      break;
    case MIDI_TYPE.AFTERTOUCH_POLY:
      touch_group.msg.press.midi.data2 = 0;
      send_midi_msg(touch_group.msg.press.midi);
      break;
    case MIDI_TYPE.CHORD: {
      const intervals = CHORD_INTERVALS[touch_group.msg.press.chord] || CHORD_INTERVALS[1];
      const note_on_status = ((mapping.data.chan.out - 1) & 0x0F) | MIDI_TYPE.NOTE_ON;
      for (const interval of intervals) {
        send_midi_msg({ status: note_on_status, data1: touch_group.msg.press.note + interval, data2: 0 });
      }
      break;
    }
  }
}

function make_touch_circle(center, opts) {
  opts = opts || {};
  const fill = opts.fillColor !== undefined ? opts.fillColor : "black";
  const hover = opts.hoverColor || "red";
  let circle = new paper.Path.Circle({
    "name": opts.name || "touch-circle",
    "center": center,
    "radius": opts.radius !== undefined ? opts.radius : TOUCH_RADIUS
  });
  circle.style = {
    "fillColor": fill,
    "strokeWidth": opts.strokeWidth !== undefined ? opts.strokeWidth : 0,
    "strokeColor": opts.strokeColor || null
  };
  circle.onMouseEnter = function () {
    if (e256_current_mode === MODE.EDIT) this.style.fillColor = hover;
  };
  circle.onMouseLeave = function () {
    if (e256_current_mode === MODE.EDIT && !(touch_selection_locked && this.parent === current_touch)) this.style.fillColor = fill;
  };
  return circle;
}

function make_touch_txt(point, content, opts) {
  opts = opts || {};
  let txt = new paper.PointText({
    "name": "touch-txt",
    "point": point,
    "content": content,
    "justification": opts.justification || "left",
    "locked": true
  });
  txt.style = {
    "fillColor": opts.fillColor || "black",
    "fontSize": opts.fontSize || FONT_SIZE,
    "fontWeight": opts.fontWeight || "normal"
  };
  return txt;
}
