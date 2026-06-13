/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// GRID Factory
// Multitouch MIDI grid GUI
function grid_factory() {

  const DEFAULT = {
    WIDTH: 450,
    HEIGHT: 450,
    COLS: 8,
    ROWS: 6,
    TOUCHS: 3,
    MODE_PRESS: MIDI_TYPE.NOTE_ON_ONLY,
    MIN_SIZE: 150,
    HARMONIC_BASE: 40, // E2 — bottom-left key; grid covers E2→C5 (MIDI 40→72)
    HARMONIC_X: 1,     // semitones per column (chromatic, right → higher)
    HARMONIC_Y: 5,     // semitones per row (perfect fourth, up → higher)
    LAYOUT: 1,         // default layout: Fourths
  };

  // row 0 is top (highest pitch); layout 0 = sequential (row_step = cols)
  const harmonic_note = (col, row, rows, cols, layout) => {
    if (layout === 4) return Math.min(127, 60 + col); // Omnichord: root = C4 + col, same for all rows
    const row_step = layout === 0 ? cols : (GRID_LAYOUT_ROW_STEP[layout] ?? DEFAULT.HARMONIC_Y);
    return Math.min(127, Math.max(0, DEFAULT.HARMONIC_BASE + col * DEFAULT.HARMONIC_X + (rows - 1 - row) * row_step));
  };

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi_note_name = note => NOTE_NAMES[note % 12] + (Math.floor(note / 12) - 1);

  const OMNICHORD_COL_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];
  const OMNICHORD_ROW_CHORD = [1, 2, 7]; // row 0: Major, row 1: Minor, row 2: Dom7

  let frame_width = null;
  let frame_height = null;
  let key_width = null;
  let key_height = null;
  let half_key_width = null;
  let half_key_height = null;

  let current_key_count = null;
  let previous_key_count = null;

  var _grid = new paper.Group({
    "name": "grid",
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "cols": null,
      "rows": null,
      "chan": null,
      "layout": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT.WIDTH / 2),
        mouseEvent.point.y - (DEFAULT.HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT.WIDTH / 2),
        mouseEvent.point.y + (DEFAULT.HEIGHT / 2)
      );
      this.data.cols = DEFAULT.COLS;
      this.data.rows = DEFAULT.ROWS;
      this.data.layout = DEFAULT.LAYOUT;
      this.data.touchs = DEFAULT.TOUCHS;
      this.data.chan = { in: MIDI_DEFAULT.INPUT_CHANNEL, out: MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.data.press = Object.assign(midi_msg_builder(DEFAULT.MODE_PRESS), { enabled: true });

      this.data.msg = [];
      current_key_count = this.data.cols * this.data.rows;
      for (let _key = 0; _key < current_key_count; _key++) {
        const col = _key % this.data.cols;
        const row = Math.floor(_key / this.data.cols);
        let key_msg = {};
        key_msg.press = Object.assign(midi_msg_builder(DEFAULT.MODE_PRESS), { enabled: true });
        key_msg.press.note = harmonic_note(col, row, this.data.rows, this.data.cols, this.data.layout);
        if (key_msg.press.midi) key_msg.press.midi.data1 = key_msg.press.note;
        this.data.msg.push(key_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(
        mapp(params.from[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.from[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.to = new paper.Point(
        mapp(params.to[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.to[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.cols = params.cols;
      this.data.rows = params.rows;
      this.data.layout = params.layout ?? DEFAULT.LAYOUT;
      this.data.touchs = params.touchs ?? DEFAULT.TOUCHS;
      this.data.chan = { in: params.chan?.in || MIDI_DEFAULT.INPUT_CHANNEL, out: params.chan?.out || MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.data.press = params.press ?? Object.assign(midi_msg_builder(DEFAULT.MODE_PRESS), { enabled: true });
      this.data.msg = params.msg;
      current_key_count = params.cols * params.rows;
    },

    save_params: function () {
      this.data.from = this.children["grid-group"].data.from;
      this.data.to = this.children["grid-group"].data.to;
      this.data.cols = this.children["grid-group"].data.cols;
      this.data.rows = this.children["grid-group"].data.rows;
      const old_layout = this.data.layout;
      this.data.layout = this.children["grid-group"].data.layout;
      if (this.data.layout !== old_layout) {
        const dims = GRID_LAYOUT_DIMS[this.data.layout];
        if (dims) { this.data.cols = dims.cols; this.data.rows = dims.rows; }
      }
      this.data.touchs = this.children["grid-group"].data.touchs;
      this.data.chan = this.children["grid-group"].data.chan;
      this.data.press = this.children["grid-group"].data.press;

      previous_key_count = current_key_count;
      current_key_count = this.data.cols * this.data.rows;

      const is_omnichord = this.data.layout === 4;
      this.data.msg = [];
      for (let _key = 0; _key < current_key_count; _key++) {
        const col = _key % this.data.cols;
        const row = Math.floor(_key / this.data.cols);
        const note = harmonic_note(col, row, this.data.rows, this.data.cols, this.data.layout);
        let key_msg = {};
        if (_key < previous_key_count) {
          const old_press = this.children["keys-group"].children[_key].msg.press;
          if (is_omnichord && old_press.chord === undefined) {
            key_msg.press = Object.assign(midi_msg_builder(MIDI_TYPE.CHORD), { enabled: true, note, chord: OMNICHORD_ROW_CHORD[row] ?? 1 });
          } else if (!is_omnichord && old_press.chord !== undefined) {
            key_msg.press = Object.assign(midi_msg_builder(DEFAULT.MODE_PRESS), { enabled: true });
            key_msg.press.note = note;
            if (key_msg.press.midi) key_msg.press.midi.data1 = note;
          } else {
            key_msg.press = old_press;
            key_msg.press.note = note;
            if (key_msg.press.midi) key_msg.press.midi.data1 = note;
          }
        } else {
          if (is_omnichord) {
            key_msg.press = Object.assign(midi_msg_builder(MIDI_TYPE.CHORD), { enabled: true, note, chord: OMNICHORD_ROW_CHORD[row] ?? 1 });
          } else {
            key_msg.press = Object.assign(midi_msg_builder(DEFAULT.MODE_PRESS), { enabled: true });
            key_msg.press.note = note;
            if (key_msg.press.midi) key_msg.press.midi.data1 = note;
          }
        }
        this.data.msg.push(key_msg);
      }
    },

    new_key: function (index_x, index_y) {
      let _key_id = index_y * this.data.cols + index_x;
      const _hn = harmonic_note(index_x, index_y, this.data.rows, this.data.cols, this.data.layout);
      const _press = this.data.msg[_key_id]?.press;
      if (_press) {
        _press.note = _hn;
        if (_press.midi) _press.midi.data1 = _hn;
      }

      let _key_group = new paper.Group({
        "name": "key-" + _key_id,
        "pos": new paper.Point(index_x, index_y),
        "from": new paper.Point(
          this.data.from.x + index_x * key_width,
          this.data.from.y + index_y * key_height
        ),
        "to": new paper.Point(
          this.data.from.x + index_x * key_width + key_width,
          this.data.from.y + index_y * key_height + key_height
        ),
        "msg": this.data.msg[_key_id],
        "prev_press": null
      });

      let _key_frame = new paper.Path.Rectangle({
        "name": "key-frame",
        "from": _key_group.from,
        "to": _key_group.to
      });

      _key_frame.style = {
        "fillColor": "pink",
        "strokeColor": "black",
        "strokeWidth": 0.2
      };

      _key_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            this.style.fillColor = "#FF8C00";
            if (!touch_selection_locked) show_only_touch(_key_group);
            break;
          case MODE.THROUGH:
            this.style.fillColor = "#FF8C00";
            break;
          case MODE.PLAY:
            break;
        }
      };

      _key_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            if (!(touch_selection_locked && current_touch.id === _key_group.id)) this.style.fillColor = "pink";
            break;
          case MODE.THROUGH:
            this.style.fillColor = "pink";
            break;
          case MODE.PLAY:
            break;
        }
      };

      _key_frame.onMouseDown = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            show_only_touch(_key_group, true);
            touch_selection_locked = true;
            break;
          case MODE.THROUGH: {
            this.style.fillColor = "red";
            const press = _key_group.msg.press;
            if (!press || press.enabled === false) break;
            switch (press_type_from_msg(press)) {
              case MIDI_TYPE.NOTE_ON_ONLY:
              case MIDI_TYPE.NOTE_ON:
                press.midi.data2 = 127;
                send_midi_msg(press.midi);
                paper.view.update();
                break;
              case MIDI_TYPE.CONTROL_CHANGE:
              case MIDI_TYPE.AFTERTOUCH_POLY:
                press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(press.midi);
                break;
              case MIDI_TYPE.CHORD:
                touch_press_down(_grid, _key_group);
                paper.view.update();
                break;
            }
            break;
          }
          default:
            break;
        }
      };

      _key_frame.onMouseUp = function () {
        if (e256_current_mode !== MODE.THROUGH) return;
        this.style.fillColor = "#FF8C00";
        const press = _key_group.msg.press;
        if (!press || press.enabled === false) return;
        switch (press_type_from_msg(press)) {
          case MIDI_TYPE.NOTE_ON:
            if (!press.note_on_only) {
              press.midi.data2 = 0;
              send_midi_msg(press.midi);
            }
            break;
          case MIDI_TYPE.CHORD:
            touch_press_up(_grid, _key_group);
            break;
        }
      };

      _key_group.addChild(_key_frame);

      const cell_font_size = Math.min(key_width, key_height) * 0.4;
      const _label_text = this.data.layout === 4
        ? (OMNICHORD_COL_NAMES[index_x] ?? NOTE_NAMES[index_x % 12]) + (["", "m", "7"][index_y] ?? "")
        : midi_note_name(harmonic_note(index_x, index_y, this.data.rows, this.data.cols, this.data.layout));
      let _key_id_label = make_touch_txt(
        new paper.Point(_key_group.from.x + key_width * 0.1, _key_group.from.y + cell_font_size),
        _label_text,
        { fontSize: cell_font_size, justification: "left", fillColor: "white" }
      );
      _key_id_label.name = "key-id";
      _key_group.addChild(_key_id_label);

      return _key_group;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;
      key_width = frame_width / this.data.cols;
      key_height = frame_height / this.data.rows;

      let _grid_group = new paper.Group({
        "name": "grid-group",
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "cols": this.data.cols,
          "rows": this.data.rows,
          "chan": this.data.chan,
          "layout": this.data.layout,
          "press": this.data.press
        }
      });

      let _keys_group = new paper.Group({
        "name": "keys-group"
      });

      for (let index_y = 0; index_y < _grid_group.data.rows; index_y++) {
        for (let index_x = 0; index_x < _grid_group.data.cols; index_x++) {
          _keys_group.addChild(this.new_key(index_x, index_y));
        }
      }

      let _grid_frame = new paper.Path.Rectangle({
        "name": "grid-frame",
        "from": _grid_group.data.from,
        "to": _grid_group.data.to
      });

      _grid_frame.style = {
        "strokeColor": new paper.Color(0, 0, 0, 0),
        "strokeWidth": 15
      };
      
      _grid_frame.onMouseEnter = function () {
        // visual hover handled by paper_tool.onMouseMove in e256_paper_script.js
      }

      _grid_frame.onMouseLeave = function () {
        // visual hover handled by paper_tool.onMouseMove in e256_paper_script.js
      }

      _grid_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            if (current_part.type === "bounds") {
              let newPos = new paper.Point();
              switch (current_part.name) {
                case "top-left": {
                  frame_width  = Math.max(DEFAULT.MIN_SIZE, this.bounds.right  - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT.MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  const cx_tl  = this.bounds.right  - frame_width;
                  const cy_tl  = this.bounds.bottom - frame_height;
                  key_width = frame_width / _grid_group.data.cols;   half_key_width  = key_width  / 2;
                  key_height = frame_height / _grid_group.data.rows; half_key_height = key_height / 2;
                  this.segments[0].point.x = cx_tl;
                  this.segments[1].point   = new paper.Point(cx_tl, cy_tl);
                  this.segments[2].point.y = cy_tl;
                  const cfs_tl = Math.min(key_width, key_height) * 0.4;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.right - (_grid_group.data.cols - _key.pos.x) * key_width + half_key_width;
                    newPos.y = this.bounds.bottom - (_grid_group.data.rows - _key.pos.y) * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-id"].point = new paper.Point(newPos.x - half_key_width + key_width * 0.1, newPos.y - half_key_height + cfs_tl);
                    _key.children["key-id"].fontSize = cfs_tl;
                  }
                  _grid_group.data.from = new paper.Point(cx_tl, cy_tl);
                  break;
                }
                case "top-right": {
                  frame_width  = Math.max(DEFAULT.MIN_SIZE, mouseEvent.point.x  - this.bounds.left);
                  frame_height = Math.max(DEFAULT.MIN_SIZE, this.bounds.bottom  - mouseEvent.point.y);
                  const cx_tr  = this.bounds.left  + frame_width;
                  const cy_tr  = this.bounds.bottom - frame_height;
                  key_width = frame_width / _grid_group.data.cols;   half_key_width  = key_width  / 2;
                  key_height = frame_height / _grid_group.data.rows; half_key_height = key_height / 2;
                  this.segments[1].point.y = cy_tr;
                  this.segments[2].point   = new paper.Point(cx_tr, cy_tr);
                  this.segments[3].point.x = cx_tr;
                  const cfs_tr = Math.min(key_width, key_height) * 0.4;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.left + _key.pos.x * key_width + half_key_width;
                    newPos.y = this.bounds.bottom - (_grid_group.data.rows - _key.pos.y) * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-id"].point = new paper.Point(newPos.x - half_key_width + key_width * 0.1, newPos.y - half_key_height + cfs_tr);
                    _key.children["key-id"].fontSize = cfs_tr;
                  }
                  _grid_group.data.from.y = cy_tr;
                  _grid_group.data.to.x   = cx_tr;
                  break;
                }
                case "bottom-right": {
                  frame_width  = Math.max(DEFAULT.MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT.MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  const cx_br  = this.bounds.left + frame_width;
                  const cy_br  = this.bounds.top  + frame_height;
                  key_width = frame_width / _grid_group.data.cols;   half_key_width  = key_width  / 2;
                  key_height = frame_height / _grid_group.data.rows; half_key_height = key_height / 2;
                  this.segments[2].point.x = cx_br;
                  this.segments[3].point   = new paper.Point(cx_br, cy_br);
                  this.segments[0].point.y = cy_br;
                  const cfs_br = Math.min(key_width, key_height) * 0.4;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.left + _key.pos.x * key_width + half_key_width;
                    newPos.y = this.bounds.top  + _key.pos.y * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-id"].point = new paper.Point(newPos.x - half_key_width + key_width * 0.1, newPos.y - half_key_height + cfs_br);
                    _key.children["key-id"].fontSize = cfs_br;
                  }
                  _grid_group.data.to = new paper.Point(cx_br, cy_br);
                  break;
                }
                case "bottom-left": {
                  frame_width  = Math.max(DEFAULT.MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT.MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  const cx_bl  = this.bounds.right - frame_width;
                  const cy_bl  = this.bounds.top   + frame_height;
                  key_width = frame_width / _grid_group.data.cols;   half_key_width  = key_width  / 2;
                  key_height = frame_height / _grid_group.data.rows; half_key_height = key_height / 2;
                  this.segments[3].point.y = cy_bl;
                  this.segments[0].point   = new paper.Point(cx_bl, cy_bl);
                  this.segments[1].point.x = cx_bl;
                  const cfs_bl = Math.min(key_width, key_height) * 0.4;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.right - (_grid_group.data.cols - _key.pos.x) * key_width + half_key_width;
                    newPos.y = this.bounds.top   + _key.pos.y * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-id"].point = new paper.Point(newPos.x - half_key_width + key_width * 0.1, newPos.y - half_key_height + cfs_bl);
                    _key.children["key-id"].fontSize = cfs_bl;
                  }
                  _grid_group.data.from.x = cx_bl;
                  _grid_group.data.to.y   = cy_bl;
                  break;
                }
                default:
                  //console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
              update_item_main_params(_grid_group.parent);
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }
      _grid_group.addChild(_grid_frame);

      _grid_group.fit_to_canvas = function() {
        this.data.from = new paper.Point(0, 0);
        this.data.to = new paper.Point(canvas_width, canvas_height);
        frame_width = canvas_width;
        frame_height = canvas_height;
        key_width = frame_width / this.data.cols;
        key_height = frame_height / this.data.rows;
        half_key_width = key_width / 2;
        half_key_height = key_height / 2;
        _grid_frame.segments[0].point = new paper.Point(0, canvas_height);
        _grid_frame.segments[1].point = new paper.Point(0, 0);
        _grid_frame.segments[2].point = new paper.Point(canvas_width, 0);
        _grid_frame.segments[3].point = new paper.Point(canvas_width, canvas_height);
        const cfs_fit = Math.min(key_width, key_height) * 0.4;
        for (const key of _keys_group.children) {
          const kx = key.pos.x * key_width;
          const ky = key.pos.y * key_height;
          const frame = key.children["key-frame"];
          frame.segments[0].point = new paper.Point(kx, ky + key_height);
          frame.segments[1].point = new paper.Point(kx, ky);
          frame.segments[2].point = new paper.Point(kx + key_width, ky);
          frame.segments[3].point = new paper.Point(kx + key_width, ky + key_height);
          key.children["key-id"].point = new paper.Point(kx + key_width * 0.1, ky + cfs_fit);
          key.children["key-id"].fontSize = cfs_fit;
        }
        update_item_main_params(this.parent);
        paper.view.update();
      };

      this.addChild(_grid_group);
      this.addChild(_keys_group);
    },

    handle_arrow_key: function (key) {
      const keys_group = this.children["keys-group"];
      if (!current_touch || current_touch.parent !== keys_group) return;
      const grid_data = this.children["grid-group"].data;
      const dx = key === "right" ? 1 : key === "left" ? -1 : 0;
      const dy = key === "down"  ? 1 : key === "up"   ? -1 : 0;
      const nx = current_touch.pos.x + dx;
      const ny = current_touch.pos.y + dy;
      if (nx < 0 || nx >= grid_data.cols || ny < 0 || ny >= grid_data.rows) return;
      const target_key = keys_group.children.find(k => k.pos.x === nx && k.pos.y === ny);
      if (!target_key) return;
      show_only_touch(target_key, true);
      touch_selection_locked = true;
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case MODE.EDIT:
          if (current_part.type === "fill") {
            move_item(this, mouseEvent);
            update_item_main_params(this);
          }
          break;
        case MODE.PLAY:
          // N/A
          break;
      }
    },

    _blob_key_map: new Map(), // UID → key_group

    midi_play_blob_update: function(sysExMsg) {
      const keys_group = this.children["keys-group"];
      const grid_group = this.children["grid-group"];
      if (!keys_group || !grid_group) return;

      const uid = sysExMsg[BLOB_PARAM_CODE.UID];
      const blob_status = sysExMsg[BLOB_PARAM_CODE.STATUS];
      const releasing = blob_status === BLOB_STATUS.RELEASED || blob_status === BLOB_STATUS.FREE;

      if (releasing) {
        const prev_key = this._blob_key_map.get(uid);
        if (prev_key) {
          const f = prev_key.children["key-frame"];
          if (f) f.style.fillColor = "pink";
          this._blob_key_map.delete(uid);
          paper.view.update();
        }
        return;
      }

      const cx = mapp(
        sysExMsg[BLOB_PARAM_CODE.CENTROID_X_WHOLE_PART] + sysExMsg[BLOB_PARAM_CODE.CENTROID_X_FRACTIONAL_PART] / 100,
        0, NEW_COLS, 0, canvas_width
      );
      const cy = mapp(
        sysExMsg[BLOB_PARAM_CODE.CENTROID_Y_WHOLE_PART] + sysExMsg[BLOB_PARAM_CODE.CENTROID_Y_FRACTIONAL_PART] / 100,
        0, NEW_ROWS, 0, canvas_height
      );

      const gd = grid_group.data;
      if (cx < gd.from.x || cx > gd.to.x || cy < gd.from.y || cy > gd.to.y) return;

      const kw = (gd.to.x - gd.from.x) / gd.cols;
      const kh = (gd.to.y - gd.from.y) / gd.rows;
      const col = Math.min(gd.cols - 1, Math.floor((cx - gd.from.x) / kw));
      const row = Math.min(gd.rows - 1, Math.floor((cy - gd.from.y) / kh));

      const key = keys_group.children.find(k => k.pos.x === col && k.pos.y === row);
      if (!key) return;

      const prev_key = this._blob_key_map.get(uid);
      if (prev_key && prev_key !== key) {
        const f = prev_key.children["key-frame"];
        if (f) f.style.fillColor = "pink";
      }
      this._blob_key_map.set(uid, key);

      const key_frame = key.children["key-frame"];
      if (key_frame) {
        key_frame.style.fillColor = "red";
        paper.view.update();
      }
    },

    midi_play_update: function (msg) {
      const keys_group = this.children["keys-group"];
      if (!keys_group) return;
      const status = midi_msg_status_unpack(msg.status);
      let updated = false;

      for (const key_group of keys_group.children) {
        if (!key_group.msg?.press || key_group.msg.press.enabled === false) continue;
        const press_midi = key_group.msg.press.midi;
        if (!press_midi) continue;
        const ps = midi_msg_status_unpack(press_midi.status);
        if (ps.channel !== status.channel) continue;

        if (status.type === MIDI_TYPE.NOTE_ON || status.type === MIDI_TYPE.NOTE_OFF) {
          if (ps.type !== MIDI_TYPE.NOTE_ON || press_midi.data1 !== msg.data1) continue;
          const active = status.type === MIDI_TYPE.NOTE_ON && msg.data2 > 0;
          key_group.children["key-frame"].fillColor = active ? "red" : "pink";
          updated = true;
        } else if (status.type === MIDI_TYPE.CONTROL_CHANGE) {
          if (ps.type !== MIDI_TYPE.CONTROL_CHANGE || press_midi.data1 !== msg.data1) continue;
          const t = msg.data2 / 127;
          key_group.children["key-frame"].fillColor = new paper.Color(1, 1 - t, 1 - t);
          updated = true;
        }
      }
      if (updated) paper.view.update();
    }

  });
  return _grid;
};
