// Spanish (Spain) sound system, taught the Fluent Forever way:
// ear training with minimal pairs, then each sound with its spellings,
// then stress. Standard peninsular Castilian with "distinción".
import type { SoundLesson, MinimalPairSet } from '../types';

export const sounds: SoundLesson[] = [
  // ───────────────────────────── Vowels ─────────────────────────────
  {
    id: 'vowel-a',
    order: 1,
    title: 'The vowel A',
    ipa: '[a]',
    spellings: ['a', 'á'],
    english:
      "Like the 'a' in 'father', but shorter and a little more central, halfway toward the 'u' in 'cut'. Never the 'a' of 'cat' or 'cake', and never the weak 'uh' (schwa) of 'about' or 'sofa'.",
    howTo:
      "Drop your jaw, keep the tongue low and flat in the middle of the mouth, lips relaxed and neutral. Keep it short and steady: the sound must not change from beginning to end. Every A in a word sounds the same, stressed or not: Spanish has no schwa. Practice: say 'casa', 'mañana', 'Panamá' and make all the A's identical, like a metronome: ta-ta-ta. Then 'nada', 'mapa', 'agua'.",
    pitfalls:
      "Reducing unstressed A's to 'uh': 'KAH-suh' for casa, 'mun-YAH-nuh' for mañana. This is the single biggest giveaway of an English accent. Also avoid the flat 'a' of 'cat' and the 'ey' glide of 'day'.",
    examples: [
      { word: 'casa', mark: 'a' },
      { word: 'agua', mark: 'a' },
      { word: 'mañana', mark: 'a' },
      { word: 'gato', mark: 'a' },
      { word: 'padre', mark: 'a' },
      { word: 'mapa', mark: 'a' },
      { word: 'nada', mark: 'a' },
      { word: 'papá', mark: 'á' },
    ],
  },
  {
    id: 'vowel-e',
    order: 2,
    title: 'The vowel E',
    ipa: '[e]',
    spellings: ['e', 'é'],
    english:
      "Between the 'e' of 'bed' and the 'ay' of 'day', but with no 'y' glide at the end: imagine the 'ay' of 'day' cut off before your tongue starts to rise.",
    howTo:
      "Lips slightly spread, tongue mid-high and forward. Hold it steady: say a long 'eeeh' and make sure your tongue doesn't rise into 'ee' at the end. Before a consonant in the same syllable ('verde', 'papel') it may be a touch more open, like 'bed', but Spaniards hear it as the same sound. Every written E is pronounced, including at the end of a word: 'nombre' is NOM-bre, 'leche' is LE-che. Practice: 'mesa – leche – verde – café – bebé', every E pure and equal.",
    pitfalls:
      "Saying 'café' as 'ca-FAY' with an 'ee' glide. Dropping or swallowing final -e as in English 'come' or 'name' ('nom-br' for nombre). Reducing unstressed E's to schwa ('LE-chuh').",
    examples: [
      { word: 'mesa', mark: 'e' },
      { word: 'leche', mark: 'e' },
      { word: 'verde', mark: 'e' },
      { word: 'café', mark: 'é' },
      { word: 'tres', mark: 'e' },
      { word: 'nombre', mark: 'e' },
      { word: 'noche', mark: 'e' },
      { word: 'pez', mark: 'e' },
    ],
  },
  {
    id: 'vowel-i',
    order: 3,
    title: 'The vowel I',
    ipa: '[i]',
    spellings: ['i', 'í', "y when it stands alone (the word 'y', 'and')"],
    english:
      "Like the 'ee' in 'see', but shorter and tenser, with no glide. Never the relaxed short 'i' of 'sit' or 'bit'.",
    howTo:
      "Spread your lips as in a smile, tongue high and forward, close to the roof of the mouth. Keep it short and tense in every position: Spanish has no 'sit' vowel, so the I of 'libro' and 'mil' is the same as in 'sí'. Practice: compare English 'listen' with Spanish 'lista': the Spanish one is 'LEES-ta'. Then 'sí – vino – libro – hijo – amigo – difícil'.",
    pitfalls:
      "Using the lax 'i' of 'bit' before consonants or in unstressed syllables ('LIB-ro', 'dif-IS-il'). Adding a 'y' glide at the end ('see-y').",
    examples: [
      { word: 'sí', mark: 'í' },
      { word: 'vino', mark: 'i' },
      { word: 'libro', mark: 'i' },
      { word: 'hijo', mark: 'i' },
      { word: 'mil', mark: 'i' },
      { word: 'amigo', mark: 'i' },
      { word: 'aquí', mark: 'í' },
      { word: 'difícil', mark: 'í' },
    ],
  },
  {
    id: 'vowel-o',
    order: 4,
    title: 'The vowel O',
    ipa: '[o]',
    spellings: ['o', 'ó'],
    english:
      "Like the 'o' in 'go' without the 'w' glide at the end: a pure, short 'oh'. Never the 'ah' of American 'hot' or the 'aw' of 'law'.",
    howTo:
      "Round your lips and keep them rounded and still for the whole vowel; tongue mid-high and back. In English 'no' your lips close further into 'oo' at the end ('noʊ'); in Spanish they stay put. Practice in a mirror: 'no, no, no', and your lips should not move during the vowel. Then 'todo – ojo – poco – ocho – adiós'.",
    pitfalls:
      "Gliding into 'oh-oo' ('noʊ' for no, 'KOH-moʊ' for como). Unrounding unstressed O's into schwa ('TOH-duh'). Using American 'ah' in words like 'doctor' or 'chocolate'.",
    examples: [
      { word: 'no', mark: 'o' },
      { word: 'ojo', mark: 'o' },
      { word: 'todo', mark: 'o' },
      { word: 'poco', mark: 'o' },
      { word: 'sol', mark: 'o' },
      { word: 'foto', mark: 'o' },
      { word: 'ocho', mark: 'o' },
      { word: 'adiós', mark: 'ó' },
    ],
  },
  {
    id: 'vowel-u',
    order: 5,
    title: 'The vowel U',
    ipa: '[u]',
    spellings: ['u', 'ú', 'ü (in güe, güi)', 'silent in que, qui, gue, gui'],
    english:
      "Like the 'oo' in 'food', but shorter and with tightly rounded lips. Never the 'u' of 'cut', the 'oo' of 'book', or the 'yoo' of 'cute' and 'music'.",
    howTo:
      "Round and push your lips forward, more than in English, tongue high and back. Keep it short and steady. Watch the spelling: in 'que, qui, gue, gui' the U is silent, just a spelling device ('queso' is KE-so, 'guitarra' is gui-TA-rra). With two dots (ü) it is pronounced: 'pingüino', 'vergüenza'. Practice: 'uno – luna – mucho – música – azúcar – fruta'.",
    pitfalls:
      "Adding a 'y' before it as English does ('MYOO-si-ca' for música; it's MU-si-ca). Relaxing it to schwa when unstressed. Pronouncing the silent U in 'queso' or 'guitarra' ('KWAY-so').",
    examples: [
      { word: 'uno', mark: 'u' },
      { word: 'luna', mark: 'u' },
      { word: 'mucho', mark: 'u' },
      { word: 'música', mark: 'ú' },
      { word: 'tú', mark: 'ú' },
      { word: 'azúcar', mark: 'ú' },
      { word: 'fruta', mark: 'u' },
      { word: 'uva', mark: 'u' },
    ],
  },

  // ─────────────────────── Diphthongs and hiatus ───────────────────────
  {
    id: 'diphthongs-rising',
    order: 6,
    title: 'Diphthongs with i and u first',
    ipa: '[ja] [je] [jo] [ju] [wa] [we] [wi] [wo]',
    spellings: ['ia', 'ie', 'io', 'iu', 'ua', 'ue', 'ui', 'uo'],
    english:
      "An unstressed i or u before another vowel becomes a quick 'y' or 'w' glide, like English 'yes' and 'wet': 'ie' sounds like the 'ye' of 'yes', 'ue' like the 'we' of 'wet', 'ua' like the 'wa' of 'water'.",
    howTo:
      "Both vowels share one syllable: glide quickly through the i or u and land on the other vowel, which keeps its pure Spanish sound. 'bien' is ONE syllable, [bjen], not 'bee-en'; 'bueno' is two, BWE-no. In 'iu' and 'ui' the second vowel usually carries the weight: 'ciudad' [θjuˈðað], 'cuidado' [kwiˈða.ðo]. Many verbs switch between a plain vowel and a diphthong when the stress moves: poder → puedo, querer → quiero, tener → tiene. Practice: 'bien – tiene – siete – cielo', then 'bueno – nueve – puerta – fuego', then 'agua – cuatro – ciudad – cuidado'.",
    pitfalls:
      "Splitting the diphthong into two syllables ('bee-EN', 'boo-EH-no'). Turning the E of 'ie' and 'ue' into English 'ay' ('bee-AYN'). Missing that the vowel changed: 'tengo' but 'tienes', 'puedo' but 'podemos'.",
    examples: [
      { word: 'bien', mark: 'ie' },
      { word: 'cielo', mark: 'ie' },
      { word: 'siete', mark: 'ie' },
      { word: 'bueno', mark: 'ue' },
      { word: 'nueve', mark: 'ue' },
      { word: 'agua', mark: 'ua' },
      { word: 'cuatro', mark: 'ua' },
      { word: 'radio', mark: 'io' },
      { word: 'ciudad', mark: 'iu' },
      { word: 'cuidado', mark: 'ui' },
    ],
  },
  {
    id: 'diphthongs-falling',
    order: 7,
    title: 'Diphthongs with i and u last',
    ipa: '[ai̯] [ei̯] [oi̯] [au̯] [eu̯]',
    spellings: ['ai / ay', 'ei / ey', 'oi / oy', 'au', 'eu'],
    english:
      "A full vowel that slides into a short i or u: 'ai' like 'eye', 'ei' like the 'ay' of 'day', 'oi' like 'boy', 'au' like the 'ow' of 'cow'. 'eu' has no English equivalent: a Spanish E then a quick 'oo', in one syllable.",
    howTo:
      "Start on the full, pure vowel and finish with a short, quick i or u, all in one syllable. At the end of a word the i is spelled y: 'hay', 'rey', 'hoy' (see the next lesson). 'ei' is the one place where Spanish really has the glide of English 'day': 'seis' has it, 'sé' does not. Practice in groups: 'aire – baile', 'seis – peine', 'oigo – boina', 'auto – causa', 'euro – deuda'.",
    pitfalls:
      "Turning 'eu' into English 'you': 'Europa' is eu-RO-pa, starting with Spanish E, not 'yoo-RO-pa'. Splitting 'au' or 'ai' into two syllables. Forgetting the glide in 'seis' (it's not 'sés'), while wrongly adding it to plain E and O everywhere else.",
    examples: [
      { word: 'aire', mark: 'ai' },
      { word: 'baile', mark: 'ai' },
      { word: 'seis', mark: 'ei' },
      { word: 'peine', mark: 'ei' },
      { word: 'oigo', mark: 'oi' },
      { word: 'auto', mark: 'au' },
      { word: 'causa', mark: 'au' },
      { word: 'euro', mark: 'eu' },
      { word: 'deuda', mark: 'eu' },
    ],
  },
  {
    id: 'y-vowel',
    order: 8,
    title: 'Y as a vowel',
    ipa: '[i] [i̯]',
    spellings: ["y alone (the word 'y', 'and')", 'y at the end of a word: -ay, -ey, -oy, -uy'],
    english:
      "When y stands alone or ends a word it is a vowel: 'y' sounds like 'ee', 'hay' like 'eye', 'rey' like 'ray', 'hoy' rhymes with 'boy'.",
    howTo:
      "Treat word-final y exactly like the i of a diphthong: a short glide after the main vowel, in the same syllable, with no buzz. 'muy' is one syllable, [mui̯]: a U that slides into a short i, like 'moo-ee' squeezed into one beat; in fast speech many people say it closer to [mwi], like English 'we' with an m in front. As soon as a vowel follows, y becomes a consonant again (see 'LL and Y'): 'rey' → 'reyes', 'ley' → 'leyes', 'hoy' but 'yo'. The word 'y' links to its neighbours ('tú y yo' is almost 'tuiyo'), and becomes 'e' before a word starting with an i sound: 'padre e hijo'. Practice: 'hay – rey – hoy – muy', then 'voy – soy – estoy – doy'.",
    pitfalls:
      "Pronouncing final y as a buzzing consonant. Saying 'muy' in two syllables ('MOO-ee'). Pronouncing 'hay' with the H.",
    examples: [
      { word: 'y', mark: 'y' },
      { word: 'hay', mark: 'y' },
      { word: 'rey', mark: 'y' },
      { word: 'ley', mark: 'y' },
      { word: 'hoy', mark: 'y' },
      { word: 'voy', mark: 'y' },
      { word: 'soy', mark: 'y' },
      { word: 'estoy', mark: 'y' },
      { word: 'muy', mark: 'y' },
    ],
  },

  // ─────────────────────────── Stress ───────────────────────────
  {
    id: 'stress',
    order: 9,
    title: 'Stress and the written accent',
    ipa: '[ˈ]',
    spellings: [
      'á é í ó ú: a written accent marks the stressed vowel',
      'no accent, ending in a vowel, -n or -s: stress the second-to-last syllable',
      'no accent, ending in any other consonant: stress the last syllable',
    ],
    english:
      "As in English, each word has one stressed syllable and moving it can change the word (like 'REcord' vs 'reCORD'). Unlike English, the spelling always tells you where it is. And Spanish stress is louder and higher, not much longer, and it never turns the other vowels into 'uh'.",
    howTo:
      "Three rules cover every word. (1) A written accent wins: stress that vowel ('café', 'música', 'árbol'). (2) No accent and the word ends in a vowel, n or s: stress the second-to-last syllable ('CA-sa', 'HA-blan', 'za-PA-tos'). (3) No accent and it ends in any other consonant: stress the last syllable ('ha-BLAR', 'ciu-DAD', 'es-pa-ÑOL', 're-LOJ'). The accent is written exactly when a word breaks rules 2 and 3: 'can-CIÓN', 'ÁR-bol', 'te-LÉ-fo-no'. Stress changes meaning: 'papa' (potato; el Papa = the Pope) vs 'papá' (dad); 'término' (end) vs 'termino' (I finish) vs 'terminó' (he/she finished). On one-syllable words the accent only separates look-alikes: 'el' (the) / 'él' (he), 'tu' (your) / 'tú' (you), 'si' (if) / 'sí' (yes), 'mas' (but) / 'más' (more). Practice: tap the table on the stressed syllable as you read: te-LÉ-fo-no, ha-BLAR, CA-sa, MÚ-si-ca.",
    pitfalls:
      "Carrying English stress over to cognates: 'chocolate' is cho-co-LA-te, 'animal' is a-ni-MAL, 'doctor' is doc-TOR, 'hospital' is hos-pi-TAL. Ignoring written accents: 'hablo' (I speak) and 'habló' (she spoke) are different words. Stretching the stressed vowel and mumbling the rest: keep every vowel full.",
    examples: [
      { word: 'casa', mark: 'ca' },
      { word: 'zapato', mark: 'pa' },
      { word: 'examen', mark: 'xa' },
      { word: 'hablar', mark: 'blar' },
      { word: 'ciudad', mark: 'dad' },
      { word: 'papá', mark: 'pá' },
      { word: 'café', mark: 'fé' },
      { word: 'teléfono', mark: 'lé' },
      { word: 'música', mark: 'mú' },
      { word: 'árbol', mark: 'ár' },
    ],
  },
  {
    id: 'hiatus',
    order: 10,
    title: 'Hiatus: when the accent breaks a diphthong',
    ipa: '[ˈi.a] [aˈi] [ˈi.o] [ˈe.a]',
    spellings: [
      'í or ú next to another vowel: día, país, río, baúl',
      'two of a, e, o side by side: leer, idea, museo',
    ],
    english:
      "Two vowels in a row that stay in separate syllables, like the 'e-a' in English 'idea'. 'día' sounds like 'DEE-ah', not 'dya'.",
    howTo:
      "Spanish splits vowels into strong (a, e, o) and weak (i, u). (1) Two strong vowels never make a diphthong: each gets its own syllable: 'le-er', 'i-de-a', 'mu-se-o', 'po-e-ta'. (2) A weak vowel next to another vowel normally glides into a diphthong ('Dios', 'bien', 'aire'). A written accent on the i or u cancels that: it becomes a full, stressed vowel in its own syllable: 'DÍ-a', 'pa-ÍS', 'RÍ-o', 'ba-ÚL', 'o-Í-do'. So the accent changes the word: 'hacia' (towards, HA-cia, two syllables) vs 'hacía' (he used to do, ha-CÍ-a, three); 'continuo' (continuous) vs 'continúo' (I continue). In fast casual speech Spaniards may squeeze strong vowels together ('teatro' almost 'TYA-tro'), but learn the careful form first. Practice: clap the syllables: dí-a (2), pa-ís (2), tí-a (2), ha-cí-a (3), Ma-rí-a (3), le-er (2).",
    pitfalls:
      "Ignoring the accent and saying 'dya' for día. Making 'país' one syllable like English 'pies'. Merging 'leer' into one long E: say both.",
    examples: [
      { word: 'día', mark: 'ía' },
      { word: 'país', mark: 'aí' },
      { word: 'río', mark: 'ío' },
      { word: 'tía', mark: 'ía' },
      { word: 'frío', mark: 'ío' },
      { word: 'baúl', mark: 'aú' },
      { word: 'María', mark: 'ía' },
      { word: 'leer', mark: 'ee' },
      { word: 'idea', mark: 'ea' },
      { word: 'museo', mark: 'eo' },
    ],
  },

  // ─────────────────────────── Consonants ───────────────────────────
  {
    id: 'unaspirated-p',
    order: 11,
    title: 'P without a puff of air',
    ipa: '[p]',
    spellings: ['p'],
    english:
      "Like the 'p' in 'spin', not the 'p' in 'pin'. English adds a puff of air (aspiration) to p at the start of a stressed syllable; Spanish never does.",
    howTo:
      "Close your lips and release them gently, with no burst of air: the vowel starts immediately. Test with a sheet of paper or your palm in front of your mouth. English 'pin' makes it move; 'spin' barely does. Spanish 'pan', 'pero', 'papá' should all be like 'spin'. Trick: think an 's' before the word ('(s)pan'), then drop the s. Because there's no puff, Spanish p can sound a bit like b to English ears; that's normal (see the b vs p pairs). Practice: 'pan – pero – padre – pie – playa – puerta – sopa'.",
    pitfalls:
      "Aspirating ('p-hero' for pero). You'll be understood, but it's one of the clearest signs of an English accent.",
    examples: [
      { word: 'pan', mark: 'p' },
      { word: 'pero', mark: 'p' },
      { word: 'padre', mark: 'p' },
      { word: 'perro', mark: 'p' },
      { word: 'pie', mark: 'p' },
      { word: 'playa', mark: 'p' },
      { word: 'puerta', mark: 'p' },
      { word: 'plato', mark: 'p' },
      { word: 'sopa', mark: 'p' },
    ],
  },
  {
    id: 'dental-t',
    order: 12,
    title: 'Dental T',
    ipa: '[t̪]',
    spellings: ['t'],
    english:
      "Like the 't' in 'stop', but with the tongue on the back of the upper front teeth instead of the ridge behind them. No puff of air, and never the soft 'flap' of American 'water' or 'butter'.",
    howTo:
      "Put the tip of your tongue against the back of your upper front teeth (English t is made further back, on the gum ridge) and release it without aspiration; use the paper test from the P lesson. It stays a crisp T between vowels: 'gato' is never 'GA-do' (that American flap is what Spanish hears as an R: 'ga-ro'). 'tr' is T plus a tapped R, never the 'chr' of English 'tree'. Practice: 'tú – té – tres – tomate – gato – patata – cuatro'.",
    pitfalls:
      "Aspirating ('t-hengo'). Flapping T between vowels ('pa-TA-da' for patata). Turning 'tr' into 'chr' ('chres' for tres). Placing the tongue too far back.",
    examples: [
      { word: 'tú', mark: 't' },
      { word: 'té', mark: 't' },
      { word: 'tres', mark: 't' },
      { word: 'tomate', mark: 't' },
      { word: 'gato', mark: 't' },
      { word: 'patata', mark: 't' },
      { word: 'fruta', mark: 't' },
      { word: 'tarde', mark: 't' },
      { word: 'cuatro', mark: 't' },
    ],
  },
  {
    id: 'k',
    order: 13,
    title: 'The K sound: c, qu, k',
    ipa: '[k]',
    spellings: [
      'c before a, o, u or a consonant: casa, cosa, cuna, clase',
      'qu before e, i (the u is silent): queso, aquí',
      'k in a few foreign words: kilo, kiwi',
      'the first c of cc: acción, lección',
    ],
    english: "Like the 'k' in 'skin', not 'kin': no puff of air.",
    howTo:
      "Back of the tongue against the soft palate, released without aspiration (paper test again). The sound is easy; the spelling is the lesson. Write 'c' before a, o, u (casa, cosa, cuna) but 'qu' before e and i (queso, quince, aquí), because 'ce' and 'ci' spell a different sound (the Castilian [θ]). The U in 'que, qui' is silent: 'queso' is KE-so. To spell a real 'kwe' sound you write 'cue': 'cuerpo', 'escuela'. Practice: 'casa – cosa – cuchara – queso – quiero – aquí – poco'.",
    pitfalls:
      "Pronouncing the U in 'qu' ('KWIE-ro' for quiero). Aspirating. Misspelling: 'kasa' or 'qasa' instead of 'casa', 'keso' or 'ceso' instead of 'queso'.",
    examples: [
      { word: 'casa', mark: 'c' },
      { word: 'cosa', mark: 'c' },
      { word: 'cuchara', mark: 'c' },
      { word: 'clase', mark: 'c' },
      { word: 'queso', mark: 'qu' },
      { word: 'quince', mark: 'qu' },
      { word: 'aquí', mark: 'qu' },
      { word: 'kilo', mark: 'k' },
      { word: 'poco', mark: 'c' },
    ],
  },
  {
    id: 'b-v',
    order: 14,
    title: 'B and V: one sound, two flavours',
    ipa: '[b] [β]',
    spellings: [
      'b and v (pronounced exactly the same)',
      'hard [b] after a pause and after m or n',
      'soft [β] everywhere else',
    ],
    english:
      "B and V are the same sound in Spanish; there is no English 'v' with the teeth on the lip. After a pause or after m/n it's a normal 'b'. Everywhere else it's a soft, lazy 'b' where the lips almost touch but let air buzz through.",
    howTo:
      "Hard [b]: lips close fully, voiced. Used at the start of a phrase and after m or n: 'Bien.', 'Vale.', 'hombre', 'invierno' (n becomes m: [imˈbjer.no]), 'un vaso' [um ˈba.so]. Soft [β]: everywhere else, including between words, bring the lips close together but don't close them, and let the voiced air flow: 'lobo' [ˈlo.βo], 'uva', 'abuelo', 'la vaca', 'el vino' (unlike d, b is soft after l). Practice: 'vino' (hard, after a pause) vs 'el vino' (soft); then 'baba' with a lazy second b: [ˈba.βa]. Natives won't misunderstand a hard b everywhere, but the soft one makes you sound far more natural. Spelling: memorize whether a word has b or v; Spaniards themselves mix them up.",
    pitfalls:
      "Using the English v (teeth on the lower lip) for written v. Using a full, stopped English b between vowels ('a-BUE-lo' with a pop). Trying to hear a difference that doesn't exist: 'tubo' (tube) and 'tuvo' (he had) sound identical.",
    examples: [
      { word: 'bien', mark: 'b' },
      { word: 'vino', mark: 'v' },
      { word: 'boca', mark: 'b' },
      { word: 'hombre', mark: 'b' },
      { word: 'lobo', mark: 'b' },
      { word: 'uva', mark: 'v' },
      { word: 'abuelo', mark: 'b' },
      { word: 'llave', mark: 'v' },
      { word: 'avión', mark: 'v' },
    ],
  },
  {
    id: 'd',
    order: 15,
    title: 'D: dental [d] and soft [ð]',
    ipa: '[d̪] [ð]',
    spellings: [
      'd after a pause or after n, l: hard [d̪]',
      'd everywhere else, including between vowels: soft [ð]',
      'final -d (Madrid, verdad): very soft, often [θ] or silent in Spain',
    ],
    english:
      "Hard d is like English 'd' but with the tongue on the teeth. Soft d is like the 'th' of 'this' or 'then', only gentler: the tongue barely touches the teeth.",
    howTo:
      "Hard [d̪]: tongue tip against the back of the upper front teeth, voiced; at the start of a phrase and after n or l: 'dos', 'donde', 'cuando', 'falda'. Soft [ð]: everywhere else, between vowels, after r or s, and across words: 'nada', 'todo', 'cada', 'padre', 'verde', 'la doctora'. Rest the tip lightly behind or between the teeth and let voiced air through. In casual Spain Spanish the -ado ending weakens further ('cansado' → 'cansao'). Final -d is very weak: a faint [ð], devoiced to [θ] by many Madrileños ('Madriz', 'verdaz') or dropped ('verdá', 'usté'). Aim for a short, soft [ð]. Practice: 'dedo' (first d hard, second soft), then 'dado – todo – nada – verdad – Madrid'.",
    pitfalls:
      "A hard English d between vowels ('NA-da' with a stop) sounds wooden. Worse is the American flap, which Spanish ears hear as R: 'cada' becomes 'cara' (face), 'todo' becomes 'toro' (bull). Pronouncing final -d as a strong English D ('ma-DREED').",
    examples: [
      { word: 'dos', mark: 'd' },
      { word: 'donde', mark: 'd' },
      { word: 'nada', mark: 'd' },
      { word: 'todo', mark: 'd' },
      { word: 'cada', mark: 'd' },
      { word: 'verde', mark: 'd' },
      { word: 'verdad', mark: 'd' },
      { word: 'Madrid', mark: 'd' },
      { word: 'usted', mark: 'd' },
    ],
  },
  {
    id: 'g',
    order: 16,
    title: 'G: hard [ɡ] and soft [ɣ]',
    ipa: '[ɡ] [ɣ]',
    spellings: [
      'g before a, o, u or a consonant: gato, gordo, gusto, grande',
      'gu before e, i (silent u): guerra, guitarra',
      'gü before e, i (spoken u): pingüino, vergüenza',
    ],
    english:
      "Hard g is the 'g' of 'go'. Soft g has no English equivalent: a 'g' where the back of the tongue doesn't quite close, so the voice keeps flowing, like a very relaxed, slightly gargled 'g'.",
    howTo:
      "Hard [ɡ]: back of the tongue fully against the soft palate, voiced; after a pause and after n: 'Gracias.', 'tengo', 'domingo', 'un gato' [uŋ ˈɡa.to]. Soft [ɣ]: everywhere else, leave a narrow gap and voice through it: 'agua', 'lago', 'amigo', 'el gato', 'la guitarra'. Spelling: 'ge' and 'gi' make a different sound (the jota, [x]), so to keep the G sound before e or i you write 'gue, gui' with a silent u: 'guerra', 'guitarra', 'Miguel'. If the u must be heard, it takes two dots: 'pingüino' [piŋˈɡwi.no], 'vergüenza'. Practice: 'gato / el gato', 'tengo / lago', 'guerra – guitarra – pingüino'.",
    pitfalls:
      "Pronouncing the silent U in 'guitarra' ('gwi-TA-rra'). Reading 'gente' or 'página' with a hard G (they have the jota). Using a full, stopped G between vowels: understood, but stiff.",
    examples: [
      { word: 'gato', mark: 'g' },
      { word: 'grande', mark: 'g' },
      { word: 'tengo', mark: 'g' },
      { word: 'agua', mark: 'g' },
      { word: 'amigo', mark: 'g' },
      { word: 'lago', mark: 'g' },
      { word: 'guerra', mark: 'gu' },
      { word: 'guitarra', mark: 'gu' },
      { word: 'pingüino', mark: 'gü' },
      { word: 'vergüenza', mark: 'gü' },
    ],
  },
  {
    id: 'f',
    order: 17,
    title: 'F',
    ipa: '[f]',
    spellings: ['f'],
    english: "Exactly like English 'f'. The easy one.",
    howTo:
      "Upper teeth on the lower lip, blow, no voice. Spanish never writes 'ph': 'foto', 'teléfono', 'filosofía'. Use this lesson to set F apart from V: Spanish V is a B, never made with the teeth on the lip, so 'fino' and 'vino' are clearly different. Practice: 'foto – fuego – fácil – café – teléfono – familia'.",
    pitfalls:
      "Spelling with 'ph' out of English habit ('photo' → 'foto'). Letting it voice into an English v between vowels.",
    examples: [
      { word: 'foto', mark: 'f' },
      { word: 'fuego', mark: 'f' },
      { word: 'fácil', mark: 'f' },
      { word: 'café', mark: 'f' },
      { word: 'teléfono', mark: 'f' },
      { word: 'fruta', mark: 'f' },
      { word: 'feliz', mark: 'f' },
      { word: 'familia', mark: 'f' },
      { word: 'flor', mark: 'f' },
    ],
  },
  {
    id: 'apical-s',
    order: 18,
    title: 'The Spanish S',
    ipa: '[s̺]',
    spellings: ['s', 's before b, d, g, l, m, n: voiced [z̺] (mismo, desde)'],
    english:
      "In central and northern Spain, s is made with the very tip of the tongue, which gives a slightly darker, whistly hiss, halfway between English 's' and 'sh'. In Latin America and the Canary Islands it's just like English 's'.",
    howTo:
      "Raise the tip of your tongue toward the ridge behind the upper teeth (English s uses the blade, just behind the tip, with the tip often pointing down). The result is a hiss with a hint of 'sh'. It is always voiceless between vowels: 'casa', 'rosa', 'presidente', 'museo' all hiss, never buzz like English 'rose'. Before a voiced consonant it voices by itself: 'mismo', 'desde', 'isla', 'los dos'. Don't force the apical sound: a plain English s is perfectly acceptable, and it's what most of the Spanish-speaking world uses. Practice: 'sí – seis – casa – mesa – rosa – gracias – mismo'.",
    pitfalls:
      "Buzzing S between vowels as English does: 'rosa' as 'ROH-za', 'presidente' as 'prezidente', 'museo' as 'myoo-ZAY-oh'. Dropping final S, which carries the plural ('los gatos'). Overdoing the apical S into a full 'sh'.",
    examples: [
      { word: 'sí', mark: 's' },
      { word: 'seis', mark: 's' },
      { word: 'casa', mark: 's' },
      { word: 'mesa', mark: 's' },
      { word: 'rosa', mark: 's' },
      { word: 'gracias', mark: 's' },
      { word: 'museo', mark: 's' },
      { word: 'mismo', mark: 's' },
      { word: 'desde', mark: 's' },
    ],
  },
  {
    id: 'theta',
    order: 19,
    title: 'The Castilian Z: z and soft c',
    ipa: '[θ]',
    spellings: [
      'z before a, o, u and at the end of a word: zapato, zumo, luz',
      'c before e, i: cena, cinco',
      'the second c of cc: acción, lección',
      'z before e, i in a handful of words: zeta, zigzag',
    ],
    english:
      "Exactly the 'th' of 'think' or 'thin', never the 'th' of 'this' (that's the soft d). It isn't a lisp: it's a separate sound, so in Spain 'casa' (house) and 'caza' (hunt) are different words.",
    howTo:
      "Put the tip of the tongue between or just behind the upper front teeth and blow, without voice. Spelling: 'z' before a, o, u and at the end of a word; 'c' before e, i. Plurals switch letters but keep the sound: luz → luces, lápiz → lápices, vez → veces. In 'cc' the first c is [k] and the second [θ]: 'acción' [akˈθjon]. Seseo: in Latin America, the Canary Islands and much of Andalusia, z and soft c are pronounced [s], so 'casa' and 'caza' sound alike. That is equally correct Spanish; this course teaches standard peninsular 'distinción'. Practice: 'cero – cinco – once – doce – zapato – zumo – azúcar – luz'.",
    pitfalls:
      "Using S (fine in Latin America, but it merges words Spaniards keep apart: casa/caza, coser/cocer, cien/sien). Using the voiced 'th' of 'this'. Reading 'ce, ci' as K ('KE-na' for cena). Spelling: normal words never take 'ze, zi' ('cero', not 'zero').",
    examples: [
      { word: 'zapato', mark: 'z' },
      { word: 'cielo', mark: 'c' },
      { word: 'cinco', mark: 'c' },
      { word: 'cero', mark: 'c' },
      { word: 'zumo', mark: 'z' },
      { word: 'azúcar', mark: 'z' },
      { word: 'luz', mark: 'z' },
      { word: 'cerveza', mark: 'c' },
      { word: 'plaza', mark: 'z' },
      { word: 'gracias', mark: 'c' },
    ],
  },
  {
    id: 'jota',
    order: 20,
    title: 'The jota: j, ge, gi',
    ipa: '[x]',
    spellings: [
      'j before any vowel',
      'g before e, i: gente, página',
      'x in a few place names: México, Texas',
    ],
    english:
      "No English equivalent. Like the 'ch' in Scottish 'loch' or German 'Bach': a raspy H made at the back of the mouth. In Spain it is strong, often scraping right back at the uvula; in Latin America and southern Spain it's softer, closer to English 'h'.",
    howTo:
      "Raise the back of the tongue toward the soft palate as for K, but don't close it: leave a narrow gap and push air through, without voice, so it rasps. Two ways in: start from an English 'h' and make it scrape, or start from a 'k' and let the air leak out. Before a, o, u many Spaniards make it even further back, almost a gargle [χ]. Spelling: j works before any vowel (jamón, jefe, jirafa, joven, jugar); g gives the same sound only before e and i (gente, girasol, página). At the end of a word ('reloj') the j is barely heard. Practice: 'ajo – hijo – ojo – jamón – jugar – gente – mujer'.",
    pitfalls:
      "Using the English J of 'jam' ('JAM-on' for jamón). Reading 'gente' with a hard G or an English J. Using a weak English H: understood, but it sounds soft and un-Castilian.",
    examples: [
      { word: 'jamón', mark: 'j' },
      { word: 'ajo', mark: 'j' },
      { word: 'hijo', mark: 'j' },
      { word: 'ojo', mark: 'j' },
      { word: 'jugar', mark: 'j' },
      { word: 'jirafa', mark: 'j' },
      { word: 'mujer', mark: 'j' },
      { word: 'gente', mark: 'g' },
      { word: 'página', mark: 'g' },
      { word: 'reloj', mark: 'j' },
    ],
  },
  {
    id: 'ch',
    order: 21,
    title: 'CH',
    ipa: '[tʃ]',
    spellings: ['ch'],
    english:
      "Like the 'ch' in 'church' or 'cheese'. In parts of Andalusia it softens to 'sh', but in standard Castilian it's the full 'ch'.",
    howTo:
      "Make the English 'ch', with the lips a little less pushed out than in English. CH is a single sound (it used to be a separate letter of the alphabet), so 'coche' splits as 'co-che'. It is never K (as in 'chorus') and never 'sh' (as in 'chef'), whatever the word looks like. Practice: 'chico – leche – noche – ocho – mucho – coche – chocolate'.",
    pitfalls:
      "Reading CH as 'sh' in French-looking words ('chaqueta', 'champú', 'chocolate' all start with a real 'ch'). Reading it as K in Greek-looking words.",
    examples: [
      { word: 'chico', mark: 'ch' },
      { word: 'leche', mark: 'ch' },
      { word: 'noche', mark: 'ch' },
      { word: 'ocho', mark: 'ch' },
      { word: 'mucho', mark: 'ch' },
      { word: 'coche', mark: 'ch' },
      { word: 'chocolate', mark: 'ch' },
      { word: 'cuchara', mark: 'ch' },
      { word: 'chaqueta', mark: 'ch' },
    ],
  },
  {
    id: 'll-y',
    order: 22,
    title: 'LL and Y',
    ipa: '[ʝ]',
    spellings: ['ll', 'y before a vowel', 'hie- at the start of a word: hielo, hierba'],
    english:
      "Like the 'y' of 'yes', but with the tongue pressed closer to the roof of the mouth so there's a slight buzz, a little toward the 's' of 'measure' or the 'j' of 'jam'. Not the 'l' sound of English 'million'.",
    howTo:
      "Press the middle of your tongue up against the hard palate, closer than for English y, and voice through the narrow gap: a buzzing 'y'. After a pause, or after n or l, it often hardens into something close to English 'j': 'yo', 'un yate', 'el yeso'. Yeísmo: for nearly all Spaniards (and Latin Americans), ll and y are the same sound, so 'pollo' (chicken) sounds exactly like 'poyo' (stone bench). A separate ll sound (like the 'lli' of 'million') survives only among some older and rural speakers in the north, so you don't need it. You still memorize the spelling: 'llave', 'calle', but 'mayo', 'playa'. Practice: 'yo – llave – calle – pollo – playa – mayo – lluvia – desayuno'.",
    pitfalls:
      "Reading LL as an English L ('POL-lo' for pollo, 'CAL-le' for calle). Making it so weak that 'mayo' sounds like 'mao'. Being surprised by a 'jo' for 'yo' from emphatic speakers: same word.",
    examples: [
      { word: 'llave', mark: 'll' },
      { word: 'calle', mark: 'll' },
      { word: 'pollo', mark: 'll' },
      { word: 'lluvia', mark: 'll' },
      { word: 'silla', mark: 'll' },
      { word: 'yo', mark: 'y' },
      { word: 'playa', mark: 'y' },
      { word: 'mayo', mark: 'y' },
      { word: 'desayuno', mark: 'y' },
      { word: 'hierba', mark: 'hi' },
    ],
  },
  {
    id: 'silent-h',
    order: 23,
    title: 'Silent H',
    ipa: '∅',
    spellings: [
      'h: always silent',
      'ch is a separate sound, [tʃ]',
      'hie- sounds like "ye": hielo',
      'hue- sounds like "we", often "gwe": huevo',
    ],
    english: "Never pronounced, like the 'h' of 'hour' or 'honest', every single time.",
    howTo:
      "Just skip it: 'hola' = 'ola', 'hay' = 'ay', 'ahora' = 'a-O-ra', 'hacer' = 'a-CER', 'hombre' = 'OM-bre'. A silent h between vowels doesn't separate them: 'búho' is BU-o. What looks like exceptions are really about the next letters: 'ch' is its own sound; 'hie-' sounds like 'ye' ('hielo' [ˈʝe.lo], 'hierba'); 'hue-' sounds like 'we', often with a light g in front ('huevo' [ˈwe.βo] or [ˈɡwe.βo], 'hueso'). A few English loanwords ('hámster', 'hobby') are said with a jota. Practice: 'hola – hay – hombre – hijo – ahora – hacer – huevo – hielo'.",
    pitfalls:
      "Pronouncing the H with English breath ('HO-la'): the classic beginner mistake. The opposite mistake: silencing the J ('hijo' is EE-ho with a rasp, not EE-o). Spelling: you have to memorize where the h goes ('hora' vs 'ora', 'hecho' vs 'echo').",
    examples: [
      { word: 'hola', mark: 'h' },
      { word: 'hay', mark: 'h' },
      { word: 'hombre', mark: 'h' },
      { word: 'hijo', mark: 'h' },
      { word: 'ahora', mark: 'h' },
      { word: 'hacer', mark: 'h' },
      { word: 'hora', mark: 'h' },
      { word: 'huevo', mark: 'hue' },
      { word: 'hielo', mark: 'hie' },
    ],
  },
  {
    id: 'enye',
    order: 24,
    title: 'Ñ',
    ipa: '[ɲ]',
    spellings: ['ñ'],
    english:
      "Like the 'ny' in 'canyon' or the 'ni' in 'onion', but as one single sound, not n + y.",
    howTo:
      "Keep the tip of the tongue down behind the lower teeth and press the middle of the tongue flat against the hard palate, as for y, then hum through your nose. Since it's one sound, it begins the next syllable: 'ni-ño', 'ma-ña-na', 'es-pa-ñol'. Practice: 'niño – año – mañana – España – señor – baño – montaña', then contrast N and Ñ: 'una / uña', 'pena / peña', 'cana / caña'.",
    pitfalls:
      "Ignoring the tilde and saying N: '¿Cuántos años tienes?' (how old are you?) becomes a very different and embarrassing question with 'anos'. Splitting it across two syllables ('an-yo').",
    examples: [
      { word: 'niño', mark: 'ñ' },
      { word: 'año', mark: 'ñ' },
      { word: 'mañana', mark: 'ñ' },
      { word: 'España', mark: 'ñ' },
      { word: 'señor', mark: 'ñ' },
      { word: 'baño', mark: 'ñ' },
      { word: 'montaña', mark: 'ñ' },
      { word: 'pequeño', mark: 'ñ' },
      { word: 'compañero', mark: 'ñ' },
    ],
  },
  {
    id: 'nasals',
    order: 25,
    title: 'M and N: the nasals',
    ipa: '[m] [n] [ŋ] [ɱ]',
    spellings: [
      'm',
      'n',
      'n before b, v, p, m sounds like m: un beso, invierno',
      'n before c/qu (k), g, j sounds like the "ng" of "sing": banco, tengo',
      'n before f is made on the lip: enfermo',
    ],
    english:
      "M and N are as in English. The twist: N copies the position of the next consonant, as in English 'inbox' (said 'imbox') or 'sink' (with the 'ng' of 'sing'). Spanish does this everywhere, even across words.",
    howTo:
      "Before b, v, p, m, N becomes M: 'un beso' [um ˈbe.so], 'invierno', 'un poco', 'conmigo' [komˈmi.ɣo]. Before k, g, j it becomes the 'ng' of 'sing': 'banco' [ˈbaŋ.ko], 'tengo', 'naranja', 'un gato'. Before f it's made with the lip against the teeth: 'enfermo', 'un favor'. Before t and d it's dental like them: 'antes', 'donde'. At the end of a word N stays a clear, full [n], never dropped and never just a nasal vowel as in French or Portuguese: 'pan', 'tren', 'jamón'. Practice: say 'un' before different words and feel your mouth change: 'un beso – un poco – un gato – un café – un día'.",
    pitfalls:
      "Fighting the assimilation and pronouncing a careful [n] in 'un beso' or 'invierno': it sounds stiff. Dropping final N and nasalizing the vowel ('pa' for pan).",
    examples: [
      { word: 'mano', mark: 'm' },
      { word: 'nariz', mark: 'n' },
      { word: 'pan', mark: 'n' },
      { word: 'invierno', mark: 'nv' },
      { word: 'cambio', mark: 'mb' },
      { word: 'conmigo', mark: 'nm' },
      { word: 'banco', mark: 'nc' },
      { word: 'tengo', mark: 'ng' },
      { word: 'naranja', mark: 'nj' },
      { word: 'enfermo', mark: 'nf' },
    ],
  },
  {
    id: 'light-l',
    order: 26,
    title: 'The clear L',
    ipa: '[l]',
    spellings: ['l (single; ll is a different sound)'],
    english:
      "Like the 'l' in 'leaf' or 'light', never the 'dark' l of 'full', 'milk' or 'ball', even at the end of a word or before a consonant.",
    howTo:
      "Tongue tip on the ridge behind the upper teeth (on the teeth themselves before t or d: 'alto', 'falda'), with the body of the tongue forward and the back of the tongue low, as if you were about to say 'ee'. English raises the back of the tongue for L at the end of a syllable ('feel', 'milk'): that's the dark L to avoid. Practice: say English 'leaf', hold the L, then keep exactly that bright L in 'sol – mil – papel – azul – hotel – español'. Don't let the vowel before it change either: 'sol' is 'so' + clear L, not 'soul'.",
    pitfalls:
      "Dark L at the end of words ('sol' like 'soul', 'español' with an 'ow' sound). Turning L into a vowel ('miuk'). Confusing L with LL: 'polo' and 'pollo' are different words.",
    examples: [
      { word: 'luna', mark: 'l' },
      { word: 'libro', mark: 'l' },
      { word: 'malo', mark: 'l' },
      { word: 'sol', mark: 'l' },
      { word: 'mil', mark: 'l' },
      { word: 'papel', mark: 'l' },
      { word: 'azul', mark: 'l' },
      { word: 'alto', mark: 'l' },
      { word: 'hotel', mark: 'l' },
      { word: 'español', mark: 'l' },
    ],
  },
  {
    id: 'tap-r',
    order: 27,
    title: 'The tapped R',
    ipa: '[ɾ]',
    spellings: [
      'r between vowels: pero, cara',
      'r after a consonant other than n, l, s: tres, otro, gracias',
      'r at the end of a syllable or word: parque, comer',
    ],
    english:
      "Like the quick 'tt' of American 'butter', the 'dd' of 'ladder' or the 't' of 'gotta': one fast flick of the tongue. Nothing like the English R, where the tongue never touches anything.",
    howTo:
      "Flick the tip of your tongue once, quickly, against the ridge behind the upper teeth. Find it in American English: say 'gotta', 'pot of tea' or 'edda' fast; that flap is the Spanish R. So 'para' is close to American 'potta', and 'pero' to 'Peddo' said quickly. After a consonant ('tres', 'otro', 'brazo', 'gracias') try 'te-res' and squeeze it into one syllable: 'tres'. At the end of a word ('comer', 'hablar', 'mar') it's still a tap; Spaniards often make it stronger, even trilled, when speaking emphatically, which is fine. Practice: 'para – pero – cara – toro – hora – tres – comer'.",
    pitfalls:
      "Using the English R (tongue curled back, never touching): the most noticeable accent marker. Holding the tap too long so it becomes a trill: 'pero' (but) turns into 'perro' (dog). Dropping R after a vowel, as in British English ('co-ME' for comer).",
    examples: [
      { word: 'pero', mark: 'r' },
      { word: 'cara', mark: 'r' },
      { word: 'para', mark: 'r' },
      { word: 'toro', mark: 'r' },
      { word: 'hora', mark: 'r' },
      { word: 'naranja', mark: 'r' },
      { word: 'tres', mark: 'r' },
      { word: 'otro', mark: 'r' },
      { word: 'gracias', mark: 'r' },
      { word: 'comer', mark: 'r' },
    ],
  },
  {
    id: 'trill-r',
    order: 28,
    title: 'The trilled R',
    ipa: '[r]',
    spellings: [
      'rr (only between vowels): perro, carro',
      'r at the start of a word: rojo, río',
      'r after n, l, s: Enrique, alrededor, Israel',
    ],
    english:
      "No English equivalent: a rapid series of two to five tongue taps, like a cat purring or a child imitating a motorbike ('brrrm').",
    howTo:
      "The relaxed tip of the tongue vibrates against the ridge behind the upper teeth because air flows past it. You don't flap it with muscle; the air does the work. The sides of the tongue rest against the upper side teeth, the tip stays loose, and the voice stays on. Progressive drill, a few minutes every day: (1) Say 'tra-tra-tra' or 'dra-dra-dra' quickly, then push more and more air through until the tap keeps going: 'trrra', 'drrra'. (2) Say a tap R ('para') and add a strong burst of air on the R: 'parrra'. (3) Say 'butter' or 'ladder' fast and repeatedly ('budda-budda-budda'), then put a strong breath behind the middle sound. (4) Once you get even a short trill, move it to the start of words ('rrrojo', 'rrrata') and between vowels ('perrro', 'carrro'). In normal speech natives use only two or three taps. Some people need weeks to get it; meanwhile a long, strong tap is understood far better than an English R.",
    pitfalls:
      "Using a tap or an English R where the trill is needed: 'perro' (dog) vs 'pero' (but), 'carro' vs 'caro'. Forgetting that word-initial R is always trilled: 'rojo', 'rosa', 'Roma' never start with a tap. Tensing the tongue: a stiff tongue can't vibrate. Trilling with the uvula, French-style: that isn't Spanish.",
    examples: [
      { word: 'perro', mark: 'rr' },
      { word: 'carro', mark: 'rr' },
      { word: 'tierra', mark: 'rr' },
      { word: 'guitarra', mark: 'rr' },
      { word: 'arroz', mark: 'rr' },
      { word: 'rojo', mark: 'r' },
      { word: 'ratón', mark: 'r' },
      { word: 'río', mark: 'r' },
      { word: 'Enrique', mark: 'r' },
      { word: 'alrededor', mark: 'r' },
    ],
  },
  {
    id: 'x',
    order: 29,
    title: 'X',
    ipa: '[ks]',
    spellings: [
      'x between vowels: [ks] (taxi, examen)',
      'x before a consonant: [ks], or just [s] in casual speech (texto, extranjero)',
      'x at the start of a word: [s] (xilófono)',
      'x in México, Texas, Oaxaca: [x], the jota',
    ],
    english:
      "Like the 'x' in 'taxi', 'ks', but never the 'gz' of English 'exam' or 'exact'.",
    howTo:
      "Between vowels say a clear 'ks' (many Spaniards soften it to 'gs', also fine): 'taxi', 'examen' [ekˈsa.men], 'éxito', 'máximo'. Before a consonant many Spaniards simplify it to S: 'texto' [ˈtes.to], 'extranjero', 'explicar'. Both are correct; the 'ks' is more careful. A few names keep an old spelling where x is the jota: 'México' and 'mexicano' (Spain also accepts 'Méjico'), 'Texas', 'Oaxaca'. Practice: 'taxi – examen – éxito – máximo – texto – extranjero – México'.",
    pitfalls:
      "English 'gz' in 'examen', 'exacto', 'existir'. Saying 'México' with KS. Falling for the false friend: 'éxito' means 'success'; an exit is 'salida'.",
    examples: [
      { word: 'taxi', mark: 'x' },
      { word: 'examen', mark: 'x' },
      { word: 'éxito', mark: 'x' },
      { word: 'máximo', mark: 'x' },
      { word: 'texto', mark: 'x' },
      { word: 'extranjero', mark: 'x' },
      { word: 'explicar', mark: 'x' },
      { word: 'México', mark: 'x' },
    ],
  },

  // ───────────────────────────── Linking ─────────────────────────────
  {
    id: 'linking',
    order: 30,
    title: 'Linking words together',
    ipa: '‿',
    spellings: [
      'consonant + vowel across words (enlace): es‿un, los‿otros',
      'vowel + vowel across words (sinalefa): la‿alumna, mi‿amigo',
    ],
    english:
      "Spanish flows as one unbroken stream: there are no little pauses or 'catches' (glottal stops) before words that start with a vowel, as in careful English 'an | apple'. That's a big part of why Spanish sounds so fast.",
    howTo:
      "(1) Enlace: a final consonant joins the vowel of the next word, as if it began that syllable: 'es un' → 'e-sun', 'los otros' → 'lo-so-tros', 'el agua' → 'e-la-gua', 'Buenos Aires' → 'bue-no-sai-res'. (2) Sinalefa: a final vowel and the next word's first vowel merge into one syllable: 'la alumna' → 'la-lum-na' (identical vowels fuse), 'mi amigo' → 'mia-mi-go', 'su hermano' → 'suer-ma-no' (the h is silent), 'todo el día' → 'to-doel-dí-a'. Never insert a glottal stop (the catch in 'uh-oh') before a vowel. Practice: read slowly while sliding your finger along without lifting it, as if each sentence were one long word: '¿Dónde está el hotel?', 'Tengo un hermano y una hermana'. Then speed up. In listening, this is why word boundaries vanish at first: 'está en el' sounds like 'es-táe-nel'.",
    pitfalls:
      "Pausing or adding a catch before every vowel-initial word ('el | agua'). Not recognizing linked words when listening: 'los otros' sounds like 'lo sotros', 'un elefante' like 'u-ne-le-fan-te'.",
    examples: [
      { word: 'es un', mark: 's u' },
      { word: 'los otros', mark: 's o' },
      { word: 'el agua', mark: 'l a' },
      { word: 'Buenos Aires', mark: 's A' },
      { word: 'la alumna', mark: 'a a' },
      { word: 'mi amigo', mark: 'i a' },
      { word: 'su hermano', mark: 'u he' },
      { word: 'todo el día', mark: 'o e' },
    ],
  },
];

