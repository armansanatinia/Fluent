import type { LanguagePack } from '../types';
import { grammar } from './grammar';
import { prompts } from './prompts';
import { activities, resources } from './resources';
import { pairs, sounds } from './sounds';
import { vocab } from './vocab';
import { categories, words } from './words';

export { ipa } from './ipa';

// Vocabulary expansion skips anything already taught in the base words.
const base = new Set(words.map(w => `${w.word}|${w.pos}`));
const extra = vocab.filter(v => !base.has(`${v.word}|${v.pos}`));

export const spanish: LanguagePack = {
  code: 'es-ES',
  name: 'Spanish (Spain)',
  native: 'Español (España)',
  flag: '🇪🇸',
  ttsLang: 'es-ES',
  linguaLibre: 'LL-Q1321 (spa)',
  genders: { m: { article: 'el', label: 'masculine' }, f: { article: 'la', label: 'feminine' } },
  categories,
  words,
  sounds,
  pairs,
  grammar,
  vocab: extra,
  resources,
  activities,
  prompts,
};
