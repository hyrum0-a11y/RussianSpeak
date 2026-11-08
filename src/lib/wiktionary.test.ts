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
