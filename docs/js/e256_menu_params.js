/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// For details on the html form_control structure refer to
// https://getbootstrap.com/docs/5.0/forms/form-control/
function create_item_menu_params(item) {
  let div_menu_params = document.getElementById("e256_params");
  div_menu_params.className = "card-body";

  let div_item_menu_params = document.createElement("div");            // div item params
  div_item_menu_params.setAttribute("id", item.name + "_" + item.id);  // div UID use to delate the div
  div_item_menu_params.className = "collapse";                         // Used to show/hide item params

  let card_header = document.createElement("div");                     // div item name
  card_header.className = "card-title display-6";
  card_header.append(item.name + " params");
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
                midi.status = (midi.status & 0xF0) | ((new_out - 1) & 0x0F);
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
      const is_switch = item.parent && item.parent.name === "switch";
      const pressure_source = is_switch
        ? PRESSURE
        : Object.fromEntries(Object.entries(PRESSURE).filter(([k]) => k !== "0"));
      // Force None (key "255") first — integer keys are sorted numerically by JS engines
      let press_entries = Object.entries(pressure_source);
      const none_idx = press_entries.findIndex(([k]) => k === "255");
      if (none_idx > 0) press_entries.unshift(press_entries.splice(none_idx, 1)[0]);
      const { span, select } = create_select_field({
        param: "press",
        source: pressure_source,
        item,
        entries: press_entries
      });
      select.addEventListener("change", () => {
        re_create_item(item.parent);
      });
      part_param.appendChild(span);
      part_param.appendChild(select);
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

      midi_param_val.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        item.data[param] = Number(e.target.value);
        if (param === "steps" && item.redraw_steps) item.redraw_steps();
        else re_create_item(item.parent);
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
  let sub_part_params = document.createElement("div");           // Sub part menu main div
  sub_part_params.setAttribute("id", item.name + "_" + item.id); // Sub part menu UID

  sub_part_params.className = "collapse";

  let table_params = document.createElement("table");
  table_params.className = "table table-sm table-striped table-bordered";

  let table_caption = document.createElement("caption");
  table_caption.className = "caption-top card-title display-6";
  const _touch_index = parseInt(item.name.split("-")[1]);
  table_caption.textContent = isNaN(_touch_index) ? item.name : item.name.split("-")[0] + "-" + (_touch_index + 1);
  table_params.appendChild(table_caption);

  let row_params_body = document.createElement("tbody");

  for (const msg_type in item.msg) {
    if (msg_type === "pos"   && item.parent?.parent?.children["slider-group"]?.data?.move === MOVE_CODES.ROL) continue;
    if (msg_type === "press" && item.parent?.parent?.children["slider-group"]?.data?.move === MOVE_CODES.ROL) continue;

    const msg_obj = item.msg[msg_type];

    // Skip press row when press mode is None (no midi, no chord)
    if (msg_type === "press" && !msg_obj.midi && msg_obj.chord === undefined) continue;

    // Chord press: replace MIDI byte inputs with chord-type + root-note selects
    if (msg_type === "press" && msg_obj.chord !== undefined) {
      // chord + note: each fills exactly 2 of the 4 table columns (no label column)
      let chord_atr_tr = document.createElement("tr");
      let chord_val_tr = document.createElement("tr");

      let empty_th = document.createElement("th");
      chord_atr_tr.appendChild(empty_th);

      let chord_atr = document.createElement("th");
      chord_atr.className = "align-middle text-center";
      chord_atr.setAttribute("colspan", "2");
      chord_atr.textContent = "chord";
      chord_atr_tr.appendChild(chord_atr);

      let press_lbl = document.createElement("th");
      press_lbl.className = "align-middle text-center";
      press_lbl.textContent = "press";
      chord_val_tr.appendChild(press_lbl);

      let chord_td = document.createElement("td");
      chord_td.setAttribute("colspan", "2");
      let chord_select = document.createElement("select");
      chord_select.className = "form-select form-select-sm";
      Object.entries(CHORD_NAMES).forEach(([k, v]) => {
        let opt = document.createElement("option");
        opt.value = k; opt.textContent = v;
        if (String(msg_obj.chord) === k) opt.selected = true;
        chord_select.appendChild(opt);
      });
      chord_select.addEventListener("change", e => { msg_obj.chord = Number(e.target.value); });
      chord_td.appendChild(chord_select);
      chord_val_tr.appendChild(chord_td);

      let note_atr = document.createElement("th");
      note_atr.className = "align-middle text-center";
      note_atr.setAttribute("colspan", "2");
      note_atr.textContent = "note";
      chord_atr_tr.appendChild(note_atr);

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
      note_td.setAttribute("colspan", "2");
      let note_wrapper = document.createElement("div");
      note_wrapper.className = "d-flex gap-1";
      note_wrapper.appendChild(note_select);
      note_wrapper.appendChild(octave_select);
      note_td.appendChild(note_wrapper);
      chord_val_tr.appendChild(note_td);

      row_params_body.appendChild(chord_atr_tr);
      row_params_body.appendChild(chord_val_tr);
      continue;
    }

    const row_inputs = []; // collect all inputs for this msg_type to toggle them

    let row_params_atr_tr = document.createElement("tr");
    let row_params_val_tr = document.createElement("tr");

    let first_param_atr = document.createElement("th");
    first_param_atr.className = "align-middle text-center";

    // Toggle switch — not shown for press (use None in the press select instead)
    let toggle = null;
    if (msg_type !== "press") {
      let toggle_wrap = document.createElement("div");
      toggle_wrap.className = "form-check form-switch d-flex justify-content-center mb-0";
      toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.className = "form-check-input";
      toggle.setAttribute("role", "switch");
      toggle.checked = msg_obj.enabled !== false;
      toggle_wrap.appendChild(toggle);
      first_param_atr.appendChild(toggle_wrap);
    }
    row_params_atr_tr.appendChild(first_param_atr);

    let status = midi_msg_status_unpack(msg_obj["midi"]["status"]);

    let first_param_val = document.createElement("th");
    first_param_val.className = "align-middle text-center";
    first_param_val.textContent = msg_type;
    row_params_val_tr.appendChild(first_param_val);

    let param_arg = null;
    for (const param in msg_obj) {
      switch (param) {

        case "midi":
          for (const midi_byte in msg_obj[param]) {

            // velo (data2) is set dynamically by firmware — skip from UI
            if (midi_byte === "data2") continue;

            switch (midi_byte) {
              case "status":
                param_arg = "chan";
                break;
              case "data1":
                param_arg = DATA1[status.type];
                break;
            }
            if (param_arg) {
              let param_atr = document.createElement("th");
              param_atr.setAttribute("id", item.id + "_" + msg_type + "_" + param_arg + "_atr");
              param_atr.className = "align-middle text-center";
              param_atr.textContent = param_arg;

              let param_val = document.createElement("input");
              param_val.className = "form-control text-center";
              param_val.setAttribute("type", "number");
              param_val.setAttribute("id", item.id + "_" + msg_type + "_" + param_arg + "_val");
              param_val.setAttribute("aria-describedby", item.id + "_" + msg_type + "_" + param_arg + "_atr");
              row_inputs.push(param_val);

              param_val.addEventListener("input", function (event) {
                if (event.target.type !== "number") return;
                if (midi_byte === "status") {
                  $("#" + event.target.id).css("background-color",
                    (event.target.value > 0 && event.target.value <= 16) ? "lightGreen" : "pink");
                } else {
                  $("#" + event.target.id).css("background-color",
                    (event.target.value > -1 && event.target.value < 128) ? "lightGreen" : "pink");
                }
              });
              param_val.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" || event.target.type !== "number") return;
                if (midi_byte === "status") {
                  if (event.target.value > 0 && event.target.value <= 16)
                    msg_obj[param][midi_byte] = midi_msg_status_pack(event.target.value, status.type);
                } else if (event.target.value > -1 && event.target.value < 128) {
                  msg_obj[param][midi_byte] = Number(event.target.value);
                }
              });
              param_val.addEventListener("change", function (event) {
                if (event.target.type !== "number") return;
                if (midi_byte === "status") {
                  if (event.target.value > 0 && event.target.value <= 16)
                    msg_obj[param][midi_byte] = midi_msg_status_pack(event.target.value, status.type);
                } else if (event.target.value > -1 && event.target.value < 128) {
                  msg_obj[param][midi_byte] = Number(event.target.value);
                }
              });
              let param_td = document.createElement("td");
              param_td.appendChild(param_val);
              row_params_atr_tr.appendChild(param_atr);
              row_params_val_tr.appendChild(param_td);
            }
          }
          break;

        case "limit":
          for (const limit in msg_obj[param]) {
            let param_atr = document.createElement("th");
            param_atr.setAttribute("id", item.id + "_" + MIDI_BY_NAME[status.type] + "_" + limit + "_atr");
            param_atr.className = "align-middle text-center";
            param_atr.textContent = limit;

            let param_val = document.createElement("input");
            param_val.className = "form-control text-center";
            param_val.setAttribute("type", "number");
            param_val.setAttribute("id", item.id + "_" + msg_type + "_" + limit + "_val");
            param_val.setAttribute("aria-describedby", item.id + "_" + msg_type + "_" + limit + "_atr");
            row_inputs.push(param_val);

            if (msg_type === "press" && status.type === MIDI_TYPE.NOTE_ON) {
              param_val.disabled = true;
            } else {
              param_val.addEventListener("input", function (event) {
                if (event.target.type !== "number") return;
                $("#" + event.target.id).css("background-color",
                  (event.target.value > -1 && event.target.value < 128) ? "lightGreen" : "pink");
              });
              param_val.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" || event.target.type !== "number") return;
                if (event.target.value > -1 && event.target.value < 128) {
                  msg_obj[param][limit] = Number(event.target.value);
                }
              });
              param_val.addEventListener("change", function (event) {
                if (event.target.type !== "number") return;
                if (event.target.value > -1 && event.target.value < 128) {
                  msg_obj[param][limit] = Number(event.target.value);
                }
              });
            }
            let param_td = document.createElement("td");
            param_td.appendChild(param_val);
            row_params_atr_tr.appendChild(param_atr);
            row_params_val_tr.appendChild(param_td);
          }
          break;
      }
    }

    // Apply initial disabled state and wire up toggle (press has no toggle)
    if (toggle) {
      if (msg_obj.enabled === false) {
        row_inputs.forEach(inp => { inp.disabled = true; });
      }
      toggle.addEventListener("change", function () {
        msg_obj.enabled = this.checked;
        row_inputs.forEach(inp => { inp.disabled = !this.checked; });
      });
    }

    row_params_body.appendChild(row_params_atr_tr);
    row_params_body.appendChild(row_params_val_tr);
  }
  table_params.appendChild(row_params_body);
  sub_part_params.appendChild(table_params);
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
                if (el) el.value = midi_value;
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

