// Registro das peças. O nome à esquerda é o que vai no "tipo" do video.json.
// Peça nova: crie src/pecas/<nome>.tsx, importe aqui, ponha uma linha no REGISTRO
// (no formato  'nome': Componente,  uma por linha — o render.mjs lê esta lista)
// e descreva no CATALOGO.md. Guia: COMO-CRIAR-PECA.md.

import type React from 'react';
import type { PropsPeca } from '../tipos';
import { Asa } from './asa';
import { Calendario } from './calendario';
import { Carimbo } from './carimbo';
import { Chamada } from './chamada';
import { Comparacao } from './comparacao';
import { Cronometro } from './cronometro';
import { Emoji } from './emoji';
import { Emojis } from './emojis';
import { Espaco } from './espaco';
import { Forno } from './forno';
import { Etiqueta } from './etiqueta';
import { GradeEmojis } from './grade-emojis';
import { Icone } from './icone';
import { Lista } from './lista';
import { Molecula } from './molecula';
import { Numero } from './numero';
import { Ondas } from './ondas';
import { Pergunta } from './pergunta';
import { Placar } from './placar';
import { Prato } from './prato';
import { Selo } from './selo';
import { Texto } from './texto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const REGISTRO: Record<string, React.FC<PropsPeca<any>>> = {
  'texto': Texto,
  'etiqueta': Etiqueta,
  'pergunta': Pergunta,
  'cronometro': Cronometro,
  'numero': Numero,
  'lista': Lista,
  'grade-emojis': GradeEmojis,
  'emojis': Emojis,
  'comparacao': Comparacao,
  'emoji': Emoji,
  'icone': Icone,
  'chamada': Chamada,
  'espaco': Espaco,
  'selo': Selo,
  'asa': Asa,
  'prato': Prato,
  'molecula': Molecula,
  'forno': Forno,
  'ondas': Ondas,
  'calendario': Calendario,
  'carimbo': Carimbo,
  'placar': Placar,
};
