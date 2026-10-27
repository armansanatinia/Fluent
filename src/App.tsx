import { useEffect, type ReactNode } from 'react';
import { IconBooks, IconProgress, IconSettings, IconStudy, IconToday } from './components/icons';
import { Spinner, Toaster } from './components/ui';
import { go, useRoute, useStore } from './lib/hooks';
import { Browse } from './screens/Browse';
import { Drill } from './screens/Drill';
import { Grammar, GrammarTopicView } from './screens/Grammar';
import { Guide } from './screens/Guide';
import { Inbox } from './screens/Inbox';
import { MakeVocab, Vocab } from './screens/Vocab';
import { MakeWords, Words } from './screens/Words';
import { Progress } from './screens/Progress';
import { Resources } from './screens/Resources';
import { Review } from './screens/Review';
import { Settings } from './screens/Settings';
import { SoundLessonView, Sounds } from './screens/Sounds';
import { Study } from './screens/Study';
import { Today } from './screens/Today';
import { Welcome } from './screens/Welcome';
import { Write } from './screens/Write';

const TABS = [
  { id: 'today', label: 'Today', Icon: IconToday },
  { id: 'study', label: 'Study', Icon: IconStudy },
  { id: 'progress', label: 'Progress', Icon: IconProgress },
  { id: 'resources', label: 'Resources', Icon: IconBooks },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
];
const STUDY = new Set(['study', 'guide', 'review', 'words', 'sounds', 'grammar', 'vocab', 'write', 'inbox', 'browse']);

function isFull(r: string[]) {
  return r[0] === 'review' || r[0] === 'welcome' || (r[0] === 'words' && r[1] === 'make') || (r[0] === 'sounds' && r[1] === 'drill') || (r[0] === 'vocab' && r[1] === 'make');
}

function screen(r: string[]): ReactNode {
  const [a, b, c] = r;
  switch (a) {
    case 'today': return <Today />;
    case 'study': return <Study />;
    case 'review': return <Review />;
    case 'words': return b === 'make' ? <MakeWords key={c ?? 'all'} only={c} /> : <Words />;
    case 'sounds': return b === 'drill' ? <Drill key={c ?? 'auto'} setId={c} /> : b ? <SoundLessonView key={b} id={b} /> : <Sounds />;
    case 'grammar': return b ? <GrammarTopicView key={b} id={b} /> : <Grammar />;
    case 'vocab': return b === 'make' ? <MakeVocab key={c ?? 'all'} only={c} /> : <Vocab />;
    case 'write': return <Write />;
    case 'inbox': return <Inbox />;
    case 'browse': return <Browse key={b ?? 'list'} noteId={b ? decodeURIComponent(b) : undefined} />;
    case 'progress': return <Progress />;
    case 'resources': return <Resources />;
    case 'settings': return <Settings />;
    case 'welcome': return <Welcome />;
    case 'guide': return <Guide />;
    default: return <Today />;
  }
}

export function App() {
  const s = useStore();
  const route = useRoute();

  useEffect(() => {
    const t = s.device.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }, [s.device.theme]);

  useEffect(() => {
    if (s.ready && s.isNew && route[0] !== 'welcome') go('#/welcome');
  }, [s.ready, s.isNew, route]);

  useEffect(() => { window.scrollTo(0, 0); }, [route.join('/')]);

  if (!s.ready) return <div className="splash"><Spinner /></div>;

  const full = isFull(route);
  const active = STUDY.has(route[0]) ? 'study' : route[0];
  const vars = { ['--m' as string]: s.settings.gender.m.color, ['--f' as string]: s.settings.gender.f.color };

  return (
    <div className="app" style={vars}>
      <main className={`main${full ? ' full' : ''}`}>
        {s.saveError && (
          <div className="notice bad" style={{ marginBottom: 12 }}>
            This device couldn’t save your last change ({s.saveError}). Free up space, or export a backup in Settings.
          </div>
        )}
        {screen(route)}
      </main>
      {!full && (
        <nav className="tabbar" aria-label="Main">
          <div className="brand"><img src="/icons/icon.svg" alt="" /> Fluent</div>
          {TABS.map(({ id, label, Icon }) => (
            <a key={id} href={`#/${id}`} className={`tab${active === id ? ' on' : ''}`} aria-current={active === id ? 'page' : undefined}>
              <Icon /> {label}
            </a>
          ))}
        </nav>
      )}
      <Toaster />
    </div>
  );
}
