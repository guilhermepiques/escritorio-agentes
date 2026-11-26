import React from 'react';
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { EmojiArte } from '../EmojiArte';

type Dados = {
  emojis: string[];
  tamanho?: number;
  tempos?: number[];
  intervalo?: number;
  separador?: string; // ex.: "+"
  som?: string;
};

export const Emojis: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua, volumeEfeitos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inicio = dados.entraEm ?? 0;
  const lista = dados.emojis ?? [];
  const tam = dados.tamanho ?? (lista.length > 3 ? 170 : 220);
  const som = dados.som ?? 'pop';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      {lista.map((e, i) => {
        const tt = dados.tempos?.[i] ?? inicio + i * (dados.intervalo ?? 0.45);
        const p = continua ? 1 : spring({ frame: frame - Math.round(tt * fps), fps, config: { damping: 9, stiffness: 160 } });
        return (
          <React.Fragment key={i}>
            {i > 0 && dados.separador ? (
              <span style={{ ...fonte(estilo.fonte), fontSize: tam * 0.45, color: estilo.cores.texto, opacity: p }}>{dados.separador}</span>
            ) : null}
            <EmojiArte emoji={e} tamanho={tam} estilo={estilo} style={{ transform: `scale(${p}) rotate(${(1 - p) * -30}deg)` }} />
            {som !== 'nenhum' && !continua ? (
              <Sequence from={Math.round(tt * fps)} durationInFrames={Math.round(0.4 * fps)} layout="none">
                <Audio src={staticFile(`sons/${som}.wav`)} volume={volumeEfeitos} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};
