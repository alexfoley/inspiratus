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
    if (!passphrase) return out; // all zeros -> XOR is identity (plain hiding)
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

  function seal(carrier, note, passphrase) {
    var base = stripSelectors(carrier != null ? String(carrier) : '');
    var bytes = new TextEncoder().encode(note != null ? note : '');
    var ks = keystream(passphrase, bytes.length);
    var out = base;
    for (var i = 0; i < bytes.length; i++) {
      out += String.fromCodePoint(byteToCodePoint((bytes[i] ^ ks[i]) & 0xff));
    }
    return out;
  }

  function reveal(text, passphrase) {
    var bytes = [];
    var str = text != null ? String(text) : '';
    for (var ch of str) {
      var b = codePointToByte(ch.codePointAt(0));
      if (b >= 0) bytes.push(b);
    }
    var arr = new Uint8Array(bytes);
    var ks = keystream(passphrase, arr.length);
    for (var i = 0; i < arr.length; i++) arr[i] = (arr[i] ^ ks[i]) & 0xff;
    return new TextDecoder().decode(arr);
  }

  var api = {
    seal: seal,
    reveal: reveal,
    keystream: keystream,
    byteToCodePoint: byteToCodePoint,
    codePointToByte: codePointToByte,
    stripSelectors: stripSelectors
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Palimpsest = api;
})(typeof self !== 'undefined' ? self : this);
