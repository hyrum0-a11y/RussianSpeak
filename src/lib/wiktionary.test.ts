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
