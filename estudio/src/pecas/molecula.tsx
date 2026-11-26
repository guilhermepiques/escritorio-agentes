import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { suave } from './fases';

// Molécula de água (H2O): oxigênio vermelho grande e dois hidrogênios brancos, em V.
// `chacoalhaEm`: começa a chacoalhar. `calorEm`: aparecem as linhas de calor.
type Dados = { chacoalhaEm?: number; calorEm?: number; tamanho?: number };

export const Molecula: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tam = dados.tamanho ?? 1;
  const ch = dados.chacoalhaEm === undefined ? 0 : suave((t - dados.chacoalhaEm) / 0.3);
  const calor = dados.calorEm === undefined ? 0 : suave((t - dados.calorEm) / 0.4);
  const rot = Math.sin(t * 26) * 22 * ch;
  const dx = Math.sin(t * 31) * 14 * ch;
  const dy = Math.cos(t * 23) * 10 * ch;
  const quente = estilo.cores.destaque;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={460 * tam} height={300 * tam} viewBox="0 0 460 300" style={{ overflow: 'visible' }}>
        <g transform={`translate(${230 + dx} ${130 + dy}) rotate(${rot})`}>
          <line x1={0} y1={0} x2={-85} y2={85} stroke="#8A8A8A" strokeWidth={14} strokeLinecap="round" />
          <line x1={0} y1={0} x2={85} y2={85} stroke="#8A8A8A" strokeWidth={14} strokeLinecap="round" />
          <circle cx={-92} cy={95} r={36} fill="#FFFFFF" stroke="#9A9A9A" strokeWidth={5} />
          <circle cx={92} cy={95} r={36} fill="#FFFFFF" stroke="#9A9A9A" strokeWidth={5} />
          <circle r={62} fill="#E5484D" stroke="#B3262B" strokeWidth={5} />
          <circle cx={-20} cy={-22} r={14} fill="#fff" opacity={0.35} />
        </g>
        <g opacity={calor}>
          {[-1, 0, 1].map((k) => {
            const x = 230 + k * 120;
            const d = Math.sin(t * 6 + k) * 8;
            return (
              <path
                key={k}
                d={`M ${x} 4 C ${x - 14 + d} -16, ${x + 14 - d} -34, ${x} -54`}
                fill="none"
                stroke={quente}
                strokeWidth={10}
                strokeLinecap="round"
                transform={`translate(0 ${-(1 - calor) * 14})`}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
