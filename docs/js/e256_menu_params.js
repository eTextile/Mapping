/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// For details on the html form_control structure refer to
// https://getbootstrap.com/docs/5.0/forms/form-control/
function create_item_menu_params(item) {
  let menu_params = document.getElementById("e256_params");
  menu_params.className = "card-body";

  let div_item_menu_params = document.createElement("div");            // div item params
  div_item_menu_params.setAttribute("id", item.name + "_" + item.id);  // div UID use to delate the div
  div_item_menu_params.className = "collapse";                         // Used to show/hide item params

  let card_header = document.createElement("div");                     // div item name
  card_header.className = "card-title display-5";
  card_header.append(item.name + " params");
  div_item_menu_params.appendChild(card_header);

  for (const part of item.children) {  // 1ST LEVEL ITEM MENU PARAMS
    if (part.data) {
      //console.log(part.name + "_" + part.id); // PROB!
      div_item_menu_params.appendChild(create_menu_1st_level(part));
    }
    for (const sub_part of part.children) {  // 2ND LEVEL ITEM MENU PARAMS
      if (sub_part.data.midi) {
        //console.log(sub_part.name + "_" + sub_part.id); // PROB!
        div_item_menu_params.appendChild(create_menu_2nd_level(sub_part));
        //$("#" + sub_part.name + "_" + sub_part.id).collapse("hide"); // FIXME!
      }
    }
  }
  menu_params.appendChild(div_item_menu_params);
  $("#set_button_params").collapse("show");
};

