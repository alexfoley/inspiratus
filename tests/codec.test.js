'use strict';
const test = require('node:test');
const assert = require('node:assert');
const P = require('../codec.js');

test('round-trips plain ASCII', () => {
  const sealed = P.ariel('😀', 'meet me at noon');
  assert.strictEqual(P.prospero(sealed), 'meet me at noon');
});

test('round-trips multi-byte Unicode and emoji in the note', () => {
  const note = 'café — 秋の月 — 🦊🔑';
  assert.strictEqual(P.prospero(P.ariel('🌙', note)), note);
});

test('round-trips an empty note; sealed output shows only the carrier', () => {
  const sealed = P.ariel('🔥', '');
  assert.strictEqual(P.prospero(sealed), '');
  // The framing header is invisible, so the only visible character is the carrier.
  const visible = Array.from(sealed)
    .filter((ch) => P.codePointToByte(ch.codePointAt(0)) < 0)
    .join('');
  assert.strictEqual(visible, '🔥');
});

test('round-trips a long note', () => {
  const note = 'x'.repeat(500);
  assert.strictEqual(P.prospero(P.ariel('🌟', note)), note);
});

test('reveal ignores visible text surrounding the payload', () => {
  const sealed = P.ariel('😀', 'the oak at dawn');
  const noisy = 'hey look ' + sealed + ' cool right?';
  assert.strictEqual(P.prospero(noisy), 'the oak at dawn');
});

test('reveal returns empty string when there are no selectors', () => {
  assert.strictEqual(P.prospero('just a normal message 😀'), '');
  assert.strictEqual(P.prospero(''), '');
});

test('carrier that already contains a variation selector still round-trips', () => {
  // ❤️ is U+2764 U+FE0F — the embedded selector must not become payload.
  const sealed = P.ariel('❤️', 'still works');
  assert.strictEqual(P.prospero(sealed), 'still works');
});

test('sealed output starts with the carrier and payload is all selectors', () => {
  const sealed = P.ariel('🦊', 'hi');
  const cps = Array.from(sealed).map((ch) => ch.codePointAt(0));
  assert.strictEqual(cps[0], '🦊'.codePointAt(0));
  for (const cp of cps.slice(1)) {
    assert.ok(P.codePointToByte(cp) >= 0, 'every payload code point is a data selector');
  }
});

test('round-trips with a passphrase', () => {
  const sealed = P.ariel('😀', 'the oak at dawn', 'tempest');
  assert.strictEqual(P.prospero(sealed, 'tempest'), 'the oak at dawn');
});

test('empty passphrase equals no passphrase', () => {
  assert.strictEqual(P.ariel('😀', 'plain', ''), P.ariel('😀', 'plain'));
});

test('wrong passphrase does not recover the note and does not throw', () => {
  const sealed = P.ariel('😀', 'the oak at dawn', 'tempest');
  let out;
  assert.doesNotThrow(() => { out = P.prospero(sealed, 'wrong'); });
  assert.notStrictEqual(out, 'the oak at dawn');
});

test('keystream is all zeros when passphrase is empty', () => {
  const ks = P.keystream('', 8);
  assert.deepStrictEqual(Array.from(ks), [0, 0, 0, 0, 0, 0, 0, 0]);
});

test('keystream is deterministic for a given passphrase', () => {
  assert.deepStrictEqual(
    Array.from(P.keystream('tempest', 16)),
    Array.from(P.keystream('tempest', 16))
  );
});

test('reveal ignores foreign emoji variation selectors in surrounding text', () => {
  const sealed = P.ariel('😀', 'hi');
  assert.strictEqual(P.prospero('look ❤️ ' + sealed), 'hi');
  assert.strictEqual(P.prospero(sealed + ' ✌️'), 'hi');
  assert.strictEqual(P.prospero('❤️ ' + sealed + ' 1️⃣'), 'hi');
});
