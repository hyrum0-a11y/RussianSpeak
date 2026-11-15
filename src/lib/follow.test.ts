import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUp, splitLines, tokenize, wordAtChar, wordAtFraction, wordCount, wordTiming } from './follow.ts';

test('tokenize keeps stress marks inside words and indexes words', () => {
  const t = tokenize('Приве́т! Как дела́?');
  assert.deepEqual(t.filter((x) => x.word).map((x) => [x.text, x.index]), [['Приве́т', 0], ['Как', 1], ['дела́', 2]]);
  assert.equal(t.map((x) => x.text).join(''), 'Приве́т! Как дела́?');
  assert.equal(wordCount('где-то бог послал'), 3);
});

test('wordAtChar maps engine char positions to words', () => {
  const s = 'Иди ко мне, пожалуйста';
  assert.equal(wordAtChar(s, 0), 0);
  assert.equal(wordAtChar(s, 4), 1);
  assert.equal(wordAtChar(s, 12), 3);
});

test('wordTiming weighs syllables and pauses', () => {
  const { starts, weight } = wordTiming('Мама, мыла раму.');
  assert.equal(starts.length, 3);
  assert.equal(starts[0], 0);
  assert.ok(starts[1] > starts[0] && starts[2] > starts[1]);
  assert.ok(weight > 6);
  assert.equal(wordAtFraction(starts, 0.99), 2);
  assert.equal(wordAtFraction(starts, 0), 0);
});

test('buildUp grows the phrase piece by piece', () => {
  assert.deepEqual(buildUp('Мороз и солнце; день чудесный!'), ['Мороз и солнце;', 'Мороз и солнце; день чудесный!']);
  assert.deepEqual(buildUp('Привет!'), ['Привет!']);
  const long = buildUp('Я помню чудное мгновенье передо мной явилась ты');
  assert.equal(long[long.length - 1], 'Я помню чудное мгновенье передо мной явилась ты');
  assert.ok(long.length >= 3);
});

test('splitLines keeps line breaks and splits long paragraphs into sentences', () => {
  assert.deepEqual(splitLines('Раз.\n\n\nДва.\n'), ['Раз.', '', 'Два.']);
  const long = 'Это первое довольно длинное предложение для проверки. А это второе, тоже не короткое! И третье?';
  assert.deepEqual(splitLines(long), ['Это первое довольно длинное предложение для проверки.', 'А это второе, тоже не короткое!', 'И третье?']);
});
