import React from 'react';
import { Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { EmojiArte } from '../EmojiArte';
import { clamp, estiloCartao } from '../util';

type Item = string | { texto: string; emoji?: string };
type Dados = {
  itens: Item[];
  tempos?: number[]; // s: quando cada item aparece
  intervalo?: number;
  numerada?: boolean;
  destacarAtual?: boolean;
  som?: string; // efeito ao aparecer cada item (ex.: "pop"); "nenhum" para silêncio
};

export const Lista: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua, volumeEfeitos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inicio = dados.entraEm ?? 0;
  const itens = (dados.itens ?? []).map((it) => (typeof it === 'string' ? { texto: it } : it));
  const tempos = itens.map((_, i) => dados.tempos?.[i] ?? inicio + i * (dados.intervalo ?? 0.6));
  const t = frame / fps;
  let atual = -1;
  tempos.forEach((tt, i) => {
    if (t >= tt) atual = i;
  });
  const numerada = dados.numerada ?? true;
  const som = dados.som ?? 'pop';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {itens.map((it, i) => {
        const p = continua ? 1 : spring({ frame: frame - Math.round(tempos[i] * fps), fps, config: { damping: 13, stiffness: 170 } });
        const ativo = (dados.destacarAtual ?? true) && i === atual;
        return (
          <div
            key={i}
            style={{
              ...estiloCartao(estilo, ativo ? estilo.cores.destaque : estilo.cores.cartao),
              ...fonte(estilo.fonteApoio),
              fontSize: 66,
              color: ativo ? estilo.cores.contorno : estilo.cores.cartaoTexto,
              padding: '22px 30px',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              opacity: interpolate(p, [0, 0.4], [0, 1], clamp) * (atual > i && dados.destacarAtual !== false ? 0.75 : 1),
              transform: `translateY(${interpolate(p, [0, 1], [70, 0])}px) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
            }}
          >
            {som !== 'nenhum' && !continua ? (
              <Sequence from={Math.round(tempos[i] * fps)} durationInFrames={Math.round(0.5 * fps)} layout="none">
                <Audio src={staticFile(`sons/${som}.wav`)} volume={volumeEfeitos} />
              </Sequence>
            ) : null}
            {it.emoji || numerada ? (
              <span
                style={{
                  minWidth: 84,
                  height: 84,
                  borderRadius: Math.min(estilo.cantos, 42),
                  background: it.emoji ? 'transparent' : estilo.cores.destaque2,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: it.emoji ? 72 : 50,
                }}
              >
                {it.emoji ? <EmojiArte emoji={it.emoji} tamanho={72} estilo={estilo} /> : i + 1}
              </span>
            ) : null}
            <span style={{ flex: 1, lineHeight: 1.12 }}>{it.texto}</span>
          </div>
        );
      })}
    </div>
  );
};
