// Language packs. Add a language by writing a pack like ./es and listing it here.
import { ipa as esIpa, spanish } from './es';
import type { LanguagePack } from './types';

export const PACKS: Record<string, LanguagePack> = { [spanish.code]: spanish };

const IPA: Record<string, (text: string) => string> = { [spanish.code]: esIpa };

/** Languages planned next, shown in Settings and Resources. */
export const COMING = [
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
];

export function getPack(code: string): LanguagePack {
  return PACKS[code] ?? spanish;
}

export function transcribe(code: string, text: string): string {
  return (IPA[code] ?? IPA[spanish.code])(text);
}
