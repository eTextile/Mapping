/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function apply_global_press_to_keys(grid_item, press_template) {
  const keys_group = grid_item.children["keys-group"];
  if (!keys_group) return;
  for (const key of keys_group.children) {
    const current_note  = key.msg.press?.note ?? key.msg.press?.midi?.data1 ?? 60;
    const current_chord = key.msg.press?.chord; // preserve per-key chord (Omnichord rows)
    const new_press = JSON.parse(JSON.stringify(press_template));
    if (new_press.chord !== undefined) {
      new_press.note = current_note;
      if (current_chord !== undefined) new_press.chord = current_chord;
    } else if (new_press.midi) {
      new_press.midi.data1 = current_note;
    }
    key.msg.press = new_press;
  }
}

function get_press_type(msg_obj) {
  if (!msg_obj || (!msg_obj.midi && msg_obj.chord === undefined)) return MIDI_TYPE.NONE;
  if (msg_obj.chord !== undefined) return msg_obj.gate ? MIDI_TYPE.CHORD_GATE : MIDI_TYPE.CHORD_TRIGGER;
  if (msg_obj.note_on_only) return MIDI_TYPE.NOTE_ON_ONLY;
  if (msg_obj.clock) return MIDI_TYPE.CLOCK;
  return midi_msg_status_unpack(msg_obj.midi.status).type;
}

function bind_midi_number_input(input, validate, update) {
  const highlight = () => { input.style.backgroundColor = validate(input.value) ? "lightGreen" : "pink"; };
  const commit    = () => { if (validate(input.value)) update(Number(input.value)); };
  input.addEventListener("input",   highlight);
  input.addEventListener("change",  commit);
  input.addEventListener("keydown", e => { if (e.key === "Enter") { commit(); input.blur(); } });
}

function attach_toggle_fold(toggle, msg_obj, inputs, rows) {
  if (msg_obj.enabled === false) {
    inputs.forEach(inp => { inp.disabled = true; });
    rows.forEach(r => { r.style.display = "none"; });
  }
  toggle.addEventListener("change", function () {
    msg_obj.enabled = this.checked;
    inputs.forEach(inp => { inp.disabled = !this.checked; });
    rows.forEach(r => { r.style.display = this.checked ? "" : "none"; });
  });
}

// For details on the html form_control structure refer to
// https://getbootstrap.com/docs/5.0/forms/form-control/
function create_item_menu_params(item) {
  let div_menu_params = document.getElementById("e256_params");
  div_menu_params.className = "p-2";

  let div_item_menu_params = document.createElement("div");            // div item params
  div_item_menu_params.setAttribute("id", item.name + "_" + item.id);  // div UID use to delate the div
  div_item_menu_params.style.display = "none";

  let card_header = document.createElement("div");                     // div item name
  card_header.className = "btn btn-primary w-100 fw-bold disabled mb-1 mapping-id-label";
  const mapping_index = item.parent ? item.parent.children.indexOf(item) + 1 : item.id;
  card_header.append(item.name + "-" + mapping_index);
  div_item_menu_params.appendChild(card_header);

  for (const part of item.children) { // 1ST LEVEL ITEM MENU PARAMS
    if (part.data) {
      div_item_menu_params.appendChild(create_item_main_params(part));
    }
    for (const sub_part of part.children) { // 2ND LEVEL ITEM MENU PARAMS
      if (sub_part.msg) {
        div_item_menu_params.appendChild(create_item_touchs_menu_params(sub_part));
      }
    }
  }
  div_menu_params.appendChild(div_item_menu_params);
};

function remove_item_menu_params(item) {
  let div_menu_params = document.getElementById("e256_params");
  let div_item_menu_params = document.getElementById(item.name + "_" + item.id);
  if (div_item_menu_params) div_menu_params.removeChild(div_item_menu_params);
};

