import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { clamp } from '../util';

type Dados = {
  mito?: number; // pontos de MITO (contando o novo, se houver)
  verdade?: number; // pontos de VERDADE
  novo?: 'mito' | 'verdade'; // qual lado ganha um risquinho em `novoEm`
  novoEm?: number; // s
  crescerEm?: number; // s: o placar cresce e desce para o meio da tela
  rotuloA?: string; // padrão "MITO"
  rotuloB?: string; // padrão "VERDADE"
};

const PASSO = 32; // distância entre riscos
const GRUPO = PASSO * 5 + 20;

/** Riscos de giz em grupos de 5 (4 em pé e 1 cortando). O último (`n`-ésimo) é desenhado até `ultimo` (0 a 1). */
const Riscos: React.FC<{ n: number; cor: string; ultimo: number }> = ({ n, cor, ultimo }) => {
  const grupos = Math.max(1, Math.ceil(n / 5));
  return (
    <svg width={grupos * GRUPO} height={64} style={{ overflow: 'visible' }}>
      {Array.from({ length: n }, (_, i) => {
        const g = Math.floor(i / 5);
        const k = i % 5;
        const p = i === n - 1 ? ultimo : 1;
        const x0 = g * GRUPO;
        const [ax, ay, bx, by] = k < 4 ? [x0 + k * PASSO + 4, 4, x0 + k * PASSO, 60] : [x0 - 8, 52, x0 + 3 * PASSO + 12, 12];
        return (
          <line key={i} x1={ax} y1={ay} x2={ax + (bx - ax) * p} y2={ay + (by - ay) * p} stroke={cor} strokeWidth={8} strokeLinecap="round" opacity={0.95} />
        );
      })}
    </svg>
  );
};

/** Placar de giz: "MITO: n  VERDADE: n" com um risquinho por ponto. Pequeno no alto; `crescerEm` leva para o meio. */
export const Placar: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const novoAtivo = dados.novo !== undefined && dados.novoEm !== undefined;
  const novoT = dados.novoEm ?? 0;
  const antes = novoAtivo && t < novoT;
  const prog = novoAtivo ? interpolate(t, [novoT, novoT + 0.28], [0, 1], clamp) : 1;
  const crescer = dados.crescerEm !== undefined ? spring({ frame: frame - Math.round(dados.crescerEm * fps), fps, config: { damping: 12, stiffness: 120 } }) : 0;
  const coluna = (rotulo: string, lado: 'mito' | 'verdade', cor: string) => {
    const total = (lado === 'mito' ? dados.mito : dados.verdade) ?? 0;
    const eNovo = novoAtivo && dados.novo === lado;
    const n = eNovo && antes ? total - 1 : total;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 260 }}>
        <div style={{ ...fonte(estilo.fonteApoio), fontSize: 58, color: cor, lineHeight: 1 }}>
          {rotulo}: {n}
        </div>
        <div style={{ minHeight: 64 }}>{n > 0 ? <Riscos n={n} cor={cor} ultimo={eNovo && !antes ? prog : 1} /> : null}</div>
      </div>
    );
  };
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        transform: `translateY(${crescer * 300}px) scale(${1 + crescer * 0.3})`,
        transformOrigin: 'center top',
        marginBottom: crescer * 300,
      }}
    >
      <div style={{ display: 'flex', gap: 60, padding: '4px 20px 12px', borderBottom: `4px dashed ${estilo.cores.texto}66` }}>
        {coluna(dados.rotuloA ?? 'MITO', 'mito', estilo.cores.destaque)}
        {coluna(dados.rotuloB ?? 'VERDADE', 'verdade', estilo.cores.destaque2)}
      </div>
    </div>
  );
};
