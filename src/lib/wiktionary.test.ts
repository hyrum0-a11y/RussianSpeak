import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanDefinition, russianMeanings, stems, wordList } from './wiktionary.ts';

const PAGE = `{{wikipedia}}
= {{-ru-}} =
=== Морфологические и синтаксические свойства ===
{{сущ ru m ina 1c(1)}}
==== Значение ====
# [[здание]], [[строение]], предназначенное для [[жильё|жилья]] {{пример|Большой '''дом'''.|Автор}}
# {{перен.|ru}} [[семья]], [[домашний очаг]] {{пример|}}
#:{{пример|ещё}}
# {{?|ru}}
==== Синонимы ====
# [[здание]]
= {{-uk-}} =
==== Значение ====
# будинок
`;

test('russianMeanings reads only Russian meanings', () => {
  assert.deepEqual(russianMeanings(PAGE), [
    'здание, строение, предназначенное для жилья',
    'перен. семья, домашний очаг',
  ]);
});

test('cleanDefinition strips links and examples', () => {
  assert.equal(cleanDefinition("# ''[[a|б]]'' в {{пример|x {{y}} z}}"), 'б в');
});

test('wordList dedupes and keeps stress marks', () => {
  const w = wordList(['Приве́т, как дела́?', 'привет / Дела!']);
  assert.deepEqual(w.map((x) => x.word), ['дела́', 'как', 'приве́т']);
});

test('stems shortens words', () => {
  assert.deepEqual(stems('говорю'), ['говор', 'гово', 'гов']);
});

import { markWord, russianExamples } from './wiktionary.ts';

test('russianExamples pulls example sentences', () => {
  const ex = russianExamples(PAGE);
  assert.deepEqual(ex, ['Большой дом.', 'ещё'].filter((x) => x.length >= 8));
});

test('russianExamples handles nested templates and named args', () => {
  const page = '= {{-ru-}} =\n==== Значение ====\n# смысл {{пример|Я вижу {{выдел|дом}} на горе.|Автор|Книга}}\n# другое {{пример|текст=Мы идём домой вечером.}}\n';
  assert.deepEqual(russianExamples(page), ['Я вижу дом на горе.', 'Мы идём домой вечером.']);
});

test('markWord highlights forms of the word', () => {
  const parts = markWord('Мы идём домой, где наш дом.', 'дом');
  assert.deepEqual(parts.filter((p) => p.hit).map((p) => p.text), ['домой,', 'дом.']);
});

import { contextChunk, russianSetPhrases } from './wiktionary.ts';

test('contextChunk cuts a short phrase around the word', () => {
  assert.equal(contextChunk('Он сказал: иди ко мне скорее, я жду.', 'идти'), 'иди ко мне скорее');
  assert.equal(contextChunk('Мы долго шли домой по тёмной улице.', 'дом'), 'долго шли домой по тёмной улице');
});

test('russianSetPhrases reads set-phrase lists', () => {
  const page = '= {{-ru-}} =\n=== Фразеологизмы и устойчивые сочетания ===\n* [[дом отдыха]], [[из дома]]\n* [[дом]]\n=== Перевод ===\n* x y\n';
  assert.deepEqual(russianSetPhrases(page), ['дом отдыха', 'из дома']);
});

import { contexts } from './wiktionary.ts';

test('contexts puts short phrases first and keeps the full sentence', () => {
  const c = contexts('идти', ['Он сказал: иди ко мне скорее, я жду.'], ['идти в ногу']);
  assert.deepEqual(c, [{ short: 'иди ко мне скорее', full: 'Он сказал: иди ко мне скорее, я жду.' }, { short: 'идти в ногу' }]);
});

test('cleanDefinition drops the семантика block and doubled commas', () => {
  assert.equal(
    cleanDefinition('# {{разг.|ru}} выражает [[согласие]], {{-}}, [[согласен]] {{пример|Хорошо, приду.}}{{семантика|синонимы=ладно|антонимы=}}'),
    'разг. выражает согласие, согласен',
  );
});
