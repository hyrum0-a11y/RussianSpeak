// Stress is marked with a combining acute accent (U+0301) after the stressed vowel.
// It is stripped before text is sent to text-to-speech.

export type Phrase = {
  id: string;
  ru: string;
  en: string;
  cat: Category;
  note?: string;
};

export const CATEGORIES = [
  'Basics',
  'Small talk',
  'Getting by',
  'Food & drink',
  'Travel',
  'Shopping',
  'Opinions',
  'Plans & time',
  'Feelings',
] as const;

export type Category = (typeof CATEGORIES)[number];

const raw: [string, string, Category, string?][] = [
  // Basics
  ['Здра́вствуйте!', 'Hello! (formal)', 'Basics', 'The first в is silent: здра́ствуйте.'],
  ['Приве́т! Как дела́?', 'Hi! How are you?', 'Basics'],
  ['Всё хорошо́, спаси́бо. А у тебя́?', "All good, thanks. And you?", 'Basics'],
  ['Ничего́, норма́льно.', "Not bad, okay.", 'Basics', 'ничего́ is pronounced ничево́.'],
  ['Как вас зову́т?', 'What is your name? (formal)', 'Basics'],
  ['Меня́ зову́т…', 'My name is…', 'Basics'],
  ['О́чень прия́тно.', 'Nice to meet you.', 'Basics'],
  ['До свида́ния!', 'Goodbye!', 'Basics'],
  ['Пока́!', 'Bye! (informal)', 'Basics'],
  ['Спаси́бо большо́е.', 'Thank you very much.', 'Basics'],
  ['Пожа́луйста.', "Please. / You're welcome.", 'Basics', 'Often said quickly: пожа́лста.'],
  ['Извини́те.', 'Excuse me. / Sorry. (formal)', 'Basics'],
  ['Ничего́ стра́шного.', "It's no big deal.", 'Basics'],
  ['Да, коне́чно.', 'Yes, of course.', 'Basics', 'коне́чно is pronounced коне́шно.'],

  // Small talk
  ['Отку́да вы?', 'Where are you from?', 'Small talk'],
  ['Я из Аме́рики.', "I'm from America.", 'Small talk'],
  ['Где вы живёте?', 'Where do you live?', 'Small talk'],
  ['Чем вы занима́етесь?', 'What do you do (for work)?', 'Small talk'],
  ['Я рабо́таю программи́стом.', 'I work as a programmer.', 'Small talk', 'Instrumental case after рабо́тать.'],
  ['Я учу́ ру́сский язы́к.', "I'm learning Russian.", 'Small talk'],
  ['Я немно́го говорю́ по-ру́сски.', 'I speak a little Russian.', 'Small talk'],
  ['Как давно́ вы здесь?', 'How long have you been here?', 'Small talk'],
  ['У вас есть де́ти?', 'Do you have children?', 'Small talk'],
  ['Что вы лю́бите де́лать в свобо́дное вре́мя?', 'What do you like to do in your free time?', 'Small talk'],
  ['Я люблю́ чита́ть и гуля́ть.', 'I like reading and going for walks.', 'Small talk'],
  ['Кака́я сего́дня пого́да!', 'What weather today!', 'Small talk', 'сего́дня is pronounced сево́дня.'],

  // Getting by
  ['Я не понима́ю.', "I don't understand.", 'Getting by'],
  ['Повтори́те, пожа́луйста.', 'Please repeat that.', 'Getting by'],
  ['Говори́те поме́дленнее, пожа́луйста.', 'Please speak more slowly.', 'Getting by'],
  ['Как сказа́ть по-ру́сски…?', 'How do you say … in Russian?', 'Getting by'],
  ['Что э́то зна́чит?', 'What does this mean?', 'Getting by'],
  ['Вы говори́те по-англи́йски?', 'Do you speak English?', 'Getting by'],
  ['Мо́жно вопро́с?', 'May I ask a question?', 'Getting by'],
  ['Я забы́л сло́во.', 'I forgot the word.', 'Getting by', 'A woman says забы́ла.'],
  ['Подожди́те мину́точку.', 'Wait a moment, please.', 'Getting by'],
  ['Помоги́те, пожа́луйста!', 'Help, please!', 'Getting by'],

  // Food & drink
  ['Мо́жно меню́, пожа́луйста?', 'Can I have the menu, please?', 'Food & drink'],
  ['Что вы посове́туете?', 'What do you recommend?', 'Food & drink'],
  ['Я бу́ду борщ.', "I'll have the borscht.", 'Food & drink'],
  ['Мне, пожа́луйста, ча́шку ко́фе.', 'A cup of coffee for me, please.', 'Food & drink'],
  ['Без са́хара, пожа́луйста.', 'Without sugar, please.', 'Food & drink'],
  ['Счёт, пожа́луйста.', 'The check, please.', 'Food & drink'],
  ['Мо́жно оплати́ть ка́ртой?', 'Can I pay by card?', 'Food & drink'],
  ['О́чень вку́сно!', 'Very tasty!', 'Food & drink'],
  ['Я не ем мя́со.', "I don't eat meat.", 'Food & drink'],
  ['Прия́тного аппети́та!', 'Enjoy your meal!', 'Food & drink'],
  ['За ва́ше здоро́вье!', 'To your health! (toast)', 'Food & drink'],

  // Travel
  ['Где нахо́дится метро́?', 'Where is the metro?', 'Travel'],
  ['Как дое́хать до це́нтра?', 'How do I get to the center?', 'Travel'],
  ['Э́то далеко́ отсю́да?', 'Is it far from here?', 'Travel'],
  ['Иди́те пря́мо, пото́м напра́во.', 'Go straight, then right.', 'Travel'],
  ['Оди́н биле́т до Москвы́, пожа́луйста.', 'One ticket to Moscow, please.', 'Travel'],
  ['Во ско́лько отправля́ется по́езд?', 'What time does the train leave?', 'Travel'],
  ['У меня́ заброни́рован но́мер.', 'I have a room reserved.', 'Travel'],
  ['Где здесь туале́т?', 'Where is the restroom here?', 'Travel'],
  ['Я заблуди́лся.', "I'm lost.", 'Travel', 'A woman says заблуди́лась.'],
  ['Останови́те здесь, пожа́луйста.', 'Stop here, please.', 'Travel'],

  // Shopping
  ['Ско́лько э́то сто́ит?', 'How much does this cost?', 'Shopping'],
  ['Э́то сли́шком до́рого.', "That's too expensive.", 'Shopping'],
  ['Мо́жно приме́рить?', 'Can I try it on?', 'Shopping'],
  ['У вас есть друго́й разме́р?', 'Do you have another size?', 'Shopping'],
  ['Я про́сто смотрю́.', "I'm just looking.", 'Shopping'],
  ['Я возьму́ э́то.', "I'll take this.", 'Shopping'],
  ['Паке́т ну́жен?', 'Do you need a bag?', 'Shopping'],

  // Opinions
  ['По-мо́ему, э́то хоро́шая иде́я.', "In my opinion, it's a good idea.", 'Opinions'],
  ['Я с ва́ми согла́сен.', 'I agree with you.', 'Opinions', 'A woman says согла́сна.'],
  ['Я не уве́рен.', "I'm not sure.", 'Opinions', 'A woman says уве́рена.'],
  ['Мне ка́жется, что…', 'It seems to me that…', 'Opinions'],
  ['Мне э́то нра́вится.', 'I like this.', 'Opinions'],
  ['Мне э́то не о́чень нра́вится.', "I don't really like this.", 'Opinions'],
  ['Всё зави́сит от ситуа́ции.', 'It all depends on the situation.', 'Opinions'],
  ['С одно́й стороны́… с друго́й стороны́…', 'On one hand… on the other hand…', 'Opinions'],
  ['Ты прав.', "You're right.", 'Opinions', 'To a woman: ты права́.'],

  // Plans & time
  ['Кото́рый час?', 'What time is it?', 'Plans & time'],
  ['Что ты де́лаешь в выходны́е?', 'What are you doing this weekend?', 'Plans & time'],
  ['Дава́й встре́тимся за́втра.', "Let's meet tomorrow.", 'Plans & time'],
  ['Во ско́лько тебе́ удо́бно?', 'What time works for you?', 'Plans & time'],
  ['Я за́нят сего́дня.', "I'm busy today.", 'Plans & time', 'A woman says занята́.'],
  ['Я опа́здываю на пять мину́т.', "I'm running five minutes late.", 'Plans & time'],
  ['Вчера́ я был до́ма.', 'Yesterday I was at home.', 'Plans & time', 'A woman says была́.'],
  ['Я давно́ хоте́л туда́ пое́хать.', "I've wanted to go there for a long time.", 'Plans & time'],
  ['Уви́димся!', 'See you!', 'Plans & time'],

  // Feelings
  ['Я уста́л.', "I'm tired.", 'Feelings', 'A woman says уста́ла.'],
  ['Я так рад тебя́ ви́деть!', "I'm so glad to see you!", 'Feelings', 'A woman says ра́да.'],
  ['Мне ску́чно.', "I'm bored.", 'Feelings', 'ску́чно is pronounced ску́шно.'],
  ['Не волну́йся.', "Don't worry.", 'Feelings'],
  ['Как здо́рово!', 'How great!', 'Feelings'],
  ['Жаль.', "That's a pity.", 'Feelings'],
  ['Мне пло́хо.', "I feel bad / unwell.", 'Feelings'],
  ['Я в восто́рге!', "I'm thrilled!", 'Feelings'],
];

// The Russian text doubles as the id, so progress survives reordering or adding phrases.
export const PHRASES: Phrase[] = raw.map(([ru, en, cat, note]) => ({
  id: ru,
  ru,
  en,
  cat,
  note,
}));