function create_menu_1st_level(item) {
  let part_params = document.createElement("div");
  //console.log("SET_ID_1ST: " + item.name + "_" + item.id); // PROB!
  part_params.setAttribute("id", item.name + "_" + item.id); // Menu UID

  for (const param in item.data) {
    let part_param = document.createElement("div");
    part_param.className = "input-group";

    if (item.data[param].constructor.name === "Point") {
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

      midi_param_val_x.addEventListener("input", function (event) {
        if (Number(event.target.value)) {
          item.data[param].x = event.target.value;
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

      midi_param_val_y.addEventListener("input", function (event) {
        if (Number(event.target.value)) {
          item.data[param].y = event.target.value;
        }
      });
      part_param.appendChild(midi_param_val_y);
    }

    else if (param === "mode") {
      // For details on the html form-select structure refer to
      // https://getbootstrap.com/docs/5.0/forms/select/
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
      let span_param = document.createElement("span");
      span_param.className = "input-group-text";
      span_param.textContent = param;
      part_param.appendChild(span_param);

      let params_list = document.createElement("select");
      params_list.className = "form-select form-select-sm";
      params_list.setAttribute("aria-label", ".form-select-sm select");
      params_list.setAttribute("id", item.name + "_value_" + item.id);

      for (const mode in item.modes) {
        let _option = document.createElement("option");
        _option.textContent = item.modes[mode];
        if (item.data.mode === item.modes[mode]) {
          _option.defaultSelected = true;
        }
        params_list.appendChild(_option);
      }

      params_list.addEventListener("change", function (event) {
        item.data.mode = event.target.value;
      });

      part_param.appendChild(params_list);
    }

    else if (param === "velocity" || param === "aftertouch" || param === "automap" || param === "pressure") {
      // For details on the buttons refer to
      // https://getbootstrap.com/docs/5.0/components/buttons/
      let span_param = document.createElement("span");
      span_param.className = "input-group-text";
      span_param.textContent = param;
      part_param.appendChild(span_param);

      let button = document.createElement("button");
      button.setAttribute("id", item.id + "_" + param + "_val");
      button.setAttribute("type", "button");
      button.className = "btn btn-outline-primary flex-fill";
      button.textContent = item.data[param];

      button.addEventListener("click", function (event) {
        if (event.target.textContent === "OFF") {
          button.textContent = "ON";
        } else {
          button.textContent = "OFF";
        }
        item.data[param] = button.textContent;
      });
      part_param.appendChild(button);
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

      midi_param_val.addEventListener("input", function (event) {
        if (Number(event.target.value)) {
          item.data[param] = event.target.value;
        }
      });

      part_param.appendChild(midi_param_val);
    }
    part_params.appendChild(part_param);
  }
  return part_params;
}

// For details on the html form_control structure refer to:
// https://getbootstrap.com/docs/5.0/forms/form-control/
function create_menu_2nd_level(item) {

  let sub_part_params = document.createElement("div");           // Sub part menu main div 
  sub_part_params.setAttribute("id", item.name + "_" + item.id); // Sub part menu UID

  //console.log(item.name + "_" + item.id);

  sub_part_params.className = "collapse";

  let table_params = document.createElement("table");
  table_params.className = "table table-sm table-striped table-bordered";

  let table_caption = document.createElement("caption");
  table_caption.className = "caption-top card-subtitle mb-2 text-body-secondary display-6";
  table_caption.textContent = item.name;
  table_params.appendChild(table_caption);

  let row_midi_params_body = document.createElement("tbody");

  for (const param in item.data.midi) {
    let row_midi_params_atr_tr = document.createElement("tr");
    let sub_part_name = document.createElement("th");
    sub_part_name.textContent = " ";
    row_midi_params_atr_tr.appendChild(sub_part_name);

    let row_midi_params_val_tr = document.createElement("tr");
    let midi_param_val = document.createElement("th");
    midi_param_val.className = "align-middle text-center";
    midi_param_val.textContent = param;
    row_midi_params_val_tr.appendChild(midi_param_val);

    for (const msg in item.data.midi[param]) {
      if (msg !== "val") {
        let midi_param_atr = document.createElement("th");
        midi_param_atr.setAttribute("id", item.id + "_" + param + "_" + msg + "_atr");
        midi_param_atr.className = "text-center";
        midi_param_atr.textContent = msg;
        row_midi_params_atr_tr.appendChild(midi_param_atr);

        let midi_param_td = document.createElement("td");
        let midi_param_val = document.createElement("input");
        midi_param_val.className = "form-control text-center";
        midi_param_val.setAttribute("type", "number");
        midi_param_val.setAttribute("id", item.id + "_" + param + "_" + msg + "_val");
        midi_param_val.setAttribute("aria-describedby", item.id + "_" + param + "_" + msg + "_atr");
        midi_param_val.addEventListener("input", function (event) {
          if (event.target.type === "number") {
            item.data.midi[param][msg] = event.target.value;
          }
        });
        midi_param_td.appendChild(midi_param_val);
        row_midi_params_val_tr.appendChild(midi_param_td);
      }
      row_midi_params_body.appendChild(row_midi_params_atr_tr);
      row_midi_params_body.appendChild(row_midi_params_val_tr);
    }
  }
  table_params.appendChild(row_midi_params_body);
  table_params.appendChild(row_midi_params_body);
  sub_part_params.appendChild(table_params);
  return sub_part_params;
};

// 1ST_LEVEL_ITEMS
function update_item_menu_params(item) {
  for (const part of item.children) {
    for (const param in part.data) {
      if (part.data[param].constructor.name === "Point") {
        $("#" + part.parent.id + "_" + param + "_val_x").val(Math.round(part.data[param].x));
        $("#" + part.parent.id + "_" + param + "_val_y").val(Math.round(part.data[param].y));
      }
      else {
        $("#" + part.parent.id + "_" + param + "_val").val(Math.round(part.data[param]));
      }
    }
  }
}

// UPADTE 2ND_LEVEL_ITEM MENU FROM TOP ITEM
function update_item_touch_menu_params(item) {
  for (const part of item.children) {
    for (const sub_part of part.children) {
      for (const param in sub_part.data.midi) { // position, pressure, etc.
        for (const msg in sub_part.data.midi[param]) {
          $("#" + sub_part.id + "_" + param + "_" + msg + "_val").val(sub_part.data.midi[param][msg]);
        }
      }
    }
  }
};

// UPADTE 2ND_LEVEL_ITEM
function update_touch_menu_params(part) {
  for (const param in part.data.midi) {
    for (const msg in part.data.midi[param]) {
      $("#" + part.id + "_" + param + "_" + msg + "_val").val(part.data.midi[param][msg]);
    }
  }
};

function remove_item_menu_params(item) {
  let div_params = document.getElementById("e256_params");
  let item_params = document.getElementById(item.name + "_" + item.id);
  div_params.removeChild(item_params);
  //$("#contextualContent").html(" ");
};

// Show/Hide menu params
function item_menu_params(item, state) {
  $("#" + item.name + "_" + item.id).collapse(state);
};
