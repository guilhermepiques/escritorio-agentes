// Fontes grátis (Google Fonts, licença livre), todas com os acentos do português.
// Para acrescentar uma: importe de @remotion/google-fonts/<Nome>, ponha na lista FONTES
// e no CATALOGO.md.

import * as anton from '@remotion/google-fonts/Anton';
import * as archivoBlack from '@remotion/google-fonts/ArchivoBlack';
import * as baloo2 from '@remotion/google-fonts/Baloo2';
import * as bangers from '@remotion/google-fonts/Bangers';
import * as bebasNeue from '@remotion/google-fonts/BebasNeue';
import * as bungee from '@remotion/google-fonts/Bungee';
import * as caveat from '@remotion/google-fonts/Caveat';
import * as dmSerif from '@remotion/google-fonts/DMSerifDisplay';
import * as fredoka from '@remotion/google-fonts/Fredoka';
import * as inter from '@remotion/google-fonts/Inter';
import * as lilita from '@remotion/google-fonts/LilitaOne';
import * as luckiest from '@remotion/google-fonts/LuckiestGuy';
import * as montserrat from '@remotion/google-fonts/Montserrat';
import * as notoEmoji from '@remotion/google-fonts/NotoColorEmoji';
import * as oswald from '@remotion/google-fonts/Oswald';
import * as marker from '@remotion/google-fonts/PermanentMarker';
import * as playfair from '@remotion/google-fonts/PlayfairDisplay';
import * as poppins from '@remotion/google-fonts/Poppins';
import * as pressStart from '@remotion/google-fonts/PressStart2P';
import * as righteous from '@remotion/google-fonts/Righteous';
import * as rubik from '@remotion/google-fonts/Rubik';
import * as spaceGrotesk from '@remotion/google-fonts/SpaceGrotesk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuloFonte = { getInfo: () => any; loadFont: (...args: any[]) => { fontFamily: string } };

// nome no catálogo → [módulo, peso preferido em ordem]
const FONTES: Record<string, [ModuloFonte, string[]]> = {
  Anton: [anton, ['400']],
  'Archivo Black': [archivoBlack, ['400']],
  'Baloo 2': [baloo2, ['800', '700']],
  Bangers: [bangers, ['400']],
  'Bebas Neue': [bebasNeue, ['400']],
  Bungee: [bungee, ['400']],
  Caveat: [caveat, ['700']],
  'DM Serif Display': [dmSerif, ['400']],
  Fredoka: [fredoka, ['700', '600']],
  Inter: [inter, ['900', '800']],
  'Lilita One': [lilita, ['400']],
  'Luckiest Guy': [luckiest, ['400']],
  Montserrat: [montserrat, ['900', '800']],
  Oswald: [oswald, ['700']],
  'Permanent Marker': [marker, ['400']],
  'Playfair Display': [playfair, ['900', '800']],
  Poppins: [poppins, ['900', '800']],
  'Press Start 2P': [pressStart, ['400']],
  Righteous: [righteous, ['400']],
  Rubik: [rubik, ['900', '800']],
  'Space Grotesk': [spaceGrotesk, ['700']],
};

export const NOMES_FONTES = Object.keys(FONTES);

const carregadas = new Map<string, { familia: string; peso: string }>();
let emoji = '';

function carregar(mod: ModuloFonte, pesosPreferidos: string[]) {
  const info = mod.getInfo();
  const pesosDisponiveis = Object.keys(info.fonts.normal ?? {});
  const peso = pesosPreferidos.find((p) => pesosDisponiveis.includes(p)) ?? pesosDisponiveis[0];
  const subsets = ['latin', 'latin-ext'].filter((s) => info.subsets.includes(s));
  const { fontFamily } = mod.loadFont('normal', { weights: [peso], subsets });
  return { familia: fontFamily, peso };
}

function garantirEmoji() {
  if (!emoji) emoji = notoEmoji.loadFont('normal', { weights: ['400'], subsets: ['emoji'] }).fontFamily;
  return emoji;
}

/** Carrega a fonte (uma vez) e devolve o estilo CSS com o emoji de reserva. */
export function fonte(nome: string): { fontFamily: string; fontWeight: number } {
  const e = garantirEmoji();
  if (!carregadas.has(nome)) {
    const item = FONTES[nome];
    carregadas.set(nome, item ? carregar(item[0], item[1]) : { familia: 'sans-serif', peso: '800' });
  }
  const f = carregadas.get(nome)!;
  return { fontFamily: `"${f.familia}", "${e}", sans-serif`, fontWeight: Number(f.peso) };
}

export function fonteEmoji(): string {
  return `"${garantirEmoji()}", sans-serif`;
}
