import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { EmojiArte } from '../EmojiArte';
import { clamp, estiloCartao } from '../util';

type Lado = { texto: string; emoji?: string };
type Dados = {
  a: Lado;
  b: Lado;
  meio?: string; // texto do selo do meio (padrão "OU")
  porcentagens?: [number, number];
  revelarEm?: number;
};

export const Comparacao: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rev = dados.revelarEm !== undefined && dados.porcentagens ? interpolate(t, [dados.revelarEm, dados.revelarEm + 1], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const lados = [dados.a, dados.b];
  const vencedor = dados.porcentagens ? (dados.porcentagens[0] >= dados.porcentagens[1] ? 0 : 1) : -1;

  const cartao = (lado: Lado, i: number) => {
    const pct = dados.porcentagens?.[i] ?? 0;
    const cor = i === 0 ? estilo.cores.destaque : estilo.cores.destaque2;
    return (
      <div
        key={i}
        style={{
          ...estiloCartao(estilo),
          position: 'relative',
          overflow: 'hidden',
          padding: '34px 30px',
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          minHeight: 250,
          transform: rev > 0 && i === vencedor ? `scale(${1 + 0.04 * rev})` : undefined,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * rev}%`, background: cor, opacity: 0.35 }} />
        {lado.emoji ? <EmojiArte emoji={lado.emoji} tamanho={150} estilo={estilo} style={{ position: 'relative' }} /> : null}
        <span style={{ ...fonte(estilo.fonteApoio), fontSize: 64, lineHeight: 1.1, flex: 1, position: 'relative', color: estilo.cores.cartaoTexto }}>{lado.texto}</span>
        {rev > 0 ? (
          <span style={{ ...fonte(estilo.fonte), fontSize: 84, position: 'relative', color: estilo.cores.cartaoTexto }}>{Math.round(pct * rev)}%</span>
        ) : null}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', alignItems: 'stretch' }}>
      {cartao(lados[0], 0)}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-30px 0', zIndex: 2 }}>
        <div
          style={{
            ...fonte(estilo.fonte),
            fontSize: 64,
            padding: '10px 40px',
            borderRadius: 999,
            background: estilo.cores.contorno,
            color: estilo.cores.destaque,
            textTransform: 'uppercase',
          }}
        >
          {dados.meio ?? 'ou'}
        </div>
      </div>
      {cartao(lados[1], 1)}
    </div>
  );
};
