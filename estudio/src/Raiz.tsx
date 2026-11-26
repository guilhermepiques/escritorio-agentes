import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import type { PropsVideo } from './tipos';
import atalhos from './estilos/atalhos.json';
import type { Estilo } from './tipos';

// Exemplo só para abrir no "npm run studio" (sem narração). Os vídeos de verdade
// passam pelo scripts/render.mjs, que gera a voz e calcula os tempos.
const exemplo: PropsVideo & { textos: string[] } = {
  legenda: { modo: 'karaoke', palavrasPorVez: 3, posicao: 'baixo', tamanho: 70, caixa: false, maiusculas: false },
  volumes: { narracao: 1, efeitos: 0.6 },
  duracaoTotal: 4,
  textos: [''],
  cenas: [
    {
      inicio: 0,
      duracao: 4,
      entrada: 'corte',
      estilo: atalhos.pop as Estilo,
      pecas: [
        { tipo: 'etiqueta', texto: 'Pergunta 1 de 3' },
        { tipo: 'pergunta', pergunta: 'Qual é a capital da Austrália?', alternativas: ['Sydney', 'Camberra', 'Melbourne'], correta: 1, revelarEm: 3 },
        { tipo: 'cronometro', segundos: 2, comecaEm: 1, forma: 'circulo' },
      ],
      efeitos: [],
    },
  ],
};

export const Raiz: React.FC = () => (
  <Composition
    id="Video"
    component={Video as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={120}
    defaultProps={exemplo as unknown as Record<string, unknown>}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round(((props as unknown as PropsVideo).duracaoTotal ?? 4) * 30)),
    })}
  />
);
