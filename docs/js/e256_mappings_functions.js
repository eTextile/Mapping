/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function item_create_menu_params(item) {

  let menu_params = document.getElementById("e256_params");
  menu_params.className = "card-body";

  let div_card = document.createElement("div");            // div item params
  div_card.setAttribute("id", item.name + "_" + item.id);  // div UID use to delate the div
  div_card.className = "collapse";                         // Used to show/hide item params

  let card_header = document.createElement("div");         // div item name
  card_header.className = "card-title display-6";
  card_header.append(item.name + " params");
  div_card.appendChild(card_header);

  // ITEMS_1ST_LEVEL
  for (const part of item.children) {
    let part_params = document.createElement("div");

    //console.log("MENU_1ST: " + part.name + "_" + item.index); // PROB_MENU

    part_params.setAttribute("id", part.name + "_" + item.id);  // UID use to delate the div menu
    part_params.className = "collapse";

    for (const param in part.data.form_style) {

      switch (part.data.form_style[param]) {
        case "form-control":
          part_params.appendChild(param_form_control(part, param));
          break;
        case "form-select":
          part_params.appendChild(param_form_select(part, param));
          break;
        case "form-toggle":
          part_params.appendChild(param_toggle(part, param));
          break;
        default:
          // No menu params!
          break;
      }
      div_card.appendChild(part_params);
    }

    // ITEMS_2ND_LEVEL
    for (const sub_part in part.children) {
      let sub_part_params = document.createElement("div");

      //console.log("MENU_2ND: " + part.children[sub_part].name + "_" + part.children[sub_part].index); // PROB_MENU

      sub_part_params.setAttribute("id", part.children[sub_part].name + "_" + part.children[sub_part].id); // Used to show/hide sub item params
      sub_part_params.className = "collapse";

      let card_header = document.createElement("div");
      card_header.className = "card-title display-6";
      card_header.append(part.children[sub_part].name + " params");
      sub_part_params.appendChild(card_header);

      for (const param in part.children[sub_part].data.form_style) {
        switch (part.children[sub_part].data.form_style[param]) {
          case "form-control":
            sub_part_params.appendChild(param_form_control(part.children[sub_part], param));
            break;
          case "form-select":
            sub_part_params.appendChild(param_form_select(part.children[sub_part], param));
            break;
          case "form-toggle":
            sub_part_params.appendChild(param_toggle(part.children[sub_part], param));
            break;
          default:
            // No menu params!
            break;
        }
        div_card.appendChild(sub_part_params);
      }
    }
  }
  menu_params.appendChild(div_card);
  $("#set_button_params").collapse("show");
};

function update_menu_params(item) {
  // ITEMS_1ST_LEVEL
  for (const part of item.children) {
    for (const param in part.data.form_style) {
      //console.log("UPDATE_1ST: " + part.name + "_value_" + item.id); // PROB_MENU
      let div_param_value = "#" + param + "_value_" + item.id;
      switch (part.data.form_style[param]) {
        case "form-control":
          if (typeof part.data[param] === "object") {
            $(div_param_value).val(Math.round(part.data[param].x) + " " + Math.round(part.data[param].y));
          } else {
            $(div_param_value).val(part.data[param]);
          }
          break;
        case "form-select":
          //console.log("UPDATE_1ST: " + div_param_value); // PROB!!!
          $(div_param_value).text(part.data[param]);
          break;
        case "form-toggle":
          $(div_param_value).text(part.data[param]);
          break;
      }
    }
    // ITEMS_2ND_LEVEL
    for (const sub_part in part.children) {
      for (const param in part.children[sub_part].data.form_style) {
        //console.log("UPDATE_2ND: " + part.children[sub_part].name + "_value_" + part.children[sub_part].id); // PROB
        let div_param_value = "#" + part.children[sub_part].name + "_value_" + part.children[sub_part].id;
        switch (part.children[sub_part].data.form_style[param]) {
          case "form-control":
            if (typeof part.data[param] === "object") {
              console.log("OBJ: " + part.data[param].name);
              $(div_param_value).val(JSON.stringify(part.children[sub_part].data[param]));
            } else {
              $(div_param_value).val(part.children[sub_part].data[param]);
            }
            break;
          case "form-select":
            //console.log("UPDATE_2ND: " + div_param_value); // PROB!!!
            $(div_param_value).text(part.children[sub_part].data[param]);
            break;
          case "form-toggle":
            $(div_param_value).text(part.children[sub_part].data[param]);
            break;
        }
      }
    }
  }
};

// Function: update grid GUI using form params
// Called by the "SET PARAMS" button #btnSet
function item_create_from_params(item) {
  item.save_params();
  item_remove_menu_params(item);
  item.removeChildren();
  item.create();
  item_create_menu_params(item);
  update_menu_params(item);
  item_menu_params(item, "show");
};

function item_remove_menu_params(item) {
  let div_params = document.getElementById("e256_params");
  let item_params = document.getElementById(item.name + "_" + item.id);
  div_params.removeChild(item_params);
  $("#summaryContent").html(" ");
};

