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

test('picks an on-device Russian voice over network or non-Russian ones', async () => {
  const { pickRussianVoice } = await import('./speechText.ts');
  const voices = [
    { identifier: 'en-us-x-sfg-local', name: '', language: 'en-US' },
    { identifier: 'ru-ru-x-ruc-network', name: '', language: 'ru-RU' },
    { identifier: 'ru-ru-x-dfc-local', name: '', language: 'ru-RU' },
  ];
  assert.equal(pickRussianVoice(voices)?.identifier, 'ru-ru-x-dfc-local');
  assert.equal(pickRussianVoice(voices, 'ru-ru-x-ruc-network')?.identifier, 'ru-ru-x-ruc-network');
  assert.equal(pickRussianVoice(voices.slice(0, 1)), undefined);
});
