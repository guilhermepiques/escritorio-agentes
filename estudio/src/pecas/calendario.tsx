import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { EmojiArte } from '../EmojiArte';
import { clamp, estiloCartao } from '../util';

type Dados = {
  mes?: string; // cabeçalho (padrão "NOVEMBRO")
  dias?: { nome: string; numero: number }[]; // uma semana (padrão SEG 23 ... DOM 29, de novembro de 2026)
  destacar?: string[]; // nomes dos dias em destaque (padrão ["QUI", "SEX"])
  emojiDia?: { dia: string; emoji: string; etiqueta?: string }; // emoji pequeno e etiqueta sobre um dia
  circulo?: 'dia' | 'numero'; // o que o círculo vermelho envolve
  circuloDia?: string; // nome do dia circulado (ex.: "SEX")
  circuloEm?: number; // s: quando o traço começa (leva 0,4 s)
  largura?: number;
};

const SEMANA = [
  { nome: 'SEG', numero: 23 },
  { nome: 'TER', numero: 24 },
  { nome: 'QUA', numero: 25 },
  { nome: 'QUI', numero: 26 },
  { nome: 'SEX', numero: 27 },
  { nome: 'SÁB', numero: 28 },
  { nome: 'DOM', numero: 29 },
];

/** Calendário de uma semana: cabeçalho colorido, dois dias em destaque e um círculo desenhado à mão. */
export const Calendario: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dias = dados.dias ?? SEMANA;
  const destaque = dados.destacar ?? ['QUI', 'SEX'];
  const larg = dados.largura ?? 840;
  const celula = (larg - 40) / dias.length;
  const altCelula = 190;
  const cab = 96;
  const idxCirc = dados.circuloDia ? dias.findIndex((d) => d.nome === dados.circuloDia) : -1;
  const progCirc = dados.circuloEm !== undefined ? interpolate(t, [dados.circuloEm, dados.circuloEm + 0.4], [0, 1], clamp) : 0;
  const idxEmoji = dados.emojiDia ? dias.findIndex((d) => d.nome === dados.emojiDia!.dia) : -1;

  // elipse à mão em torno do dia ou só do número (as medidas do traço, em px dentro do corpo do calendário)
  const cx = 20 + (idxCirc + 0.5) * celula;
  const alvoNumero = dados.circulo === 'numero';
  const cy = alvoNumero ? 129 : 107;
  const rx = alvoNumero ? celula * 0.62 : celula * 0.6;
  const ry = alvoNumero ? 46 : 92;
  // caminho aberto de ~1,15 volta, levemente torto, para parecer feito à mão
  const pontos = Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2.3 - Math.PI * 0.5;
    const torto = 1 + 0.06 * Math.sin(a * 2 + 1);
    return [cx + Math.cos(a) * rx * torto * (1 + i * 0.002), cy + Math.sin(a) * ry * torto + i * 0.12] as const;
  });
  const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const comprimento = 4200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ ...estiloCartao(estilo), width: larg, overflow: 'visible', position: 'relative', borderRadius: Math.max(estilo.cantos, 6) }}>
        <div
          style={{
            ...fonte(estilo.fonte),
            background: estilo.cores.destaque,
            color: '#FFFFFF',
            height: cab,
            fontSize: 70,
            letterSpacing: 6,
            textAlign: 'center',
            lineHeight: `${cab}px`,
            borderRadius: `${Math.max(estilo.cantos, 6)}px ${Math.max(estilo.cantos, 6)}px 0 0`,
          }}
        >
          {dados.mes ?? 'NOVEMBRO'}
        </div>
        <div style={{ position: 'relative', display: 'flex', padding: '12px 20px 20px', gap: 0 }}>
          {dias.map((dia, i) => {
            const forte = destaque.includes(dia.nome);
            return (
              <div
                key={dia.nome}
                style={{
                  width: celula,
                  height: altCelula,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 10,
                  background: forte ? '#FFFFFF22' : 'transparent',
                  opacity: forte ? 1 : 0.5,
                }}
              >
                <div style={{ ...fonte(estilo.fonteApoio), fontSize: 38, color: forte ? estilo.cores.destaque : estilo.cores.destaque2, letterSpacing: 1 }}>{dia.nome}</div>
                <div style={{ ...fonte(estilo.fonte), fontSize: 82, color: estilo.cores.cartaoTexto, lineHeight: 1 }}>{dia.numero}</div>
                {i === idxEmoji ? (
                  <div style={{ marginTop: -4 }}>
                    <EmojiArte emoji={dados.emojiDia!.emoji} tamanho={46} estilo={estilo} />
                  </div>
                ) : null}
              </div>
            );
          })}
          {idxCirc >= 0 ? (
            <svg style={{ position: 'absolute', left: 0, top: 0, width: larg, height: altCelula + 40, overflow: 'visible' }}>
              <path
                d={d}
                fill="none"
                stroke={estilo.cores.destaque}
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={comprimento}
                strokeDashoffset={comprimento * (1 - (continua ? 1 : progCirc))}
                opacity={progCirc > 0 || continua ? 1 : 0}
              />
            </svg>
          ) : null}
        </div>
      </div>
      {dados.emojiDia?.etiqueta ? (
        <div
          style={{
            ...fonte(estilo.fonteApoio),
            fontSize: 44,
            letterSpacing: 2,
            padding: '8px 26px',
            borderRadius: 999,
            background: estilo.cores.destaque2,
            color: estilo.cores.fundo,
            textTransform: 'uppercase',
          }}
        >
          {dados.emojiDia.etiqueta}
        </div>
      ) : null}
    </div>
  );
};
