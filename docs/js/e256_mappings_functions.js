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
  div_card.className = "collapse";                         // Used to show/hide item params

  let card_header = document.createElement("div");         // div item name
  card_header.className = "card-header display-6";
  card_header.append(item.name + " params");
  div_card.appendChild(card_header);

  for (const part of item.children) {
    let part_params = document.createElement("div");
    part_params.setAttribute("id", part.name + "_" + item.id);  // div UID use to delate the div
    part_params.className = "collapse";
    //console.log("MENU_ID: " + "id", part.name + "_" + item.id); // MENU PROB
    
    // First level
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

    // Second level
    for (const sub_part in part.children) {
      let sub_part_params = document.createElement("div");
      sub_part_params.setAttribute("id", part.children[sub_part].name + "_" + part.children[sub_part].id); // Used to show/hide sub item params
      sub_part_params.className = "collapse";
      
      let card_header = document.createElement("div");
      card_header.className = "card-header display-6";
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
  if (item.hasChildren()) {
    for (const part of item.children) {
      for (const param in part.data.form_style) {
        let div_param_value = "#" + param + "_value_" + item.id;
        switch (part.data.form_style[param]) {
          case "form-control":
            if(typeof part.data[param] === "object"){
              //console.log("SET: " + div_param_value); // PROB
              $(div_param_value).val(JSON.stringify(part.data[param]));
            } else {
              $(div_param_value).val(part.data[param]);
            }
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
  if (item){
    switch(state){
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

/*
<div id="div_groupe" class="input-group">
  <span id="uid_param_atribute" class="input-group-text"></span>
  <input id="uid_param_value" type="text" class="form-control" aria-label="Small" aria-describedby="uid_param_atribute">
</div>
*/

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

  inputValue.addEventListener("change", function (event) {
    item.data[param] = JSON.parse(inputValue.value);
  });

  div_groupe.appendChild(inputValue);
  return div_groupe;
};

/*
<select class="form-select form-select-sm" aria-label=".form-select-sm">
  <option selected>Open</option>
  <option value="1">One</option>
  <option value="2">Two</option>
  <option value="3">Three</option>
</select>
*/
function param_form_select(item, param) {

  let div_groupe = document.createElement("div");
  div_groupe.className = "input-group";

  let span_param = document.createElement("span");
  span_param.className = "input-group-text";
  span_param.textContent = param;
  div_groupe.appendChild(span_param);

  let select = document.createElement("select");
  select.className = "form-select form-select-sm";
  select.setAttribute("aria-label", ".form-select-sm select"); //select
  select.setAttribute("id", param + "_value_" + item.id);

  // https://developer.mozilla.org/fr/docs/Web/API/HTMLOptionElement
  let _index = 0;
  for (const value in item.data.form_select_params[param]) {
    let option = document.createElement("option");
    option.value = _index;
    if (item.data.form_select_params[param][value] === item.data[param]) {
      option.defaultSelected = true;
    }
    option.textContent = item.data.form_select_params[param][value];
    select.appendChild(option);
    _index++;
  }
  
  select.addEventListener("change", function (event) {
    item.data[param] = item.data.form_select_params[param][this.value];
  });
  
  div_groupe.appendChild(select);
  return div_groupe;
};


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

  button.addEventListener("click", () => {
    if (button.textContent === "ON") {
      button.textContent = "OFF";
    } else {
      button.textContent = "ON";
    }
    item.data[param] = button.textContent;
  });

  div_groupe.appendChild(button);
  return div_groupe;
};




function moveItem(item, mouseEvent) {
  //console.log("MOVE: " + item.name);
  item.translate(mouseEvent.delta);
  item.firstChild.from = Math.round(item.bounds.topLeft);
  item.firstChild.to = Math.round(item.bounds.bottomRight);
};

function scale2d(item, mouseEvent) {
  let x = mouseEvent.point.x - item.data.x;
  let y = mouseEvent.point.y - item.data.y;
  let radius = Math.sqrt((x * paramx) + (y * y));
  let newRadius = radius - (item.children[0].strokeWidth / 2);
  let oldRadius = (item.data.to.x - item.data.from.x) / 2;
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
