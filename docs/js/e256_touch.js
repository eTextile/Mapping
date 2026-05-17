/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

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
  circle.onMouseEnter = function () { this.style.fillColor = hover; };
  circle.onMouseLeave = function () { this.style.fillColor = fill; };
  return circle;
}

function make_touch_txt(point, content, opts) {
  opts = opts || {};
  let txt = new paper.PointText({
    "name": "touch-txt",
    "point": point,
    "content": content,
    "locked": true
  });
  txt.style = {
    "fillColor": opts.fillColor || "black",
    "fontSize": opts.fontSize || FONT_SIZE
  };
  return txt;
}
