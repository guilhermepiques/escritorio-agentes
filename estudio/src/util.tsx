import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Animacao, Estilo } from './tipos';
import { fonte } from './estilos/fontes';

/** Área segura (px) — a interface do TikTok/Reels cobre topo, rodapé e lateral direita. */
export const SEGURO = { topo: 230, base: 440, esquerda: 70, direita: 150 };

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Progresso 0→1 de uma mola começando em `inicio` (s). */
export function useMola(inicio = 0, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - Math.round(inicio * fps), fps, config: { damping: 12, stiffness: 140, ...config } });
}

/** Segundos desde o começo da cena. */
export function useSegundos() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

/** Estilo de transformação de entrada para um elemento, conforme a animação escolhida. */
export function useEntrada(animacao: Animacao, inicio = 0, desligada = false): React.CSSProperties {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - Math.round(inicio * fps), fps, config: { damping: 13, stiffness: 150 } });
  const linear = interpolate(frame - inicio * fps, [0, 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (desligada) return {};
  if (frame < inicio * fps) return { opacity: 0 };
  switch (animacao) {
    case 'pop':
      return { transform: `scale(${interpolate(p, [0, 1], [0.4, 1])})`, opacity: Math.min(1, p * 3) };
    case 'deslizar':
      return { transform: `translateX(${interpolate(linear, [0, 1], [260, 0])}px)`, opacity: linear };
    case 'zoom':
      return { transform: `scale(${interpolate(linear, [0, 1], [1.6, 1])})`, opacity: linear };
    case 'girar':
      return { transform: `rotate(${interpolate(p, [0, 1], [-25, 0])}deg) scale(${interpolate(p, [0, 1], [0.5, 1])})`, opacity: Math.min(1, p * 3) };
    case 'subir':
    case 'maquina':
    default:
      return { transform: `translateY(${interpolate(linear, [0, 1], [90, 0])}px)`, opacity: linear };
  }
}

let contexto: CanvasRenderingContext2D | null = null;
function larguraTexto(t: string, familia: string, peso: number, tam: number) {
  contexto ??= document.createElement('canvas').getContext('2d');
  if (!contexto) return t.length * tam * 0.6;
  contexto.font = `${peso} ${tam}px ${familia}`;
  return contexto.measureText(t).width;
}

/**
 * Diminui a fonte até o texto caber: nenhuma palavra maior que a largura e no
 * máximo `maxLinhas` linhas. Mede de novo a cada quadro (depois que a fonte carrega).
 */
export function tamanhoQueCabe(
  texto: string,
  f: { fontFamily: string; fontWeight: number },
  tam: number,
  largura: number,
  opcoes: { maiusculas?: boolean; maxLinhas?: number; contorno?: number } = {},
): number {
  const t = (opcoes.maiusculas ? texto.toUpperCase() : texto).trim();
  if (!t) return tam;
  const extra = (opcoes.contorno ?? 0) * 2;
  const larg = (s: string) => larguraTexto(s, f.fontFamily, f.fontWeight, tam) + extra;
  const maior = Math.max(...t.split(/\s+/).map(larg));
  let escala = Math.min(1, (largura * 0.97) / maior);
  const max = opcoes.maxLinhas ?? 4;
  const linhas = (larg(t) * escala) / largura;
  if (linhas > max - 0.35) escala *= (max - 0.35) / linhas;
  return Math.floor(tam * escala);
}

/** Largura útil dentro da área segura (px). */
export const LARGURA_UTIL = 1080 - 70 - 150;

/** Estilo de um texto grande (título), seguindo o visual escolhido. Com `texto`, a fonte encolhe para caber. */
export function estiloTitulo(
  estilo: Estilo,
  opcoes: { cor?: string; tamanho?: number; apoio?: boolean; texto?: string; largura?: number; maxLinhas?: number } = {},
): React.CSSProperties {
  const f = fonte(opcoes.apoio ? estilo.fonteApoio : estilo.fonte);
  const contorno = estilo.contorno;
  const tamPedido = opcoes.tamanho ?? 110;
  const tam = opcoes.texto
    ? tamanhoQueCabe(opcoes.texto, f, tamPedido, opcoes.largura ?? LARGURA_UTIL, { maiusculas: estilo.maiusculas, maxLinhas: opcoes.maxLinhas, contorno })
    : tamPedido;
  const sombra =
    estilo.sombra === 'dura'
      ? `${Math.max(4, contorno / 1.5)}px ${Math.max(4, contorno / 1.5)}px 0 ${estilo.cores.contorno}`
      : estilo.sombra === 'suave'
        ? `0 8px 24px rgba(0,0,0,0.25)`
        : undefined;
  return {
    ...f,
    color: opcoes.cor ?? estilo.cores.texto,
    fontSize: tam,
    lineHeight: 1.08,
    textAlign: 'center',
    textTransform: estilo.maiusculas ? 'uppercase' : 'none',
    WebkitTextStroke: contorno ? `${contorno}px ${estilo.cores.contorno}` : undefined,
    paintOrder: 'stroke fill',
    textShadow: sombra,
    overflowWrap: 'break-word',
    textWrap: 'balance',
  };
}

export const TAMANHOS: Record<string, number> = { p: 64, m: 88, g: 116, gg: 150 };
export function tamanho(v: unknown, padrao: number): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && TAMANHOS[v]) return TAMANHOS[v];
  return padrao;
}

/** Caixa (cartão) no visual escolhido. */
export function estiloCartao(estilo: Estilo, fundo?: string): React.CSSProperties {
  return {
    background: fundo ?? estilo.cores.cartao,
    color: estilo.cores.cartaoTexto,
    borderRadius: estilo.cantos,
    border: estilo.sombra === 'dura' || estilo.contorno ? `5px solid ${estilo.cores.contorno}` : undefined,
    boxShadow:
      estilo.sombra === 'dura'
        ? `8px 8px 0 ${estilo.cores.contorno}`
        : estilo.sombra === 'suave'
          ? '0 12px 30px rgba(0,0,0,0.18)'
          : undefined,
  };
}

/** Número pseudo-aleatório estável (mesma semente → mesmo resultado em todo quadro). */
export function aleatorio(semente: number) {
  const x = Math.sin(semente * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Separa as palavras marcadas para colorir. Cada grupo tem a sua cor.
 * Em cada lista, "palavra#2" marca só a 2ª vez que a palavra aparece.
 */
export function textoComDestaques(texto: string, grupos: { lista?: string[]; cor: string }[]) {
  const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
  const ativos = grupos.filter((g) => g.lista?.length);
  if (!ativos.length) return texto;
  const alvos = ativos.map((g) =>
    (g.lista ?? []).flatMap((d) => d.split(/\s+/)).map((d) => {
      const [palavra, n] = d.split('#');
      return { palavra: normal(palavra), n: n ? Number(n) : 0, cor: g.cor };
    }),
  );
  const vistas: Record<string, number> = {};
  return texto.split(/(\s+)/).map((p, i) => {
    const w = normal(p);
    if (!w) return <React.Fragment key={i}>{p}</React.Fragment>;
    vistas[w] = (vistas[w] ?? 0) + 1;
    const achou = alvos.flat().find((a) => a.palavra === w && (a.n === 0 || a.n === vistas[w]));
    return achou ? (
      <span key={i} style={{ color: achou.cor }}>
        {p}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    );
  });
}

/** Separa as palavras marcadas para colorir com o destaque. */
export function textoComDestaque(texto: string, destaques: string[] | undefined, cor: string) {
  return textoComDestaques(texto, [{ lista: destaques, cor }]);
}
