/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/*
<div class="card-body"> // div_part_params
  <div class="card text-bg-warning mb-3" style="max-width: 18rem;">
    <div class="card-header">Header</div>
    <div class="card-body">
      <h5 class="card-title">Warning card title</h5>
      <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
    </div>
  </div>
</div>
*/

function item_create_menu_params(item) {

  let menu_params = document.getElementById("e256_params");
  menu_params.className = "card-body";

  let div_card = document.createElement("div");            // div item params
  div_card.setAttribute("id", item.name + "_" + item.id);  // div UID use to delate the div
  div_card.className = "collapse";                         // Used to show/hide

  let card_header = document.createElement("div");         // div item name
  card_header.className = "card-header display-6";

  card_header.append(item.name + " parameters");
  div_card.appendChild(card_header);

  // First level
  for (const gui_item of item.children) {
    for (const param in gui_item.data.form_style) {
      let gui_item_params = document.createElement("div");
      switch (gui_item.data.form_style[param]) {
        case "form-control":
          gui_item_params.appendChild(param_form_control(item.id, param));
          break;
        case "form-select":
          gui_item_params.appendChild(param_form_select(item.id, param));
          break;
        case "form-toggle":
          gui_item_params.appendChild(param_toggle(item.id, param));
          break;
        default:
          // No menu params!
          break;
      }
      div_card.appendChild(gui_item_params);
    }

    // Second level
    //let card_body = document.createElement("div");

    for (const sub_part in gui_item.children) {
      let sub_part_param = document.createElement("div");
      sub_part_param.setAttribute("id", gui_item.children[sub_part].name + "_" + gui_item.children[sub_part].id); // Used to show/hide item params
      sub_part_param.className = "collapse";
      
      let card_header = document.createElement("div");
      card_header.className = "card-header display-6";
      card_header.append(gui_item.children[sub_part].name + " params");
      sub_part_param.appendChild(card_header);

      for (const param in gui_item.children[sub_part].data.form_style) {
        switch (gui_item.children[sub_part].data.form_style[param]) {
          case "form-control":
            sub_part_param.appendChild(param_form_control(gui_item.children[sub_part].id, param));
            break;
          case "form-select":
            sub_part_param.appendChild(param_form_select(gui_item.children[sub_part].id, param));
            break;
          case "form-toggle":
            sub_part_param.appendChild(param_toggle(gui_item.children[sub_part].id, param));
            break;
          default:
            // No menu params!
            break;
        }
        //card_body.appendChild(sub_part_param);
        div_card.appendChild(sub_part_param);
      }
      //div_card.appendChild(card_body);
    }

  }
  menu_params.appendChild(div_card);
  $("#set_button_params").collapse("show");
};

function update_menu_params(item) {
  for (const part of item.children) {
    for (const param in part.data.form_style) {
      let div_param_value = "#" + item.id + "_" + param + "_value";
      switch (part.data.form_style[param]) {
        case "form-control":
          $(div_param_value).val(Object.values(part.data[param]));
          break;
        case "form-select":
          $(div_param_value).text(part.data[param]);
          break;
        case "form-toggle":
          $(div_param_value).text(part.data[param]);
          break;
        default:
          break;
      }
    }
  }
};

// Function: update grid GUI uing form params
// Called using the "SET PARAMS" button #btnSet
function item_update_from_params(item) {
  for (const part of item.children) {
    for (const param in part.data.form_style) {
      let div_param_value = "#" + item.id + "_" + param + "_value";
      switch (part.data.form_style[param]) {
        case "form-control":
          part.data[param] = $(div_param_value).val().split(",");
          break;
        case "form-select":
          console.log("param: " + param);
          console.log("val: " + item.data[param]);
          part.data[param] = $(div_param_value).text();
          break;
        case "form-toggle":
          part.data[param] = $(div_param_value).text();
          break;
        default:
          break;
      }
    }
  }
};

function item_delate_menu_params(item) {
  let div_params = document.getElementById("e256_params");
  let item_params = document.getElementById(item.name + "_" + item.id);
  div_params.removeChild(item_params);
  $("#summaryContent").html(" ");
};

function item_menu_params(item, state) {
  if (item){
    switch(state){
      case "show":
        $("#summaryContent").html(item.name + " params");
        $("#" + item.name + "_" + item.id).collapse("show");
        console.log("Show: #" + item.name + "_" + item.id);
        break;
      case "hide":
        $("#summaryContent").html(" ");
        $("#" + item.name + "_" + item.id).collapse("hide");
        console.log("Hide: #" + item.name + "_" + item.id);
        break;
    }
  }
};

/*
<div id="div_groupe" class="input-group">
  <span id="uid_param_atribute" class="input-group-text"></span>
  <input id="uid_param_value" type="text" class="form-control" aria-label="Small" aria-describedby="uid_param_atribute">
</div>
*/

function param_form_control(uid, param) {
  var div_groupe = document.createElement("div");
  div_groupe.className = "input-group";
  let span_param = document.createElement("span");
  span_param.setAttribute("id", uid + "_" + param + "_atribute");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);
  let inputValue = document.createElement("input");
  inputValue.setAttribute("id", uid + "_" + param + "_value");
  inputValue.className = "form-control";
  inputValue.setAttribute("aria-label", "Small");
  inputValue.setAttribute("aria-describedby", uid + "_" + param + "_atribute");
  div_groupe.appendChild(inputValue);
  return div_groupe;
};

