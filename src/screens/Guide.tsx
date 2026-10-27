import { AudioButton } from '../components/media';
import { TopBar } from '../components/ui';
import { useStore } from '../lib/hooks';

const TUTOR_PHRASES: [string, string][] = [
  ['¿Me corriges cuando me equivoque, por favor?', 'Will you correct me when I make a mistake?'],
  ['¿Me puedes escribir las correcciones en el chat?', 'Can you write the corrections in the chat?'],
  ['¿Cómo se dice … en español?', 'How do you say … in Spanish?'],
  ['¿Qué significa …?', 'What does … mean?'],
  ['¿Se puede decir …?', 'Can you say …?'],
  ['¿Suena natural?', 'Does it sound natural?'],
  ['¿Cómo lo dirías tú?', 'How would you say it?'],
  ['¿Cuál es la diferencia entre … y …?', 'What is the difference between … and …?'],
  ['¿Es masculino o femenino?', 'Is it masculine or feminine?'],
  ['¿Cómo se pronuncia esta palabra?', 'How is this word pronounced?'],
  ['Más despacio, por favor.', 'Slower, please.'],
  ['¿Lo puedes repetir?', 'Can you repeat it?'],
  ['Perdona, no lo he entendido.', 'Sorry, I didn’t understand.'],
];

function Section({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="card" open={open}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 17 }}>{title}</summary>
      <div className="prose" style={{ marginTop: 12 }}>{children}</div>
    </details>
  );
}