// Show / Hide item menu params
function item_menu_params(item, state) {
  if (item) { 
    $("#" + item.name + "_" + item.id).collapse(state);
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

document.getElementById("midi_term").addEventListener("shown.bs.collapse", update_midi_term_capacity);

window.addEventListener("resize", function () {
  if (document.getElementById("midi_term").classList.contains("show")) {
    update_midi_term_capacity();
  }
});

function circular_buffer(container_id, max_length) {
  this._container_id = container_id;
  this._max_length = max_length;
  this._nodes = [];   // pre-allocated DOM node pool
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
  node.style.color = e256_current_mode === MODE.THROUGH ? "white"
                   : e256_current_mode === MODE.PLAY    ? "lightGreen"
                   : "";

  term.appendChild(node); // move to end (no-op on first insert, O(1) move when reusing)
  this._write_idx = (this._write_idx + 1) % this._max_length;
};

var midi_term_out = new circular_buffer("midi_term_out", 25);
var midi_term_in  = new circular_buffer("midi_term_in",  25);

//////////////// Alert
function alert_msg(identifier, message, type) {

  const is_existing_alert_node = document.querySelector("#" + identifier);

  if (is_existing_alert_node === null) {

    const div_alert = document.createElement('div');

    div_alert.setAttribute("id", identifier);
    div_alert.className = "alert alert-" + type;
    //div_alert.className = "alert-dismissible fade show"
    div_alert.setAttribute("role", "alert");
    div_alert.textContent = message;
    
    /*
    let button = document.createElement("button");
    button.setAttribute("type", "button");
    button.className = "btn-close";
    button.setAttribute("data-bs-dismiss", "alert");
    button.setAttribute("aria-label", "Close");
    div_alert.appendChild(button);
    */

    $("#live_alert_placeholder").append(div_alert);

    setTimeout(
      function () {
        const alert_timeout = bootstrap.Alert.getOrCreateInstance("#" + identifier);
        alert_timeout.close();
    }, 3500);
  }

};
