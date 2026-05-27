/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const SYNTH_PROFILES = {
  "behringer_ubxa_mini": {
    name: "Behringer UB-Xa Mini",
    cc: {
      "1":  "Modulation",
      "36": "Pulse Width Mod",
      "38": "Filter Resonance",
      "39": "Env Release",
      "40": "Voice Mode",
      "41": "Scale",
      "42": "Detune",
      "44": "Filter Cutoff",
      "45": "Filter Envelope",
      "46": "LFO Speed",
      "47": "Freq Modulation",
      "48": "Filter Modulation",
      "49": "Env Attack",
      "50": "Env Decay",
      "51": "Env Sustain"
    }
  },
  "eowave_quadrantid_swarm": {
    name: "Eowave Quadrantid Swarm",
    cc: {
      "1": "LFO Speed",
      "2": "Spread",
      "3": "Fold",
      "4": "Perc",
      "5": "Attack",
      "6": "Decay",
      "7": "Volume"
    }
  },
  "korg_volca_fm": {
    name: "Korg Volca FM",
    cc: {
      "40": "Transpose",
      "41": "Velocity",
      "42": "Modulator Attack",
      "43": "Modulator Decay",
      "44": "Carrier Attack",
      "45": "Carrier Decay",
      "46": "LFO Rate",
      "47": "LFO Pitch Depth",
      "48": "Algorithm",
      "49": "Arp Type",
      "50": "Arp Div"
    }
  },
  "general_midi": {
    name: "General MIDI",
    cc: {
      "1":  "Modulation",
      "2":  "Breath Ctrl",
      "4":  "Foot Ctrl",
      "5":  "Portamento Time",
      "7":  "Volume",
      "10": "Pan",
      "11": "Expression",
      "64": "Sustain Pedal",
      "65": "Portamento sw",
      "66": "Sostenuto",
      "67": "Soft Pedal",
      "71": "Resonance",
      "74": "Brightness",
      "84": "Portamento Amt",
      "91": "Reverb",
      "93": "Chorus"
    }
  },
  "moog_subsequent_37": {
    name: "Moog Subsequent 37",
    cc: {
      "1":  "Modulation",
      "3":  "OSC2 Freq",
      "5":  "Glide",
      "7":  "Volume",
      "9":  "OSC Mix",
      "14": "OSC1 Wave",
      "15": "OSC2 Wave",
      "16": "Sub Level",
      "17": "Noise Level",
      "21": "LFO Rate",
      "22": "LFO Amount",
      "64": "Sustain",
      "70": "LFO Wave",
      "71": "Filter Resonance",
      "74": "Filter Cutoff",
      "75": "Filter Env Amt",
      "76": "Filter Attack",
      "77": "Filter Decay",
      "78": "Filter Sustain",
      "79": "Filter Release",
      "80": "Amp Attack",
      "81": "Amp Decay",
      "82": "Amp Sustain",
      "83": "Amp Release"
    }
  },
  "arturia_minibrute_2": {
    name: "Arturia MiniBrute 2",
    cc: {
      "1":  "LFO1 Rate",
      "2":  "LFO2 Rate",
      "7":  "Volume",
      "9":  "OSC Mix",
      "12": "VCO1 Ultrasaw",
      "13": "VCO1 Metalizer",
      "14": "VCO2 Tone",
      "15": "VCO2 Pulse Width",
      "17": "Noise Level",
      "28": "Sub Level",
      "29": "Ext In Level",
      "71": "Resonance",
      "74": "Cutoff",
      "75": "Env Amt",
      "76": "Attack",
      "77": "Decay",
      "78": "Sustain",
      "79": "Release",
      "80": "Amp Attack",
      "81": "Amp Decay",
      "82": "Amp Sustain",
      "83": "Amp Release",
      "93": "Brute Factor"
    }
  },
  "roland_jx3p": {
    name: "Roland JX-3P",
    cc: {
      "1":  "Modulation",
      "5":  "Portamento Time",
      "7":  "Volume",
      "64": "Sustain",
      "65": "Portamento sw",
      "80": "DCO1 Range",
      "81": "DCO1 Wave",
      "82": "DCO2 Range",
      "83": "DCO2 Wave",
      "84": "DCO2 Cross Mod",
      "85": "DCO2 Fine Tune",
      "86": "Mixer DCO1",
      "87": "Mixer DCO2",
      "88": "Mixer Noise",
      "89": "VCF Cutoff",
      "90": "VCF Resonance",
      "91": "VCF Env Amt",
      "92": "VCA Level",
      "93": "LFO Rate",
      "94": "LFO Wave",
      "95": "Chorus"
    }
  }
};

let active_synth_profile = null;


function _populate_cc_select(sel) {
  const input = document.getElementById(sel.dataset.inputId);
  const current_val = input ? String(input.value) : sel.value;
  sel.innerHTML = "";
  if (!active_synth_profile) return;
  const entries = Object.entries(active_synth_profile.cc).sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [cc, name] of entries) {
    const opt = document.createElement("option");
    opt.value = cc;
    opt.textContent = `${cc} – ${name}`;
    if (cc === current_val) opt.selected = true;
    sel.appendChild(opt);
  }
}

function _set_synth_profile(key) {
  active_synth_profile = key ? (SYNTH_PROFILES[key] || null) : null;
  document.querySelectorAll(".cc-select").forEach(sel => {
    const input = document.getElementById(sel.dataset.inputId);
    if (active_synth_profile) {
      _populate_cc_select(sel);
      if (input) { sel.value = String(input.value); input.style.display = "none"; }
      sel.style.display = "";
    } else {
      sel.innerHTML = "";
      sel.style.display = "none";
      if (input) input.style.display = "";
    }
  });
}

function _add_profile_to_select(sel, key, label) {
  const opt = document.createElement("option");
  opt.value = key;
  opt.textContent = label;
  sel.appendChild(opt);
}

function synth_profiles_init() {
  const sel = document.getElementById("synth_profile_select");
  if (!sel) return;

  _add_profile_to_select(sel, "", "— None —");
  for (const key in SYNTH_PROFILES) {
    _add_profile_to_select(sel, key, SYNTH_PROFILES[key].name);
  }

  sel.addEventListener("change", () => _set_synth_profile(sel.value || null));

  const load_input = document.getElementById("load_synth_profile_file");
  load_input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const profile = JSON.parse(ev.target.result);
        if (!profile.name || typeof profile.cc !== "object") throw new Error("missing name or cc fields");
        const key = profile.name.toLowerCase().replace(/\s+/g, "_");
        SYNTH_PROFILES[key] = profile;
        if (!sel.querySelector(`option[value="${key}"]`)) {
          _add_profile_to_select(sel, key, profile.name);
        }
        sel.value = key;
        _set_synth_profile(key);
      } catch (err) {
        alert("Invalid synth profile: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("save_synth_profile_btn").addEventListener("click", () => {
    if (!active_synth_profile) return;
    const blob = new Blob([JSON.stringify(active_synth_profile, null, 2)], { type: "application/json" });
    saveAs(blob, active_synth_profile.name.replace(/\s+/g, "_") + "_profile.json");
  });
}

window.addEventListener("DOMContentLoaded", synth_profiles_init);
