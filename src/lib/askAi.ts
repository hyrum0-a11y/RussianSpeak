/** Build a question about a phrase or word to paste into any AI app. Pure, unit-tested. */
export function aiPrompt(text: string, question?: string): string {
  const q = question?.trim();
  return [
    'Я изучаю русский язык (уровень B1).',
    `Фраза: «${text.replace(/́/g, '')}».`,
    q ? `Мой вопрос: ${q}` : 'Объясни, пожалуйста, что она значит, когда её говорят, и разбери грамматику.',
    'Отвечай простым русским языком, без перевода на английский. Поставь ударения в трудных словах и дай 2–3 примера.',
  ].join('\n');
}
