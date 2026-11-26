import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Check, X } from 'lucide-react';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { clamp, estiloCartao, estiloTitulo, tamanho, textoComDestaque } from '../util';

type Dados = {
  pergunta?: string;
  destaque?: string[];
  alternativas: string[];
  correta?: number; // posição da certa, começando em 0
  revelarEm?: number; // s; sem isso, não revela
  letras?: boolean;
  intervalo?: number; // s entre uma alternativa e outra aparecer
  tamanho?: string | number;
};

export const Pergunta: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inicio = dados.entraEm ?? 0;
  const intervalo = dados.intervalo ?? 0.22;
  const revelado = dados.revelarEm !== undefined && frame >= dados.revelarEm * fps;
  const pRev = dados.revelarEm !== undefined ? spring({ frame: frame - Math.round(dados.revelarEm * fps), fps, config: { damping: 9, stiffness: 160 } }) : 0;
  const letras = dados.letras ?? true;
  const alts = dados.alternativas ?? [];
  const tamanhoAlt = alts.length > 3 ? 54 : 62;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34, width: '100%' }}>
      {dados.pergunta ? (
        <div style={estiloTitulo(estilo, { tamanho: tamanho(dados.tamanho, 92), texto: dados.pergunta, maxLinhas: 3 })}>
          {textoComDestaque(dados.pergunta, dados.destaque, estilo.cores.destaque)}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {alts.map((alt, i) => {
          const ini = inicio + 0.25 + i * intervalo;
          const p = continua ? 1 : spring({ frame: frame - Math.round(ini * fps), fps, config: { damping: 14, stiffness: 170 } });
          const certa = i === dados.correta;
          const fundo = revelado && certa ? estilo.cores.destaque : estilo.cores.cartao;
          const opacidade = revelado && !certa ? interpolate(pRev, [0, 1], [1, 0.35], clamp) : 1;
          const escala = revelado && certa ? 1 + 0.06 * Math.sin(Math.min(1, pRev) * Math.PI) + 0.02 : 1;
          return (
            <div
              key={i}
              style={{
                ...estiloCartao(estilo, fundo),
                ...fonte(estilo.fonteApoio),
                color: revelado && certa ? estilo.cores.contorno : estilo.cores.cartaoTexto,
                fontSize: tamanhoAlt,
                padding: '22px 30px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                opacity: Math.min(p * 2, 1) * opacidade,
                transform: `translateX(${interpolate(p, [0, 1], [i % 2 ? 140 : -140, 0])}px) scale(${escala})`,
              }}
            >
              {letras ? (
                <span
                  style={{
                    minWidth: 78,
                    height: 78,
                    borderRadius: Math.min(estilo.cantos, 39),
                    background: revelado && certa ? estilo.cores.contorno : estilo.cores.destaque2,
                    color: revelado && certa ? estilo.cores.destaque : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 46,
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
              ) : null}
              <span style={{ flex: 1 }}>{alt}</span>
              {revelado && dados.correta !== undefined ? (
                <span style={{ transform: `scale(${Math.min(1, pRev)})`, display: 'flex' }}>
                  {certa ? <Check size={70} strokeWidth={4} /> : <X size={60} strokeWidth={4} />}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
