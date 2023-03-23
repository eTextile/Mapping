/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function showMenuParams(item) {
	$("#summaryContent").html(item.name + "_" + item.parent.uid + " parameters");
  $("#" + item.parent.uid + "_" + item.name + "_params").collapse("show");
};

function hideMenuParams(item) {
	//$("#summaryContent").html(item.name + " Null");
  console.log("HIDE: " + item.parent.uid + "_" + item.name + "_params");
	$("#" + item.parent.uid + "_" + item.name + "_params").collapse("hide");
};

function create_menu_params(item) {
  // Iterate through the childrens contained within the item:
  for (var index = 0; index < item.children.length; index++) {
    let div_params = document.createElement("div");
    div_params.setAttribute("id", item.uid + "_" + item.children[index].name + "_params");
    
    console.log("CREATE: " + item.uid + "_" + item.children[index].name + "_params");

    div_params.className = "collapse";
    for (const param in item.children[index].data) {
      switch (item.children[index].data[param]) {
        case "form-control":
          div_params.appendChild(param_form_control(item.uid, param));
          break;
        case "form-select":
          div_params.appendChild(param_form_select(item.uid, param));
          break;
        case "form-toggle":
          div_params.appendChild(param_toggle(item.uid, param));
          break;
        default:
          break;
      }
    }
    let div_menu_params = document.getElementById("e256_params");
    div_menu_params.appendChild(div_params);
  }
  $("#set_button_params").collapse("show");
};

/*
<div id="div_groupe" class="input-group">
  <span id="uid_atribute_param" class="input-group-text"></span>
	<input id="param_value_param" type="text" class="form-control" aria-label="Small" aria-describedby="uid_atribute_param">
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
  inputValue.setAttribute("id", uid + "_" + param);
	inputValue.className = "form-control";
	inputValue.setAttribute("aria-label", "Small");
  inputValue.setAttribute("aria-describedby", uid + "_" + param + "_atribute");
	div_groupe.appendChild(inputValue);
	return div_groupe;
};

/*
<div id="div_groupe" class="input-group">
  <span id="param_atribute_param" class="input-group-text"></span>
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

function param_form_select(uid, param){

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
  dropdown_button.setAttribute("id", uid + "_" + param);
	dropdown_button.setAttribute("data-bs-toggle", "dropdown"); // Used to toggle the dropdown
	dropdown_button.className = "btn btn-outline-primary dropdown-toggle";
  dropdown_button.setAttribute("aria-haspopup", "false");
	dropdown_button.setAttribute("aria-expanded", "false");
  dropdown_button.textContent = " SELECT ";
  dropdown.appendChild(dropdown_button);

  var dropdown_menu = document.createElement("div");
  dropdown_menu.className = "dropdown-menu";  
  for (let i = 0; i < 10; i++) {
    var dropdown_item = document.createElement("a");
    dropdown_item.className = "dropdown-item";
    dropdown_item.addEventListener('click', (event) =>{
			dropdown_button.textContent = event.target.innerText;
      //console.log(selected_item.name);
		});
    dropdown_item.textContent = i;
	  dropdown_menu.appendChild(dropdown_item);
  }
  dropdown.appendChild(dropdown_menu);
  div_groupe.appendChild(dropdown);

	return div_groupe;
};

function param_toggle(uid, param){
  var div_groupe = document.createElement("div");
	div_groupe.className = "input-group d-flex";

	let span_param = document.createElement("span");
	span_param.className = "input-group-text";
  span_param.textContent = param;
	div_groupe.appendChild(span_param);

	let button = document.createElement("button");
	button.setAttribute("id", uid + "_" + param);
  button.setAttribute("type", "button");
	button.className = "btn btn-outline-primary flex-fill";
  button.textContent = "OFF";
  button.addEventListener('click', (event) =>{
    if(button.textContent === "ON"){ 
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
	item.data.from[0] = Math.round(item.bounds.left);
	item.data.from[1] = Math.round(item.bounds.top);
	item.data.to[0] = Math.round(item.bounds.right);
	item.data.to[1] = Math.round(item.bounds.bottom);
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
