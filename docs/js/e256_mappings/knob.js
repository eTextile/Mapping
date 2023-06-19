/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// KNOB Factory
function knobFactory() {
	var default_knob_stroke_width = 10;
	var default_knob_radius = 150;
	var default_knob_offet = 90;
	var previous_knob_offset = 0;
	var previous_knob_radius = 0;
	var previous_knob_theta = 0;

	var _Knob = new paper.Group({
			data: {
					type: "knob",
					center: [null, null],
					offset: 60,
					radius: 50,
					theta_val: 0, tChan: 1, tCc: 1, tMin: 0, tMax: 127,
					radius_val: 0, rChan: 1, rCc: 2, rMin: 0, rMax: 127
			},

			setup_from_mouse_event: function (mouseEvent) {
					this.data.center[0] = Math.round(mouseEvent.point.x);
					this.data.center[1] = Math.round(mouseEvent.point.y);
					this.data.radius = default_knob_radius;
			},

			setup_from_config: function (params) {
					this.data.center = params[i].center;
					this.data.radius = params[i].radius;
					this.data.offset = params[i].offset;
					this.data.tChan = params[i].tChan;
					this.data.tCc = params[i].tCc;
					this.data.tMin = params[i].tMin;
					this.data.tMax = params[i].tMax;
					this.data.rChan = params[i].rChan;
					this.data.rCc = params[i].rCc;
					this.data.rMin = params[i].rMin;
					this.data.rMax = params[i].rMax;
			},

			create: function () {
					var headPos = pol_to_cart(this.data.radius - default_knob_stroke_width, deg_to_rad(default_knob_offet));
					var footPos = pol_to_cart(this.data.radius - default_knob_stroke_width * 2, deg_to_rad(default_knob_offet));
					var handlePos = pol_to_cart(this.data.radius + default_knob_stroke_width, deg_to_rad(default_knob_offet));
					var _circle = new paper.Path.Circle({
							name: "circle",
							center: new paper.Point(this.data.center[0], this.data.center[1]),
							radius: this.data.radius,
							strokeWidth: 5,
							dashArray: [10, 5],
							strokeColor: "chartreuse",
							fillColor: "springGreen"
					});
					var _head = new paper.Path.Circle({
							name: "needle-head",
							center: new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y),
							radius: 6,
							strokeColor: "black",
							strokeWidth: 5
					});
					var _foot = new paper.Path.Line({
							name: "needle-foot",
							from: new paper.Point(this.data.center[0], this.data.center[1]),
							to: new paper.Point((this.data.center[0] + footPos.x), this.data.center[1] + footPos.y),
							strokeCap: "round",
							strokeColor: "black",
							strokeWidth: 5,
					});
					var _handle = new paper.Path.RegularPolygon({
							name: "handle",
							center: new paper.Point(this.data.center[0] + handlePos.x, this.data.center[1] + handlePos.y),
							radius: 10,
							fillColor: "red",
							sides: 3
					});
					_handle.rotate(-30);

					_Knob.addChild(_circle);
					_Knob.addChild(_head);
					_Knob.addChild(_foot);
					_Knob.addChild(_handle);
			},

			activate: function (mouseEvent) {
					if (e256_current_mode === PLAY_MODE) {
							var x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
							var y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
							var polar = cart_to_pol(x, y);
							headPos = pol_to_cart(polar.radius, polar.theta);
							footPos = pol_to_cart(polar.radius, polar.theta);
							this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
							this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);
							previous_knob_radius = this.data.radius;
							this.data.radius_val = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
							if (MIDI_device_connected && this.data.radius != previous_knob_radius) {
									sendControlChange(this.data.rCc, this.data.radius, this.data.rChan);
							}
							previous_knob_theta = this.data.theta_val;
							var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
							this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
							if (MIDI_device_connected && this.data.theta_val != previous_knob_theta) {
									sendControlChange(this.data.tCc, this.data.theta_val, this.data.tChan);
							}
					}
			},

			select: function () {
					this.children["circle"].opacity = 1;
					update_menu_params(this);
			},

			free: function () {
					this.children["circle"].opacity = 0;
			},
			
			onMouseEnter: function () {
					if (e256_current_mode === EDIT_MODE) {
							this.select();
					}
					show_item_menu_params(this);
			},

			onMouseLeave: function () {
					if (e256_current_mode === EDIT_MODE) {
							this.free();
					}
			},

			onMouseDrag: function (mouseEvent) {
					if (e256_current_mode === EDIT_MODE) {
							switch (selectedPath) {
									case "fill":
											if (selectedPart.name === "handle") {
													let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
													let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
													previous_knob_offset = this.data.offset;
													this.data.offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
													let delta = this.data.offset - previous_knob_offset;
													this.children["handle"].rotate(delta, new paper.Point(this.data.center[0], this.data.center[1]));
											} else {
													//moveItem(this, mouseEvent);
													this.translate(mouseEvent.delta);
													this.data.center[0] += Math.round(mouseEvent.delta.x);
													this.data.center[1] += Math.round(mouseEvent.delta.y);
											}
											break;
									case "stroke":
											switch (selectedPart.name) {
													case "circle":
															let x = mouseEvent.point.x - this.data.center[0];
															let y = mouseEvent.point.y - this.data.center[1];
															let polar = cart_to_pol(x, y);
															this.scale(polar.radius / this.data.radius);
															this.data.radius = Math.round(polar.radius); // FIXME!
															console.log("RADIUS : " + Math.round(polar.radius));
															break;
													case "needle-head" || "needle-foot":
															//moveItem(this, mouseEvent);
															this.translate(mouseEvent.delta);
															this.data.center[0] += Math.round(mouseEvent.delta.x);
															this.data.center[1] += Math.round(mouseEvent.delta.y);
															break;
											}
							}
							update_menu_params(this);
					}
					else if (e256_current_mode === PLAY_MODE) {
							let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
							let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
							let polar = cart_to_pol(x, y);
							let headPos;
							let footPos;
							if (polar.radius > this.data.radius) {
									let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
									this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
									headPos = pol_to_cart(this.data.radius, polar.theta);
									footPos = pol_to_cart(this.data.radius, polar.theta);
							} else {
									previous_knob_radius = this.data.radius;
									this.data.radius_val = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
									let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
									previous_knob_theta = this.data.theta_val;
									this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
									headPos = pol_to_cart(polar.radius, polar.theta);
									footPos = pol_to_cart(polar.radius, polar.theta);
							}
							this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
							this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

							update_menu_params(this);

							// SEND MIDI CONTROL_CHANGE
							if (MIDI_device_connected && this.data.theta_val != previous_knob_theta) {
									sendControlChange(this.data.tCc, this.data.theta_val, this.data.tChan);
							}
							if (MIDI_device_connected && this.data.radius_val != previous_knob_radius) {
									sendControlChange(this.data.rCc, this.data.radius_val, this.data.rChan);
							}
					}
			}
	});
	return _Knob;
};
