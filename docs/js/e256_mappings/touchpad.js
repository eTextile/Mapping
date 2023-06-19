/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// TOUCHPAD Factory
function touchpadFactory() {
	const DEFAULT_PAD_WIDTH = 400;
	const DEFAULT_PAD_HEIGHT = 400;
	const DEFAULT_PAD_TOUCHS = 3;
	const DEFAULT_PAD_MIN = 0;
	const DEFAULT_PAD_MAX = 127;
	const DEFAULT_PAD_SIZE_MIN = 30;
	const MARGIN = 35;

	let frame_width = null;
	let frame_height = null;
	let previous_frame_width = null;
	let previous_frame_height = null;
	let highlight_item = null;
	let current_part = null;

	var _touchpad = new paper.Group({
			name: "TOUCHPAD",
			data: {
					from: null,
					to: null,
					touchs: null,
					min: null,
					max: null
			},

			setup_from_mouse_event: function (mouseEvent) {
					this.data.from = new paper.Point(
							Math.round(mouseEvent.point.x - (DEFAULT_PAD_WIDTH / 2)),
							Math.round(mouseEvent.point.y - (DEFAULT_PAD_HEIGHT / 2))
							);
					this.data.to = new paper.Point(
							Math.round(mouseEvent.point.x + (DEFAULT_PAD_WIDTH / 2)),
							Math.round(mouseEvent.point.y + (DEFAULT_PAD_HEIGHT / 2))
							);
					this.data.touchs = DEFAULT_PAD_TOUCHS;
					this.data.min = DEFAULT_PAD_MIN;
					this.data.max = DEFAULT_PAD_MAX;
			},

			setup_from_config: function (params) {
					this.data.from = new paper.Point(params.from);
					this.data.to = new paper.Point(params.to);
					this.data.touchs = params.touchs;
					this.data.min = params.min;
					this.data.max = params.max;
			},

			save_params: function () {
					this.data.from = this.children["pad-frame"].data.from;
					this.data.to = this.children["pad-frame"].data.to;
					this.data.touchs = this.children["pad-frame"].data.touchs;
					this.data.min = this.children["pad-frame"].data.min;
					this.data.max = this.children["pad-frame"].data.max;
					// TODO: save touchs
					console.log("ITEM_PARAMS_SAVED: " + this.name);
			},

			newTouch: function (index) {
					var _touch = new paper.Group({
							name: "pad-touch",
							index: index,
							pos: new paper.Point(
									getRandomInt(this.data.from.x + MARGIN, this.data.to.x - MARGIN),
									getRandomInt(this.data.from.y + MARGIN, this.data.to.y - MARGIN)
							),
							data: {
									midi_params: {
											x_chan: null,
											x_cc: null,
											y_chan: null,
											y_cc: null,
											z_chan: null,
											z_cc: null
									},
									form_style: {
											x_chan: "form-select",
											x_cc: "form-select",
											y_chan: "form-select",
											y_cc: "form-select",
											z_chan: "form-select",
											z_cc: "form-select"
									},
									form_select_params: {
											x_chan: MIDI_CHANNELS,
											x_cc: MIDI_CCHANGE,
											y_chan: MIDI_CHANNELS,
											y_cc: MIDI_CCHANGE,
											z_chan: MIDI_CHANNELS,
											z_cc: MIDI_CCHANGE
									}
							}
					});

					var _circle = new paper.Path.Circle({
							name: "touch-circle",
							center: new paper.Point(_touch.pos.x, _touch.pos.y),
							radius: 15
					});
					_circle.style = {
							fillColor: "green"
					};
					_touch.addChild(_circle);

					var _line_x = new paper.Path.Line({
							name: "touch-line-x",
							from: new paper.Point(this.data.from.x, _touch.pos.y),
							to: new paper.Point(this.data.to.x, _touch.pos.y),
							locked: true
					});
					_line_x.style = {
							strokeWidth: 1,
							strokeColor: "black"
					}
					_touch.addChild(_line_x);

					var _line_y = new paper.Path.Line({
							name: "touch-line-y",
							from: new paper.Point(_touch.pos.x, this.data.from.y),
							to: new paper.Point(_touch.pos.x, this.data.to.y),
							locked: true
					});
					_line_y.style = {
							strokeWidth: 1,
							strokeColor: "black"
					};
					_touch.addChild(_line_y);
					_touch.firstChild.bringToFront();
					return _touch;
			},

			create: function () {
					frame_width = this.data.to.x - this.data.from.x;
					frame_height = this.data.to.y - this.data.from.y;

					var _frame = new paper.Group({
							name: "pad-frame",
							data: {
									from: this.data.from,
									to: this.data.to,
									touchs: null,
									min: null,
									max: null,
									form_style: {
											from: "form-control",
											to: "form-control",
											touchs: "form-select",
											min: "form-select",
											max: "form-select"
									},
									form_select_params: {
											touchs: MIDI_CHANNELS,
											min: MIDI_NOTES,
											max: MIDI_NOTES
									}
							}
					});
					
					var _rect = new paper.Path.Rectangle({
							name: "frame-rect",
							from: this.data.from,
							to: this.data.to
					});
					_rect.style = {
							strokeWidth: 5,
							dashArray: [10, 5],
							strokeColor: "chartreuse",
							fillColor: "pink"
					};
					_frame.addChild(_rect);
					this.addChild(_frame);

					var _touchs = new paper.Group({
							name: "pad-touchs"
					});
					for (let index = 0; index < this.data.touchs; index++) {
							_touchs.addChild(this.newTouch(index));
					}
					this.addChild(_touchs);
					this.bringToFront();
			},

			onMouseEnter: function (mouseEvent) {
					var mouse_enter_options = {
							stroke: true,
							bounds: true,
							fill: true,
							tolerance: 8
					}
					tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);
					switch (e256_current_mode) {
							case EDIT_MODE:
									if (tmp_select) {
											if (tmp_select.item.name === "TOUCHPAD") {
													highlight_item = tmp_select.item.firstChild;
											}
											else if (tmp_select.item.name === "pad-frame" || tmp_select.item.name === "pad-touch") {
													highlight_item = tmp_select.item.firstChild;
											}
											else if (tmp_select.item.name === "frame-rect" || tmp_select.item.name === "touch-circle") {
													highlight_item = tmp_select.item;
											}
											else {
													console.log("NOT_USED: " + tmp_select.item.name);
													return;
											}
											highlight_item.selected = true;
									}
									break;
							case PLAY_MODE:
									console.log("PLAY_MODE: NOT IMPLEMENTED!");
									break;
							default:
									break;
					}
			},
		
			onMouseLeave: function () {
					switch (e256_current_mode) {
							case EDIT_MODE:
									highlight_item.selected = false;
									break;
							case PLAY_MODE:
									break;
							default:
									break;
					}
			},

			onMouseDown: function (mouseEvent) {

					this.bringToFront();

					var mouse_down_options = {
							stroke: false,
							bounds: true,
							fill: true,
							tolerance: 8
					}

					tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

					console.log(tmp_select.item.name);

					if (tmp_select) {
							previous_controleur = current_controleur; // DONE in paper_script.js
							current_controleur = this;

							previous_item = current_item;
							previous_part = current_part;

							if (tmp_select.item.name === "TOUCHPAD") {
									current_item = tmp_select.item.firstChild;
									current_part = tmp_select;
							}
							else if (tmp_select.item.name === "pad-frame" || tmp_select.item.name === "pad-touch") {
									current_item = tmp_select.item;
									current_part = tmp_select;
							}
							else if (tmp_select.item.name === "frame-rect" || tmp_select.item.name === "touch-circle") {
									current_item = tmp_select.item.parent;
									current_part = tmp_select;
							}
							else {
									//console.log("NOT_USED : " + tmp_select.item.name);
							}
							//console.log("CTL_CUR: " + current_controleur.name);
							//onsole.log("CTL_PEV: " + previous_controleur.name);
							//console.log("ITEM_CUR: " + current_item.name);
							//console.log("ITEM_PEV: " + previous_item.name);
							//console.log("PART_CUR: " + current_part.type);
							//console.log("PART_PEV: " + previous_part.name);
							
							switch (e256_current_mode) {
									case EDIT_MODE:
											if (current_item.name === "grid-key" && previous_item.name === "grid-key") {
													//previous_item.firstChild.style.fillColor = "pink";
													//current_item.firstChild.style.fillColor = "orange";
											}
											else if (current_item.name === "grid-frame" && previous_item.name === "grid-key") {
													//previous_item.firstChild.style.fillColor = "pink";
													//current_item.firstChild.style.strokeColor = "orange";
											}
											else if (previous_item.name === "grid-frame" && current_item.name === "grid-key") {
													//previous_item.firstChild.style.strokeColor = "lightGreen";
													//current_item.firstChild.style.fillColor = "orange";
											}
											else {
													//console.log("NOT_USED - CUR: " + current_item.name + "- PREV - " + previous_item.name );
											}
											//update_menu_params(this);
											break;
									case PLAY_MODE:
											// TODO
											break;
							}
					}
			},

			onMouseDrag: function (mouseEvent) {
					switch (e256_current_mode) {
							case EDIT_MODE:
									if (current_part.type === "fill") {
											moveItem(this, mouseEvent);
									}
									else if (current_part.type === "bounds") {
											let newSize = new paper.Point();
											let newPos = new paper.Point();
											if (current_item.name === "pad-frame") {
													switch (current_part.name) {
															case "top-left":
																	this.children["pad-frame"].children["frame-rect"].segments[0].point.x = mouseEvent.point.x;
																	this.children["pad-frame"].children["frame-rect"].segments[1].point = mouseEvent.point;
																	this.children["pad-frame"].children["frame-rect"].segments[2].point.y = mouseEvent.point.y;
																	previous_frame_width = frame_width;
																	previous_frame_height = frame_height;
																	frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.right - mouseEvent.point.x);
																	frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.bottom - mouseEvent.point.y);
																	for (const touch of this.children["pad-touchs"].children) {
																			touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
																			touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
																			newSize.x = ((this.bounds.right - touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
																			newSize.y = ((this.bounds.bottom - touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
																			newPos.x = this.bounds.right - newSize.x;
																			newPos.y = this.bounds.bottom - newSize.y;
																			touch.children["touch-circle"].position = newPos;
																			touch.children["touch-line-x"].position.y = newPos.y;
																			touch.children["touch-line-y"].position.x = newPos.x;
																	}
																	this.children["pad-frame"].data.from = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
																	break;
															case "top-right":
																	this.children["pad-frame"].children["frame-rect"].segments[1].point.y = mouseEvent.point.y;
																	this.children["pad-frame"].children["frame-rect"].segments[2].point = mouseEvent.point;
																	this.children["pad-frame"].children["frame-rect"].segments[3].point.x = mouseEvent.point.x;
																	previous_frame_width = frame_width;
																	previous_frame_height = frame_height;
																	frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.x - this.bounds.left);
																	frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.bottom - mouseEvent.point.y);
																	for (const touch of this.children["pad-touchs"].children) {
																			touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
																			touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
																			newSize.x = ((touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
																			newSize.y = ((this.bounds.bottom - touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
																			newPos.x = this.bounds.left + newSize.x;
																			newPos.y = this.bounds.bottom - newSize.y;
																			touch.children["touch-circle"].position = newPos;
																			touch.children["touch-line-x"].position.y = newPos.y;
																			touch.children["touch-line-y"].position.x = newPos.x;
																	}
																	this.children["pad-frame"].data.from.y = Math.round(mouseEvent.point.y);
																	this.children["pad-frame"].data.to.x = Math.round(mouseEvent.point.x);
																	break;
															case "bottom-right":
																	this.children["pad-frame"].children["frame-rect"].segments[2].point.x = mouseEvent.point.x;
																	this.children["pad-frame"].children["frame-rect"].segments[3].point = mouseEvent.point;
																	this.children["pad-frame"].children["frame-rect"].segments[0].point.y = mouseEvent.point.y;
																	previous_frame_width = frame_width;
																	previous_frame_height = frame_height;
																	frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.x - this.bounds.left);
																	frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.y - this.bounds.top);
																	for (const touch of this.children["pad-touchs"].children) {
																			touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
																			touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
																			newSize.x = ((touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
																			newSize.y = ((touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
																			newPos.x = this.bounds.left + newSize.x;
																			newPos.y = this.bounds.top + newSize.y;
																			touch.children["touch-circle"].position = newPos;
																			touch.children["touch-line-x"].position.y = newPos.y;
																			touch.children["touch-line-y"].position.x = newPos.x;
																	}
																	this.children["pad-frame"].data.to = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
																	break;
															case "bottom-left":
																	this.children["pad-frame"].children["frame-rect"].segments[3].point.y = mouseEvent.point.y;
																	this.children["pad-frame"].children["frame-rect"].segments[0].point = mouseEvent.point;
																	this.children["pad-frame"].children["frame-rect"].segments[1].point.x = mouseEvent.point.x;
																	previous_frame_width = frame_width;
																	previous_frame_height = frame_height;
																	frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.right - mouseEvent.point.x);
																	frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.y - this.bounds.top);   
																	for (const touch of this.children["pad-touchs"].children) {
																			touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
																			touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
																			newSize.x = ((this.bounds.right - touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
																			newSize.y = ((touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
																			newPos.x = this.bounds.right - newSize.x;
																			newPos.y = this.bounds.top + newSize.y;
																			touch.children["touch-circle"].position = newPos;
																			touch.children["touch-line-x"].position.y = newPos.y;
																			touch.children["touch-line-y"].position.x = newPos.x;
																	}
																	this.children["pad-frame"].data.from.x = Math.round(mouseEvent.point.x);
																	this.children["pad-frame"].data.to.y = Math.round(mouseEvent.point.y);
																	break;
															default:
																	console.log("PART_NOT_USE: " + current_part.name);
																	break;
													}
											}
									}
									update_menu_params(this);
									break;
							case PLAY_MODE:
									//TODO
									break;
					}
			}
	});
	return _touchpad;
};
