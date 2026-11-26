import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { EmojiArte } from '../EmojiArte';
import { LARGURA_UTIL, estiloCartao, estiloTitulo, tamanho, textoComDestaque } from '../util';

type Dados = { texto: string; emoji?: string; subtexto?: string; destaque?: string[]; tamanho?: string | number };

/** Chamada final ("comenta quantas acertou"), com emoji pulando. */
export const Chamada: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pulo = Math.abs(Math.sin(t * Math.PI * 1.8)) * -40;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
      <div style={{ ...estiloCartao(estilo, estilo.cores.destaque), padding: '34px 44px', transform: `rotate(-2deg)` }}>
        <div style={{ ...estiloTitulo(estilo, { cor: estilo.cores.contorno, tamanho: tamanho(dados.tamanho, 96), texto: dados.texto, largura: LARGURA_UTIL - 110 }), WebkitTextStroke: undefined, textShadow: undefined }}>
          {textoComDestaque(dados.texto, dados.destaque, estilo.cores.destaque2)}
        </div>
      </div>
      {dados.subtexto ? <div style={estiloTitulo(estilo, { tamanho: 56, apoio: true })}>{dados.subtexto}</div> : null}
      {dados.emoji !== '' ? (
        <div style={{ transform: `translateY(${pulo}px)` }}>
          <EmojiArte emoji={dados.emoji ?? '👇'} tamanho={170} estilo={estilo} />
        </div>
      ) : null}
    </div>
  );
};