/*
<div id="div_groupe" class="input-group">
  <span id="uid_param_atribute" class="input-group-text"></span>
  <input id="param_param_value" type="text" class="form-control" aria-label="Small" aria-describedby="uid_param_atribute">
</div>
*/
// TODO!
function param_form_control_double(uid, param) {
  var div_groupe = document.createElement("div");
  div_groupe.className = "input-group";
  let span_param = document.createElement("span");
  span_param.setAttribute("id", uid + "_" + param + "_atribute");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);
  let input_value = document.createElement("input");
  input_value.setAttribute("id", uid + "_" + param + "_value");
  input_value.className = "form-control";
  input_value.setAttribute("aria-label", "Small");
  input_value.setAttribute("aria-describedby", uid + "_" + param + "_atribute");
  div_groupe.appendChild(inputValue);
  return div_groupe;
};
/*
<div id="div_groupe" class="input-group">
  <span id="uid_param_value" class="input-group-text"></span>
    <div class="dropdown">
      <button type="button" class="btn btn-danger dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        SELECT
      </button>
      <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="#">INDEX-0</a></li>
        <li><a class="dropdown-item" href="#">INDEX-1</a></li>
        <li><a class="dropdown-item" href="#">INDEX-2</a></li>
      </ul>
  </div>
</div>
*/

function param_form_select(uid, param) {

  var div_groupe = document.createElement("div");
  div_groupe.className = "input-group";

  let span_param = document.createElement("span");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);

  var dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  var dropdown_button = document.createElement("button");
  dropdown_button.setAttribute("type", "button");
  dropdown_button.setAttribute("id", uid + "_" + param + "_value");
  dropdown_button.setAttribute("data-bs-toggle", "dropdown"); // Used to toggle the dropdown
  dropdown_button.className = "btn btn-outline-primary dropdown-toggle";
  dropdown_button.setAttribute("aria-haspopup", "false");
  dropdown_button.setAttribute("aria-expanded", "false");
  dropdown_button.textContent = "SELECT";
  dropdown.appendChild(dropdown_button);

  var dropdown_menu = document.createElement("div");
  dropdown_menu.className = "dropdown-menu";
  for (let i = 0; i < 10; i++) {
    var dropdown_item = document.createElement("a");
    dropdown_item.className = "dropdown-item";
    dropdown_item.addEventListener('click', (event) => {
      dropdown_button.textContent = event.target.innerText;
    });
    dropdown_item.textContent = i; // This will be a liste of modes!?
    dropdown_menu.appendChild(dropdown_item);
  }
  dropdown.appendChild(dropdown_menu);
  div_groupe.appendChild(dropdown);
  return div_groupe;
};

function param_toggle(uid, param) {
  var div_groupe = document.createElement("div");
  div_groupe.className = "input-group d-flex";

  let span_param = document.createElement("span");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);

  let button = document.createElement("button");
  button.setAttribute("id", uid + "_" + param + "_atribute");
  button.setAttribute("type", "button");
  button.className = "btn btn-outline-primary flex-fill";
  button.textContent = "OFF";
  button.addEventListener('click', (event) => {
    if (button.textContent === "ON") {
      button.textContent = "OFF";
    } else {
      button.textContent = "ON";
    }
  });
  div_groupe.appendChild(button);
  return div_groupe;
};

function moveItem(item, mouseEvent) {
  item.translate(mouseEvent.delta);
  item.data.from.x = Math.round(item.bounds.left);
  item.data.from.y = Math.round(item.bounds.top);
  item.data.to.x = Math.round(item.bounds.right);
  item.data.to.y = Math.round(item.bounds.bottom);
};

function scale2d(item, mouseEvent) {
  var x = mouseEvent.point.x - item.data.x;
  var y = mouseEvent.point.y - item.data.y;
  var radius = Math.sqrt((x * x) + (y * y));
  var newRadius = radius - (item.children[0].strokeWidth / 2);
  var oldRadius = (item.data.to.x - item.data.from.x) / 2;
  item.scale(newRadius / oldRadius);
  item.data.size = Math.round(item.children[0].bounds.width);
};

function deg_to_rad(degree) {
  return degree * (Math.PI / 180);
};

function rad_to_deg(radian) {
  return radian * (180 / Math.PI);
};

// Returning radian
function cart_to_pol(x, y) {
  var radius = Math.sqrt((x * x) + (y * y));
  var theta = 0;
  if (x == 0 && 0 < y) {
    theta = (Math.PI / 2);
  } else if (x == 0 && y < 0) {
    theta = (3 * Math.PI) / 2;
  } else if (x < 0) {
    theta = Math.atan(y / x) + Math.PI;
  } else if (y < 0) {
    theta = Math.atan(y / x) + (2 * Math.PI);
  } else {
    theta = Math.atan(y / x);
  }
  return {
    "radius": radius,
    "theta": theta
  }
};

function pol_to_cart(radius, theta) {
  var x = radius * Math.cos(theta);
  var y = radius * Math.sin(theta);
  return {
    "x": x,
    "y": y
  }
};

function rotatePolar(degree, offset) {
  // return (Math.abs(degree - 380) + offset) % 380; // Anti-clockwise direction
  return (Math.abs(degree + 380) - offset) % 380;    // Clockwise direction
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
