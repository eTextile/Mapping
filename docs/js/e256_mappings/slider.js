/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SLIDER Factory
function sliderFactory() {
	var slider_default_width = 50;
	var slider_default_height = 400;
	var slider_min_width = 45;
	var slider_min_height = 100;
	var previous_slider_val = null; // Is it Global !?
	var slider_dir = V_SLIDER;

	var _Slider = new paper.Group({
			data: {
					type: "slider",
					from: [null, null],
					to: [null, null],
					value: 0,
					chan: null,
					cc: null,
					min: 0,
					max: 127
			},
			setup_from_mouse_event: function (mouseEvent) {
					this.data.from = [Math.round(mouseEvent.point.x - (slider_default_width / 2)), Math.round(mouseEvent.point.y - (slider_default_height / 2))];
					this.data.to = [Math.round(mouseEvent.point.x + (slider_default_width / 2)), Math.round(mouseEvent.point.y + (slider_default_height / 2))];
			},

			setup_from_config: function (params) {
					this.data.from = params.from;
					this.data.to = params.to;
					this.data.chan = params.chan;
					this.data.cc = params.cc;
					this.data.min = params.min;
					this.data.max = params.max;
			},
			create: function () {
					var _rect = new paper.Path.Rectangle({
							name: "rect",
							value: 0,
							from: this.data.from,
							to: this.data.to,
							//selected: true,
							strokeWidth: 5,
							dashArray: [10, 5],
							strokeColor: "chartreuse",
							fillColor: "azure"
					});
					this.addChild(_rect);
					var _handle = new paper.Path.Line({
							name: "handle",
							from: new paper.Point(this.data.from.x, this.data.from.y + (slider_default_height / 2)),
							to: new paper.Point(this.data.to.x, this.data.from.y + (slider_default_height / 2)),
							strokeWidth: 30,
							strokeCap: "round",
							strokeColor: "lightslategray"
					});
					this.addChild(_handle);
			},
			activate: function (mouseEvent) {
					// tis is call only when cliking on TUI! -> MOVE IT TO onMouseDown!!
					console.log("SLIDER_ACTIVATE");
					/*
					switch (slider_dir) {
							case H_SLIDER:
									this.data.value = Math.round(mapp(mouseEvent.point.x, this.bounds.left, this.bounds.right, this.data.max, this.data.min));
									this.children["handle"].position.x = mouseEvent.point.x;
									break;
							case V_SLIDER:
									this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min));
									this.children["handle"].position.y = mouseEvent.point.y;
							break;
					}
					update_menu_params(this);
					*/
			},
			select: function () {
					this.children["rect"].opacity = 1;
					update_menu_params(this);
			},
			free: function () {
					this.children["rect"].opacity = 0;
			},
			onMouseEnter: function () {
					switch (e256_current_mode) {
							case EDIT_MODE:
									this.select();
									this.children["rect"].selected = true;
									break;
							case PLAY_MODE:
									//
									break;
					}
					show_item_menu_params(this);
					update_menu_params(this);
			},
			onMouseLeave: function () {
					if (e256_current_mode === EDIT_MODE) {
							//this.free();
							this.selected = false;
					}
			},
			onMouseDrag: function (mouseEvent) {
					if (e256_current_mode === EDIT_MODE) {
							switch (selectedPath) {
									case "fill":
											moveItem(this, mouseEvent);
											break;
									case "stroke":
											switch (selectedPart.name) {
													case "rect":
															if (this.bounds.width > this.bounds.height) {
																	slider_dir = H_SLIDER;
															} else {
																	slider_dir = V_SLIDER;
															}
															switch (selectedSegment) {
																	case 0: // Update left segment
																			if (mouseEvent.point.x > this.bounds.right - slider_min_width) {
																			}
																			else {
																					this.data.from.x = Math.round(this.bounds.left);
																					this.children["rect"].segments[0].point.x = mouseEvent.point.x;
																					this.children["rect"].segments[1].point.x = mouseEvent.point.x;
																					switch (slider_dir) {
																							case H_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.right - (this.bounds.width / 2);
																									this.children["handle"].segments[0].point.y = this.bounds.top;
																									this.children["handle"].segments[1].point.x = this.bounds.right - (this.bounds.width / 2);
																									this.children["handle"].segments[1].point.y = this.bounds.bottom;
																									break;
																							case V_SLIDER:
																									this.children["handle"].segments[0].point.x = mouseEvent.point.x;
																									this.children["handle"].segments[0].point.y = this.bounds.top + (this.bounds.height / 2);
																									this.children["handle"].segments[1].point.x = this.bounds.right;
																									this.children["handle"].segments[1].point.y = this.bounds.top + (this.bounds.height / 2);
																									break;
																					}
																			}
																			break;
																	case 1: // Update top segment
																			if (mouseEvent.point.y > this.bounds.bottom - slider_min_height) {
																			}
																			else {
																					this.data.from.y = Math.round(this.bounds.top);
																					this.children["rect"].segments[1].point.y = mouseEvent.point.y;
																					this.children["rect"].segments[2].point.y = mouseEvent.point.y;
																					switch (slider_dir) {
																							case H_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
																									this.children["handle"].segments[0].point.y = mouseEvent.point.y;
																									this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
																									this.children["handle"].segments[1].point.y = this.bounds.bottom;
																									break;
																							case V_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.left;
																									this.children["handle"].segments[0].point.y = this.bounds.bottom - (this.bounds.height / 2);
																									this.children["handle"].segments[1].point.x = this.bounds.right;
																									this.children["handle"].segments[1].point.y = this.bounds.bottom - (this.bounds.height / 2);
																									break;
																					}
																			}
																			break;
																	case 2: // Update right segment
																			if (mouseEvent.point.x < this.bounds.left + slider_min_width) {
																			}
																			else {
																					this.data.to.x = Math.round(this.bounds.right);
																					this.children["rect"].segments[2].point.x = mouseEvent.point.x;
																					this.children["rect"].segments[3].point.x = mouseEvent.point.x;
																					switch (slider_dir) {
																							case H_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
																									this.children["handle"].segments[0].point.y = this.bounds.top;
																									this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
																									this.children["handle"].segments[1].point.y = this.bounds.bottom;
																									break;
																							case V_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.left;
																									this.children["handle"].segments[0].point.y = this.bounds.top + (this.bounds.height / 2);
																									this.children["handle"].segments[1].point.x = mouseEvent.point.x
																									this.children["handle"].segments[1].point.y = this.bounds.top + (this.bounds.height / 2);
																									break;
																					}
																			}
																			break;
																	case 3: // Update bottom segment
																			if (mouseEvent.point.y < this.bounds.top + slider_min_height) {
																			}
																			else {
																					this.data.to.y = Math.round(this.bounds.bottom);
																					this.children["rect"].segments[0].point.y = mouseEvent.point.y;
																					this.children["rect"].segments[3].point.y = mouseEvent.point.y;
																					switch (slider_dir) {
																							case H_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
																									this.children["handle"].segments[0].point.y = this.bounds.top;
																									this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
																									this.children["handle"].segments[1].point.y = mouseEvent.point.y;
																									break;
																							case V_SLIDER:
																									this.children["handle"].segments[0].point.x = this.bounds.left;
																									this.children["handle"].segments[0].point.y = this.bounds.bottom - (this.bounds.height / 2);
																									this.children["handle"].segments[1].point.x = this.bounds.right;
																									this.children["handle"].segments[1].point.y = this.bounds.bottom - (this.bounds.height / 2);
																									break;
																					}
																			}
																			break;
																	default:
																			console.log("REST : " + selectedPath);
																			break;

															}
															update_menu_params(this);
															break;
													case "handle":
															moveItem(this, mouseEvent);
															break;
											}
							}
							update_menu_params(this);
					}
			},
			onMouseMove: function (mouseEvent) {
					switch (e256_current_mode) {
							case EDIT_MODE:
									break;
							case PLAY_MODE:
									switch (slider_dir) {
											case V_SLIDER:
													if (mouseEvent.point.y > this.bounds.top && mouseEvent.point.y < this.bounds.bottom) {
															this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min));
															this.children["handle"].position.y = mouseEvent.point.y;
													}
													break;
											case H_SLIDER:
													if (mouseEvent.point.x > this.bounds.left && mouseEvent.point.x < this.bounds.right) {
															this.data.value = Math.round(mapp(mouseEvent.point.x, this.bounds.left, this.bounds.right, this.data.min, this.data.max));
															this.children["handle"].position.x = mouseEvent.point.x;
													}
													break;
									}
									if (this.data.value != previous_slider_val) {
											previous_slider_val = this.data.value;
											if (MIDI_device_connected) sendControlChange(this.data.cc, this.data.value, this.data.chan);
											update_menu_params(this);
									}
									break;
					}
			},
			onMouseUp: function () {
					switch (e256_current_mode) {
							case EDIT_MODE:
									break;
							case PLAY_MODE:
									break;
					}
			}
	});
	return _Slider;
};
