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

import { parseLrc, searchFromFileName } from './lyrics.ts';

test('parseLrc reads timestamps and sorts', () => {
  const r = parseLrc('[ar:Someone]\n[00:10.50] два\n[00:01.00][00:20] раз\n[00:15.00]\n');
  assert.deepEqual(r.lines, ['раз', 'два', 'раз']);
  assert.deepEqual(r.times, [1, 10.5, 20]);
});

test('parseLrc falls back to plain lyrics', () => {
  const r = parseLrc('раз\nдва');
  assert.deepEqual(r.lines, ['раз', 'два']);
  assert.deepEqual(r.times, [null, null]);
});

test('searchFromFileName cleans a file name', () => {
  assert.equal(searchFromFileName('03 - Пикник - Иероглиф (Live).mp3'), 'Пикник Иероглиф');
});

import { youtubeId } from './lyrics.ts';

test('youtubeId handles common link shapes', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ?si=abc'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://m.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://music.youtube.com/watch?feature=share&v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('hello'), null);
});
