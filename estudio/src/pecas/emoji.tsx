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

type Dados = { emoji: string; tamanho?: number; movimento?: Movimento };

export const Emoji: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const transform = useMovimento(dados.movimento);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ transform }}>
        <EmojiArte emoji={dados.emoji} tamanho={dados.tamanho ?? 320} estilo={estilo} />
      </div>
    </div>
  );
};
