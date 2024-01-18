/*
    This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
    Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
    This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function move_item(item, mouseEvent) {
  item.translate(mouseEvent.delta);
  //item.firstChild.data.from = item.bounds.topLeft; // GET_BUG!?
  //item.firstChild.data.to = item.bounds.bottomRight; // GET_BUG!?
  item.firstChild.data.from = new paper.Point(item.bounds.left, item.bounds.top);
  item.firstChild.data.to = new paper.Point(item.bounds.right, item.bounds.bottom);
};

function mapp(input, in_min, in_max, out_min, out_max) {
  if (input === in_max) {
    return out_max;
  }
  else if (out_min < out_max) {
    return Math.abs((input - in_min) * (out_max - out_min + 1) / (in_max - in_min) - out_max);
  }
  else {
    return Math.abs((input - in_min) * (out_max - out_min - 1) / (in_max - in_min) + out_min);
  }
}

// Max is exclusive and min is inclusive
function get_random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

function deg_to_rad(degree) {
  return degree * (Math.PI / 180);
};

function rad_to_deg(radian) {
  return radian * (180 / Math.PI);
};

function pol_to_cart(radius, theta) {
  let pos_x = radius * Math.cos(theta);
  let pos_y = radius * Math.sin(theta);
  return {
    "x": pos_x,
    "y": pos_y
  };
}

// Returning radian
function cart_to_pol(_x, _y) {
  let radius = Math.sqrt((_x * _x) + (_y * _y));
  let theta = 0;
  if (_x == 0 && 0 < _y) {
    theta = (Math.PI / 2);
  } else if (_x == 0 && _y < 0) {
    theta = (3 * Math.PI) / 2;
  } else if (_x < 0) {
    theta = Math.atan(_y / _x) + Math.PI;
  } else if (_y < 0) {
    theta = Math.atan(_y / _x) + (2 * Math.PI);
  } else {
    theta = Math.atan(_y / _x);
  }
  return {
    "radius": radius,
    "theta": theta
  }
};

function rotate_polar(degree, offset, dir) {
  let polar_value = 0;
  switch (dir){
    case 'clockwise':
      polar_value = (Math.abs(degree - 380) + offset) % 380; // Anti-clockwise direction
      break;
    case 'counter-clockwise':
      polar_value = (Math.abs(degree + 380) - offset) % 380;    // Clockwise direction
      break;
  }
  return polar_value;
};
