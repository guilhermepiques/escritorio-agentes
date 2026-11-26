import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Estilo, Legenda as TLegenda, Palavra } from './tipos';
import { fonte } from './estilos/fontes';
import { SEGURO } from './util';

type Grupo = { palavras: Palavra[]; inicio: number; fim: number };

/** Junta as palavras em grupos (quebra em pontuação e respeita o limite por vez). */
function agrupar(palavras: Palavra[], porVez: number, frase: boolean, textoOriginal: string): Grupo[] {
  const grupos: Grupo[] = [];
  let atual: Palavra[] = [];
  // posições de fim de frase no texto original, para quebrar o grupo nelas
  const fimDeFrase = (p: Palavra) => {
    const i = textoOriginal.indexOf(p.texto);
    if (i < 0) return false;
    const depois = textoOriginal.slice(i + p.texto.length, i + p.texto.length + 2);
    textoOriginal = textoOriginal.slice(i + p.texto.length);
    return /^[.!?…,;:]/.test(depois);
  };
  for (const p of palavras) {
    atual.push(p);
    const quebra = fimDeFrase(p);
    if ((!frase && atual.length >= porVez) || quebra) {
      grupos.push({ palavras: atual, inicio: atual[0].inicio, fim: atual[atual.length - 1].fim });
      atual = [];
    }
  }
  if (atual.length) grupos.push({ palavras: atual, inicio: atual[0].inicio, fim: atual[atual.length - 1].fim });
  return grupos;
}

export const Legenda: React.FC<{
  config: TLegenda;
  estilo: Estilo;
  palavras: Palavra[]; // tempos já contados do começo da cena
  texto: string;
}> = ({ config, estilo, palavras, texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (config.modo === 'desligada' || !palavras.length) return null;

  const porVez = config.modo === 'palavra' ? 1 : Math.max(1, config.palavrasPorVez);
  const grupos = agrupar(palavras, porVez, config.modo === 'frase', texto);

  // o grupo fica na tela até o próximo começar (se a pausa for curta)
  let ativo: Grupo | undefined;
  for (let i = 0; i < grupos.length; i++) {
    const g = grupos[i];
    const proximo = grupos[i + 1];
    const ate = proximo && proximo.inicio - g.fim < 0.8 ? proximo.inicio : g.fim + 0.5;
    if (t >= g.inicio - 0.05 && t < ate) ativo = g;
  }
  if (!ativo) return null;

  const f = fonte(config.fonte ?? estilo.fonte);
  const cor = config.cor ?? (config.caixa ? estilo.cores.cartaoTexto : '#FFFFFF');
  const corDestaque = config.corDestaque ?? estilo.cores.destaque;
  const entrada = spring({ frame: frame - Math.round(ativo.inicio * fps), fps, config: { damping: 14, stiffness: 200 } });

  const posicao: React.CSSProperties =
    config.posicao === 'cima'
      ? { top: SEGURO.topo }
      : config.posicao === 'meio'
        ? { top: 860 }
        : { bottom: SEGURO.base + 10 };

  return (
    <div
      style={{
        position: 'absolute',
        left: SEGURO.esquerda,
        right: SEGURO.direita - 40,
        ...posicao,
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${0.85 + entrada * 0.15})`,
      }}
    >
      <div
        style={{
          ...f,
          fontSize: config.tamanho,
          lineHeight: 1.15,
          textAlign: 'center',
          textTransform: config.maiusculas ? 'uppercase' : 'none',
          color: cor,
          padding: config.caixa ? '14px 30px' : 0,
          background: config.caixa ? (config.corCaixa ?? estilo.cores.cartao) : 'transparent',
          borderRadius: config.caixa ? Math.min(estilo.cantos, 30) : 0,
          WebkitTextStroke: config.caixa || config.contorno === 0 ? undefined : `${config.contorno ?? Math.round(config.tamanho / 9)}px ${config.corContorno ?? '#000'}`,
          paintOrder: 'stroke fill',
          maxWidth: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: '0.3em',
        }}
      >
        {ativo.palavras.map((p, i) => {
          // acende só a última palavra que começou (até a próxima começar)
          const atual = ativo!.palavras.reduce((a, w, k) => (t >= w.inicio ? k : a), -1);
          const falando = i === atual && t < (ativo!.palavras[i + 1]?.inicio ?? p.fim + 0.3);
          const jaFoi = t >= p.inicio;
          const destacar = config.modo === 'palavra' || falando;
          return (
            <span
              key={i}
              style={{
                color: destacar ? (config.caixa && !config.corDestaque ? estilo.cores.contorno : corDestaque) : cor,
                background: destacar && config.caixa ? (config.corDestaque ? undefined : estilo.cores.destaque) : undefined,
                borderRadius: 10,
                padding: destacar && config.caixa ? "0 10px" : undefined,
                opacity: config.modo === 'frase' && !jaFoi ? 0.55 : 1,
                display: 'inline-block',
                transform: falando && config.modo !== 'palavra' ? 'scale(1.06)' : undefined,
              }}
            >
              {p.texto}
            </span>
          );
        })}
      </div>
    </div>
  );
};