//////////////////////////////////////////////// 1ST_LEVEL_ITEMS_MENU
function create_item_main_params(item) {
  let part_params = document.createElement("div");
  //console.log("SET_ID_1ST: " + item.name + "_" + item.id); // PROB!
  part_params.setAttribute("id", item.name + "_" + item.id); // Menu UID
  part_params.className = "main-params";

  for (const param in item.data) {
    if (param === "segments") continue; // edited visually on canvas, not via params panel
    let part_param = document.createElement("div");
    part_param.className = "input-group";
    part_param.setAttribute("id", item.parent.id + "_" + param + "_param");
    if (param === "populate" || param === "steps") {
      part_param.style.display = (item.data.move === MOVE_CODES.ROL) ? "" : "none";
    }

    /////////// POINT
    if (item.data[param] && item.data[param].constructor?.name === "Point") {
      let span_param = document.createElement("span");
      span_param.className = "input-group-text";
      span_param.textContent = param;
      part_param.appendChild(span_param);

      let span_x = document.createElement("span");
      span_x.className = "input-group-text";
      span_x.setAttribute("id", item.parent.id + "_" + param + "_atr_x");
      span_x.textContent = "x";
      part_param.appendChild(span_x);

      let midi_param_val_x = document.createElement("input");
      midi_param_val_x.setAttribute("id", item.parent.id + "_" + param + "_val_x");
      midi_param_val_x.className = "form-control";
      midi_param_val_x.setAttribute("aria-label", "Small");
      midi_param_val_x.setAttribute("aria-describedby", item.parent.id + "_" + param + "_atr_x");

      midi_param_val_x.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && Number.isFinite(parseFloat(event.target.value))) {
          item.data[param].x = parseFloat(event.target.value);
          re_create_item(item.parent);
        }
      });
      part_param.appendChild(midi_param_val_x);

      let span_y = document.createElement("span");
      span_y.className = "input-group-text";
      span_y.setAttribute("id", item.parent.id + "_" + param + "_atr_y");
      span_y.textContent = "y";
      part_param.appendChild(span_y);

      let midi_param_val_y = document.createElement("input");
      midi_param_val_y.setAttribute("id", item.parent.id + "_" + param + "_val_y");
      midi_param_val_y.className = "form-control";
      midi_param_val_y.setAttribute("aria-label", "Small");
      midi_param_val_y.setAttribute("aria-describedby", item.parent.id + "_" + param + "_atr_y");

      midi_param_val_y.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && Number.isFinite(parseFloat(event.target.value))) {
          item.data[param].y = parseFloat(event.target.value);
          re_create_item(item.parent);
        }
      });
      part_param.appendChild(midi_param_val_y);
    }

    else if (param === "chan") {
      let chan_lbl = document.createElement("span");
      chan_lbl.className = "input-group-text";
      chan_lbl.textContent = "chan";
      part_param.appendChild(chan_lbl);
      const { span: span_in, select: sel_in } = create_select_field({
        param: "chan",
        source: MIDI_INPUT_CHAN,
        item,
        sub_key: "in"
      });
      const { span: span_out, select: sel_out } = create_select_field({
        param: "chan",
        source: MIDI_INPUT_CHAN,
        item,
        sub_key: "out"
      });
      sel_out.addEventListener("change", () => {
        const new_out = item.data.chan.out;
        if (item.parent?.data?.msg) {
          for (const touch_msg of item.parent.data.msg) {
            for (const msg_type in touch_msg) {
              const midi = touch_msg[msg_type]?.midi;
              if (midi?.status !== undefined)
                midi.status = (midi.status & MIDI_TYPE_MASK) | ((new_out - 1) & MIDI_CHANNEL_MASK);
            }
          }
          update_item_touchs_menu_params(item.parent);
        }
      });
      part_param.appendChild(span_in);
      part_param.appendChild(sel_in);
      part_param.appendChild(span_out);
      part_param.appendChild(sel_out);
    }
    else if (param === "move") {
      const { span, select } = create_select_field({
        param: "move",
        source: MOVE,
        item
      });
      select.addEventListener("change", () => {
        re_create_item(item.parent);
      });
      part_param.appendChild(span);
      part_param.appendChild(select);
    }
    else if (param === "press") {
      if (item.name !== "grid-group") continue;

      const press_obj = item.data.press;
      const grid_item = item.parent;
      const current_press_type = get_press_type(press_obj);
      const is_omnichord = item.data.layout === 4;

      const GRID_PRESS_ALLOWED = is_omnichord
        ? new Set([MIDI_TYPE.CHORD_TRIGGER, MIDI_TYPE.CHORD_GATE])
        : new Set([MIDI_TYPE.NOTE_ON_ONLY, MIDI_TYPE.NOTE_ON_OFF]);
      const press_type_entries = PRESSURE.filter(([k]) => GRID_PRESS_ALLOWED.has(k));
      let pt_span = document.createElement("span");
      pt_span.className = "input-group-text";
      pt_span.textContent = "press";
      let pt_sel = document.createElement("select");
      pt_sel.className = "form-select form-select-sm";
      press_type_entries.forEach(([k, v]) => {
        let opt = document.createElement("option");
        opt.value = k; opt.textContent = v;
        if (Number(k) === current_press_type) opt.selected = true;
        pt_sel.appendChild(opt);
      });
      pt_sel.addEventListener("change", function () {
        const new_type = Number(this.value);
        const old = item.data.press;
        const rebuilt = midi_msg_builder(new_type);
        rebuilt.enabled = old?.enabled !== false;
        item.data.press = rebuilt;
        apply_global_press_to_keys(grid_item, rebuilt);
        re_create_touch_params(grid_item);
      });
      part_param.appendChild(pt_span);
      part_param.appendChild(pt_sel);
    }
    else if (param === "populate") {
      const { span, select } = create_select_field({
        param: "populate",
        source: POPULATE,
        item
      });
     select.addEventListener("change", () => {
        re_create_item(item.parent);
      });
      part_param.appendChild(span);
      part_param.appendChild(select);
    }
    else if (param === "layout") {
      if (item.name !== "grid-group") continue;
      const { span, select } = create_select_field({
        param: "layout",
        source: GRID_LAYOUT,
        item
      });
      select.addEventListener("change", () => re_create_item(item.parent));
      part_param.appendChild(span);
      part_param.appendChild(select);
    }
    else {
      let span_param = document.createElement("span");
      span_param.className = "input-group-text";
      span_param.setAttribute("id", item.parent.id + "_" + param + "_atr");
      span_param.textContent = param;
      part_param.appendChild(span_param);

      let midi_param_val = document.createElement("input");
      midi_param_val.setAttribute("id", item.parent.id + "_" + param + "_val");
      midi_param_val.className = "form-control";
      midi_param_val.setAttribute("aria-label", "Small");
      midi_param_val.setAttribute("aria-describedby", item.parent.id + "_" + param + "_atr");
      midi_param_val.value = param === "offset" ? round2(item.data[param]) : item.data[param];

      midi_param_val.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        item.data[param] = Number(e.target.value);
        if (param === "steps" && item.redraw_steps) item.redraw_steps();
        else re_create_item(item.parent);
        e.target.blur();
      });

      part_param.appendChild(midi_param_val);
    }

    part_params.appendChild(part_param);
  }
  return part_params;
};

