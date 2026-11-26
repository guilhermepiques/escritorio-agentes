import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { EmojiArte } from '../EmojiArte';
import { aleatorio, clamp, estiloCartao } from '../util';

type Dados = {
  emoji: string;
  diferente: string;
  linhas?: number;
  colunas?: number;
  posicao?: number; // índice do diferente (0 = primeiro); sem isso, sorteia
  revelarEm?: number;
};

export const GradeEmojis: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const linhas = dados.linhas ?? 7;
  const colunas = dados.colunas ?? 6;
  const total = linhas * colunas;
  const alvo = dados.posicao ?? Math.floor(aleatorio(total + (dados.emoji?.codePointAt(0) ?? 1)) * total);
  const celula = Math.min(800 / colunas, 860 / linhas);
  const largura = celula * colunas;

  const inicio = dados.entraEm ?? 0;
  const pRev = dados.revelarEm !== undefined ? spring({ frame: frame - Math.round(dados.revelarEm * fps), fps, config: { damping: 10, stiffness: 140 } }) : 0;
  const revelado = dados.revelarEm !== undefined && frame >= dados.revelarEm * fps;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          ...estiloCartao(estilo),
          width: largura + 40,
          padding: 20,
          display: 'grid',
          gridTemplateColumns: `repeat(${colunas}, ${celula}px)`,
          gridAutoRows: `${celula}px`,
          position: 'relative',
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const atraso = inicio + 0.015 * i;
          const p = continua ? 1 : spring({ frame: frame - Math.round(atraso * fps), fps, config: { damping: 14, stiffness: 200 } });
          const eAlvo = i === alvo;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${p * (revelado && eAlvo ? 1 + 0.35 * Math.min(1, pRev) : 1)})`,
                opacity: revelado && !eAlvo ? interpolate(pRev, [0, 1], [1, 0.25], clamp) : 1,
                position: 'relative',
              }}
            >
              <EmojiArte emoji={eAlvo ? dados.diferente : dados.emoji} tamanho={celula * 0.72} estilo={estilo} />
              {revelado && eAlvo ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: -celula * 0.12,
                    borderRadius: '50%',
                    border: `10px solid ${estilo.cores.destaque2}`,
                    transform: `scale(${interpolate(pRev, [0, 1], [2.5, 1])})`,
                    opacity: Math.min(1, pRev * 2),
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
