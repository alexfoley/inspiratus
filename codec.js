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

  function seal(carrier, note) {
    var base = stripSelectors(carrier != null ? String(carrier) : '');
    var bytes = new TextEncoder().encode(note != null ? note : '');
    var out = base;
    for (var i = 0; i < bytes.length; i++) {
      out += String.fromCodePoint(byteToCodePoint(bytes[i]));
    }
    return out;
  }

  function reveal(text) {
    var bytes = [];
    var str = text != null ? String(text) : '';
    for (var ch of str) {
      var b = codePointToByte(ch.codePointAt(0));
      if (b >= 0) bytes.push(b);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  var api = {
    seal: seal,
    reveal: reveal,
    byteToCodePoint: byteToCodePoint,
    codePointToByte: codePointToByte,
    stripSelectors: stripSelectors
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Palimpsest = api;
})(typeof self !== 'undefined' ? self : this);