function create_select_field({ param, source, item, entries: custom_entries, sub_key }) {
  const span = document.createElement("span");
  span.className = "input-group-text";
  span.textContent = sub_key ?? param;

  const select = document.createElement("select");
  select.className = "form-select form-select-sm";

  const entries = custom_entries || Object.entries(source);

  const current_val = sub_key ? item.data[param]?.[sub_key] : item.data[param];

  entries.forEach(([key, label]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    if (String(current_val) === key) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener("change", (e) => {
    if (sub_key) {
      if (!item.data[param]) item.data[param] = {};
      item.data[param][sub_key] = Number(e.target.value);
    } else {
      item.data[param] = Number(e.target.value);
    }
  });

  return { span, select };
}


function update_item_main_params(item) {
  const pid = item.id;
  for (const part of item.children) {
    for (const param in part.data) {
      if (part.data?.[param]?.constructor?.name === "Point") {
        const ex = document.getElementById(pid + "_" + param + "_val_x");
        const ey = document.getElementById(pid + "_" + param + "_val_y");
        if (ex) ex.value = round2(part.data[param].x);
        if (ey) ey.value = round2(part.data[param].y);
      } else {
        const el = document.getElementById(pid + "_" + param + "_val");
        if (el) el.value = param === "offset" ? round2(part.data[param]) : part.data[param];
      }
    }
  }
};

//////////////////////////////////////////////// 2ND_LEVEL_ITEMS_MENU
// For details on the html form_control structure refer to:
// https://getbootstrap.com/docs/5.0/forms/form-control/

function create_item_touchs_menu_params(item) {
  let sub_part_params = document.createElement("div");
  sub_part_params.setAttribute("id", item.name + "_" + item.id);

  const _touch_index = parseInt(item.name.split("-")[1]);
  sub_part_params.className = "touch-params-section";
  sub_part_params.style.display = (!isNaN(_touch_index) && _touch_index === 0) ? "" : "none";

  const is_rol = item.parent?.parent?.children["slider-group"]?.data?.move === MOVE_CODES.ROL;

  let touch_label = document.createElement("div");
  touch_label.className = "btn btn-primary w-100 fw-bold disabled text-nowrap overflow-hidden my-1 touch-id-label";
  touch_label.textContent = isNaN(_touch_index) ? item.name : item.name.split("-")[0] + "-" + (_touch_index + 1);
  touch_label.style.display = is_rol ? "none" : "";
  sub_part_params.appendChild(touch_label);

  let group_idx = 0;
  let has_params = false;

  for (const msg_type of Object.keys(item.msg).sort((a, b) => a === "press" ? -1 : b === "press" ? 1 : 0)) {
    if (msg_type === "pos"   && is_rol) continue;
    if (msg_type === "press" && is_rol) continue;

    const msg_obj = item.msg[msg_type];
    const row_bg = (group_idx % 2 === 0) ? "rgba(255, 0, 212, 0.15)" : "";

    // One table per msg_type; first row = toggle + label + type-select
    let param_table = document.createElement("table");
    param_table.className = "table table-sm table-bordered m-0 mb-2";
    let param_tbody = document.createElement("tbody");

    // Row 0: header (toggle + label + optional type-select, full-width cell)
    let header_tr = document.createElement("tr");
    let header_td = document.createElement("td");
    header_td.setAttribute("colspan", "100");
    header_td.style.backgroundColor = "rgba(255, 0, 212, 0.15)";
    let header_inner = document.createElement("div");
    header_inner.className = "d-flex align-items-center gap-1";

    let toggle = null;
    {
      let toggle_wrap = document.createElement("div");
      toggle_wrap.className = "form-check form-switch d-flex justify-content-center mb-0";
      toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.className = "form-check-input";
      toggle.setAttribute("role", "switch");
      if (msg_type === "press") {
        const current_press_type = get_press_type(msg_obj);
        const press_on = current_press_type !== MIDI_TYPE.NONE;
        toggle.checked = press_on;
        msg_obj.enabled = press_on;
      } else {
        toggle.checked = msg_obj.enabled !== false;
      }
      toggle_wrap.appendChild(toggle);
      header_inner.appendChild(toggle_wrap);
    }

    let label_span = document.createElement("span");
    label_span.className = "fw-bold flex-grow-1";
    label_span.style.fontSize = "0.75rem";
    label_span.textContent = msg_type;
    header_inner.appendChild(label_span);

    if (msg_type === "press") {
      const mapping = item.parent?.parent;
      const is_switch_mapping = mapping?.name === "switch";
      const is_grid_mapping   = mapping?.name === "grid";
      const is_omnichord = is_grid_mapping && mapping.children["grid-group"]?.data?.layout === 4;
      const GRID_TOUCH_PRESS_ALLOWED = new Set([MIDI_TYPE.NONE, MIDI_TYPE.NOTE_ON_ONLY, MIDI_TYPE.NOTE_ON_OFF]);
      const press_type_entries = PRESSURE.filter(([k]) => {
        if (is_switch_mapping) return true;
        if (is_grid_mapping)   return GRID_TOUCH_PRESS_ALLOWED.has(k);
        return k !== MIDI_TYPE.CLOCK;
      });
      const current_press_type = get_press_type(msg_obj);
      if (!is_omnichord && !is_grid_mapping) {
        let pt_sel = document.createElement("select");
        pt_sel.className = "form-select press-type-select";
        press_type_entries.forEach(([k, v]) => {
          let opt = document.createElement("option");
          opt.value = k; opt.textContent = v;
          if (Number(k) === current_press_type) opt.selected = true;
          pt_sel.appendChild(opt);
        });
        pt_sel.addEventListener("change", function () {
          const new_type = Number(this.value);
          const old = item.msg.press;
          const rebuilt = midi_msg_builder(new_type);
          if (rebuilt.midi && old?.midi) {
            rebuilt.midi.data1 = old.midi.data1;
            rebuilt.midi.status = (rebuilt.midi.status & 0xF0) | (old.midi.status & 0x0F);
          }
          if (rebuilt.chord !== undefined && old?.chord !== undefined) {
            rebuilt.chord = old.chord;
            rebuilt.note  = old.note ?? 60;
          }
          item.msg.press = rebuilt;
          if (mapping) re_create_touch_params(mapping);
        });
        header_inner.appendChild(pt_sel);
      }
    } else if (msg_type === "pos") {
      const current_pos_type = midi_msg_status_unpack(msg_obj.midi.status).type;
      const mapping = item.parent?.parent;
      let pt_sel = document.createElement("select");
      pt_sel.className = "form-select pos-type-select";
      MOVE_MSG_TYPES.forEach(([k, v]) => {
        let opt = document.createElement("option");
        opt.value = k; opt.textContent = v;
        if (Number(k) === current_pos_type) opt.selected = true;
        pt_sel.appendChild(opt);
      });
      pt_sel.addEventListener("change", function () {
        const new_type = Number(this.value);
        const old = item.msg.pos;
        const rebuilt = midi_msg_builder(new_type);
        if (rebuilt.midi && old?.midi) {
          rebuilt.midi.status = (rebuilt.midi.status & 0xF0) | (old.midi.status & 0x0F);
        }
        rebuilt.enabled = old?.enabled !== false;
        item.msg.pos = rebuilt;
        if (mapping) re_create_touch_params(mapping);
      });
      header_inner.appendChild(pt_sel);
    }

    header_td.appendChild(header_inner);
    header_tr.appendChild(header_td);
    param_tbody.appendChild(header_tr);
    param_table.appendChild(param_tbody);
    sub_part_params.appendChild(param_table);
    has_params = true;

    // press = NONE: only the header row, no param rows
    if (msg_type === "press" && !msg_obj.midi && msg_obj.chord === undefined) {
      group_idx++;
      continue;
    }

    // --- Chord press: label row + value row appended to the same table ---
    if (msg_type === "press" && msg_obj.chord !== undefined) {
      let chord_atr_tr = document.createElement("tr");
      let chord_th = document.createElement("th");
      chord_th.className = "align-middle text-center";
      chord_th.textContent = "chord";
      chord_atr_tr.appendChild(chord_th);
      let note_th = document.createElement("th");
      note_th.className = "align-middle text-center";
      note_th.textContent = "note";
      chord_atr_tr.appendChild(note_th);
      param_tbody.appendChild(chord_atr_tr);

      let chord_val_tr = document.createElement("tr");
      let chord_select = document.createElement("select");
      chord_select.className = "form-select form-select-sm";
      Object.entries(CHORD_NAMES).forEach(([k, v]) => {
        let opt = document.createElement("option");
        opt.value = k; opt.textContent = v;
        if (String(msg_obj.chord) === k) opt.selected = true;
        chord_select.appendChild(opt);
      });
      chord_select.addEventListener("change", e => { msg_obj.chord = Number(e.target.value); });
      let chord_td = document.createElement("td");
      chord_td.appendChild(chord_select);
      chord_val_tr.appendChild(chord_td);

      const init_pc  = msg_obj.note % 12;
      const init_oct = Math.floor(msg_obj.note / 12) - 1;
      let note_select   = document.createElement("select");
      let octave_select = document.createElement("select");
      const update_root = () => {
        msg_obj.note = Number(note_select.value) + (Number(octave_select.value) + 1) * 12;
      };
      note_select.className = "form-select form-select-sm";
      Object.entries(NOTE_CLASSES).forEach(([k, v]) => {
        let opt = document.createElement("option");
        opt.value = k; opt.textContent = v;
        if (Number(k) === init_pc) opt.selected = true;
        note_select.appendChild(opt);
      });
      note_select.addEventListener("change", update_root);
      octave_select.className = "form-select form-select-sm";
      for (let oct = -1; oct <= 9; oct++) {
        let opt = document.createElement("option");
        opt.value = oct; opt.textContent = oct;
        if (oct === init_oct) opt.selected = true;
        octave_select.appendChild(opt);
      }
      octave_select.addEventListener("change", update_root);
      let note_td = document.createElement("td");
      let note_w = document.createElement("div");
      note_w.className = "d-flex gap-1";
      note_w.appendChild(note_select);
      note_w.appendChild(octave_select);
      note_td.appendChild(note_w);
      chord_val_tr.appendChild(note_td);
      param_tbody.appendChild(chord_val_tr);

      attach_toggle_fold(toggle, msg_obj,
        [chord_select, note_select, octave_select],
        [chord_atr_tr, chord_val_tr]
      );

      group_idx++;
      continue;
    }

    // --- Generic MIDI: label row + value row appended to the same table ---
    if (!msg_obj.midi) { group_idx++; continue; }

    const row_inputs = [];
    let atr_tr = document.createElement("tr");
    let val_tr = document.createElement("tr");

    let status = midi_msg_status_unpack(msg_obj["midi"]["status"]);
    let param_arg = null;

    for (const param in msg_obj) {
      switch (param) {
        case "midi":
          for (const midi_byte in msg_obj[param]) {
            if (midi_byte === "data2") continue;
            switch (midi_byte) {
              case "status": param_arg = "chan"; break;
              case "data1":  param_arg = DATA1[status.type]; break;
            }
            if (param_arg) {
              const atr_id = item.id + "_" + msg_type + "_" + param_arg + "_atr";
              const val_id = item.id + "_" + msg_type + "_" + param_arg + "_val";

              let param_atr = document.createElement("th");
              param_atr.setAttribute("id", atr_id);
              param_atr.className = "align-middle text-center" + (midi_byte === "status" ? " midi-col-chan" : "");
              param_atr.textContent = param_arg;
              atr_tr.appendChild(param_atr);

              let param_val = document.createElement("input");
              param_val.className = "form-control text-center";
              param_val.setAttribute("type", "number");
              param_val.setAttribute("id", val_id);
              param_val.setAttribute("aria-describedby", atr_id);
              row_inputs.push(param_val);

              if (midi_byte === "status") {
                bind_midi_number_input(param_val,
                  v => v > 0 && v <= 16,
                  v => { msg_obj[param][midi_byte] = midi_msg_status_pack(v, status.type); }
                );
              } else {
                bind_midi_number_input(param_val,
                  v => v > -1 && v < 128,
                  v => { msg_obj[param][midi_byte] = v; }
                );
              }

              let param_td = document.createElement("td");
              if (midi_byte === "status") param_td.className = "midi-col-chan";
              param_td.appendChild(param_val);
              if (midi_byte === "data1" && status.type === MIDI_TYPE.CONTROL_CHANGE) {
                const cc_select = document.createElement("select");
                cc_select.className = "form-select cc-select";
                cc_select.dataset.inputId = val_id;
                if (active_synth_profile) {
                  _populate_cc_select(cc_select);
                  param_val.style.display = "none";
                } else {
                  cc_select.style.display = "none";
                }
                cc_select.addEventListener("change", () => {
                  param_val.value = cc_select.value;
                  msg_obj[param][midi_byte] = Number(cc_select.value);
                });
                param_td.appendChild(cc_select);
              }
              val_tr.appendChild(param_td);
            }
          }
          break;

        case "limit":
          for (const limit in msg_obj[param]) {
            const atr_id = item.id + "_" + MIDI_BY_NAME[status.type] + "_" + limit + "_atr";
            const val_id = item.id + "_" + msg_type + "_" + limit + "_val";

            let param_atr = document.createElement("th");
            param_atr.setAttribute("id", atr_id);
            param_atr.className = "align-middle text-center midi-col-limit";
            param_atr.textContent = limit;
            atr_tr.appendChild(param_atr);

            let limit_val = document.createElement("input");
            limit_val.className = "form-control text-center";
            limit_val.setAttribute("type", "number");
            limit_val.setAttribute("id", val_id);
            limit_val.setAttribute("aria-describedby", atr_id);
            row_inputs.push(limit_val);

            if (msg_type === "press" && status.type === MIDI_TYPE.NOTE_ON) {
              limit_val.disabled = true;
            } else {
              bind_midi_number_input(limit_val,
                v => v > -1 && v < 128,
                v => { msg_obj[param][limit] = v; }
              );
            }
            let limit_td = document.createElement("td");
            limit_td.className = "midi-col-limit";
            limit_td.appendChild(limit_val);
            val_tr.appendChild(limit_td);
          }
          break;
      }
    }

    param_tbody.appendChild(atr_tr);
    param_tbody.appendChild(val_tr);

    attach_toggle_fold(toggle, msg_obj, row_inputs, [atr_tr, val_tr]);

    group_idx++;
  }

  return sub_part_params;
};

// UPADTE 2ND_LEVEL_ITEMS_MENU (FROM TOP ITEM)
//function update_item_touch_menu_params(item) {
function update_item_touchs_menu_params(item) {
  for (const part of item.children) {
    for (const sub_part of part.children) {
      let status = null;
      let midi_arg = null;
      let midi_value = null;
      for (const msg_type in sub_part.msg) {
        for (const param in sub_part.msg[msg_type]) {
          switch (param) {
            case "midi":
              for (const midi_byte in sub_part.msg[msg_type][param]) {
                switch (midi_byte) {
                  case "status":
                    status = midi_msg_status_unpack(sub_part.msg[msg_type][param].status);
                    midi_arg = "chan";
                    midi_value = status.channel;
                    break;
                  case "data1":
                    midi_arg = DATA1[status.type];
                    midi_value = sub_part.msg[msg_type][param].data1;
                    break;
                  case "data2":
                    midi_arg = DATA2[status.type];
                    midi_value = sub_part.msg[msg_type][param].data2;
                    break;
                }
                const el = document.getElementById(sub_part.id + "_" + msg_type + "_" + midi_arg + "_val");
                if (el) {
                  el.value = midi_value;
                  const cc_sel = el.parentElement && el.parentElement.querySelector(".cc-select");
                  if (cc_sel) cc_sel.value = String(midi_value);
                }
              }
              break;
            case "limit": {
              const el_min = document.getElementById(sub_part.id + "_" + msg_type + "_min_val");
              const el_max = document.getElementById(sub_part.id + "_" + msg_type + "_max_val");
              if (el_min) el_min.value = sub_part.msg[msg_type][param].min;
              if (el_max) el_max.value = sub_part.msg[msg_type][param].max;
              break;
            }
          }
        }
      }
    }
  }
};

function _debounce(fn, ms) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

// Release focus from any select or checkbox in the params panel after a change so
// keyboard shortcuts (u, e, p…) are not swallowed by the focused element.
function _on_params_change(e) {
  if (e.target.matches("select, input[type='checkbox']")) e.target.blur();
}

// Show / Hide item menu params
function item_menu_params(item, state) {
  if (item) {
    const el = document.getElementById(item.name + "_" + item.id);
    if (el) el.style.display = (state === "show") ? "" : "none";
  }
};

function update_midi_term_capacity() {
  const el = document.getElementById("midi_term");
  const style = getComputedStyle(el);
  const label_h = 28; // OUT / IN label row height (approx)
  const line_height = parseFloat(style.lineHeight) || 20;
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const new_max = Math.max(1, Math.floor((el.clientHeight - padding - label_h) / line_height));
  [midi_term_out, midi_term_in].forEach(buf => {
    while (buf._nodes.length > new_max) buf._nodes.pop().remove();
    buf._max_length = new_max;
    if (buf._write_idx >= new_max) buf._write_idx = 0;
  });
};

function _on_midi_term_resize() {
  if (document.getElementById("midi_term").classList.contains("show")) {
    update_midi_term_capacity();
  }
}

if (!window._e256_menu_params_listeners) {
  window._e256_menu_params_listeners = true;
  document.getElementById("e256_params").addEventListener("change", _on_params_change);
  document.getElementById("midi_term").addEventListener("shown.bs.collapse", update_midi_term_capacity);
  window.addEventListener("resize", _debounce(_on_midi_term_resize, 150));
}

function circular_buffer(container_id, max_length) {
  this._container_id = container_id;
  this._max_length = max_length;
  this._nodes = [];   // pre-allocated DOM node pool
  this._write_idx = 0;
};

circular_buffer.prototype.clear = function () {
  const term = document.getElementById(this._container_id);
  if (term) term.replaceChildren();
  this._nodes = [];
  this._write_idx = 0;
};

circular_buffer.prototype.push = function (midi_msg) {
  const term = document.getElementById(this._container_id);
  if (!term) return;
  let status = midi_msg_status_unpack(midi_msg.status);
  const type_name = (status.type === MIDI_TYPE.NOTE_ON && midi_msg.data2 === 0)
    ? "NOFF" : (MIDI_SHORT_NAME[status.type] || MIDI_BY_NAME[status.type]);

  let node;
  if (this._nodes.length < this._max_length) {
    node = document.createElement("div");
    this._nodes.push(node);
  } else {
    node = this._nodes[this._write_idx];  // reuse oldest node
  }

  node.textContent = type_name + " :\t[ " + status.channel + ", " + midi_msg.data1 + ", " + midi_msg.data2 + " ]";
  node.style.color = "lightGreen";

  term.appendChild(node); // move to end (no-op on first insert, O(1) move when reusing)
  this._write_idx = (this._write_idx + 1) % this._max_length;
};

var midi_term_out = new circular_buffer("midi_term_out", 25);
var midi_term_in  = new circular_buffer("midi_term_in",  25);

//////////////// Alert
alert_msg._seq = 0;

function alert_msg(message, type) {
  const id = "alert_" + (++alert_msg._seq);
  const div_alert = document.createElement("div");
  div_alert.setAttribute("id", id);
  div_alert.className = "alert alert-" + type + " mb-2";
  div_alert.setAttribute("role", "alert");
  div_alert.textContent = message;
  $("#live_alert_placeholder").append(div_alert);
  setTimeout(() => bootstrap.Alert.getOrCreateInstance("#" + id).close(), 3500);
};
