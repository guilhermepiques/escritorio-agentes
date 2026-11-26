import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { EmojiArte } from '../EmojiArte';

export type Movimento = 'flutuar' | 'pulsar' | 'girar' | 'tremer' | 'nenhum';

export function useMovimento(movimento: Movimento | undefined): string {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  switch (movimento) {
    case 'pulsar':
      return `scale(${1 + 0.08 * Math.sin(t * Math.PI * 2.4)})`;
    case 'girar':
      return `rotate(${t * 90}deg)`;
    case 'tremer':
      return `translate(${Math.sin(t * 60) * 6}px, ${Math.cos(t * 47) * 4}px) rotate(${Math.sin(t * 40) * 3}deg)`;
    case 'nenhum':
      return '';
    case 'flutuar':
    default:
      return `translateY(${Math.sin(t * 2.2) * 18}px) rotate(${Math.sin(t * 1.4) * 4}deg)`;
  }
}

type Lado = {
  emoji: string;
  tamanho?: number;
  movimento?: Movimento;
  cinzaEm?: number; // s: a partir daqui o emoji perde a cor
  forteEm?: number; // s: a partir daqui o movimento fica mais forte (tremer/flutuar x2,5)
};
type Dados = { emoji: string; tamanho?: number; movimento?: Movimento; lado?: Lado };

const EmojiLado: React.FC<{ l: Lado; estilo: PropsPeca['estilo'] }> = ({ l, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const mov = useMovimento(l.movimento ?? 'flutuar');
  const forte = l.forteEm !== undefined && t >= l.forteEm;
  const cinza = l.cinzaEm !== undefined && t >= l.cinzaEm;
  const extra = forte ? `translateX(${Math.sin(t * 28) * 22}px) rotate(${Math.sin(t * 24) * 14}deg)` : '';
  return (
    <div style={{ transform: `${mov} ${extra}`, filter: cinza ? 'grayscale(1) brightness(1.1)' : undefined }}>
      <EmojiArte emoji={l.emoji} tamanho={l.tamanho ?? 160} estilo={estilo} />
    </div>
  );
};

export const Emoji: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const transform = useMovimento(dados.movimento);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
      <div style={{ transform }}>
        <EmojiArte emoji={dados.emoji} tamanho={dados.tamanho ?? 320} estilo={estilo} />
      </div>
      {dados.lado ? <EmojiLado l={dados.lado} estilo={estilo} /> : null}
    </div>
  );
};
