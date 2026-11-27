// Content packs. The event room (EVENT_CODE) uses js/data_event.js; every other room uses js/data.js.
// Banks are swapped in place, so every game module that imported them sees the active pack.
import * as D from './data.js';
import * as E from './data_event.js';
import { setPackKey } from './ui.js';

export const EVENT_CODE = 'SABTU';

const LISTS = ['QUIZ', 'TABU', 'HERD', 'KIBUL', 'RECEH', 'SIAPA_PROMPTS', 'UNDERCOVER', 'SPECTRUM', 'SIPALING', 'DILEMMAS', 'BOOK_GENERAL', 'BOOK_DADAKAN', 'BOOK_CROSSFIRE'];
const orig = {
  lists: Object.fromEntries(LISTS.map((k) => [k, [...D[k]]])),
  life: { 1: [...D.LIFE[1].q], 2: [...D.LIFE[2].q] },
  cards: Object.fromEntries(D.CARDS.map((c) => [c.id, { secret: c.secret && [...c.secret], prompt: c.prompt && [...c.prompt] }])),
};
const fill = (arr, src) => arr.splice(0, arr.length, ...src);

let current = '';
export function usePack(name) {
  name = name === 'event' ? 'event' : '';
  if (name === current) return;
  current = name;
  const ev = name === 'event';
  LISTS.forEach((k) => fill(D[k], ev && E[k] ? E[k] : orig.lists[k]));
  [1, 2].forEach((l) => fill(D.LIFE[l].q, ev ? E.LIFE[l] : orig.life[l]));
  D.CARDS.forEach((c) => {
    const o = orig.cards[c.id];
    if (c.secret) fill(c.secret, ev && E.CARD_SECRET[c.id] ? E.CARD_SECRET[c.id] : o.secret);
    if (c.prompt) fill(c.prompt, ev && E.CARD_PROMPT[c.id] ? E.CARD_PROMPT[c.id] : o.prompt);
  });
  setPackKey(name);
}
