'use strict';
const test = require('node:test');
const assert = require('node:assert');
const P = require('../codec.js');

test('round-trips plain ASCII', () => {
  const sealed = P.seal('😀', 'meet me at noon');
  assert.strictEqual(P.reveal(sealed), 'meet me at noon');
});

test('round-trips multi-byte Unicode and emoji in the note', () => {
  const note = 'café — 秘密 — 🦊🔑';
  assert.strictEqual(P.reveal(P.seal('🌙', note)), note);
});

test('round-trips an empty note (carrier only)', () => {
  const sealed = P.seal('🔥', '');
  assert.strictEqual(sealed, '🔥');
  assert.strictEqual(P.reveal(sealed), '');
});

test('round-trips a long note', () => {
  const note = 'x'.repeat(500);
  assert.strictEqual(P.reveal(P.seal('🌟', note)), note);
});

test('reveal ignores visible text surrounding the payload', () => {
  const sealed = P.seal('😀', 'secret');
  const noisy = 'hey look ' + sealed + ' cool right?';
  assert.strictEqual(P.reveal(noisy), 'secret');
});

test('reveal returns empty string when there are no selectors', () => {
  assert.strictEqual(P.reveal('just a normal message 😀'), '');
  assert.strictEqual(P.reveal(''), '');
});

test('carrier that already contains a variation selector still round-trips', () => {
  // ❤️ is U+2764 U+FE0F — the embedded selector must not become payload.
  const sealed = P.seal('❤️', 'still works');
  assert.strictEqual(P.reveal(sealed), 'still works');
});

test('sealed output starts with the carrier and payload is all selectors', () => {
  const sealed = P.seal('🦊', 'hi');
  const cps = Array.from(sealed).map((ch) => ch.codePointAt(0));
  assert.strictEqual(cps[0], '🦊'.codePointAt(0));
  for (const cp of cps.slice(1)) {
    assert.ok(P.codePointToByte(cp) >= 0, 'every payload code point is a data selector');
  }
});
