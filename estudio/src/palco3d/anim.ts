// Contas de tempo e movimento do palco 3D (tudo guiado pelo quadro atual, nunca por relógio próprio).
import { Easing } from 'remotion';

export type V3 = [number, number, number];

/** Curvas de movimento que o Roberto pode pedir em "suave". */
export const CURVAS: Record<string, (x: number) => number> = {
  suave: Easing.inOut(Easing.cubic),
  linear: (x) => x,
  rapido: Easing.out(Easing.exp),
  acelera: Easing.in(Easing.cubic),
  mola: Easing.out(Easing.back(1.6)),
};

export const cl01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const lerp3 = (a: V3, b: V3, p: number): V3 => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
export const graus = (v: V3): V3 => [(v[0] * Math.PI) / 180, (v[1] * Math.PI) / 180, (v[2] * Math.PI) / 180];
export const v3 = (v: number | V3 | undefined, padrao: V3): V3 =>
  v === undefined ? padrao : typeof v === 'number' ? [v, v, v] : v;

/** Valor de um campo numa lista de pontos-chave { em, campo, suave }. */
export function amostrar<T>(
  chaves: Array<{ em: number; suave?: string } & Record<string, unknown>>,
  campo: string,
  t: number,
  padrao: T,
  misturar: (a: T, b: T, p: number) => T,
): T {
  const com = chaves.filter((k) => k[campo] !== undefined).sort((a, b) => a.em - b.em);
  if (!com.length) return padrao;
  if (t <= com[0].em) return com[0][campo] as T;
  for (let i = 0; i < com.length - 1; i++) {
    const a = com[i];
    const b = com[i + 1];
    if (t < b.em) {
      const curva = CURVAS[b.suave ?? 'suave'] ?? CURVAS.suave;
      return misturar(a[campo] as T, b[campo] as T, curva(cl01((t - a.em) / Math.max(0.001, b.em - a.em))));
    }
  }
  return com[com.length - 1][campo] as T;
}
