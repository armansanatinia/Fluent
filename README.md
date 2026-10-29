# Fluent — Spanish the Fluent Forever way

A language-learning app that follows Gabriel Wyner's *Fluent Forever* step by step, starting with Castilian Spanish (Spain). Each day it builds a checklist of everything to do, in the app and outside it. It works offline on an iPhone home screen and syncs with your computer.

## What's in it

- **Today**: a daily plan sized to your minutes (60 by default). Flashcard reviews come first, then new material for your current phase, then one thing outside the app (a podcast, a show, a graded reader, your italki lesson, a language exchange, posting your writing for correction). In-app items tick themselves. Outside items are checkboxes with links, and you can add your own.
- **The book's phases, in order, overlapping the way the book allows**:
  1. **Pronunciation**: 30 sound lessons for Castilian, covering how each sound is made, how it's spelled, the mistakes English speakers make, example words with IPA, and recording yourself to compare. 18 minimal-pair sets (pero/perro, casa/caza, cana/caña…) for ear training, as drills and as cards.
  2. **Base words**: the book's "Your first 625" list (600 entries in this edition), in Castilian. For each word you pick a picture, hear a native recording (Lingua Libre speakers, or the device's Spain voice), play out the **gender trick** (masculine nouns explode 💥, feminine nouns catch fire 🔥; both are changeable, and they play back as animations on your cards), and add a personal memory. The cards are picture→word, word→picture and, for tricky spellings, a typed spelling card. There's no English on the cards.
  3. **Grammar through sentences**: 39 topics from A1 to B2 (ser/estar, este/ese/aquel, pretérito perfecto, subjunctive…), 533 example sentences with vosotros and Spain usage. Each blank in a sentence becomes a fill-in-the-blank card with a picture. You can add sentences from your own grammar book.
  4. **Vocabulary expansion**: about 440 frequent and abstract words, learned from simple Spanish definitions and example sentences.
  5. **Fluency**: the writing journal (daily prompts, corrections from natives or the optional AI helper, and corrections turned into cards), the word inbox (words from tutors, TV and books turned into cards), tutors, exchanges, TV and reading.
- **Spaced repetition**: FSRS by default, or Anki's classic SM-2 (the algorithm the book was written around), with learning steps, Again/Hard/Good/Easy and undo.
- **Resources**: 99 resources (pronunciation, dictionaries, grammar books, tutors, exchanges, corrections, podcasts, YouTube, TV, reading, news and tools). Each is tagged by accent, cost and level, with notes on how to use it the book's way.
- **Progress**: your roadmap, streak, retention, a cards-per-day chart, a due-cards forecast and a study calendar.
- **Settings**: pace, tutor and exchange days, gender images and colours, scheduler, voice, sync, the AI helper, a calendar reminder, backup/restore and CSV export for Anki.
- **The method**: a guide to doing each phase well, covering picking pictures, grading honestly, what to do with tutors (with phrases), and a rough timeline.

## Put it online (one time, about 10 minutes)

You need a free Cloudflare account. The worker serves the app and stores your progress for sync.

```bash
git clone https://github.com/armansanatinia/fluent.git
cd fluent
npm install
npm run setup
```

`npm run setup` logs you in to Cloudflare (it opens your browser), creates the database, deploys the app, and sets a sync password (it makes up a strong one if you don't choose one). It can also store an Anthropic API key for the AI helper. At the end it prints your app's address and the password.

Then:

- **iPhone**: open the address in Safari and tap Share → **Add to Home Screen**. Open the app, go to **Settings → Sync**, and enter the password.
- **Computer**: open the same address and enter the same password. Both devices now sync on their own.
- For Spanish (Spain) speech on the iPhone, install a voice: Settings → Accessibility → Spoken Content → Voices → Spanish (Spain).
- For a daily nudge, use **Settings → Daily reminder** to add a repeating event to your calendar.

<details><summary>Doing it by hand instead</summary>

```bash
npx wrangler login
npx wrangler d1 create fluent        # copy the database_id it prints into wrangler.jsonc
npm run db:remote                    # create the sync table
npm run deploy                       # prints your URL, e.g. https://fluent.<you>.workers.dev
npx wrangler secret put SYNC_TOKEN   # make up a long password; you'll type it on each device
npx wrangler secret put ANTHROPIC_API_KEY   # optional: turns on the AI helper for every device
```
</details>

You can also skip the server. The app works on a single device without it; use **Settings → Your data → Export** to back it up.

## Develop

Cloud sessions of Claude Code install everything on start (`.claude/hooks/session-start.sh`). Locally:

```bash
npm install
npm run db:local   # once
npm run dev        # app and worker together at http://localhost:5173
npm test           # scheduler, IPA, plan, cloze and store tests
npm run typecheck
node scripts/screenshots.mjs   # walks every screen at phone size, saves .shots/*.png
```

## How it's built

- `src/content/`: language packs. `es/` holds the base words, sound lessons and minimal pairs, grammar topics, vocabulary, resources, daily activities, writing prompts and a rule-based Castilian IPA transcriber. To add a language, write another pack with the same shape (see `types.ts`) and list it in `content/index.ts`.
- `src/lib/`: the engine. `srs/` (FSRS-5 + SM-2), `queue.ts` (what to study next), `plan.ts` (the daily plan), `store.ts` + `db.ts` (in-memory state on top of IndexedDB), `sync.ts`, `audio.ts` (Lingua Libre lookup + speech), `images.ts` (Openverse + Wikimedia Commons search, resize and store), `ai.ts`.
- `src/screens/`: one file per screen. `src/components/`: shared pieces (image picker, gender animations, recorder, cloze editor, charts).
- `worker/index.ts`: Cloudflare Worker with `/api/push` and `/api/pull` for sync (D1, newest edit wins, day logs merge), `/api/ai` for the AI helper (Anthropic SDK, Claude Opus 5.5, with server-side refusal fallback on) and `/api/img` for fetching card pictures.
- `src/shared/ai.ts`: the AI helper's prompts and structured outputs, shared by the browser (your own key) and the worker (server key).

Audio comes from Lingua Libre (Wikimedia Commons, CC BY-SA). Pictures come from Openverse and Wikimedia Commons, and their credit is stored on each card.