export function Guide() {
  const s = useStore();
  const g = s.settings.gender;
  return (
    <div className="stack">
      <TopBar title="The method" back="#/study" />
      <p className="muted" style={{ margin: 0 }}>
        How to follow <i>Fluent Forever</i> with this app, phase by phase. The daily plan already does the scheduling. This page covers
        how to do each part well.
      </p>

      <Section title="Your first months, roughly" open>
        <p>At about an hour a day, starting with some basics:</p>
        <p>
          <b>Weeks 1–2:</b> three sounds a day plus a minimal-pair drill, and about 9 new base words a day.<br />
          <b>Weeks 3–8:</b> about 15 base words a day until the list is done. Grammar sentences join after {s.settings.grammarStartAt} words.<br />
          <b>Months 3–5:</b> grammar sentences, a few lines of writing most days, and tutor lessons twice a week.<br />
          <b>Then:</b> vocabulary with Spanish definitions, more conversation, TV and books.
        </p>
        <p>Reviews grow as your deck grows. On heavy days the plan gives you fewer new cards, so you stay near your time budget.</p>
      </Section>

      <Section title="Flashcard habits that matter">
        <p><b>Every day, even five minutes.</b> Spaced repetition only works if you show up; skipped days pile up.</p>
        <p><b>Say the answer out loud before you reveal it</b>, gender included: “la llave”, not just “llave”.</p>
        <p><b>Grade honestly.</b> Again if you didn’t get it within a few seconds or got the gender wrong. Hard if you got it with effort. Good if you got it right. Easy only if it was instant.</p>
        <p><b>Forgetting a card again and again?</b> Don’t grind it. Make the card better: a more striking picture, a stronger personal memory, or a more vivid gender image. The app flags these.</p>
        <p><b>New cards are the dial.</b> If reviews take too long, make fewer new cards for a few days, but keep reviewing.</p>
      </Section>

      <Section title="Pronunciation (phase 1)">
        <p>Do the minimal-pair drills until you score 90% or more. The goal is hearing the difference: pero/perro, caro/carro, casa/caza. Your mouth catches up faster once your ears can tell the sounds apart.</p>
        <p>For each sound, read how it’s made, then <b>record yourself</b> and compare with the native recording. In Spain, watch for the trilled rr, the tap r, the θ of c/z, the strong j, and vowels that never turn into “uh”.</p>
        <p>Ask your tutor to listen to you read a minimal-pair list and correct you.</p>
      </Section>

      <Section title="Base words (phase 2)">
        <p><b>Pictures:</b> choose an image that’s vivid, specific and a little surprising — one you’d remember. Search in Spanish (the word itself) to see what Spaniards picture: “desayuno” shows a Spanish breakfast, not an American one. Verbs need an action and adjectives need a quality you can see.</p>
        <p><b>The gender trick:</b> every masculine noun <b style={{ color: g.m.color }}>{g.m.action}</b> and every feminine noun <b style={{ color: g.f.color }}>{g.f.action}</b>. Picture it with sound and smell for a second or two. You don’t need it for people (el niño, la niña). For exceptions like el agua and la mano, it matters most.</p>
        <p><b>Personal connection:</b> one quick, specific memory — your grandmother’s dog, the beach in Cádiz. It takes ten seconds and doubles how well it sticks.</p>
        <p><b>Words you already know</b> still get cards, for the sound, the gender and the picture. Press Easy if they’re instant.</p>
      </Section>

      <Section title="Grammar through sentences (phase 3)">
        <p>Work through the topics in order. Read the short explanation, then make cards from the example sentences. Each blank is something new for you: a new word, a new form (comí, comía) or a new word order. Use at most three blanks per sentence. Blank what you’re learning, not every word.</p>
        <p>If you have a grammar book (<i>Gramática de uso del español</i> is written for Spain), add its example sentences with “Add your own sentence”.</p>
        <p>Start writing as soon as grammar starts: three to five sentences on the daily prompt, using what you just learned.</p>
      </Section>

      <Section title="Vocabulary expansion (phase 4)">
        <p>Now you learn words through Spanish itself: a simple definition plus an example. If a definition is confusing, read the example twice before you look at the English.</p>
        <p>Words you meet with tutors, on TV and in books go into the inbox, and then become cards. RAE (dle.rae.es) is the monolingual dictionary to use.</p>
      </Section>

      <Section title="Tutors, exchanges and corrections">
        <p><b>Early on</b> (sounds and base words): read your words aloud and have the tutor fix your pronunciation. Describe pictures with the words you know.</p>
        <p><b>From the grammar phase:</b> bring your journal entries. Talk about what you wrote, and ask the tutor to write down every correction. Afterwards, paste the corrections into Writing and turn them into cards. This is the most valuable card-making you’ll do.</p>
        <p><b>Exchanges</b> (Tandem, HelloTalk) are free practice: half the time in Spanish, half in English.</p>
        <p><b>Between lessons,</b> post your writing to HiNative or LangCorrect, or use the AI helper.</p>
        <div className="stack tight" style={{ marginTop: 6 }}>
          <b>Phrases for your tutor</b>
          {TUTOR_PHRASES.map(([es, en]) => (
            <div key={es} className="row">
              <AudioButton text={es.replace(/…/g, '')} sentence size="mini" />
              <div className="grow"><div className="serif" style={{ fontSize: 17 }}>{es}</div><div className="faint small">{en}</div></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Listening, watching and reading">
        <p>Early on, learner podcasts are ear training. Listen for the sounds you’ve drilled, not for meaning.</p>
        <p>Watch TV with <b>Spanish</b> subtitles, never English. RTVE Play is free and Spanish-made.</p>
        <p>Read a book you already know in translation, ideally with its audiobook. <i>Harry Potter y la piedra filosofal</i> is the classic choice.</p>
      </Section>

      <Section title="On your iPhone">
        <p>Open the app in Safari, then tap Share → Add to Home Screen. It works offline.</p>
        <p>Install a Spanish (Spain) voice: Settings → Accessibility → Spoken Content → Voices → Spanish (Spain). Allow the microphone to record yourself.</p>
        <p>Set up sync in Settings so your phone and computer share progress. You can also add a daily reminder to your calendar there.</p>
      </Section>
    </div>
  );
}
