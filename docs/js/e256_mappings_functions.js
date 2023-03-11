
function moveItem(item, mouseEvent) {
	item.translate(mouseEvent.delta);
	item.data.from[0] = Math.round(item.bounds.left);
	item.data.from[1] = Math.round(item.bounds.top);
	item.data.to[0] = Math.round(item.bounds.right);
	item.data.to[1] = Math.round(item.bounds.bottom);
}

function showMenuParams(item) { ////////////////////////////// TO_UPDATE!
	$("#summaryContent").html(item.name + " parameters");
	$("#" + item.name + "-params" ).collapse("show");
	$("#set_button_params").collapse("show");
}

function hideMenuParams(item) {
	$("#summaryContent").html(item.name + " Null");
	$("#" + item.name + "-params").collapse("hide");
	$("#set_button_params").collapse("hide");
}

function updateMenuParams(item) {
	for (const param in item.data) {
		$("#param_atribute-" + param).html(param);
		$("#param_value-" + param).val(item.data[param]);
	}
}

/*
<div id="Grid-params" class="collapse">
	<div class="input-group">
		<span id="param_atribute-name" class="input-group-text"></span>
		<input id="param_value-name" type="text" class="form-control" aria-label="Small" aria-describedby="param_atribute-name">
	</div>
	<div class="input-group">
		<span id="param_atribute-name" class="input-group-text"></span>
		<input id="param_value-name" type="text" class="form-control" aria-label="Small" aria-describedby="param_atribute-name">
	</div>
</div>
*/


function create_params(item, params_style) {
	
	let div_params = document.getElementById("e256_params");
	
	let params = document.createElement("div");
	params.setAttribute("id", item.name + "-params");
	params.className = "collapse";

	for (const param in item.data) {

		let divGroupe = document.createElement("div");
		divGroupe.className = "input-group";

		let spanParam = document.createElement("span");
		spanParam.setAttribute("id", "param_atribute-" + param);

		spanParam.className = "input-group-text";
		divGroupe.appendChild(spanParam);

		let inputValue = document.createElement("input");
		inputValue.setAttribute("id", "param_value-" + param);

		inputValue.className = params_style[param]; // <<<<<<<

		inputValue.setAttribute("aria-label", "Small");
		inputValue.setAttribute("aria-describedby", "param_atribute-" + param);
		divGroupe.appendChild(inputValue);

		div_params.appendChild(divGroupe);
	}
}

function scale2d(item, mouseEvent) {
	var x = mouseEvent.point.x - item.data.x;
	var y = mouseEvent.point.y - item.data.y;
	var radius = Math.sqrt((x * x) + (y * y));
	var newRadius = radius - (item.children[0].strokeWidth / 2);
	var oldRadius = (item.data.to.x - item.data.from.x) / 2;
	item.scale(newRadius / oldRadius);
	item.data.size = Math.round(item.children[0].bounds.width);
}

function deg_to_rad(degree) {
	return degree * (Math.PI / 180);
}

function rad_to_deg(radian) {
	return radian * (180 / Math.PI);
}

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
}

function pol_to_cart(radius, theta) {
	var x = radius * Math.cos(theta);
	var y = radius * Math.sin(theta);
	return {
		"x": x,
		"y": y
	}
}

function rotatePolar(degree, offset) {
	// return (Math.abs(degree - 380) + offset) % 380; // Anti-clockwise direction
	return (Math.abs(degree + 380) - offset) % 380;    // Clockwise direction
}

function mapp(value, low1, high1, low2, high2) {
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Max is exclusive and min is inclusive
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}
