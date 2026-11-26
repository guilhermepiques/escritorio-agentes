import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { EmojiArte } from '../EmojiArte';
import { suave, tempoDaFase, useChave, type DadosFases } from './fases';

// Ondas que se anulam. Fases:
//   onda: senoide (destaque) correndo da direita para a esquerda
//   invertida: aparece a espelhada (destaque2) embaixo
//   sobe / desce: marcam, num ponto, "sobe" na primeira e "desce" na segunda
//   soma: as duas se aproximam e se sobrepõem
//   reta: viram uma linha reta cinza e o movimento para
//   dupla: duas ondas lado a lado, grave (larga e lenta) e aguda (curtinha e rápida)
//   dupla-reta: a grave vira reta; a aguda só diminui e continua tremendo
type Dados = DadosFases & { escala?: number; cinza?: string; emojiGrave?: string; emojiAgudo?: string };

const W = 860;
const H = 440;
const Y1 = 120;
const Y2 = 320;
const A = 62;
const LAMBDA = 300;
const V = 150;

const SOLO = ['onda', 'invertida', 'sobe', 'desce', 'soma', 'reta'];
const VERDE = ['invertida', 'sobe', 'desce', 'soma'];
const SOBE = ['sobe', 'desce'];
const DESCE = ['desce'];
const DUPLA = ['dupla', 'dupla-reta'];
const GRAVE_RETA = ['dupla-reta'];

function senoide(x0: number, x1: number, y: number, amp: number, lambda: number, fase: number, sinal = 1): string {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 6) {
    const yy = y - sinal * amp * Math.sin((2 * Math.PI * (x + fase)) / lambda);
    pts.push(`${x === x0 ? 'M' : 'L'}${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  return pts.join(' ');
}

export const Ondas: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const roxo = estilo.cores.destaque;
  const verde = estilo.cores.destaque2;
  const cinza = dados.cinza ?? '#9AA5B4';
  const f = fonte(estilo.fonteApoio);

  const solo = useChave(dados, SOLO, 0.4);
  const verdeOn = useChave(dados, VERDE, 0.5);
  const sobe = useChave(dados, SOBE, 0.3);
  const desce = useChave(dados, DESCE, 0.3);
  const dupla = useChave(dados, DUPLA, 0.4);
  const graveReta = useChave(dados, GRAVE_RETA, 0.7);

  // soma: aproximação entre "soma" e "reta"
  const tSoma = tempoDaFase(dados, 'soma', 1e9);
  const tReta = tempoDaFase(dados, 'reta', tSoma + 1.5);
  const p = t < tSoma ? 0 : suave((t - tSoma) / Math.max(0.2, tReta - tSoma));
  const emReta = (dados.fases ?? []).includes('reta') && t >= tReta;
  // o movimento para quando vira linha reta
  const tMov = (dados.fases ?? []).includes('reta') ? Math.min(t, tReta) : t;
  const fase = tMov * V;
  const yVerde = Y2 + (Y1 - Y2) * p;
  const opOndas = 1 - suave((p - 0.75) / 0.25);
  const opReta = suave((p - 0.8) / 0.2);

  // marcador "sobe/desce": preso a um ponto da onda que cruza o zero subindo
  const tMarca = tempoDaFase(dados, 'sobe', tempoDaFase(dados, 'desce', 0));
  const n = Math.round((600 + V * tMarca) / LAMBDA);
  const xMarca = n * LAMBDA - V * t;
  const mostraMarca = xMarca > 60 && xMarca < W - 120;

  // dupla
  const faseG = t * 70;
  const faseA = t * 200;
  const ampG = A * (1 - graveReta);
  const ampA = 52 * (1 - 0.65 * graveReta);

  const caixa = (x: number, y: number, txt: string, cor: string) => (
    <g transform={`translate(${x} ${y})`}>
      <text style={{ ...f, fontSize: 54 }} fill={cor} textAnchor="start">
        {txt}
      </text>
    </g>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <svg width={W * (dados.escala ?? 1)} height={(H) * (dados.escala ?? 1)} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* solo / invertida / soma */}
        <g opacity={solo}>
          <g opacity={opOndas}>
            <path d={senoide(0, W - 20, Y1, A, LAMBDA, fase)} fill="none" stroke={roxo} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g opacity={verdeOn * opOndas}>
            <path d={senoide(0, W - 20, yVerde, A, LAMBDA, fase, -1)} fill="none" stroke={verde} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g opacity={opReta}>
            <line x1={0} y1={Y1} x2={W - 20} y2={Y1} stroke={cinza} strokeWidth={8} strokeLinecap="round" />
          </g>
          {mostraMarca && !emReta ? (
            <g>
              <g opacity={sobe}>
                <circle cx={xMarca} cy={Y1} r={11} fill={roxo} />
                <g transform={`translate(${xMarca + 34} ${Y1})`}>
                  <line x1={0} y1={26} x2={0} y2={-26} stroke={roxo} strokeWidth={9} strokeLinecap="round" />
                  <polygon points="-18,-18 18,-18 0,-44" fill={roxo} />
                </g>
                {caixa(xMarca + 62, Y1 - 52, 'sobe', roxo)}
              </g>
              <g opacity={desce * (1 - opReta)}>
                <circle cx={xMarca} cy={Y2} r={11} fill={verde} />
                <g transform={`translate(${xMarca + 34} ${Y2})`}>
                  <line x1={0} y1={-26} x2={0} y2={26} stroke={verde} strokeWidth={9} strokeLinecap="round" />
                  <polygon points="-18,18 18,18 0,44" fill={verde} />
                </g>
                {caixa(xMarca + 62, Y2 + 62, 'desce', verde)}
              </g>
            </g>
          ) : null}
        </g>

        {/* grave x aguda */}
        <g opacity={dupla}>
          <path d={senoide(0, 400, 230, ampG, 300, faseG)} fill="none" stroke={roxo} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={0} y1={230} x2={400} y2={230} stroke={cinza} strokeWidth={8} strokeLinecap="round" opacity={graveReta} />
          <path d={senoide(450, W - 20, 230, ampA, 62, faseA)} fill="none" stroke={roxo} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 20, width: W, height: 110, opacity: dupla }}>
        <div style={{ position: 'absolute', left: 200 - 55, top: 0 }}>
          <EmojiArte emoji={dados.emojiGrave ?? '🚗'} tamanho={100} estilo={estilo} />
        </div>
        <div style={{ position: 'absolute', left: 655 - 55, top: 0 }}>
          <EmojiArte emoji={dados.emojiAgudo ?? '🔔'} tamanho={100} estilo={estilo} />
        </div>
      </div>
    </div>
  );
};
