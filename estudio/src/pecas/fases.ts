import { useCurrentFrame, useVideoConfig } from 'remotion';

/** Fases (estados) de uma peça animada: `fases[i]` começa em `tempos[i]` (s, contados do começo da cena). */
export type DadosFases = { fases?: string[]; tempos?: number[] };

const suave = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Valor de uma "chave" 0→1 em um instante: liga quando a fase atual está em `ligadoEm`, com rampa de `dur` s. */
export function valorChave(dados: DadosFases, ligadoEm: string[], t: number, dur = 0.45): number {
  const fases = dados.fases ?? [];
  const tempos = dados.tempos ?? [];
  if (!fases.length) return 0;
  const b = (i: number) => (ligadoEm.includes(fases[i]) ? 1 : 0);
  let v0 = b(0);
  let alvo = b(0);
  let ini = 0;
  const rampa = (x: number) => v0 + (alvo - v0) * suave((x - ini) / dur);
  for (let i = 1; i < fases.length; i++) {
    const ti = tempos[i] ?? 0;
    if (ti > t) break;
    if (b(i) !== b(i - 1)) {
      v0 = rampa(ti);
      alvo = b(i);
      ini = ti;
    }
  }
  return rampa(t);
}

export function useChave(dados: DadosFases, ligadoEm: string[], dur = 0.45): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return valorChave(dados, ligadoEm, frame / fps, dur);
}

/** Momento (s) em que a fase `nome` começa; `padrao` se ela não existe. */
export function tempoDaFase(dados: DadosFases, nome: string, padrao: number): number {
  const i = (dados.fases ?? []).indexOf(nome);
  return i >= 0 ? (dados.tempos?.[i] ?? 0) : padrao;
}

/** Integral da chave ao longo do tempo (para movimentos que aceleram sem "pular"). */
export function integralChave(dados: DadosFases, ligadoEm: string[], t: number, dur = 0.45): number {
  const passo = 1 / 15;
  let s = 0;
  for (let x = 0; x < t; x += passo) s += valorChave(dados, ligadoEm, x, dur) * Math.min(passo, t - x);
  return s;
}

export { suave };
