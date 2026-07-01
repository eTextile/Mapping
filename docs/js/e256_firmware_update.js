/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// HalfKay bootloader USB identifiers (Teensy 4.0)
const HALFKAY_VID = 0x16C0;
const HALFKAY_PID = 0x0478;

// Teensy 4.0 (IMXRT1062) flash parameters
// Address encoding: 3-byte little-endian relative offset from TEENSY40_FLASH_BASE.
const TEENSY40_FLASH_BASE = 0x60000000;
const HALFKAY_BLOCK_SIZE  = 1024; // bytes per HalfKay write block
const HALFKAY_PACKET_SIZE = 64;   // HID output report size (bytes, not counting report ID)

let firmware_hex_result = null; // parsed HEX: { image: Uint8Array, base: number }
let fw_modal_instance = null;

// ─── Intel HEX parser ──────────────────────────────────────────────────────
function parse_hex(text) {
  const sparse = new Map(); // absolute_address → byte_value
  let segment_base = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith(':') || line.length < 11) continue;

    const count  = parseInt(line.substring(1, 3), 16);
    const offset = parseInt(line.substring(3, 7), 16);
    const type   = parseInt(line.substring(7, 9), 16);

    switch (type) {
      case 0x00: { // Data record
        const abs = segment_base + offset;
        for (let i = 0; i < count; i++) {
          sparse.set(abs + i, parseInt(line.substring(9 + i * 2, 11 + i * 2), 16));
        }
        break;
      }
      case 0x01: break; // EOF
      case 0x02:        // Extended segment address
        segment_base = parseInt(line.substring(9, 13), 16) << 4;
        break;
      case 0x04:        // Extended linear address
        segment_base = parseInt(line.substring(9, 13), 16) << 16;
        break;
    }
  }

  if (sparse.size === 0) throw new Error("No data records found in HEX file");

  const addrs = Array.from(sparse.keys());
  const min_abs = Math.min(...addrs);
  const max_abs = Math.max(...addrs);
  const image = new Uint8Array(max_abs - min_abs + 1).fill(0xFF);
  for (const [abs, val] of sparse) image[abs - min_abs] = val;

  return { image, base: min_abs };
}

// ─── HalfKay flash ─────────────────────────────────────────────────────────
async function halfkay_flash(hex_result, on_progress) {
  const { image, base } = hex_result;

  let devices;
  try {
    devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: HALFKAY_VID, productId: HALFKAY_PID }]
    });
  } catch (e) {
    throw new Error("WebHID access denied: " + e.message);
  }
  if (!devices || devices.length === 0) {
    throw new Error("HalfKay bootloader not selected — make sure the device is in bootloader mode");
  }

  const dev = devices[0];
  await dev.open();

  try {
    if (base < TEENSY40_FLASH_BASE) {
      throw new Error("HEX contains addresses below Teensy 4.0 flash base (0x60000000)");
    }
    const rel_base = base - TEENSY40_FLASH_BASE;
    const total_blocks = Math.ceil(image.length / HALFKAY_BLOCK_SIZE);

    for (let b = 0; b < total_blocks; b++) {
      const block_offset = b * HALFKAY_BLOCK_SIZE;
      const slice = image.subarray(block_offset, block_offset + HALFKAY_BLOCK_SIZE);

      if (slice.every(byte => byte === 0xFF)) continue; // skip all-erased blocks

      const block = new Uint8Array(HALFKAY_BLOCK_SIZE).fill(0xFF);
      block.set(slice);

      const addr = rel_base + block_offset;

      // Build padded buffer: [addr_lo, addr_mid, addr_hi, block[0..1023], zero-padding to 64-byte boundary]
      const payload   = 3 + HALFKAY_BLOCK_SIZE;
      const padded    = Math.ceil(payload / HALFKAY_PACKET_SIZE) * HALFKAY_PACKET_SIZE;
      const buf = new Uint8Array(padded);
      buf[0] = addr         & 0xFF;
      buf[1] = (addr >>  8) & 0xFF;
      buf[2] = (addr >> 16) & 0xFF;
      buf.set(block, 3);

      for (let i = 0; i < padded; i += HALFKAY_PACKET_SIZE) {
        await dev.sendReport(0, buf.subarray(i, i + HALFKAY_PACKET_SIZE));
      }

      if (on_progress) on_progress(b + 1, total_blocks);
    }

    // Reboot command: full packet of 0xFF triggers normal firmware boot
    await dev.sendReport(0, new Uint8Array(HALFKAY_PACKET_SIZE).fill(0xFF));

  } finally {
    try { await dev.close(); } catch (_) {}
  }
}

// ─── Version check — called from e256_midi_io.js on SYNC ───────────────────
async function handle_firmware_version(fw_version) {
  if (fw_version === VERSION) return; // up to date

  try {
    const res = await fetch('./firmware/e256_firmware.hex');
    if (!res.ok) return; // no bundled firmware, skip silently
    firmware_hex_result = parse_hex(await res.text());
  } catch (_) {
    return; // fetch failed, skip silently
  }

  document.getElementById("fw_device_version").textContent = fw_version;
  document.getElementById("fw_app_version").textContent = VERSION;
  if (!fw_modal_instance) {
    fw_modal_instance = new bootstrap.Modal(document.getElementById("firmware_update_modal"));
  }
  fw_modal_instance.show();
}

// ─── Flash orchestration ───────────────────────────────────────────────────
async function firmware_flash_start() {
  if (!firmware_hex_result) { alert_msg("No firmware loaded", "warning"); return; }

  const btn = document.getElementById("firmware_update_btn");
  if (btn) btn.disabled = true;

  try {
    if (midi_device_connected) {
      alert_msg("Rebooting device into bootloader...", "info");
      send_sysex_cmd(MODE.BOOTLOADER);
      // Wait ~1.5 s for the Teensy to reboot into HalfKay bootloader.
      // Chrome's user-gesture activation window covers this delay so
      // requestDevice() can be called without a second user click.
      await new Promise(r => setTimeout(r, 1500));
    }

    alert_msg("Select the HalfKay device in the browser dialog...", "info");
    await halfkay_flash(firmware_hex_result, (done, total) => {
      alert_msg("Flashing... " + Math.round((done / total) * 100) + "%", "info");
    });

    firmware_hex_result = null;
    alert_msg("Firmware updated! Device is rebooting.", "success");
  } catch (e) {
    alert_msg("Flash error: " + e.message, "danger");
  } finally {
    if (btn) btn.disabled = false;
  }
}

$(document).ready(function () {
  document.getElementById("firmware_update_btn").addEventListener("click", function () {
    if (fw_modal_instance) fw_modal_instance.hide();
    firmware_flash_start();
  });
});
