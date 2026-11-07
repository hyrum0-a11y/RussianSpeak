import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forSpeech } from './speechText.ts';

test('drops the silent в in здравствуйте and keeps capitalization', () => {
  assert.equal(forSpeech('Здра́вствуйте!'), 'Здраствуйте!');
  assert.equal(forSpeech('здравствуй'), 'здраствуй');
});

test('handles other silent-consonant words', () => {
  assert.equal(forSpeech('Как ты себя́ чу́вствуешь?'), 'Как ты себя чуствуешь?');
  assert.equal(forSpeech('Ло́жись по́здно'), 'Ложись позно');
});

test('strips stress marks and ellipses only otherwise', () => {
  assert.equal(forSpeech('Меня́ зову́т…'), 'Меня зовут.');
});
