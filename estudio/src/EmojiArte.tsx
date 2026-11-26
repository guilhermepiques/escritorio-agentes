import React, { createContext, useContext } from 'react';
import { Img, staticFile } from 'remotion';
import type { Estilo } from './tipos';
import { fonteEmoji } from './estilos/fontes';

/** emoji → caminho do PNG/WebP 3D (Fluent Emoji, MIT), preenchido pelo render.mjs */
export const ContextoEmoji3D = createContext<Record<string, string>>({});

/**
 * Um emoji "solto" (não no meio de texto). No estilo com `emoji: "3d"` usa o
 * Fluent Emoji 3D da Microsoft; se não houver versão 3D, cai no Noto (plano).
 */
export const EmojiArte: React.FC<{ emoji: string; tamanho: number; estilo: Estilo; style?: React.CSSProperties }> = ({
  emoji,
  tamanho,
  estilo,
  style,
}) => {
  const mapa = useContext(ContextoEmoji3D);
  const arquivo = estilo.emoji === '3d' ? mapa[emoji] : undefined;
  if (arquivo) {
    return (
      <Img
        src={staticFile(arquivo)}
        style={{ width: tamanho * 1.05, height: tamanho * 1.05, objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle', ...style }}
      />
    );
  }
  return <span style={{ fontFamily: fonteEmoji(), fontSize: tamanho, lineHeight: 1.1, display: 'inline-block', ...style }}>{emoji}</span>;
};
