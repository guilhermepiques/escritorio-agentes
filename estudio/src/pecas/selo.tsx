import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Star } from '@remotion/shapes';
import type { PropsPeca } from '../tipos';
import { estiloTitulo } from '../util';

type Dados = {
  texto: string; // curto: "1%", "NOVO", "TOP 3"
  subtexto?: string;
  pontas?: number; // pontas da estrela (padrão 14)
  tamanho?: number; // diâmetro em px (padrão 420)
  cor?: string;
  corTexto?: string;
  escalaTexto?: number; // tamanho fixo do texto (fração de 0,3 x tamanho; quebra em linhas). Sem isso, o texto encolhe sozinho para caber
  girar?: boolean; // gira devagar (padrão sim)
};

/** Selo estourado (estrela de muitas pontas) com texto no meio — bom para gancho e destaque. */
export const Selo: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tam = dados.tamanho ?? 420;
  const giro = dados.girar === false ? 0 : (frame / fps) * 12;
  const cor = dados.cor ?? estilo.cores.destaque;
  const corTexto = dados.corTexto ?? estilo.cores.contorno;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: tam, height: tam }}>
        <div style={{ position: 'absolute', inset: 0, transform: `rotate(${giro}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Star
            points={dados.pontas ?? 14}
            innerRadius={tam * 0.4}
            outerRadius={tam / 2}
            fill={cor}
            stroke={estilo.cores.contorno}
            strokeWidth={estilo.sombra === 'dura' || estilo.contorno ? 8 : 0}
            cornerRadius={6}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-6deg)' }}>
          <div style={{ ...estiloTitulo(estilo, dados.escalaTexto ? { cor: corTexto, tamanho: tam * 0.3 * dados.escalaTexto } : { cor: corTexto, tamanho: tam * 0.3, texto: dados.texto, largura: tam * 0.62, maxLinhas: 2 }), WebkitTextStroke: undefined, textShadow: undefined, lineHeight: 1, width: dados.escalaTexto ? tam * 0.66 : undefined }}>
            {dados.texto}
          </div>
          {dados.subtexto ? (
            <div style={{ ...estiloTitulo(estilo, { cor: corTexto, tamanho: tam * 0.1, apoio: true, texto: dados.subtexto, largura: tam * 0.6, maxLinhas: 2 }), WebkitTextStroke: undefined, textShadow: undefined }}>
              {dados.subtexto}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
