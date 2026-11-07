import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apostropheToStress, compareWords, pickCloze, sameWord, score } from './compare.ts';

test('ignores stress, case, ё and punctuation', () => {
  const r = compareWords('Всё хорошо́, спаси́бо!', 'все хорошо спасибо');
  assert.deepEqual(r.map((x) => x.ok), [true, true, true]);
  assert.equal(score(r), 1);
});

test('a missing word only marks that word wrong', () => {
  const r = compareWords('Я не понима́ю тебя́', 'я понимаю тебя');
  assert.deepEqual(r.map((x) => x.ok), [true, false, true, true]);
});

test('a misspelled word is wrong', () => {
  const r = compareWords('Как дела́?', 'как дила');
  assert.deepEqual(r.map((x) => x.ok), [true, false]);
});

test('cloze blanks a long word and keeps punctuation outside', () => {
  const c = pickCloze('Спаси́бо большо́е.', 1);
  assert.ok(c);
  assert.equal(c.before + c.answer + c.after, 'Спаси́бо большо́е.');
  assert.ok(!/[.]/.test(c.answer));
  assert.equal(pickCloze('Да, я.'), null);
});

test('sameWord and apostrophe stress', () => {
  assert.ok(sameWord('Ёлка', 'елка'));
  assert.equal(apostropheToStress("приве'т"), 'приве́т');
});
