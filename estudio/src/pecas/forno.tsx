import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { suave } from './fases';

// Caixa do forno vista de frente: ondas batendo e voltando nas paredes (`ondasEm`),
// pontos quentes (`quentesEm`, destaque) e frios (`friosEm`, destaque2) alternados.
type Dados = { escala?: number; ondasEm?: number; quentesEm?: number; friosEm?: number };

const W = 600;
const H = 440;

export const Forno: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const quente = estilo.cores.destaque;
  const frio = estilo.cores.destaque2;
  const on = dados.ondasEm === undefined ? 1 : suave((t - dados.ondasEm) / 0.3);
  const qu = dados.quentesEm === undefined ? 1 : suave((t - dados.quentesEm) / 0.4);
  const fr = dados.friosEm === undefined ? 1 : suave((t - dados.friosEm) / 0.4);

  const linhas = [105, 220, 335];
  const manchas: { x: number; y: number; quente: boolean }[] = [];
  [0, 1, 2, 3].forEach((c) => [0, 1].forEach((l) => manchas.push({ x: 110 + c * 127, y: 150 + l * 140, quente: (c + l) % 2 === 0 })));

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={W * (dados.escala ?? 1)} height={H * (dados.escala ?? 1)} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="forno-q">
            <stop offset="0" stopColor={quente} stopOpacity={0.95} />
            <stop offset="1" stopColor={quente} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="forno-f">
            <stop offset="0" stopColor={frio} stopOpacity={0.95} />
            <stop offset="1" stopColor={frio} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={10} y={10} width={W - 20} height={H - 20} rx={26} fill="rgba(128,128,128,0.08)" stroke="#8C8C8C" strokeWidth={14} />
        {manchas.map((m, i) => (
          <circle key={i} cx={m.x + 20} cy={m.y} r={66} fill={m.quente ? 'url(#forno-q)' : 'url(#forno-f)'} opacity={m.quente ? qu : fr} />
        ))}
        {linhas.map((y, i) => {
          const ciclo = 1.8;
          const p = (((t / ciclo + i * 0.3) % 1) + 1) % 1;
          const ida = p < 0.5;
          const x = ida ? 60 + (p / 0.5) * (W - 120) : W - 60 - ((p - 0.5) / 0.5) * (W - 120);
          const dir = ida ? 1 : -1;
          return (
            <g key={i} opacity={on} transform={`translate(${x} ${y})`}>
              <line x1={-dir * 54} y1={0} x2={dir * 6} y2={0} stroke={quente} strokeWidth={12} strokeLinecap="round" />
              <polygon points={`${dir * 34},-22 ${dir * 34},22 ${dir * 62},0`} fill={quente} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
