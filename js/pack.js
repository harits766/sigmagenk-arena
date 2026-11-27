// Content packs. The event room (EVENT_CODE) uses js/data_event.js; every other room uses js/data.js.
// Banks are swapped in place, so every game module that imported them sees the active pack.
import * as D from './data.js';
import { setPackKey } from './ui.js';

export const EVENT_CODE = 'SABTU';
// The event-room button only shows on ?host=1&k=<EVENT_KEY>.
export const EVENT_KEY = 'a5suxh27';

const LISTS = ['QUIZ', 'TABU', 'HERD', 'KIBUL', 'RECEH', 'SIAPA_PROMPTS', 'UNDERCOVER', 'SPECTRUM', 'SIPALING', 'DILEMMAS', 'BOOK_GENERAL', 'BOOK_DADAKAN', 'BOOK_CROSSFIRE'];
const orig = {
  lists: Object.fromEntries(LISTS.map((k) => [k, [...D[k]]])),
  life: { 1: [...D.LIFE[1].q], 2: [...D.LIFE[2].q] },
  cards: Object.fromEntries(D.CARDS.map((c) => [c.id, { secret: c.secret && [...c.secret], prompt: c.prompt && [...c.prompt] }])),
};
const fill = (arr, src) => arr.splice(0, arr.length, ...src);

// The event pack is only downloaded inside the event room, so it never shows up in other rooms' network traffic.
let current = '';
let E = null;
export async function usePack(name) {
  name = name === 'event' ? 'event' : '';
  if (name === current) return false;
  current = name;
  const ev = name === 'event';
  if (ev && !E) E = await import('./data_event.js');
  LISTS.forEach((k) => fill(D[k], ev && E[k] ? E[k] : orig.lists[k]));
  [1, 2].forEach((l) => fill(D.LIFE[l].q, ev ? E.LIFE[l] : orig.life[l]));
  D.CARDS.forEach((c) => {
    const o = orig.cards[c.id];
    if (c.secret) fill(c.secret, ev && E.CARD_SECRET[c.id] ? E.CARD_SECRET[c.id] : o.secret);
    if (c.prompt) fill(c.prompt, ev && E.CARD_PROMPT[c.id] ? E.CARD_PROMPT[c.id] : o.prompt);
  });
  setPackKey(name);
  return true;
}
