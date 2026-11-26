import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { clamp, estiloTitulo, tamanho } from '../util';

type Dados = {
  ate: number;
  de?: number;
  prefixo?: string;
  sufixo?: string;
  legenda?: string; // texto pequeno embaixo do número
  comecaEm?: number;
  duracaoContagem?: number;
  casas?: number;
  tamanho?: string | number;
  cor?: string;
};

export const Numero: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const comeca = dados.comecaEm ?? dados.entraEm ?? 0;
  const dur = dados.duracaoContagem ?? 1.2;
  const v = continua
    ? dados.ate
    : interpolate(frame / fps, [comeca, comeca + dur], [dados.de ?? 0, dados.ate], { ...clamp, easing: Easing.out(Easing.cubic) });
  const casas = dados.casas ?? 0;
  const texto = v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const tam = tamanho(dados.tamanho, 240);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ ...estiloTitulo(estilo, { cor: dados.cor ?? estilo.cores.destaque, tamanho: tam, texto: `${dados.prefixo ?? ''}${dados.ate.toLocaleString('pt-BR')}${dados.sufixo ?? ''}`, maxLinhas: 1 }), lineHeight: 1 }}>
        {dados.prefixo ?? ''}
        {texto}
        {dados.sufixo ?? ''}
      </div>
      {dados.legenda ? <div style={estiloTitulo(estilo, { tamanho: Math.round(tam * 0.3), apoio: true, texto: dados.legenda, maxLinhas: 2 })}>{dados.legenda}</div> : null}
    </div>
  );
};
