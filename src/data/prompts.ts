// Conversation prompts: hear a question, answer out loud, then compare with sample answers.

export type Prompt = {
  id: string;
  ru: string;
  en: string;
  answers: { ru: string; en: string }[];
  hint?: string;
};

const raw: [string, string, [string, string][], string?][] = [
  ['Как тебя́ зову́т?', "What's your name?", [['Меня́ зову́т… А тебя́?', 'My name is… And you?']]],
  ['Как дела́?', 'How are you?', [
    ['Хорошо́, спаси́бо. А у тебя́?', 'Good, thanks. And you?'],
    ['Так себе́. Мно́го рабо́ты.', 'So-so. Lots of work.'],
  ]],
  ['Отку́да ты?', 'Where are you from?', [['Я из Аме́рики, из шта́та Юта.', "I'm from America, from Utah."]], 'из + genitive'],
  ['Где ты живёшь?', 'Where do you live?', [['Я живу́ в го́роде… ', 'I live in the city of…']], 'в + prepositional'],
  ['Почему́ ты у́чишь ру́сский?', 'Why are you learning Russian?', [
    ['Потому́ что мне нра́вится ру́сская культу́ра.', 'Because I like Russian culture.'],
    ['Я хочу́ говори́ть с друзья́ми по-ру́сски.', 'I want to speak Russian with friends.'],
  ]],
  ['Как давно́ ты у́чишь ру́сский?', 'How long have you been learning Russian?', [['Я учу́ ру́сский уже́ два го́да.', "I've been learning Russian for two years."]], 'Present tense for ongoing actions'],
  ['Кем ты рабо́таешь?', 'What do you do for work?', [['Я рабо́таю инжене́ром.', 'I work as an engineer.']], 'рабо́тать + instrumental'],
  ['Тебе́ нра́вится твоя́ рабо́та?', 'Do you like your job?', [['Да, о́чень. Она́ интере́сная.', "Yes, a lot. It's interesting."]]],
  ['Что ты обы́чно де́лаешь по утра́м?', 'What do you usually do in the mornings?', [['Я пью ко́фе и чита́ю но́вости.', 'I drink coffee and read the news.']]],
  ['Что ты де́лал вчера́ ве́чером?', 'What did you do last night?', [['Я смотре́л фильм и ра́но лёг спать.', 'I watched a movie and went to bed early.']], 'Past tense: -л / -ла'],
  ['Что ты бу́дешь де́лать в выходны́е?', 'What will you do this weekend?', [['Я бу́ду отдыха́ть и, мо́жет быть, пойду́ в похо́д.', "I'll relax and maybe go hiking."]], 'бу́ду + infinitive'],
  ['Кака́я у тебя́ семья́?', 'What is your family like?', [['У меня́ больша́я семья́: жена́ и тро́е дете́й.', 'I have a big family: a wife and three kids.']], 'У меня́ есть…'],
  ['У тебя́ есть дома́шние живо́тные?', 'Do you have pets?', [['Да, у меня́ есть соба́ка.', 'Yes, I have a dog.'], ['Нет, у меня́ нет живо́тных.', "No, I don't have any pets."]], 'нет + genitive'],
  ['Како́е твоё люби́мое блю́до?', "What's your favorite dish?", [['Я о́чень люблю́ пельме́ни.', 'I really love pelmeni.']]],
  ['Ты лю́бишь гото́вить?', 'Do you like to cook?', [['Да, но гото́влю я не о́чень хорошо́.', "Yes, but I don't cook very well."]]],
  ['Что ты лю́бишь де́лать в свобо́дное вре́мя?', 'What do you like to do in your free time?', [['Я люблю́ игра́ть на гита́ре и гуля́ть.', 'I like playing guitar and walking.']], 'игра́ть на + prepositional (instruments)'],
  ['Ты был в Росси́и?', 'Have you been to Russia?', [['Нет, ещё не был, но о́чень хочу́ пое́хать.', "No, not yet, but I really want to go."]], 'был в + prepositional'],
  ['Како́й го́род ты хо́чешь посети́ть?', 'Which city do you want to visit?', [['Я хочу́ посети́ть Санкт-Петербу́рг.', 'I want to visit Saint Petersburg.']]],
  ['Кака́я сего́дня пого́да?', "What's the weather like today?", [['Сего́дня хо́лодно и идёт снег.', "It's cold today and it's snowing."]]],
  ['Како́е вре́мя го́да тебе́ нра́вится бо́льше всего́?', 'Which season do you like most?', [['Мне бо́льше всего́ нра́вится о́сень.', 'I like autumn most of all.']], 'мне нра́вится + nominative'],
  ['Что ты сове́туешь посмотре́ть?', 'What do you recommend watching?', [['Посмотри́ фильм «Брат». Он класси́ческий.', 'Watch the movie "Brother". It\'s a classic.']]],
  ['Ты лю́бишь чита́ть?', 'Do you like to read?', [['Да, сейча́с я чита́ю Че́хова.', "Yes, right now I'm reading Chekhov."]], 'чита́ть + accusative'],
  ['Как ты добира́ешься до рабо́ты?', 'How do you get to work?', [['Я е́зжу на маши́не.', 'I drive.'], ['Я рабо́таю из до́ма.', 'I work from home.']], 'е́здить на + prepositional'],
  ['Во ско́лько ты обы́чно встаёшь?', 'What time do you usually get up?', [['Обы́чно я встаю́ в семь часо́в.', 'I usually get up at seven.']]],
  ['Что тебе́ ну́жно купи́ть?', 'What do you need to buy?', [['Мне ну́жно купи́ть хлеб и молоко́.', 'I need to buy bread and milk.']], 'мне ну́жно + infinitive'],
  ['Как ты себя́ чу́вствуешь?', 'How are you feeling?', [['Непло́хо, но немно́го уста́л.', 'Not bad, but a little tired.']]],
  ['Что ты ду́маешь об э́том?', 'What do you think about this?', [['По-мо́ему, э́то интере́сная иде́я.', "I think it's an interesting idea."]], 'о / об + prepositional'],
  ['Мо́жешь мне помо́чь?', 'Can you help me?', [['Коне́чно! Что ну́жно сде́лать?', 'Of course! What needs doing?']]],
  ['Дава́й встре́тимся в пя́тницу?', 'Shall we meet on Friday?', [['Дава́й! Во ско́лько?', "Let's! What time?"], ['К сожале́нию, в пя́тницу я за́нят.', "Unfortunately, I'm busy on Friday."]], 'в + accusative for days'],
  ['Расскажи́ о себе́.', 'Tell me about yourself.', [['Меня́ зову́т… Я живу́ в… Я рабо́таю… В свобо́дное вре́мя я…', 'My name is… I live in… I work as… In my free time I…']], 'Aim for 3–4 sentences'],
];

export const PROMPTS: Prompt[] = raw.map(([ru, en, answers, hint]) => ({
  id: ru,
  ru,
  en,
  answers: answers.map(([aru, aen]) => ({ ru: aru, en: aen })),
  hint,
}));