function item_menu_params(item, state) {
  if (item) {
    switch (state) {
      case "show":
        //$("#summaryContent").html(item.name + " params");
        $("#" + item.name + "_" + item.id).collapse("show");
        for (const part of item.children) {
          $("#" + part.name + "_" + item.id).collapse("show");
        }
        break;
      case "hide":
        //$("#summaryContent").html(" ");
        $("#" + item.name + "_" + item.id).collapse("hide");
        for (const part of item.children) {
          $("#" + part.name + "_" + item.id).collapse("hide");
        }
        break;
    }
  }
};

// For details on the html form_control structure refer to
// https://getbootstrap.com/docs/5.0/forms/form-control/
function param_form_control(item, param) {
  let div_groupe = document.createElement("div");
  div_groupe.className = "input-group";
  let span_param = document.createElement("span");
  span_param.setAttribute("id", param + "_atribute_" + item.parent.id);
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);
  let inputValue = document.createElement("input");
  inputValue.setAttribute("id", param + "_value_" + item.parent.id);
  inputValue.className = "form-control";
  inputValue.setAttribute("aria-label", "Small");
  inputValue.setAttribute("aria-describedby", param + "_atribute_" + item.parent.id);

  inputValue.addEventListener("input", function (event) {
    if (typeof event.target.value === "object") {
      let input = JSON.parse(event.target.value);
      item.data[param] = new paper.Point(input[1], input[2]);
    }
    else {
      item.data[param] = event.target.value;
    }
  });

  div_groupe.appendChild(inputValue);
  return div_groupe;
};

// For details on the html form-select structure refer to
// https://getbootstrap.com/docs/5.0/forms/select/
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
function param_form_select(item, param) {

  //console.log("PARAM: " + param)

  let div_groupe = document.createElement("div");
  div_groupe.className = "input-group";

  let span_param = document.createElement("span");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);

  let _params_list = document.createElement("select");

  _params_list.className = "form-select form-select-sm";
  _params_list.setAttribute("aria-label", ".form-select-sm select");
  _params_list.setAttribute("id", item.name + "_value_" + item.id);

  for (const value of MAPING_MENU[param]) {
    let _option = document.createElement("option");
    _option.textContent = value;

    if (item.data.midiMsg) { // Refact!
      if (item.data.midiMsg[param] === value) {
        _option.defaultSelected = true;
      } else {
        //_option.defaultSelected = false;
      }
    }
    else {
      if (item.data[param] === value) {
        _option.defaultSelected = true;
      } else {
        //_option.defaultSelected = false;
      }
    }
    _params_list.appendChild(_option);
  }

  _params_list.addEventListener("change", function (event) {
    if (item.data.midiMsg) {
      //item.data.midiMsg[param] = JSON.stringify(event.target.value);
      item.data.midiMsg[param] = JSON.parse(event.target.value);
    }
    else {
      item.data[param] = event.target.value;
    }
  });

  div_groupe.appendChild(_params_list);
  return div_groupe;
};

// For details on the buttons refer to
// https://getbootstrap.com/docs/5.0/components/buttons/
function param_toggle(item, param) {
  let div_groupe = document.createElement("div");
  div_groupe.className = "input-group d-flex";

  let span_param = document.createElement("span");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);

  let button = document.createElement("button");
  button.setAttribute("id", param + "_value_" + item.id);
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

  div_groupe.appendChild(button);
  return div_groupe;
};

function moveItem(item, mouseEvent) {
  item.translate(mouseEvent.delta);
  item.firstChild.data.from = new paper.Point(item.bounds.left, item.bounds.top);
  item.firstChild.data.to = new paper.Point(item.bounds.right, item.bounds.bottom);
};

function mapp(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};

// Max is exclusive and min is inclusive
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

// MIDI object constructur
function Midi_key(chan, note, velo) {
  this.chan = chan;   // Set the MIDI channel
  this.note = note;   // Set the MIDI note
  this.velo = velo;   // Set the MIDI velocinnty
};

// MIDI object constructur
function Midi_slider(chan, cc, min, max) {
  this.chan = chan;   // Set the MIDI channel
  this.cc = cc;       // Set the MIDI control change
};

// MIDI object constructur
function Midi_touch(x_chan, x_cc, y_chan, y_cc, z_chan, z_cc) {
  this.x_chan = x_chan;   // Set the MIDI channel
  this.x_cc = x_cc;       // Set the MIDI control change
  this.y_chan = y_chan;   // Set the MIDI channel
  this.y_cc = y_cc;       // Set the MIDI control change
  this.z_chan = z_chan;   // Set the MIDI channel
  this.z_cc = z_cc;       // Set the MIDI control change
};

// MIDI object constructur
function Midi_touch(x_chan, x_cc, y_chan, y_cc, z_chan, z_cc) {
  this.x_chan = x_chan;   // Set the MIDI channel
  this.x_cc = x_cc;       // Set the MIDI control change
  this.y_chan = y_chan;   // Set the MIDI channel
  this.y_cc = y_cc;       // Set the MIDI control change
  this.z_chan = z_chan;   // Set the MIDI channel
  this.z_cc = z_cc;       // Set the MIDI control change
};

function Midi_knob(
  t_chan, t_cc, t_min, t_max,
  r_chan, r_cc, r_min, r_max
  ) {
  this.t_chan = t_chan;
  this.t_cc = t_cc;
  this.t_min = t_min;
  this.t_max = t_max;
  this.r_chan = r_chan;
  this.r_cc = r_cc;
  this.r_min = r_min;
  this.r_max = r_max;
};
