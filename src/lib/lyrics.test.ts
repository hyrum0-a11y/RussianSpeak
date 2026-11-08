import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineAt, splitLyrics } from './lyrics.ts';

test('splitLyrics drops blank lines and trims', () => {
  assert.deepEqual(splitLyrics(' a \n\n b\r\n'), ['a', 'b']);
});

test('lineAt finds the current line', () => {
  const t = [1, 5, null, 9];
  assert.equal(lineAt(t, 0), -1);
  assert.equal(lineAt(t, 1), 0);
  assert.equal(lineAt(t, 6), 1);
  assert.equal(lineAt(t, 9.5), 3);
});
