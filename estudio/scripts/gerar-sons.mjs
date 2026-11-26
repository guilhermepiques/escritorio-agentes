// Gera os efeitos sonoros do estúdio por síntese (sem direitos autorais de ninguém).
// Uso: npm run sons   → grava public/sons/<nome>.wav
// Para um efeito novo: acrescente uma função em EFEITOS e rode de novo.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAXA = 44100;
const PASTA = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sons');

const seno = (f, t) => Math.sin(2 * Math.PI * f * t);
const ruido = () => Math.random() * 2 - 1;
const envelope = (t, ataque, queda) => (t < ataque ? t / ataque : Math.exp(-(t - ataque) / queda));

// Cada efeito: [duração em s, função(t) → amostra entre -1 e 1]
const EFEITOS = {
  // tique de relógio: clique curto e seco
  tique: [0.08, (t) => (seno(2200, t) * 0.6 + ruido() * 0.4) * envelope(t, 0.001, 0.012)],
  // toque: tique mais grave, para alternar com o tique
  toque: [0.08, (t) => (seno(1400, t) * 0.7 + ruido() * 0.3) * envelope(t, 0.001, 0.015)],
  // ding: acerto, sino com dois harmônicos
  ding: [1.2, (t) => (seno(1318.5, t) * 0.6 + seno(1975.5, t) * 0.3 + seno(2637, t) * 0.1) * envelope(t, 0.003, 0.35)],
  // acerto: duas notas subindo
  acerto: [0.7, (t) => {
    const f = t < 0.12 ? 880 : 1318.5;
    const tt = t < 0.12 ? t : t - 0.12;
    return (seno(f, t) * 0.7 + seno(f * 2, t) * 0.2) * envelope(tt, 0.003, 0.15);
  }],
  // erro: buzina grave descendo
  erro: [0.6, (t) => {
    const f = 220 - t * 120;
    return Math.sign(seno(f, t)) * 0.35 * envelope(t, 0.01, 0.25);
  }],
  // whoosh: ruído com filtro que varre
  whoosh: [0.45, (() => {
    let anterior = 0;
    return (t) => {
      const corte = 0.05 + 0.5 * Math.sin(Math.PI * (t / 0.45));
      anterior = anterior + corte * (ruido() - anterior);
      return anterior * 1.6 * Math.sin(Math.PI * (t / 0.45));
    };
  })()],
  // pop: bolha curta, bom para itens aparecendo
  pop: [0.12, (t) => seno(500 + 900 * Math.exp(-t * 40), t) * envelope(t, 0.002, 0.03)],
  // suspense: pulso grave crescendo
  suspense: [2.0, (t) => (seno(55, t) * 0.6 + seno(110, t) * 0.3) * (t / 2) * (0.6 + 0.4 * seno(4, t))],
  // tambor: rufar curto para revelar
  tambor: [1.0, (t) => {
    const batida = (t * 22) % 1;
    return ruido() * Math.exp(-batida * 6) * 0.5 * (0.4 + t * 0.6);
  }],
  // brilho: notas rápidas subindo (para número grande / conquista)
  brilho: [0.6, (t) => {
    const notas = [1046.5, 1318.5, 1568, 2093];
    const i = Math.min(3, Math.floor(t / 0.08));
    return seno(notas[i], t) * 0.5 * envelope(t - i * 0.08, 0.002, 0.08);
  }],
};

function wav(amostras) {
  const dados = Buffer.alloc(amostras.length * 2);
  amostras.forEach((v, i) => dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const cabecalho = Buffer.alloc(44);
  cabecalho.write('RIFF', 0);
  cabecalho.writeUInt32LE(36 + dados.length, 4);
  cabecalho.write('WAVEfmt ', 8);
  cabecalho.writeUInt32LE(16, 16);
  cabecalho.writeUInt16LE(1, 20);
  cabecalho.writeUInt16LE(1, 22);
  cabecalho.writeUInt32LE(TAXA, 24);
  cabecalho.writeUInt32LE(TAXA * 2, 28);
  cabecalho.writeUInt16LE(2, 32);
  cabecalho.writeUInt16LE(16, 34);
  cabecalho.write('data', 36);
  cabecalho.writeUInt32LE(dados.length, 40);
  return Buffer.concat([cabecalho, dados]);
}

mkdirSync(PASTA, { recursive: true });
for (const [nome, [duracao, fn]] of Object.entries(EFEITOS)) {
  const n = Math.floor(duracao * TAXA);
  const amostras = Array.from({ length: n }, (_, i) => fn(i / TAXA) * 0.9);
  // pequena rampa no fim para não estalar
  for (let i = 0; i < 200 && i < n; i++) amostras[n - 1 - i] *= i / 200;
  writeFileSync(join(PASTA, `${nome}.wav`), wav(amostras));
  console.log(`som: ${nome}.wav`);
}
