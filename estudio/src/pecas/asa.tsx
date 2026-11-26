import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { integralChave, suave, useChave, type DadosFases } from './fases';

// Fases: fluxo (linhas de ar contornando a asa), curva (linhas de trás curvam para baixo),
// menos (aparece o "−" em cima), pressao ("−" e "+"; em cima o ar corre mais rápido),
// baixo (setas azuis para baixo atrás da asa), forca (e seta laranja para cima), vacuo (sem ar).
type Dados = DadosFases & { escala?: number; cor?: string; corAr?: string; corForca?: string; largura?: number };

const W = 860;
const H = 560;
const CX = 400;
const CY = 300;

const LINHAS_AR = ['fluxo', 'curva', 'menos', 'pressao', 'baixo', 'forca'];
const CURVA = ['curva', 'menos', 'pressao', 'baixo', 'forca'];
const MENOS = ['menos', 'pressao', 'baixo', 'forca'];
const MAIS = ['pressao', 'baixo', 'forca'];
const RAPIDO = ['pressao', 'baixo', 'forca'];
const BAIXO = ['baixo', 'forca'];
const FORCA = ['forca'];

function caminhoLinha(y0: number, cima: boolean, curva: number): string {
  const pts: string[] = [];
  for (let x = -40; x <= W + 40; x += 12) {
    const dx = x - CX;
    const bump = Math.exp(-Math.pow(dx / 170, 2));
    let y = y0 + (cima ? -1 : 1) * 26 * bump;
    // atrás da asa as linhas são desviadas para baixo
    y += curva * (cima ? 92 : 70) * suave((dx - 170) / 300);
    pts.push(`${x === -40 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

const Seta: React.FC<{ x: number; y: number; comprimento: number; cima: boolean; cor: string; progresso: number }> = ({ x, y, comprimento, cima, cor, progresso }) => {
  if (progresso <= 0.01) return null;
  const c = comprimento * progresso;
  const dir = cima ? -1 : 1;
  const topo = y + dir * c;
  return (
    <g opacity={Math.min(1, progresso * 2)}>
      <line x1={x} y1={y} x2={x} y2={topo - dir * 26} stroke={cor} strokeWidth={22} strokeLinecap="round" />
      <polygon points={`${x - 34},${topo - dir * 40} ${x + 34},${topo - dir * 40} ${x},${topo}`} fill={cor} />
    </g>
  );
};

export const Asa: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cor = dados.cor ?? estilo.cores.texto;
  const corAr = dados.corAr ?? estilo.cores.destaque;
  const corForca = dados.corForca ?? estilo.cores.destaque2;

  const ar = useChave(dados, LINHAS_AR);
  const curva = useChave(dados, CURVA, 0.9);
  const menos = useChave(dados, MENOS);
  const mais = useChave(dados, MAIS);
  const baixo = useChave(dados, BAIXO, 0.6);
  const forca = useChave(dados, FORCA, 0.6);

  const base = 250;
  const extra = integralChave(dados, RAPIDO, t, 0.8) * base;
  const faseCima = t * base + extra * 0.7; // em cima o ar corre mais rápido
  const faseBaixo = t * base - extra * 0.25;

  const cima = [-175, -215, -255];
  const baixoY = [122, 162, 202];

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={W * (dados.escala ?? 1)} height={(H) * (dados.escala ?? 1)} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <g transform={`translate(0 ${CY})`} opacity={ar}>
          {cima.map((y, i) => (
            <path key={`c${i}`} d={caminhoLinha(y, true, curva)} fill="none" stroke={corAr} strokeWidth={7} strokeLinecap="round" strokeDasharray="70 46" strokeDashoffset={-(faseCima + i * 37)} opacity={0.95 - i * 0.12} />
          ))}
          {baixoY.map((y, i) => (
            <path key={`b${i}`} d={caminhoLinha(y, false, curva)} fill="none" stroke={corAr} strokeWidth={7} strokeLinecap="round" strokeDasharray="70 46" strokeDashoffset={-(faseBaixo + i * 53)} opacity={0.95 - i * 0.12} />
          ))}
        </g>

        {/* setas de ação e reação */}
        <Seta x={CX + 262} y={CY - 30} comprimento={130} cima={false} cor={corAr} progresso={baixo} />
        <Seta x={CX + 352} y={CY - 10} comprimento={110} cima={false} cor={corAr} progresso={baixo} />

        {/* a asa em corte, inclinada (nariz uns 5 graus pra cima) */}
        <g transform={`translate(${CX} ${CY}) rotate(-5)`}>
          <path
            d="M -210 0 C -210 -52 -120 -66 -20 -58 C 90 -50 165 -18 212 8 C 120 10 0 24 -90 26 C -170 27 -210 22 -210 0 Z"
            fill={cor}
          />
        </g>

        <Seta x={CX + 40} y={CY - 66} comprimento={150} cima cor={corForca} progresso={forca} />

        {/* sinais de pressão */}
        <g opacity={menos} transform={`translate(${CX - 110} ${CY - 112 - (1 - menos) * 12})`}>
          <circle r={34} fill={corAr} />
          <rect x={-18} y={-4} width={36} height={8} rx={4} fill="#fff" />
        </g>
        <g opacity={mais} transform={`translate(${CX - 90} ${CY + 76 + (1 - mais) * 12})`}>
          <circle r={34} fill={corForca} />
          <rect x={-18} y={-4} width={36} height={8} rx={4} fill="#fff" />
          <rect x={-4} y={-18} width={8} height={36} rx={4} fill="#fff" />
        </g>
      </svg>
    </div>
  );
};