export const pairs: MinimalPairSet[] = [
  {
    id: 'r-rr',
    contrast: 'r vs rr',
    lessons: ['tap-r', 'trill-r'],
    pairs: [
      ['pero', 'perro'],
      ['caro', 'carro'],
      ['para', 'parra'],
      ['pera', 'perra'],
      ['cero', 'cerro'],
      ['coro', 'corro'],
      ['foro', 'forro'],
      ['ahora', 'ahorra'],
      ['coral', 'corral'],
      ['enterar', 'enterrar'],
    ],
    note:
      "Between vowels, one r is a single tap and rr is a trill. The difference is the most important one in Spanish pronunciation: 'pero' = but, 'perro' = dog; 'caro' = expensive, 'carro' = cart; 'ahora' = now, 'ahorra' = he saves.",
  },
  {
    id: 'r-l',
    contrast: 'r vs l',
    lessons: ['tap-r', 'light-l'],
    pairs: [
      ['pero', 'pelo'],
      ['cara', 'cala'],
      ['hora', 'hola'],
      ['para', 'pala'],
      ['paro', 'palo'],
      ['cero', 'celo'],
      ['mar', 'mal'],
      ['arma', 'alma'],
      ['harto', 'alto'],
      ['suero', 'suelo'],
    ],
    note:
      "Both touch the same spot behind the teeth: the tapped R flicks and leaves, the L stays and lets air out at the sides. Keep the L clear even before a consonant ('alma', 'alto'). The h of 'hora', 'hola' and 'harto' is silent.",
  },
  {
    id: 'd-r',
    contrast: 'soft d [ð] vs tapped r',
    lessons: ['d', 'tap-r'],
    pairs: [
      ['cada', 'cara'],
      ['todo', 'toro'],
      ['codo', 'coro'],
      ['mudo', 'muro'],
      ['dudo', 'duro'],
      ['pudo', 'puro'],
      ['moda', 'mora'],
      ['lodo', 'loro'],
      ['ida', 'ira'],
      ['mida', 'mira'],
    ],
    note:
      "A trap for American English speakers: the flapped d of 'ladder' IS a Spanish tapped R. Between vowels Spanish d is a soft 'th' as in 'this', so 'cada' (each) never sounds like 'cara' (face), and 'todo' (all) never like 'toro' (bull).",
  },
  {
    id: 's-theta',
    contrast: 's vs z/c [θ]',
    lessons: ['apical-s', 'theta'],
    pairs: [
      ['casa', 'caza'],
      ['coser', 'cocer'],
      ['sien', 'cien'],
      ['siento', 'ciento'],
      ['sierra', 'cierra'],
      ['casar', 'cazar'],
      ['asar', 'azar'],
      ['abrasar', 'abrazar'],
      ['ves', 'vez'],
      ['tasa', 'taza'],
      ['masa', 'maza'],
      ['sumo', 'zumo'],
    ],
    note:
      "In Spain these are different words: casa (house) / caza (hunt), coser (sew) / cocer (cook), ves (you see) / vez (time), sumo (I add) / zumo (juice). In seseo areas (Latin America, the Canaries, much of Andalusia) each pair sounds the same.",
  },
  {
    id: 'theta-d',
    contrast: 'z [θ] vs soft d [ð]',
    lessons: ['theta', 'd'],
    pairs: [
      ['caza', 'cada'],
      ['lazo', 'lado'],
      ['mozo', 'modo'],
      ['moza', 'moda'],
      ['pozo', 'podo'],
    ],
    note:
      "Both sound like English 'th': z is voiceless like 'think', soft d is voiced like 'this' and weaker. Put your fingers on your throat: only the d should buzz.",
  },
  {
    id: 'n-enye',
    contrast: 'n vs ñ',
    lessons: ['enye'],
    pairs: [
      ['cana', 'caña'],
      ['pena', 'peña'],
      ['mono', 'moño'],
      ['una', 'uña'],
      ['cuna', 'cuña'],
      ['cano', 'caño'],
      ['sonar', 'soñar'],
      ['sueno', 'sueño'],
      ['ano', 'año'],
    ],
    note:
      "N touches the ridge with the tip of the tongue; Ñ presses the middle of the tongue against the palate. 'ano/año' is included on purpose: 'año' means year, 'ano' means anus, and mixing them up ('¿Cuántos anos tienes?') is the most famous learner mistake in Spanish.",
  },
  {
    id: 'l-ll',
    contrast: 'l vs ll',
    lessons: ['light-l', 'll-y'],
    pairs: [
      ['polo', 'pollo'],
      ['ola', 'olla'],
      ['loro', 'lloro'],
      ['vale', 'valle'],
      ['pila', 'pilla'],
      ['cala', 'calla'],
      ['lave', 'llave'],
      ['mala', 'malla'],
      ['ala', 'halla'],
      ['lama', 'llama'],
    ],
    note:
      "With yeísmo, ll sounds like Spanish y, so this is really L vs [ʝ]: 'pollo' (chicken) sounds like 'poyo', 'olla' (pot) like 'oya'. Never read LL as an English L.",
  },
  {
    id: 'l-r-initial',
    contrast: 'l vs r at the start of a word',
    lessons: ['light-l', 'trill-r'],
    pairs: [
      ['lata', 'rata'],
      ['lana', 'rana'],
      ['loca', 'roca'],
      ['lobo', 'robo'],
      ['lima', 'rima'],
      ['lisa', 'risa'],
      ['losa', 'rosa'],
      ['lío', 'río'],
    ],
    note: 'At the start of a word R is always trilled, never tapped: rata (rat), rana (frog), roca (rock), risa (laughter), río (river).',
  },
  {
    id: 'stress-position',
    contrast: 'stress position',
    lessons: ['stress'],
    pairs: [
      ['papa', 'papá'],
      ['esta', 'está'],
      ['hablo', 'habló'],
      ['tomo', 'tomó'],
      ['camino', 'caminó'],
      ['término', 'termino'],
      ['termino', 'terminó'],
      ['sabana', 'sábana'],
      ['público', 'publico'],
      ['práctica', 'practica'],
      ['ingles', 'inglés'],
      ['ánimo', 'animo'],
    ],
    note:
      "Same sounds, different stressed syllable: listen for the louder, higher one. hablo (I speak) / habló (she spoke); término (end) / termino (I finish) / terminó (he finished); sabana (savannah) / sábana (bedsheet); público (public) / publico (I publish); ingles (groins) / inglés (English).",
  },
  {
    id: 'e-i',
    contrast: 'e vs i',
    lessons: ['vowel-e', 'vowel-i'],
    pairs: [
      ['mesa', 'misa'],
      ['peso', 'piso'],
      ['pesa', 'pisa'],
      ['dejo', 'dijo'],
      ['me', 'mi'],
      ['se', 'si'],
      ['de', 'di'],
      ['mes', 'mis'],
      ['tela', 'tila'],
      ['pecar', 'picar'],
    ],
    note:
      "Spanish E is mid (between 'bed' and 'day', with no glide); I is high and tense like 'see'. English speakers tend to hear E as 'ay' and I as the 'i' of 'sit', which blurs these. mesa (table) / misa (mass); peso (weight) / piso (flat, floor); dejo (I leave) / dijo (he said).",
  },
  {
    id: 'o-u',
    contrast: 'o vs u',
    lessons: ['vowel-o', 'vowel-u'],
    pairs: [
      ['oso', 'uso'],
      ['rosa', 'rusa'],
      ['lona', 'luna'],
      ['moda', 'muda'],
      ['hoyo', 'huyo'],
      ['tos', 'tus'],
      ['loto', 'luto'],
      ['hondo', 'hundo'],
      ['cobra', 'cubra'],
    ],
    note:
      "O is mid and rounded with no 'w' glide at the end; U is higher, with lips pushed further forward. oso (bear) / uso (use); rosa (rose) / rusa (Russian); lona (canvas) / luna (moon); tos (cough) / tus (your).",
  },
  {
    id: 'b-p',
    contrast: 'b/v vs p',
    lessons: ['b-v', 'unaspirated-p'],
    pairs: [
      ['beso', 'peso'],
      ['vino', 'pino'],
      ['vaso', 'paso'],
      ['bala', 'pala'],
      ['bata', 'pata'],
      ['boca', 'poca'],
      ['bar', 'par'],
      ['baño', 'paño'],
      ['bollo', 'pollo'],
      ['basta', 'pasta'],
      ['beca', 'peca'],
      ['venas', 'penas'],
    ],
    note:
      "Spanish P has no puff of air, so English ears often hear it as B. The real difference is the voice: B/V buzzes from the very start, P is silent until the vowel. B and V sound the same: 'tubo' (tube) and 'tuvo' (he had) are identical.",
  },
  {
    id: 'd-t',
    contrast: 'd vs t',
    lessons: ['d', 'dental-t'],
    pairs: [
      ['dos', 'tos'],
      ['de', 'te'],
      ['dado', 'dato'],
      ['nada', 'nata'],
      ['seda', 'seta'],
      ['boda', 'bota'],
      ['moda', 'mota'],
      ['codo', 'coto'],
      ['cada', 'cata'],
      ['drama', 'trama'],
      ['manda', 'manta'],
      ['verde', 'verte'],
    ],
    note:
      "Both are made on the teeth. Spanish T has no puff of air, so the difference is voicing, and between vowels the d turns into a soft [ð]: 'nada' (nothing) vs 'nata' (cream), 'boda' (wedding) vs 'bota' (boot), 'seda' (silk) vs 'seta' (mushroom).",
  },
  {
    id: 'g-k',
    contrast: 'g vs k',
    lessons: ['g', 'k'],
    pairs: [
      ['gama', 'cama'],
      ['goma', 'coma'],
      ['gol', 'col'],
      ['gallo', 'callo'],
      ['gana', 'cana'],
      ['gasa', 'casa'],
      ['guiso', 'quiso'],
      ['pegar', 'pecar'],
      ['gorro', 'corro'],
      ['gasto', 'casto'],
    ],
    note:
      "K has no puff of air, so listen for the voice in G. Between vowels G is the soft [ɣ] ('pegar'). In 'guiso' and 'quiso' the u is silent: [ˈɡi.so] vs [ˈki.so].",
  },
  {
    id: 'jota-k',
    contrast: 'j [x] vs k',
    lessons: ['jota', 'k'],
    pairs: [
      ['jota', 'cota'],
      ['jura', 'cura'],
      ['juro', 'curo'],
      ['jarro', 'carro'],
      ['gema', 'quema'],
      ['mojo', 'moco'],
      ['paja', 'paca'],
      ['baja', 'baca'],
    ],
    note:
      "Same place in the mouth: K closes completely, the jota leaves a gap and rasps. 'gema' (gem) / 'quema' (burns) shows the spelling: ge = [xe], que = [ke].",
  },
  {
    id: 'diphthong-hiatus',
    contrast: 'diphthong vs hiatus',
    lessons: ['hiatus', 'diphthongs-rising', 'stress'],
    pairs: [
      ['hacia', 'hacía'],
      ['sabia', 'sabía'],
      ['seria', 'sería'],
      ['varias', 'varías'],
      ['tenia', 'tenía'],
      ['secretaria', 'secretaría'],
      ['continuo', 'continúo'],
    ],
    note:
      "The first word of each pair glides the two vowels into one syllable; in the second the accent splits them and takes the stress. hacia (towards) / hacía (used to do); sabia (wise) / sabía (knew); seria (serious) / sería (would be); secretaria (secretary) / secretaría (secretary's office); continuo (continuous) / continúo (I continue).",
  },
  {
    id: 'vowel-falling-diphthong',
    contrast: 'plain vowel vs vowel + i/u',
    lessons: ['vowel-a', 'vowel-e', 'diphthongs-falling', 'y-vowel'],
    pairs: [
      ['pena', 'peina'],
      ['le', 'ley'],
      ['re', 'rey'],
      ['ves', 'veis'],
      ['ha', 'hay'],
      ['vas', 'vais'],
      ['bala', 'baila'],
      ['trago', 'traigo'],
      ['casa', 'causa'],
      ['ala', 'aula'],
    ],
    note:
      "Keep plain vowels steady and make real glides only where they're written: pena (sorrow) / peina (combs), ves (you see) / veis (you all see), ha (has) / hay (there is), casa (house) / causa (cause). English speakers often add a glide to every E ('pay-na'), which erases the difference.",
  },
  {
    id: 'vowel-rising-diphthong',
    contrast: 'plain vowel vs ie / ue',
    lessons: ['vowel-e', 'vowel-o', 'diphthongs-rising'],
    pairs: [
      ['celo', 'cielo'],
      ['mente', 'miente'],
      ['neto', 'nieto'],
      ['bono', 'bueno'],
      ['solo', 'suelo'],
      ['costa', 'cuesta'],
      ['logo', 'luego'],
      ['porta', 'puerta'],
    ],
    note:
      "Listen for the quick 'y' or 'w' before the vowel: mente (mind) / miente (lies), solo (alone) / suelo (floor), costa (coast) / cuesta (slope; it costs), logo / luego (later).",
  },
];
