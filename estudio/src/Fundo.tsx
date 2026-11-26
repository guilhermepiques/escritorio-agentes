import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { Estilo } from './tipos';
import { aleatorio } from './util';
import { EmojiArte } from './EmojiArte';
import { noise2D } from '@remotion/noise';

/** Fundo da cena. `inicioGlobal` (quadros) mantém o movimento contínuo entre cenas. */
export const Fundo: React.FC<{ estilo: Estilo; inicioGlobal: number }> = ({ estilo, inicioGlobal }) => {
  const f = useCurrentFrame() + inicioGlobal;
  const { cores, fundo } = estilo;
  const mov = fundo.movimento === false ? 0 : 1;
  const base: React.CSSProperties = { background: cores.fundo };

  switch (fundo.tipo) {
    case 'degrade':
      return (
        <AbsoluteFill
          style={{ background: `linear-gradient(${160 + Math.sin(f / 60) * 20 * mov}deg, ${cores.fundo}, ${cores.fundo2})` }}
        />
      );
    case 'bolinhas': {
      const d = (f * 0.6 * mov) % 90;
      return (
        <AbsoluteFill
          style={{
            ...base,
            backgroundImage: `radial-gradient(${cores.fundo2} 14px, transparent 15px)`,
            backgroundSize: '90px 90px',
            backgroundPosition: `${d}px ${d}px`,
          }}
        />
      );
    }
    case 'listras': {
      const d = (f * 1.2 * mov) % 120;
      return (
        <AbsoluteFill
          style={{
            ...base,
            backgroundImage: `repeating-linear-gradient(45deg, ${cores.fundo2} 0 60px, transparent 60px 120px)`,
            backgroundPosition: `${d}px 0`,
            backgroundSize: '170px 170px',
          }}
        />
      );
    }
    case 'grade': {
      const d = (f * 1.0 * mov) % 100;
      return (
        <AbsoluteFill
          style={{
            ...base,
            backgroundImage: `linear-gradient(${cores.fundo2} 3px, transparent 3px), linear-gradient(90deg, ${cores.fundo2} 3px, transparent 3px)`,
            backgroundSize: '100px 100px',
            backgroundPosition: `0 ${d}px`,
          }}
        />
      );
    }
    case 'raios': {
      const giro = f * 0.25 * mov;
      return (
        <AbsoluteFill style={{ ...base, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              left: -900,
              top: -500,
              width: 2880,
              height: 2880,
              transform: `rotate(${giro}deg)`,
              background: `repeating-conic-gradient(from 0deg at 50% 50%, ${cores.fundo2} 0deg 10deg, ${cores.fundo} 10deg 20deg)`,
            }}
          />
        </AbsoluteFill>
      );
    }
    case 'formas':
    case 'emojis': {
      const itens = Array.from({ length: 14 }, (_, i) => {
        const x = aleatorio(i + 1) * 1080;
        const y0 = aleatorio(i + 50) * 1920;
        const vel = 0.4 + aleatorio(i + 99) * 0.8;
        const y = ((y0 - f * vel * mov) % 2100 + 2100) % 2100 - 120;
        const t = 60 + aleatorio(i + 7) * 120;
        const giro = f * (aleatorio(i + 3) - 0.5) * 2 * mov;
        if (fundo.tipo === 'emojis') {
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: 0.22, transform: `rotate(${giro}deg)` }}>
              <EmojiArte emoji={fundo.emoji ?? '✨'} tamanho={t * 0.8} estilo={estilo} />
            </div>
          );
        }
        const forma = i % 3;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: t,
              height: t,
              opacity: 0.55,
              transform: `rotate(${giro}deg)`,
              background: forma === 2 ? 'transparent' : i % 2 ? cores.fundo2 : cores.destaque2,
              border: forma === 2 ? `14px solid ${cores.fundo2}` : undefined,
              borderRadius: forma === 0 ? '50%' : forma === 1 ? 18 : '50%',
            }}
          />
        );
      });
      return <AbsoluteFill style={{ ...base, overflow: 'hidden' }}>{itens}</AbsoluteFill>;
    }
    case 'manchas': {
      // manchas grandes e macias que "respiram" (ruído orgânico)
      const manchas = Array.from({ length: 6 }, (_, i) => {
        const t = (f / 30) * 0.12 * mov;
        const x = 540 + noise2D(`x${i}`, i * 3.1, t) * 620;
        const y = 960 + noise2D(`y${i}`, t, i * 2.7) * 1050;
        const r = 380 + noise2D(`r${i}`, i, t * 0.7) * 140;
        const cor = i % 3 === 0 ? cores.destaque2 : i % 3 === 1 ? cores.fundo2 : cores.destaque;
        return (
          <div
            key={i}
            style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: cor, opacity: i % 3 === 2 ? 0.25 : 0.55, filter: 'blur(90px)' }}
          />
        );
      });
      return <AbsoluteFill style={{ ...base, overflow: 'hidden' }}>{manchas}</AbsoluteFill>;
    }
    case 'chapado':
    default:
      return <AbsoluteFill style={base} />;
  }
};
