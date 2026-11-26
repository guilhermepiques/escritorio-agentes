import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { suave, tempoDaFase, useChave, type DadosFases } from './fases';

// Prato visto de cima com mapa de calor. Fases:
//   frio-quente: borda laranja com vapor, centro azul
//   ondas: ondas entram pelos lados e param perto da borda
//   conducao: o calor avança da borda ao centro (dura `duracaoConducao` s)
//   girando: o prato gira, por baixo de pontos quentes fixos
type Dados = DadosFases & { escala?: number; duracaoConducao?: number; corPrato?: string };

const S = 540;
const C = S / 2;
const CY = 320;
const R = 205; // comida
const RP = 250; // prato

function mistura(a: string, b: string, p: number): string {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const x = h(a);
  const y = h(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(',')})`;
}

export const Prato: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const quente = estilo.cores.destaque;
  const frio = estilo.cores.destaque2;
  const corPrato = dados.corPrato ?? '#D9D5CF';

  const vapor = useChave(dados, ['frio-quente']);
  const ondas = useChave(dados, ['ondas'], 0.5);
  const girando = useChave(dados, ['girando'], 0.4);

  const tCond = tempoDaFase(dados, 'conducao', 1e9);
  const tGira = tempoDaFase(dados, 'girando', 1e9);
  const durCond = dados.duracaoConducao ?? 2;
  const prog = t >= tGira ? 1 : suave((t - tCond) / durCond);

  const inner = 0.62 - 0.62 * prog;
  const centro = mistura(frio, quente, Math.min(1, prog * 0.85));
  const giro = t >= tGira ? (t - tGira) * 40 : 0;

  const pedacos = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + i;
    const r = 40 + ((i * 37) % 110);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 14 + (i % 3) * 5 };
  });
  const manchas = [
    [-95, -90],
    [85, -110],
    [135, 20],
    [30, 100],
    [-110, 60],
    [0, -10],
  ];

  const lados = [0, 90, 180, 270];
  const ciclo = 1.4;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={S * (dados.escala ?? 1)} height={(S + 70) * (dados.escala ?? 1)} viewBox={`0 0 ${S} ${S + 70}`} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="prato-calor" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={centro} />
            <stop offset={Math.max(0.001, inner)} stopColor={centro} />
            <stop offset={Math.min(1, inner + 0.38)} stopColor={quente} />
            <stop offset="1" stopColor={quente} />
          </radialGradient>
          <radialGradient id="prato-mancha">
            <stop offset="0" stopColor={quente} stopOpacity={0.75} />
            <stop offset="1" stopColor={quente} stopOpacity={0} />
          </radialGradient>
        </defs>

        <g opacity={vapor} transform={`translate(${C} ${CY - R - 4})`}>
          {[-70, 0, 70].map((x, i) => {
            const d = Math.sin(t * 3 + i * 1.7) * 9;
            return (
              <path
                key={i}
                d={`M ${x} 0 C ${x - 22 + d} -22, ${x + 22 - d} -44, ${x} -66 S ${x - 20 + d} -104, ${x} -122`}
                fill="none"
                stroke={quente}
                strokeWidth={9}
                strokeLinecap="round"
                opacity={0.8 - i * 0.05}
                transform={`translate(0 ${-Math.abs(Math.sin(t * 1.6 + i)) * 10})`}
              />
            );
          })}
        </g>

        <g transform={`translate(${C} ${CY})`}>
          <circle r={RP} fill={corPrato} stroke="#B9B4AD" strokeWidth={8} />
          <circle r={RP - 28} fill="none" stroke="#C6C1BA" strokeWidth={4} />
          <g transform={`rotate(${giro})`}>
            <circle r={R} fill="url(#prato-calor)" />
            {pedacos.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.s} fill="#000" opacity={0.16} />
            ))}
          </g>
          <g opacity={girando}>
            {manchas.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={56} fill="url(#prato-mancha)" stroke={quente} strokeWidth={4} strokeDasharray="10 8" />
            ))}
          </g>
          <g opacity={ondas}>
            {lados.map((ang) =>
              [0, 1, 2].map((k) => {
                const fase = (((t / ciclo + k / 3) % 1) + 1) % 1;
                const r = RP + 38 - fase * (RP + 38 - (R - 62));
                const op = Math.min(1, fase * 5) * (1 - Math.max(0, (fase - 0.6) / 0.4));
                const a = 0.62;
                const px = (s: number) => Math.cos(s) * r;
                const py = (s: number) => Math.sin(s) * r;
                return (
                  <path
                    key={`${ang}-${k}`}
                    d={`M ${px(-a)} ${py(-a)} A ${r} ${r} 0 0 1 ${px(a)} ${py(a)}`}
                    transform={`rotate(${ang})`}
                    fill="none"
                    stroke={quente}
                    strokeWidth={9}
                    strokeLinecap="round"
                    opacity={op * 0.95}
                  />
                );
              }),
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};
