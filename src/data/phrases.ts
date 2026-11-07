// Stress is marked with a combining acute accent (U+0301) after the stressed vowel.
// It is stripped before text is sent to text-to-speech.

export type Phrase = {
  id: string;
  ru: string;
  en: string;
  cat: Category;
  deck: Deck;
  note?: string;
  /** Idioms show their English automatically: the literal words won't get you there. */
  idiom: boolean;
};

export type Deck = 'everyday' | 'sayings' | 'movies';

export const DECKS: { id: Deck; title: string; blurb: string }[] = [
  { id: 'everyday', title: 'Everyday phrases', blurb: 'Useful phrases for real conversations.' },
  { id: 'sayings', title: 'Famous sayings', blurb: 'Russian proverbs (пословицы) that people actually use.' },
  { id: 'movies', title: 'Movie lines', blurb: 'Iconic lines from classic Soviet and Russian films.' },
];

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
  'Sayings',
  'Movie lines',
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

  // Sayings — en is the meaning or English equivalent; note is the literal translation.
  ['Без труда́ не вы́тащишь и ры́бку из пруда́.', 'No pain, no gain.', 'Sayings', 'Lit.: Without effort you won\'t even pull a little fish out of the pond.'],
  ['Ти́ше е́дешь — да́льше бу́дешь.', 'Slow and steady wins the race.', 'Sayings', 'Lit.: The quieter you ride, the farther you\'ll get.'],
  ['Не име́й сто рубле́й, а име́й сто друзе́й.', 'Friends are worth more than money.', 'Sayings', 'Lit.: Don\'t have a hundred rubles, have a hundred friends.'],
  ['Лу́чше по́здно, чем никогда́.', 'Better late than never.', 'Sayings'],
  ['Век живи́ — век учи́сь.', 'Live and learn.', 'Sayings', 'Lit.: Live a century, learn a century.'],
  ['Москва́ не сра́зу стро́илась.', "Rome wasn't built in a day.", 'Sayings', 'Lit.: Moscow wasn\'t built all at once.'],
  ['У́тро ве́чера мудрене́е.', "Sleep on it.", 'Sayings', 'Lit.: The morning is wiser than the evening.'],
  ['Цыпля́т по о́сени счита́ют.', "Don't count your chickens before they hatch.", 'Sayings', 'Lit.: Chicks are counted in autumn.'],
  ['Друзья́ познаю́тся в беде́.', 'A friend in need is a friend indeed.', 'Sayings', 'Lit.: Friends are recognized in trouble.'],
  ['Аппети́т прихо́дит во вре́мя еды́.', 'Appetite comes with eating.', 'Sayings', 'The more you have, the more you want.'],
  ['В гостя́х хорошо́, а до́ма лу́чше.', "There's no place like home.", 'Sayings', 'Lit.: Visiting is nice, but home is better.'],
  ['Пе́рвый блин ко́мом.', 'The first try never goes right.', 'Sayings', 'Lit.: The first pancake comes out lumpy.'],
  ['Сло́во не воробе́й: вы́летит — не пойма́ешь.', "You can't take back your words.", 'Sayings', 'Lit.: A word is not a sparrow: once it flies out, you won\'t catch it.'],
  ['Волко́в боя́ться — в лес не ходи́ть.', 'Nothing ventured, nothing gained.', 'Sayings', 'Lit.: If you fear wolves, don\'t go into the forest.'],
  ['Где то́нко, там и рвётся.', 'A chain is only as strong as its weakest link.', 'Sayings', 'Lit.: Where it\'s thin, that\'s where it tears.'],
  ['Что напи́сано перо́м, того́ не вы́рубишь топоро́м.', "What's written down can't be undone.", 'Sayings', 'Lit.: What is written with a pen can\'t be cut out with an axe.'],
  ['Ры́ба и́щет, где глу́бже, а челове́к — где лу́чше.', 'People go where life is better.', 'Sayings', 'Lit.: A fish looks for deeper water, a person for a better place.'],
  ['Ко́нчил де́ло — гуля́й сме́ло.', 'Work first, then play.', 'Sayings', 'Lit.: Finished the job? Go out and have fun.'],
  ['Ни пу́ха ни пера́! — К чёрту!', 'Good luck! — Thanks! (traditional exchange)', 'Sayings', 'Lit.: Neither fur nor feather! — To the devil! Never answer «спаси́бо».'],
  ['Не всё коту́ ма́сленица.', "Good times don't last forever.", 'Sayings', 'Lit.: It\'s not always Maslenitsa (carnival) for the cat.'],

  // Movie lines — note gives the film.
  ['Восто́к — де́ло то́нкое.', 'The East is a delicate matter.', 'Movie lines', '«Бе́лое со́лнце пусты́ни» (1970)'],
  ['За держа́ву оби́дно.', 'I feel hurt for my country.', 'Movie lines', '«Бе́лое со́лнце пусты́ни» (1970)'],
  ['Я тре́бую продолже́ния банке́та!', 'I demand the banquet continue!', 'Movie lines', '«Ива́н Васи́льевич меня́ет профе́ссию» (1973)'],
  ['Красота́-то кака́я! Лепота́!', 'What beauty! Splendor!', 'Movie lines', '«Ива́н Васи́льевич меня́ет профе́ссию» (1973). лепота́ is Old Russian.'],
  ['На́ши лю́ди в бу́лочную на такси́ не е́здят.', "Our people don't take a taxi to the bakery.", 'Movie lines', '«Бриллиа́нтовая рука́» (1968)'],
  ['Шоб я так жил!', 'I wish I lived like that!', 'Movie lines', '«Бриллиа́нтовая рука́» (1968). шоб is colloquial for что́бы.'],
  ['Кака́я га́дость э́та ва́ша за́ливная ры́ба!', 'What a disgusting thing this jellied fish of yours is!', 'Movie lines', '«Иро́ния судьбы́, и́ли С лёгким па́ром!» (1975)'],
  ['Огласи́те весь спи́сок, пожа́луйста!', 'Read out the whole list, please!', 'Movie lines', '«Опера́ция „Ы“» (1965)'],
  ['Кто не рабо́тает, тот ест!', "Whoever doesn't work, eats!", 'Movie lines', '«Опера́ция „Ы“» (1965). A twist on «Кто не рабо́тает, тот не ест».'],
  ['Спортсме́нка, комсомо́лка и про́сто краса́вица!', 'An athlete, a Komsomol member, and simply a beauty!', 'Movie lines', '«Кавка́зская пле́нница» (1967)'],
  ['Короче, Склифосо́вский!', 'Get to the point!', 'Movie lines', '«Кавка́зская пле́нница» (1967). Said to someone who talks too long.'],
  ['Птичку жа́лко.', 'I feel sorry for the little bird.', 'Movie lines', '«Кавка́зская пле́нница» (1967)'],
  ['Вор до́лжен сиде́ть в тюрьме́!', 'A thief belongs in prison!', 'Movie lines', '«Ме́сто встре́чи измени́ть нельзя́» (1979)'],
  ['А вас, Шти́рлиц, я попрошу́ оста́ться.', 'And you, Stirlitz, I will ask to stay.', 'Movie lines', '«Семна́дцать мгнове́ний весны́» (1973)'],
  ['Я так ду́маю.', "That's what I think.", 'Movie lines', '«Мимино́» (1977)'],
  ['В со́рок лет жизнь то́лько начина́ется.', 'At forty, life is just beginning.', 'Movie lines', '«Москва́ слеза́м не ве́рит» (1979)'],
  ['Си́ла в пра́вде.', 'Strength lies in truth.', 'Movie lines', '«Брат 2» (2000): «Вот скажи́ мне, америка́нец, в чём си́ла?»'],
  ['Тёпленькая пошла́!', "The warm water's started flowing!", 'Movie lines', '«Иро́ния судьбы́» (1975). Said when things finally get going.'],
  ['Э́то я уда́чно зашёл!', 'Well, I dropped by at just the right time!', 'Movie lines', '«Ива́н Васи́льевич меня́ет профе́ссию» (1973)'],
];

// The Russian text doubles as the id, so progress survives reordering or adding phrases.
export const PHRASES: Phrase[] = raw.map(([ru, en, cat, note]) => ({
  id: ru,
  ru,
  en,
  cat,
  deck: cat === 'Sayings' ? 'sayings' : cat === 'Movie lines' ? 'movies' : 'everyday',
  note,
  idiom: cat === 'Sayings' || cat === 'Movie lines',
}));

export function phrasesIn(deck: Deck): Phrase[] {
  return PHRASES.filter((p) => p.deck === deck);
}
