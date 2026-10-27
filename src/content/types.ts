// Shapes for a language pack. Every language the app teaches provides one
// LanguagePack built from these pieces. Spanish (Spain) is the first.

export type PhaseId = 'sounds' | 'words' | 'grammar' | 'vocab' | 'fluency';

export type Gender = 'm' | 'f' | 'mf';

export type PartOfSpeech = 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'num' | 'other';

/** One entry of the book's "Your first 625" list, translated. */
export interface BaseWord {
  /** Stable slug, unique within the pack, from the English concept: 'dog', 'ticket-train'. */
  id: string;
  /** English concept from the 625 list. Only used for image search and as a hidden hint. */
  en: string;
  /** Category key, e.g. 'animals'. Must match a WordCategory id. */
  category: string;
  /** The target-language word, without article: 'perro'. */
  word: string;
  pos: PartOfSpeech;
  /** Nouns only. 'mf' = same form for both (el/la estudiante). */
  gender?: Gender;
  /** Article to show when it is not the regular one, e.g. 'el' for 'agua' (feminine). */
  article?: string;
  /** Feminine form for people nouns and adjectives: 'profesora', 'roja'. */
  fem?: string;
  /** Plural, only when irregular or the accent moves: 'lápices', 'jóvenes'. */
  plural?: string;
  /** English note when the gender breaks the -o/-a pattern or is surprising. */
  genderNote?: string;
  /** English usage note: regional words, false friends, etc. */
  note?: string;
  /** Other accepted answers when typing (synonyms the learner might give). */
  alt?: string[];
  /** One emoji that pictures the word, used until the learner picks a photo. */
  emoji?: string;
  /** Auto-drawn picture: 'swatch:#d62828', 'text:7', 'arrow:left'. */
  draw?: string;
  /** Image search query (English) when `en` alone would find the wrong thing. */
  search?: string;
}

export interface WordCategory {
  id: string;
  /** English heading from the book. */
  title: string;
  /** Target-language heading. */
  native: string;
  /** Personal-connection prompt in English; '{w}' is replaced with the word. */
  prompt: string;
}

/** A sound of the language and how it is spelled. */
export interface SoundLesson {
  id: string;
  order: number;
  title: string;
  /** IPA symbol(s), e.g. '[r]'. */
  ipa: string;
  /** Spellings that make this sound, e.g. ['rr', 'r at the start of a word']. */
  spellings: string[];
  /** Comparison to English for an English speaker. */
  english: string;
  /** How to make it: tongue, lips, voice. */
  howTo: string;
  /** Common mistakes English speakers make. */
  pitfalls?: string;
  /** Example words; `mark` is the letters to highlight in the word. */
  examples: { word: string; mark: string }[];
}

/** Minimal pairs: words that differ in one sound, for ear training. */
export interface MinimalPairSet {
  id: string;
  /** e.g. 'r vs rr' */
  contrast: string;
  /** Sound lesson ids this set trains. */
  lessons: string[];
  /** Real words only. */
  pairs: [string, string][];
  note?: string;
}

/** A grammar point taught through example sentences, the book's way. */
export interface GrammarTopic {
  id: string;
  order: number;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  title: string;
  /** Short English explanation. Plain text; blank lines separate paragraphs. */
  summary: string;
  /** Where to read more, e.g. 'Gramática de uso del español A1-A2, unit 12'. */
  ref?: string;
  sentences: GrammarSentence[];
}

/**
 * Cloze syntax, like Anki: {{c1::answer::hint}}. Each distinct cN becomes one
 * card. The hint is shown in the blank (base form, infinitive, etc.).
 * Example: 'Yo {{c1::hablo::hablar}} con {{c2::mi::my}} madre.'
 */
export interface GrammarSentence {
  id: string;
  text: string;
  /** English meaning, shown only on request. */
  en: string;
  /** English image search query for a picture that shows the sentence. */
  image?: string;
  note?: string;
}

/** Words beyond the first 625, learned with target-language definitions. */
export interface VocabWord {
  id: string;
  word: string;
  pos: PartOfSpeech;
  gender?: Gender;
  article?: string;
  fem?: string;
  /** Monolingual definition in simple target language. */
  def: string;
  /** Example sentence; the word itself is wrapped in [[ ]]. */
  example: string;
  /** English gloss, hidden by default. */
  en: string;
  /** Rough frequency band: 1 = top 1000, 2 = top 2000, 3 = top 3000+. */
  band: 1 | 2 | 3;
  topic?: string;
  emoji?: string;
}

export type ResourceCategory =
  | 'pronunciation' | 'dictionary' | 'grammar' | 'vocabulary' | 'images'
  | 'srs' | 'tutors' | 'exchange' | 'corrections' | 'podcasts' | 'youtube'
  | 'tv' | 'reading' | 'news' | 'tools' | 'courses';

export interface Resource {
  id: string;
  name: string;
  url: string;
  category: ResourceCategory;
  description: string;
  cost: 'free' | 'freemium' | 'paid';
  /** Accent / variety of the content. */
  accent?: 'spain' | 'latam' | 'mixed' | 'neutral';
  /** CEFR range, e.g. 'A1–B1'. */
  level?: string;
  /** Phases where it is most useful. */
  phases?: PhaseId[];
  /** Part of the core kit the book's method needs. */
  core?: boolean;
  /** How to use it the book's way. */
  howTo?: string;
}

/** An outside-the-app activity the daily plan can schedule. */
export interface ActivityTemplate {
  id: string;
  kind: 'listen' | 'watch' | 'read' | 'tutor' | 'exchange' | 'correct' | 'speak' | 'review';
  /** Imperative label, e.g. 'Listen to one episode of Hoy Hablamos'. */
  title: string;
  /** Resource id this links to. */
  resource: string;
  minutes: number;
  /** Phases where this activity is scheduled. */
  phases: PhaseId[];
  /** Minimum CEFR-ish level; plan skips harder items early on. */
  minLevel?: 'A1' | 'A2' | 'B1' | 'B2';
  /** Short how-to shown under the checkbox. */
  tip?: string;
}

export interface WritingPrompt {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  /** Prompt in the target language. */
  text: string;
  /** English translation. */
  en: string;
}

export interface LanguagePack {
  code: string;          // 'es-ES'
  name: string;          // 'Spanish (Spain)'
  native: string;        // 'Español (España)'
  flag: string;          // emoji
  ttsLang: string;       // BCP-47 tag for speech synthesis, 'es-ES'
  /** Lingua Libre language code used for native recordings, e.g. 'LL-Q1321 (spa)'. */
  linguaLibre?: string;
  genders: { m: { article: string; label: string }; f: { article: string; label: string } };
  categories: WordCategory[];
  words: BaseWord[];
  sounds: SoundLesson[];
  pairs: MinimalPairSet[];
  grammar: GrammarTopic[];
  vocab: VocabWord[];
  resources: Resource[];
  activities: ActivityTemplate[];
  prompts: WritingPrompt[];
}
