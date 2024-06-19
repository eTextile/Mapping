/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
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
  card_header.className = "card-title display-5";
  card_header.append(item.name + " params");
  div_item_menu_params.appendChild(card_header);

  for (const part of item.children) { // 1ST LEVEL ITEM MENU PARAMS
    if (part.data) {
      div_item_menu_params.appendChild(create_menu_1st_level(part));
    }
    for (const sub_part of part.children) { // 2ND LEVEL ITEM MENU PARAMS
      if (sub_part.msg) {
        div_item_menu_params.appendChild(create_menu_2nd_level(sub_part));
      }
    }
  }
  div_menu_params.appendChild(div_item_menu_params);
  $("#set_button_params").collapse("show");
};

function remove_item_menu_params(item) {
  let div_menu_params = document.getElementById("e256_params");
  let div_item_menu_params = document.getElementById(item.name + "_" + item.id);
  if (div_item_menu_params) div_menu_params.removeChild(div_item_menu_params);
  //$("#contextualContent").html(" ");
};

//////////////////////////////////////////////// 1ST_LEVEL_ITEMS_MENU
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
          item.data[param].x = parseInt(event.target.value);
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
          item.data[param].y = parseInt(event.target.value);
        }
      });
      part_param.appendChild(midi_param_val_y);
    }

    else if (param === "mode_z") { ///////////// MODE
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
        if (MIDI_TYPES[item.data.mode_z] === item.modes[mode]) {
          _option.defaultSelected = true;
        }
        params_list.appendChild(_option);
      }

      params_list.addEventListener("change", function (event) {
        item.data.mode_z = eval(event.target.value);
        //re_create_item(current_controleur); // Rebuild the MIDI message like #btnSet
      });

      part_param.appendChild(params_list);
    }
    /*
    else if (param === "midilearn") {
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
    */
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

