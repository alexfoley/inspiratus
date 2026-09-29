(function (root) {
  'use strict';

  var VS_LOW_START = 0xFE00;   // VS1..VS16   -> bytes 0..15
  var VS_LOW_END = 0xFE0F;
  var VS_HIGH_START = 0xE0100; // VS17..VS256 -> bytes 16..255
  var VS_HIGH_END = 0xE01EF;

  function byteToCodePoint(b) {
    return b < 16 ? VS_LOW_START + b : VS_HIGH_START + (b - 16);
  }

  function codePointToByte(cp) {
    if (cp >= VS_LOW_START && cp <= VS_LOW_END) return cp - VS_LOW_START;
    if (cp >= VS_HIGH_START && cp <= VS_HIGH_END) return cp - VS_HIGH_START + 16;
    return -1;
  }

  function stripSelectors(str) {
    var out = '';
    for (var ch of str) {
      if (codePointToByte(ch.codePointAt(0)) < 0) out += ch;
    }
    return out;
  }

  function seedFromString(str) {
    var h = 0x811c9dc5; // FNV-1a 32-bit offset basis
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193); // FNV prime
    }
    return h >>> 0;
  }

  function keystream(passphrase, length) {
    var out = new Uint8Array(length);
    if (!passphrase) return out; // all zeros -> XOR is a no-op
    var x = seedFromString(passphrase) || 0x9e3779b9; // avoid a zero PRNG state
    for (var i = 0; i < length; i++) {
      // xorshift32
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;  x >>>= 0;
      out[i] = x & 0xff;
    }
    return out;
  }

  // Each run is framed: MAGIC (2 bytes) + length (4 bytes, little-endian) +
  // body. The marker lets prospero pick out the intended run and skip any
  // lone selector that other characters carry (e.g. a U+FE0F on ❤️ or ✌️).
  // The header bytes are unscrambled; the passphrase keystream applies only
  // to the body.
  var MAGIC0 = 0x9e;
  var MAGIC1 = 0x3a;
  var HEADER_LEN = 6;

  function ariel(carrier, note, passphrase) {
    var base = stripSelectors(carrier != null ? String(carrier) : '');
    var data = new TextEncoder().encode(note != null ? note : '');
    var ks = keystream(passphrase, data.length);
    var n = data.length;
    var header = [MAGIC0, MAGIC1, n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
    var out = base;
    for (var h = 0; h < header.length; h++) {
      out += String.fromCodePoint(byteToCodePoint(header[h]));
    }
    for (var i = 0; i < data.length; i++) {
      out += String.fromCodePoint(byteToCodePoint((data[i] ^ ks[i]) & 0xff));
    }
    return out;
  }

  function prospero(text, passphrase) {
    var str = text != null ? String(text) : '';
    // Group the input into contiguous runs of selector bytes, then take the
    // first run whose header matches MAGIC.
    var runs = [];
    var current = null;
    for (var ch of str) {
      var b = codePointToByte(ch.codePointAt(0));
      if (b >= 0) {
        if (!current) { current = []; runs.push(current); }
        current.push(b);
      } else {
        current = null;
      }
    }
    for (var r = 0; r < runs.length; r++) {
      var run = runs[r];
      if (run.length >= HEADER_LEN && run[0] === MAGIC0 && run[1] === MAGIC1) {
        var len = (run[2] | (run[3] << 8) | (run[4] << 16) | (run[5] << 24)) >>> 0;
        if (run.length >= HEADER_LEN + len) {
          var arr = new Uint8Array(len);
          for (var k = 0; k < len; k++) arr[k] = run[HEADER_LEN + k];
          var ks = keystream(passphrase, len);
          for (var m = 0; m < len; m++) arr[m] = (arr[m] ^ ks[m]) & 0xff;
          return new TextDecoder().decode(arr);
        }
      }
    }
    return '';
  }

  var api = {
    ariel: ariel,
    prospero: prospero,
    keystream: keystream,
    byteToCodePoint: byteToCodePoint,
    codePointToByte: codePointToByte,
    stripSelectors: stripSelectors
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Palimpsest = api;
})(typeof self !== 'undefined' ? self : this);
