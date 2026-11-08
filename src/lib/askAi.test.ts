import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiPrompt } from './askAi.ts';

test('aiPrompt strips stress marks and includes the question', () => {
  const p = aiPrompt('Приве́т', 'почему так?');
  assert.match(p, /«Привет»/);
  assert.match(p, /Мой вопрос: почему так\?/);
});

test('aiPrompt has a default question', () => {
  assert.match(aiPrompt('дом'), /Объясни/);
});