//function update_item_menu_params(item) {
function update_menu_1st_level(item) {
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

//////////////////////////////////////////////// 2ND_LEVEL_ITEMS_MENU
// For details on the html form_control structure refer to:
// https://getbootstrap.com/docs/5.0/forms/form-control/
function create_menu_2nd_level(item) {
  let sub_part_params = document.createElement("div");           // Sub part menu main div 
  sub_part_params.setAttribute("id", item.name + "_" + item.id); // Sub part menu UID

  sub_part_params.className = "collapse";

  let table_params = document.createElement("table");
  table_params.className = "table table-sm table-striped table-bordered";

  let table_caption = document.createElement("caption");
  table_caption.className = "caption-top card-subtitle mb-2 text-body-secondary display-6";
  table_caption.textContent = item.name;
  table_params.appendChild(table_caption);

  let row_params_body = document.createElement("tbody");

  for (const msg_type in item.msg) {

    let row_params_atr_tr = document.createElement("tr");
    let row_params_val_tr = document.createElement("tr");

    let first_param_atr = document.createElement("th");
    first_param_atr.textContent = "";
    row_params_atr_tr.appendChild(first_param_atr);

    let status = midi_msg_status_unpack(item.msg[msg_type].midi.status);

    let first_param_val = document.createElement("th");
    first_param_val.className = "align-middle text-center";
    first_param_val.textContent = MIDI_TYPES[status.type]; // Set MIDI message type
    row_params_val_tr.appendChild(first_param_val);

    let param_arg = null;

    for (const param in item.msg[msg_type]) {
      switch (param) {

        case "midi":
          for (const midi_byte in item.msg[msg_type][param]) {
            switch (midi_byte) {
              case "status":
                param_arg = "chan";
                break;
              case "data1":
                param_arg = DATA1[status.type];
                break;
              case "data2":
                param_arg = DATA2[status.type];
                break;
            }
            if (param_arg !== "null") {
              let param_atr = document.createElement("th");
              param_atr.setAttribute("id", item.id + "_" + msg_type + "_" + param_arg + "_atr");
              param_atr.className = "align-middle text-center";
              param_atr.textContent = param_arg;

              let param_val = document.createElement("input");
              param_val.className = "form-control text-center";
              param_val.setAttribute("type", "number");
              param_val.setAttribute("id", item.id + "_" + msg_type + "_" + param_arg + "_val");
              //console.log("MAKE_ID: " + item.id + "_" + msg_type + "_" + param_arg + "_val");
              param_val.setAttribute("aria-describedby", item.id + "_" + msg_type + "_" + param_arg + "_atr");

              param_val.addEventListener("input", function (event) {
                if (event.target.type === "number") {
                  if (midi_byte === "status") {
                    if (event.target.value > 0 && event.target.value <= 16) {
                      item.msg[msg_type][param][midi_byte] = midi_msg_status_pack(status.type, event.target.value);
                      $("#" + event.target.id).css("background-color", "lightGreen");
                    }
                    else {
                      $("#" + event.target.id).css("background-color", "pink");
                    }
                  }
                  else if (event.target.value > -1 && event.target.value < 128) {
                    item.msg[msg_type][param][midi_byte] = event.target.value;
                    $("#" + event.target.id).css("background-color", "lightGreen");
                  }
                  else {
                    $("#" + event.target.id).css("background-color", "pink");
                  }
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
          for (const limit in item.msg[msg_type][param]) {
            let param_atr = document.createElement("th");
            param_atr.setAttribute("id", item.id + "_" + MIDI_TYPES[status.type] + "_" + limit + "_atr");
            param_atr.className = "align-middle text-center";
            param_atr.textContent = limit;

            let param_val = document.createElement("input");
            param_val.className = "form-control text-center";
            param_val.setAttribute("type", "number");
            param_val.setAttribute("id", item.id + "_" + msg_type + "_" + limit + "_val");
            param_val.setAttribute("aria-describedby", item.id + "_" + msg_type + "_" + limit + "_atr");

            param_val.addEventListener("input", function (event) {
              if (event.target.type === "number") {
                if (event.target.value > -1 && event.target.value < 128) {
                  item.msg[msg_type][param][limit] = event.target.value;
                  $("#" + event.target.id).css("background-color", "lightGreen");
                }
                else {
                  $("#" + event.target.id).css("background-color", "pink");
                }
              }
            });
            let param_td = document.createElement("td");
            param_td.appendChild(param_val);
            row_params_atr_tr.appendChild(param_atr);
            row_params_val_tr.appendChild(param_td);
          }
          break;
      }
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
function update_menu_2nd_level(item) {
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
                $("#" + sub_part.id + "_" + msg_type + "_" + midi_arg + "_val").val(midi_value);
              }
              break;
            case "limit":
              $("#" + sub_part.id + "_" + msg_type + "_min_val").val(sub_part.msg[msg_type][param].min);
              $("#" + sub_part.id + "_" + msg_type + "_max_val").val(sub_part.msg[msg_type][param].max);
              break;
          }
        }
      }
    }
  }
}

// UPADTE 2ND_LEVEL_ITEM (FROM SUB PART ITEM)
/*
function update_touch_menu_params(sub_part) {
  let status = null;
  let midi_arg = null;
  let midi_value = null;
  for (const param in sub_part.msg) {
    //console.log("PARAM_B: " + param);
    switch (param) {
      case "midi":
        for (const midi_byte in sub_part.msg[msg_type]) {
          switch (midi_byte) {
            case "status":
              status = midi_msg_status_unpack(sub_part.msg[param][midi_byte]);
              midi_arg = "chan";
              midi_value = status.channel;
              break;
            case "data1":
              midi_arg = DATA1[status.type];
              midi_value = sub_part.msg.[msg_type][midi_byte];
              break;
            case "data2":
              midi_arg = DATA2[status.type];
              midi_value = sub_part.msg.[msg_type][midi_byte];
              break;
          }
          $("#" + sub_part.id + "_" + MIDI_TYPES[status.type] + "_" + midi_arg + "_val").val(midi_value);
        }
        break;
      case "limit":
        $("#" + sub_part.id + "_" + MIDI_TYPES[status.type] + "_min_val").val(sub_part.msg.limit.min);
        $("#" + sub_part.id + "_" + MIDI_TYPES[status.type] + "_max_val").val(sub_part.msg.limit.max);
        break;
    }
  }
};
*/

// Show/Hide menu params
function item_menu_params(item, state) {
  $("#" + item.name + "_" + item.id).collapse(state);
};

function re_create_item(item) {
  item.save_params();
  remove_item_menu_params(item);
  item.removeChildren();
  item.create();
  create_item_menu_params(item);
  update_menu_1st_level(item);
  update_menu_2nd_level(item);
  item_menu_params(item, "show");
}

//////////////// Tail effect
function scroll() {
  let div_height = $("#midi_term").get(0).scrollHeight;
  $("#midi_tescrollrm").animate({ scrollTop: div_height }, 10);
}

function circular_buffer(max_length) {
  this._max_length = max_length;
  this._msg_count = 0;
}

circular_buffer.prototype = Object.create(Array.prototype);

circular_buffer.prototype.push = function (midiMsg) {
  Array.prototype.push.call(this, midiMsg);
  let div_midi_msg = document.createElement("div");
  div_midi_msg.setAttribute("id", "midi_msg_" + this._msg_count);

  let status = new midi_msg_status_unpack(midiMsg.status);
  div_midi_msg.textContent = MIDI_TYPES[status.type] + " : [ " + status.channel + ", " + midiMsg.data1 + ", " + midiMsg.data2 + " ]";

  $("#midi_term").append(div_midi_msg);
  while (this.length > this._max_length) {
    this.shift();
    scroll();
    $("#midi_msg_" + (this._msg_count - this._max_length)).remove();
  }
  this._msg_count++;
}

var midi_term = new circular_buffer(25);
