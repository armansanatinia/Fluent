import { describe, expect, it } from 'vitest';
import { ipa } from '../src/content/es/ipa';

const cases: [string, string][] = [
  ['perro', 'ˈpe.ro'],
  ['pero', 'ˈpe.ɾo'],
  ['ciudad', 'θjuˈðað'],
  ['agua', 'ˈa.ɣwa'],
  ['gente', 'ˈxen.te'],
  ['llave', 'ˈʝa.βe'],
  ['guitarra', 'ɡiˈta.ra'],
  ['pingüino', 'piŋˈɡwi.no'],
  ['zapato', 'θaˈpa.to'],
  ['hombre', 'ˈom.bɾe'],
  ['árbol', 'ˈaɾ.βol'],
  ['camión', 'kaˈmjon'],
  ['país', 'paˈis'],
  ['día', 'ˈdi.a'],
  ['coche', 'ˈko.tʃe'],
  ['niño', 'ˈni.ɲo'],
  ['rey', 'rei̯'],
  ['mismo', 'ˈmiz.mo'],
  ['examen', 'ekˈsa.men'],
  ['Madrid', 'maˈðɾið'],
  ['inglés', 'iŋˈɡles'],
  ['reloj', 'reˈlox'],
  ['y', 'i'],
  ['huevo', 'ˈwe.βo'],
  ['ahora', 'aˈo.ɾa'],
  ['cuidado', 'kwiˈða.ðo'],
  ['leer', 'leˈeɾ'],
  ['ratón', 'raˈton'],
  ['alrededor', 'al.re.ðeˈðoɾ'],
  ['también', 'tamˈbjen'],
  ['extranjero', 'eks.tɾaŋˈxe.ɾo'],
  ['obstáculo', 'oβsˈta.ku.lo'],
  ['estoy', 'esˈtoi̯'],
  ['cinco', 'ˈθiŋ.ko'],
  ['queso', 'ˈke.so'],
  ['jamón', 'xaˈmon'],
  ['caldo', 'ˈkal.do'],
  ['cuídate', 'ˈkwi.ða.te'],
];

describe('Castilian IPA', () => {
  it.each(cases)('%s → %s', (word, expected) => {
    expect(ipa(word)).toBe(expected);
  });
  it('handles phrases', () => {
    expect(ipa('en punto')).toBe('en ˈpun.to');
  });
});
