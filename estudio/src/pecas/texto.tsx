import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { LARGURA_UTIL, estiloCartao, estiloTitulo, tamanho, textoComDestaques } from '../util';

type Dados = {
  texto: string;
  destaque?: string[]; // "palavra#2" marca só a 2ª vez
  destaque2?: string[]; // palavras na cor destaque2
  corDestaque?: string; // troca a cor do destaque
  tamanho?: string | number;
  cor?: string;
  apoio?: boolean; // usa a fonte de apoio
  caixa?: boolean; // texto dentro de um cartão
  maquina?: boolean; // efeito máquina de escrever
};

export const Texto: React.FC<PropsPeca<Dados>> = ({ dados, estilo, continua }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - (dados.entraEm ?? 0);
  const maquina = (dados.maquina ?? estilo.animacao === 'maquina') && !continua;
  const texto = String(dados.texto ?? '');
  const visivel = maquina ? texto.slice(0, Math.max(0, Math.floor(t / Math.min(0.045, 1.2 / texto.length)))) : texto;
  const corpo = (
    <div style={estiloTitulo(estilo, { cor: dados.cor, tamanho: tamanho(dados.tamanho, 110), apoio: dados.apoio, texto, largura: dados.caixa ? LARGURA_UTIL - 100 : LARGURA_UTIL })}>
      {maquina && visivel.length < texto.length ? (
        <>
          {visivel}
          <span style={{ opacity: 0 }}>{texto.slice(visivel.length)}</span>
        </>
      ) : (
        textoComDestaques(texto, [
          { lista: dados.destaque, cor: dados.corDestaque ?? estilo.cores.destaque },
          { lista: dados.destaque2, cor: estilo.cores.destaque2 },
        ])
      )}
    </div>
  );
  if (!dados.caixa) return corpo;
  return <div style={{ ...estiloCartao(estilo), padding: '36px 44px' }}>{React.cloneElement(corpo, { style: { ...corpo.props.style, color: dados.cor ?? estilo.cores.cartaoTexto, WebkitTextStroke: undefined, textShadow: undefined } })}</div>;
};
