// Arte do escritório: tudo desenhado em código, retângulo por retângulo.
// Nenhuma imagem de terceiros. Coordenadas em "pixels de arte" (1 bloco = 16).

export const T = 16;
let c = null;

export function usarContexto(ctx) { c = ctx; }

export function R(x, y, w, h, cor) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = cor;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function sorte(semente) {
  let s = Math.max(1, Math.floor(Math.abs(semente)) % 2147483647);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function hashTexto(t) {
  let h = 7;
  for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  return h;
}

// ---------- letras em pixel (3 a 5 de largura, 5 de altura) ----------
const LETRAS = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'], E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'], M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['1001', '1101', '1011', '1001', '1001'], O: ['010', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'],
  V: ['101', '101', '101', '101', '010'], ' ': ['00', '00', '00', '00', '00'],
};
export function letreiro(t, x, y, cor) {
  let cx = x;
  for (const ch of t.toUpperCase()) {
    const base = ch === 'É' ? 'E' : ch;
    const g = LETRAS[base];
    if (!g) { cx += 4; continue; }
    g.forEach((linha, j) => { for (let i = 0; i < linha.length; i++) if (linha[i] === '1') R(cx + i, y + j, 1, 1, cor); });
    if (ch === 'É') R(cx + 1, y - 2, 1, 1, cor);
    cx += g[0].length + 1;
  }
  return cx - x;
}
export function larguraLetreiro(t) {
  let w = 0;
  for (const ch of t.toUpperCase()) w += ((LETRAS[ch === 'É' ? 'E' : ch] || ['000'])[0].length + 1);
  return w - 1;
}

// ---------- céu (dia e noite) ----------
// hora: número de 0 a 24 (com fração)
export function corDoCeu(hora) {
  if (hora < 5 || hora >= 20) return { ceu: '#1b2440', baixo: '#27325a', noite: true };
  if (hora < 7) return { ceu: '#e9a08a', baixo: '#f5c48e', noite: false };
  if (hora < 17) return { ceu: '#8fc8ec', baixo: '#b9e0f5', noite: false };
  if (hora < 18.5) return { ceu: '#f2a46b', baixo: '#f7cd8a', noite: false };
  return { ceu: '#6b5a9e', baixo: '#e58c74', noite: false };
}
function estrelas(x, y, w, h, semente) {
  const r = sorte(semente);
  for (let i = 0; i < (w * h) / 40; i++) R(x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1, r() < 0.5 ? '#f8f4d8' : '#9fb0e0');
}

// ---------- pisos ----------
export function pisoMadeira(x, y, w, h, base, linha) {
  R(x, y, w, h, base);
  for (let yy = y, n = 0; yy < y + h; yy += 5, n++) {
    R(x, yy, w, 1, linha);
    for (let xx = x + ((n * 13) % 37); xx < x + w; xx += 37) R(xx, yy, 1, Math.min(5, y + h - yy), linha);
  }
}
export function pisoXadrez(x, y, w, h, a, b, t) {
  for (let yy = 0; yy < h; yy += t)
    for (let xx = 0; xx < w; xx += t)
      R(x + xx, y + yy, Math.min(t, w - xx), Math.min(t, h - yy), (Math.floor((x + xx) / t) + Math.floor((y + yy) / t)) % 2 ? a : b);
}
export function pisoGrade(x, y, w, h, base, linha, t) {
  R(x, y, w, h, base);
  for (let xx = x - (x % t) + t; xx < x + w; xx += t) R(xx, y, 1, h, linha);
  for (let yy = y - (y % t) + t; yy < y + h; yy += t) R(x, yy, w, 1, linha);
}
export function pisoCarpete(x, y, w, h, base, ponto) {
  R(x, y, w, h, base);
  const r = sorte(x * 7 + y * 13 + 3);
  for (let i = 0; i < (w * h) / 26; i++) R(x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1, ponto);
}
export function pisoConcreto(x, y, w, h, base = '#e3ded5') {
  R(x, y, w, h, base);
  const r = sorte(x * 31 + y * 17 + 7);
  for (let i = 0; i < (w * h) / 70; i++) R(x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1, r() < 0.5 ? '#d3ccc1' : '#ece8e1');
}

// ---------- decoração de parede (fica na parte estática) ----------
export function janela(x, y, w, h, hora) {
  const ceu = corDoCeu(hora);
  R(x, y, w, h, '#f4f1ea');
  R(x + 2, y + 2, w - 4, h - 4, ceu.ceu);
  R(x + 2, y + 2 + Math.floor((h - 4) * 0.6), w - 4, Math.ceil((h - 4) * 0.4), ceu.baixo);
  if (ceu.noite) estrelas(x + 2, y + 2, w - 4, Math.floor((h - 4) * 0.6), x + y);
  R(x + 2, y + 2 + Math.floor((h - 4) / 2), w - 4, 1, '#f4f1ea'); R(x + Math.floor(w / 2), y + 2, 1, h - 4, '#f4f1ea');
  if (!ceu.noite) { R(x + 4, y + 4, 3, 1, 'rgba(255,255,255,.6)'); R(x + 4, y + 5, 1, 2, 'rgba(255,255,255,.6)'); }
  R(x, y + h, w, 2, '#cfc8bc');
}
export function janelaCidade(x, y, w, h, hora) {
  const ceu = corDoCeu(hora);
  R(x, y, w, h, '#1d2433');
  R(x + 1, y + 1, w - 2, h - 2, ceu.baixo); R(x + 1, y + 1, w - 2, Math.floor(h / 2), ceu.ceu);
  if (ceu.noite) estrelas(x + 1, y + 1, w - 2, Math.floor(h / 2), x * 3);
  const r = sorte(x * 13 + 5);
  let xx = x + 1;
  while (xx < x + w - 1) {
    const bw = Math.min(4 + Math.floor(r() * 7), x + w - 1 - xx), bh = 5 + Math.floor(r() * (h - 7));
    R(xx, y + h - 1 - bh, bw, bh, ceu.noite ? '#2c3752' : '#4b5f86');
    for (let k = 2; k < bh - 1; k += 3) for (let j = 1; j < bw - 1; j += 2) if (r() < (ceu.noite ? 0.55 : 0.3)) R(xx + j, y + h - 1 - bh + k, 1, 1, '#ffe08a');
    xx += bw + 1;
  }
  for (let i = 1; i < 4; i++) R(x + Math.floor((w * i) / 4), y + 1, 1, h - 2, '#1d2433');
  R(x, y + h, w, 2, '#c9a24a');
}
export function quadroBranco(x, y, w, h) {
  R(x, y, w, h, '#9aa1a9'); R(x + 1, y + 1, w - 2, h - 2, '#fbfbfc');
  const cs = ['#ffd43b', '#ff8fab', '#74c0fc', '#8ce99a'];
  for (let i = 0; i < 6; i++) R(x + 4 + (i % 3) * 7, y + 3 + Math.floor(i / 3) * 6, 5, 4, cs[i % 4]);
  R(x + w - 20, y + 4, 14, 1, '#4263eb'); R(x + w - 20, y + 7, 9, 1, '#e8590c'); R(x + w - 20, y + 10, 12, 1, '#2f9e44');
  R(x + 2, y + h, w - 4, 2, '#7d848c');
}
export function relogio(x, y, hora) {
  R(x + 1, y, 8, 10, '#2b2430'); R(x, y + 1, 10, 8, '#2b2430'); R(x + 1, y + 1, 8, 8, '#f8f8f8');
  const cx = x + 5, cy = y + 5;
  const ah = ((hora % 12) / 12) * Math.PI * 2, am = ((hora % 1)) * Math.PI * 2;
  for (let i = 1; i <= 2; i++) R(Math.round(cx + Math.sin(ah) * i) - 0.5, Math.round(cy - Math.cos(ah) * i) - 0.5, 1, 1, '#2b2430');
  for (let i = 1; i <= 3; i++) R(Math.round(cx + Math.sin(am) * i) - 0.5, Math.round(cy - Math.cos(am) * i) - 0.5, 1, 1, '#c92a2a');
}
export function quadroArte(x, y, w, h, semente) {
  R(x, y, w, h, '#c9a24a'); R(x + 1, y + 1, w - 2, h - 2, '#f3ead7');
  const r = sorte(semente), cs = ['#e8590c', '#4263eb', '#2f9e44', '#d6336c', '#f59f00'];
  for (let i = 0; i < 3; i++) R(x + 2 + Math.floor(r() * (w - 8)), y + 2 + Math.floor(r() * (h - 7)), 4 + Math.floor(r() * 3), 3 + Math.floor(r() * 3), cs[Math.floor(r() * cs.length)]);
}
export function estante(x, y, w, h) {
  R(x, y, w, h, '#5b3a29'); R(x + 2, y + 2, w - 4, h - 4, '#3e271b');
  const r = sorte(x * 7 + y), cs = ['#c92a2a', '#1971c2', '#e8590c', '#2f9e44', '#f08c00', '#862e9c', '#f1f3f5'];
  for (let sy = y + 2; sy < y + h - 6; sy += 9) {
    let bx = x + 3;
    while (bx < x + w - 4) {
      const bw = Math.min(2 + Math.floor(r() * 2), x + w - 3 - bx), bh = 5 + Math.floor(r() * 3);
      R(bx, sy + 8 - bh, bw, bh, cs[Math.floor(r() * cs.length)]);
      bx += bw + (r() < 0.2 ? 2 : 0);
    }
    R(x + 2, sy + 8, w - 4, 1, '#5b3a29');
  }
}
export function prateleiraTrofeus(x, y) {
  R(x, y + 10, 26, 2, '#c9a24a');
  R(x + 3, y + 2, 6, 4, '#f2c94c'); R(x + 5, y + 6, 2, 2, '#c9a24a'); R(x + 4, y + 8, 4, 2, '#8a6d2c');
  R(x + 13, y + 3, 9, 7, '#1d2433'); R(x + 14, y + 4, 7, 5, '#f2b880');
}
export function tapete(x, y, w, h, borda, meio, detalhe) {
  R(x, y, w, h, borda); R(x + 3, y + 3, w - 6, h - 6, meio); R(x + 5, y + 5, w - 10, h - 10, borda); R(x + 6, y + 6, w - 12, h - 12, meio);
  const cx = Math.round(x + w / 2), cy = Math.round(y + h / 2);
  for (let i = 0; i < 7; i++) { R(cx - i * 2 - 1, cy - 7 + i, i * 4 + 2, 1, detalhe); R(cx - i * 2 - 1, cy + 7 - i, i * 4 + 2, 1, detalhe); }
}
export function tapeteCorredor(x, y, w, h) {
  R(x, y, w, h, '#2f5d62'); R(x + 2, y + 2, w - 4, h - 4, '#3d7a80');
  for (let xx = x + 6; xx < x + w - 6; xx += 10) R(xx, y + Math.floor(h / 2), 4, 1, '#5aa3a8');
  R(x, y, w, 1, '#24484c');
}
export function tapetinho(x, y, w, h) { R(x, y, w, h, '#5c7cfa'); R(x + 2, y + 2, w - 4, h - 4, '#748ffc'); for (let i = 4; i < w - 4; i += 6) R(x + i, y + 2, 2, h - 4, '#6b84f5'); }
export function espuma(x, y, w, h) {
  R(x, y, w, h, '#2a2638');
  for (let yy = y + 2; yy < y + h - 6; yy += 7) for (let xx = x + 2; xx < x + w - 6; xx += 7) {
    R(xx, yy, 6, 6, '#3b3456'); R(xx, yy, 6, 1, '#51487a'); R(xx + 2, yy + 2, 2, 2, '#322b49');
  }
}
export function telaVerde(x, yTopo, w, yChao, fundo) {
  R(x - 2, yTopo - 2, w + 4, 3, '#1b1922');
  R(x, yTopo, w, yChao - yTopo, '#2fb35a'); R(x, yChao, w, fundo, '#3cc46a'); R(x, yChao, w, 1, '#28a04f');
  for (let i = 4; i < w; i += 9) R(x + i, yTopo + 1, 1, yChao - yTopo - 1, '#33bd60');
}
export function cardapio(x, y) {
  R(x, y, 30, 18, '#3b2f2a'); R(x + 1, y + 1, 28, 16, '#2f3b33');
  letreiro('CAFÉ', x + 7, y + 4, '#ffe8a3');
  R(x + 4, y + 11, 20, 1, '#cfe6d8'); R(x + 4, y + 14, 14, 1, '#cfe6d8');
}
export function placaEmBreve(x, y) {
  const w = larguraLetreiro('EM BREVE') + 10;
  R(x, y, w, 11, '#868e96'); R(x + 1, y + 1, w - 2, 9, '#f8f9fa');
  letreiro('EM BREVE', x + 5, y + 3, '#868e96');
  return w;
}
export function logoRecepcao(x, y) {
  R(x, y, 34, 14, '#1d2433'); R(x + 1, y + 1, 32, 12, '#2b3a55');
  R(x + 4, y + 4, 6, 6, '#f59f00'); R(x + 6, y + 6, 2, 2, '#1d2433');
  R(x + 13, y + 5, 17, 1, '#f8f4ec'); R(x + 13, y + 8, 12, 1, '#9fb3d1');
}

// ---------- móveis (desenhados na ordem de profundidade) ----------
export function planta(x, y) { // 12x18
  R(x + 1, y + 4, 10, 8, '#3f8f4a'); R(x + 3, y + 1, 6, 4, '#4fae5b'); R(x, y + 6, 2, 4, '#2f6f3a'); R(x + 10, y + 6, 2, 4, '#2f6f3a');
  R(x + 3, y + 5, 2, 2, '#6cc777'); R(x + 7, y + 7, 2, 2, '#6cc777'); R(x + 5, y + 2, 2, 2, '#7fd88a');
  R(x + 2, y + 11, 8, 2, '#8c4a28'); R(x + 3, y + 13, 6, 5, '#b5653a'); R(x + 3, y + 13, 6, 1, '#d27d4b');
}
export function plantaGrande(x, y) { // 16x26
  R(x + 2, y + 4, 12, 12, '#2f7a3c'); R(x + 4, y, 8, 6, '#3f9a4c'); R(x, y + 8, 4, 6, '#276633'); R(x + 12, y + 8, 4, 6, '#276633');
  R(x + 5, y + 5, 3, 3, '#5fc06c'); R(x + 9, y + 9, 3, 3, '#5fc06c');
  R(x + 3, y + 16, 10, 2, '#2b2430'); R(x + 4, y + 18, 8, 8, '#4a4450'); R(x + 4, y + 18, 8, 1, '#6a6470');
}
export function bebedouro(x, y) { // 12x22
  R(x + 2, y, 8, 8, '#a5d8ff'); R(x + 3, y + 1, 2, 4, '#d0ebff');
  R(x + 1, y + 8, 10, 14, '#e9ecef'); R(x + 1, y + 8, 10, 1, '#ced4da'); R(x + 3, y + 11, 2, 1, '#1c7ed6'); R(x + 7, y + 11, 2, 1, '#e03131');
}
export function impressora(x, y) { // 18x20
  R(x, y + 4, 18, 10, '#dee2e6'); R(x, y + 4, 18, 1, '#f1f3f5'); R(x + 3, y, 12, 5, '#f8f9fa'); R(x + 3, y + 9, 12, 2, '#495057');
  R(x + 14, y + 6, 2, 1, '#40c057'); R(x + 1, y + 14, 16, 6, '#adb5bd');
}
export function banco(x, y, w) { R(x, y, w, 5, '#a0673f'); R(x, y, w, 1, '#c08457'); R(x, y + 5, w, 2, '#6b432c'); R(x + 2, y + 7, 2, 4, '#2b2430'); R(x + w - 4, y + 7, 2, 4, '#2b2430'); }
export function balcaoRecepcao(x, y, w) {
  R(x, y, w, 8, '#e9e4dc'); R(x, y, w, 1, '#ffffff'); R(x, y + 8, w, 10, '#3d7a80'); R(x, y + 8, w, 1, '#2f5d62');
  R(x + 4, y + 11, w - 8, 1, '#5aa3a8'); R(x + w - 14, y - 6, 10, 7, '#2b2430'); R(x + w - 13, y - 5, 8, 5, '#74c0fc');
  R(x + 4, y + 2, 6, 4, '#f8f9fa'); R(x + 12, y + 2, 3, 3, '#e8590c');
}

// tela: função (x, y, w, h) que desenha o conteúdo do monitor
export function mesaTrabalho(x, y, w) { // tampo em y-4; ocupa um bloco de altura
  R(x, y - 4, w, 10, '#c8976a'); R(x, y - 4, w, 1, '#e0b68a'); R(x, y + 6, w, 6, '#8b5e3c'); R(x, y + 6, w, 1, '#6f4a2f');
  R(x + 1, y + 12, 2, 4, '#5a3b27'); R(x + w - 3, y + 12, 2, 4, '#5a3b27');
  R(x + w / 2 - 6, y + 1, 12, 3, '#eceef2'); R(x + w / 2 + 8, y + 1, 3, 4, '#eceef2');
}
export function monitor(x, y, w, h, tela) { // moldura + tela
  R(x, y, w, h, '#2b2430'); tela(x + 1, y + 1, w - 2, h - 3); R(x + w / 2 - 2, y + h, 4, 2, '#2b2430');
}
export function canecas(x, y, n) {
  for (let i = 0; i < n; i++) {
    const cx = x + (i % 3) * 5, cy = y - Math.floor(i / 3) * 4;
    R(cx, cy, 4, 4, '#f8f9fa'); R(cx + 4, cy + 1, 1, 2, '#f8f9fa'); R(cx + 1, cy, 2, 1, '#7a4a2a'); R(cx, cy + 3, 4, 1, '#ced4da');
  }
}
export function cadeira(x, y, cor) { // encosto visto de trás, 14x12
  R(x + 1, y, 12, 8, cor); R(x + 1, y, 12, 1, 'rgba(255,255,255,.25)'); R(x, y + 1, 1, 6, cor); R(x + 13, y + 1, 1, 6, cor);
  R(x + 6, y + 8, 2, 2, '#2b2430'); R(x + 2, y + 10, 10, 1, '#2b2430'); R(x + 2, y + 11, 1, 1, '#2b2430'); R(x + 11, y + 11, 1, 1, '#2b2430');
}
export function cadeiraExecutiva(x, y) { // 18x22, encosto alto atrás de quem senta
  R(x, y, 18, 22, '#1f1c24'); R(x + 1, y + 1, 16, 20, '#2c2833'); R(x + 1, y + 1, 16, 1, '#4a4555');
  R(x + 3, y + 4, 12, 1, '#3a3542'); R(x + 3, y + 9, 12, 1, '#3a3542');
}
export function mesaExecutiva(x, y, w) { // tampo em y-4
  R(x, y - 4, w, 12, '#5b3a29'); R(x, y - 4, w, 1, '#7a5039'); R(x, y + 8, w, 7, '#40281c'); R(x, y + 9, w, 1, '#c9a24a');
  R(x + 2, y + 15, 3, 1, '#2b1b13'); R(x + w - 5, y + 15, 3, 1, '#2b1b13');
  R(x + 4, y - 10, 7, 3, '#c9a24a'); R(x + 6, y - 7, 2, 5, '#8a6d2c'); R(x + 4, y - 2, 6, 2, '#8a6d2c');
  R(x + w - 15, y - 2, 8, 6, '#f8f9fa'); R(x + w - 14, y - 1, 6, 1, '#adb5bd'); R(x + w - 6, y - 2, 3, 4, '#e9ecef');
}
export function notebook(x, y, tela) { R(x, y, 16, 9, '#c9ced6'); tela(x + 1, y + 1, 14, 7); R(x - 1, y + 9, 18, 2, '#adb5bd'); }
export function poltronaCostas(x, y, cor, esc) { R(x, y, 16, 12, esc); R(x + 1, y + 1, 14, 9, cor); R(x + 1, y + 1, 14, 1, 'rgba(255,255,255,.2)'); R(x - 1, y + 4, 3, 9, esc); R(x + 14, y + 4, 3, 9, esc); }
export function sofaCostas(x, y, w, cor, esc) {
  R(x, y, w, 14, esc); R(x + 1, y + 1, w - 2, 10, cor); R(x + 1, y + 1, w - 2, 1, 'rgba(255,255,255,.2)');
  R(x - 3, y + 4, 4, 12, esc); R(x + w - 1, y + 4, 4, 12, esc);
  for (let i = 1; i < 3; i++) R(x + Math.round((w * i) / 3), y + 2, 1, 8, esc);
}
export function sofaFrente(x, y, w, cor, esc) {
  R(x, y, w, 7, esc); R(x, y + 7, w, 9, cor); R(x + 1, y + 7, w - 2, 1, 'rgba(255,255,255,.25)'); R(x, y + 16, w, 2, esc);
  R(x - 3, y + 3, 4, 14, esc); R(x + w - 1, y + 3, 4, 14, esc);
  for (let i = 1; i < 3; i++) R(x + Math.round((w * i) / 3), y + 8, 1, 7, esc);
}
export function mesaCentro(x, y, w, h) { R(x, y, w, h, '#1d2433'); R(x + 1, y + 1, w - 2, h - 3, '#bfe3ee'); R(x + 3, y + 2, 5, 1, '#ffffff'); R(x + w - 10, y + 3, 4, 3, '#c9a24a'); }
export function luminaria(x, y, acesa) {
  R(x, y, 10, 6, acesa ? '#fff3bf' : '#f2e3b3'); R(x + 1, y + 6, 8, 1, '#c9a24a'); R(x + 4, y + 7, 2, 16, '#2b2430'); R(x + 1, y + 23, 8, 2, '#2b2430');
}
export function minibar(x, y) {
  R(x, y, 22, 16, '#40281c'); R(x, y, 22, 2, '#7a5039'); R(x + 2, y + 5, 8, 9, '#2b1b13'); R(x + 12, y + 5, 8, 9, '#2b1b13');
  R(x + 9, y + 9, 1, 2, '#c9a24a'); R(x + 12, y + 9, 1, 2, '#c9a24a');
  R(x + 3, y - 7, 2, 7, '#2f9e44'); R(x + 7, y - 6, 2, 6, '#c92a2a'); R(x + 11, y - 8, 2, 8, '#f08c00'); R(x + 15, y - 3, 4, 3, '#dee2e6');
}

// estúdio
export function ilhaEdicao(x, y, w) { // tampo em y-4
  R(x + 2, y - 12, 6, 9, '#1b1922'); R(x + 3, y - 10, 4, 4, '#3b3946'); R(x + w - 8, y - 12, 6, 9, '#1b1922'); R(x + w - 7, y - 10, 4, 4, '#3b3946');
  R(x, y - 4, w, 11, '#3a3846'); R(x, y - 4, w, 1, '#55536a'); R(x, y + 7, w, 6, '#26242f'); R(x, y + 8, w, 1, '#9775fa');
  R(x + 2, y + 13, 2, 3, '#1b1922'); R(x + w - 4, y + 13, 2, 3, '#1b1922');
  const cx = Math.round(x + w / 2);
  R(cx - 8, y + 1, 16, 3, '#d0d0dc'); R(cx + 11, y, 11, 5, '#2b2933');
  for (let i = 0; i < 4; i++) R(cx + 12 + i * 2.5, y + 1, 1, 3, '#ffd43b');
}
export function microfoneBraco(x, y) { // base no tampo em (x, y)
  R(x, y, 3, 5, '#1b1922');
  for (let i = 0; i < 12; i++) R(x + 1 - i, y - i, 2, 1, '#5a5868');
  R(x - 16, y - 18, 7, 9, '#2b2933'); R(x - 15, y - 17, 5, 7, '#8a8898');
  R(x - 21, y - 17, 3, 7, '#1b1922'); R(x - 20, y - 16, 1, 5, '#3b3946');
}
export function ondasSom(x, y, t) { // ondas saindo do microfone
  for (let i = 0; i < 3; i++) {
    const f = ((t / 600 + i / 3) % 1), d = 3 + f * 9, a = 1 - f;
    const cor = `rgba(177,151,252,${a.toFixed(2)})`;
    R(x + d, y - 2 - d / 3, 1, 2 + d / 2, cor); R(x - d, y - 2 - d / 3, 1, 2 + d / 2, cor);
  }
}
export function softbox(x, y, acesa) {
  R(x, y, 12, 10, '#1b1922'); R(x + 1, y + 1, 10, 8, acesa ? '#fffbe8' : '#d9d4c3');
  R(x + 5, y + 10, 2, 10, '#1b1922'); R(x + 1, y + 20, 10, 1, '#1b1922'); R(x + 1, y + 19, 2, 1, '#1b1922'); R(x + 9, y + 19, 2, 1, '#1b1922');
}
export function cameraTripe(x, y, gravando, t) {
  R(x, y, 15, 8, '#1b1922'); R(x + 15, y + 2, 4, 4, '#3b3946');
  R(x + 2, y + 2, 2, 2, gravando && Math.floor(t / 500) % 2 ? '#ff2d2d' : '#5c2b2e');
  R(x + 6, y + 8, 2, 10, '#1b1922'); R(x + 2, y + 18, 10, 1, '#1b1922'); R(x + 2, y + 17, 2, 1, '#1b1922'); R(x + 10, y + 17, 2, 1, '#1b1922');
}
export function ringLight(x, y, acesa) { // 14x30
  const cor = acesa ? '#fffbe8' : '#cfc9b6';
  R(x + 3, y, 8, 2, cor); R(x + 3, y + 12, 8, 2, cor); R(x + 1, y + 2, 2, 10, cor); R(x + 11, y + 2, 2, 10, cor);
  R(x + 6, y + 14, 2, 14, '#1b1922'); R(x + 2, y + 28, 10, 1, '#1b1922'); R(x + 2, y + 27, 2, 1, '#1b1922'); R(x + 10, y + 27, 2, 1, '#1b1922');
}
export function mesinha(x, y, w) { R(x, y, w, 6, '#4a4858'); R(x, y + 6, w, 3, '#2b2933'); R(x + 1, y + 9, 2, 5, '#2b2933'); R(x + w - 3, y + 9, 2, 5, '#2b2933'); }
export function claquete(x, y, aberta) { // 15x13
  R(x, y + 4, 15, 9, '#1b1922'); R(x + 1, y + 7, 13, 1, '#f8f9fa'); R(x + 1, y + 10, 8, 1, '#f8f9fa');
  if (aberta) { for (let i = 0; i < 7; i++) R(x + 1 + i * 2, y - i / 2 - 1, 2, 3, i % 2 ? '#f8f9fa' : '#1b1922'); }
  else { for (let i = 0; i < 8; i++) R(x - 1 + i * 2, y + (i % 2), 2, 3, i % 2 ? '#f8f9fa' : '#1b1922'); }
}
export function caseEquipamento(x, y) { R(x, y, 16, 12, '#1b1922'); R(x + 1, y + 1, 14, 2, '#3b3946'); R(x + 6, y + 5, 4, 2, '#adb5bd'); R(x, y + 12, 16, 10, '#2b2933'); R(x + 6, y + 15, 4, 2, '#adb5bd'); }
export function prateleiraEquipamento(x, y) { // 44x24
  R(x, y, 44, 24, '#1b1922'); R(x + 2, y + 2, 40, 9, '#2b2933'); R(x + 2, y + 13, 40, 9, '#2b2933');
  R(x + 4, y + 5, 6, 6, '#3b3946'); R(x + 5, y + 6, 4, 4, '#74c0fc'); R(x + 13, y + 6, 9, 5, '#868e96'); R(x + 25, y + 4, 4, 7, '#f59f00'); R(x + 33, y + 7, 6, 4, '#e03131');
  R(x + 4, y + 16, 10, 6, '#495057'); R(x + 5, y + 17, 1, 1, '#40c057'); R(x + 18, y + 16, 10, 6, '#495057'); R(x + 19, y + 17, 1, 1, '#40c057'); R(x + 33, y + 15, 6, 7, '#7950f2');
}
export function placaNoAr(x, y, ligada, t) {
  R(x, y, 28, 11, '#1b1922');
  const pulso = ligada ? (Math.sin(t / 300) > -0.6 ? '#ff3b3b' : '#d42a2a') : '#4a2427';
  R(x + 1, y + 1, 26, 9, pulso);
  letreiro('NO AR', x + 4, y + 3, ligada ? '#ffffff' : '#7a4a4e');
}

// copa
export function bancada(x, y, w) { // tampo em y
  R(x, y, w, 4, '#8f99a3'); R(x, y, w, 1, '#c3cad1'); R(x, y + 4, w, 12, '#f1f3f5'); R(x, y + 4, w, 1, '#ced4da');
  for (let i = 0; i < w - 2; i += 12) { R(x + i, y + 4, 1, 12, '#ced4da'); R(x + i + 5, y + 8, 3, 1, '#868e96'); }
}
export function cafeteira(x, y, t, servindo) { // base em y
  R(x, y - 14, 11, 14, '#2b2430'); R(x + 1, y - 13, 9, 4, '#4a4352'); R(x + 2, y - 12, 2, 1, servindo ? '#40c057' : '#e03131');
  R(x + 3, y - 7, 5, 1, '#868e96'); R(x + 3, y - 5, 5, 5, '#f8f9fa'); R(x + 4, y - 4, 3, 2, '#7a4a2a');
  if (servindo) for (let i = 0; i < 3; i++) R(x + 4 + ((Math.floor(t / 200) + i) % 2), y - 7 - i * 2 - ((t / 150) % 2), 1, 1, 'rgba(255,255,255,.7)');
}
export function microondas(x, y) { R(x, y - 9, 16, 9, '#dee2e6'); R(x + 1, y - 8, 10, 7, '#343a40'); R(x + 12, y - 7, 3, 5, '#868e96'); }
export function geladeira(x, y) { // y = base
  R(x, y - 36, 17, 36, '#adb5bd'); R(x + 1, y - 35, 15, 34, '#e9ecef'); R(x + 1, y - 23, 15, 1, '#adb5bd');
  R(x + 13, y - 32, 1, 6, '#868e96'); R(x + 13, y - 20, 1, 9, '#868e96'); R(x + 3, y - 32, 4, 3, '#ffd43b'); R(x + 8, y - 30, 3, 3, '#ff8fab');
}
export function maquinaSalgadinho(x, y) { // y = base
  R(x, y - 34, 20, 34, '#c92a2a'); R(x + 2, y - 32, 12, 24, '#1b1922');
  const cs = ['#ffd43b', '#4dabf7', '#ff922b', '#69db7c'];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R(x + 3 + j * 4, y - 30 + i * 6, 3, 3, cs[(i + j) % 4]);
  R(x + 15, y - 30, 3, 8, '#868e96'); R(x + 3, y - 6, 12, 3, '#343a40');
}
export function banqueta(x, y, cor) { R(x + 1, y, 10, 6, cor); R(x + 1, y, 10, 1, 'rgba(255,255,255,.35)'); R(x + 5, y + 6, 2, 5, '#2b2430'); R(x + 3, y + 11, 6, 1, '#2b2430'); }
export function mesaRedonda(x, y) { // 28x22
  R(x + 2, y, 24, 14, '#2b2430'); R(x + 3, y + 1, 22, 12, '#d9b88f'); R(x + 3, y + 1, 22, 1, '#ecd2ad');
  R(x + 12, y + 14, 4, 5, '#5a3b27'); R(x + 8, y + 19, 12, 2, '#5a3b27');
  R(x + 7, y + 4, 4, 4, '#f8f9fa'); R(x + 8, y + 5, 2, 2, '#7a4a2a'); R(x + 17, y + 6, 3, 3, '#e8590c');
}
export function tvGame(x, y, w, ligada, t) { // tela na parede; y = topo da tela
  R(x, y, w, 17, '#17151c');
  const sx = x + 1, sy = y + 1, sw = w - 2;
  if (!ligada) { R(sx, sy, sw, 15, '#26232e'); R(sx + 2, sy + 2, 4, 1, '#3a3644'); return; }
  const f = Math.floor(t / 120);
  R(sx, sy, sw, 15, '#74c0fc'); R(sx, sy + 11, sw, 4, '#51cf66');
  for (let i = 0; i < sw; i += 8) R(sx + ((i + f) % sw), sy + 10, 3, 1, '#2f9e44');
  R(sx + 6 + ((f >> 1) % 6), sy + 7 - (f % 4 === 0 ? 2 : 0), 3, 4, '#e03131');
  R(sx + ((sw - (f % sw)) % sw), sy + 4, 4, 3, '#ffd43b'); R(sx + sw - 12, sy + 2, 6, 2, '#ffffff');
}
export function rackTv(x, y, w) { R(x, y, w, 11, '#5b3a29'); R(x, y, w, 1, '#7a5039'); R(x + 4, y + 3, 11, 3, '#e9ecef'); R(x + 18, y + 3, 7, 3, '#2b2430'); R(x + 2, y + 11, 2, 3, '#3e271b'); R(x + w - 4, y + 11, 2, 3, '#3e271b'); }
export function puff(x, y, cor, esc) { R(x + 2, y, 13, 12, cor); R(x, y + 2, 17, 8, cor); R(x + 3, y + 1, 6, 2, 'rgba(255,255,255,.3)'); R(x + 1, y + 10, 15, 2, esc); }

// sala vazia
export function caixa(x, y) { R(x, y, 12, 10, '#c08a4f'); R(x, y, 12, 1, '#d9a66a'); R(x + 5, y, 2, 10, '#e8d3a8'); R(x, y + 9, 12, 1, '#8f6233'); }
export function escada(x, y) { R(x, y, 2, 26, '#adb5bd'); R(x + 10, y, 2, 26, '#adb5bd'); for (let i = 3; i < 26; i += 6) R(x + 2, y + i, 8, 1, '#868e96'); }

// ---------- telas de cada cargo (animadas) ----------
export const TELAS = {
  videos(x, y, w, h, t) {
    R(x, y, w, h, '#101018');
    const cs = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#da77f2'];
    const off = Math.floor(t / 180) % 5;
    for (let i = 0; i < 3; i++) { const cw = Math.floor((w - 2) / 3); R(x + 1 + i * (cw + 0), y + 1, cw - 1, h - 2, cs[(i + off) % 5]); R(x + 2 + i * cw, y + 2 + ((Math.floor(t / 90) + i * 3) % Math.max(1, h - 5)), cw - 3, 2, '#ffffff'); }
  },
  texto(x, y, w, h, t) {
    R(x, y, w, h, '#f8f9fa');
    const n = Math.floor(t / 140) % (w * 3);
    for (let l = 0; l < 4; l++) { const len = Math.min(w - 4, Math.max(0, n - l * (w - 4))); R(x + 2, y + 2 + l * 2, len, 1, '#495057'); }
    if (Math.floor(t / 400) % 2) R(x + 2 + Math.min(w - 4, n % (w - 3)), y + 2 + Math.min(3, Math.floor(n / (w - 4))) * 2, 1, 1, '#4263eb');
  },
  hashtags(x, y, w, h, t) {
    R(x, y, w, h, '#ffdeeb'); R(x + 2, y + 2, 5, h - 4, '#d6336c'); R(x + 3, y + 3, 3, h - 7, '#ffffff');
    const k = Math.floor(t / 300) % 3;
    for (let i = 0; i < 3; i++) R(x + 9, y + 2 + i * 3, 2 + ((i + k) % 3) * 2, 2, i === k ? '#d6336c' : '#f783ac');
  },
  checklist(x, y, w, h, t) {
    R(x, y, w, h, '#ebfbee');
    const k = Math.floor(t / 500) % 4;
    for (let i = 0; i < 3; i++) { R(x + 2, y + 2 + i * 3, 2, 2, i < k ? (i === 1 ? '#e03131' : '#2f9e44') : '#ced4da'); R(x + 6, y + 2 + i * 3, w - 8, 1, '#868e96'); }
  },
  edicao(x, y, w, h, t) {
    R(x, y, w, h, '#15131c');
    R(x + 2, y + 1, w - 4, h - 6, '#4dabf7'); R(x + 4, y + 3, 4, 3, '#ffd43b');
    R(x + 1, y + h - 4, w - 2, 1, '#7950f2'); R(x + 2, y + h - 3, 7, 2, '#9775fa'); R(x + 10, y + h - 3, Math.max(2, w - 12), 2, '#20c997');
    R(x + 1 + Math.floor((t / 60) % (w - 2)), y + h - 5, 1, 5, '#ff6b6b');
  },
  painel(x, y, w, h, t) {
    R(x, y, w, h, '#121a24');
    const n = 5, bw = Math.max(2, Math.floor((w - 2) / n));
    for (let i = 0; i < n; i++) { const v = Math.max(1, Math.min(h - 2, Math.round((h - 2) * (0.3 + 0.7 * Math.abs(Math.sin(t / 900 + i)))))); R(x + 1 + i * bw, y + h - 1 - v, bw - 1, v, i === n - 1 ? '#40c057' : '#339af0'); }
  },
  codigo(x, y, w, h, t) {
    R(x, y, w, h, '#1b1f2a');
    const cs = ['#74c0fc', '#ffd43b', '#b197fc', '#69db7c'];
    for (let l = 0; l < 4; l++) R(x + 2 + (l % 2) * 2, y + 2 + l * 2, ((l * 5 + Math.floor(t / 300)) % (w - 6)) + 2, 1, cs[l]);
  },
  desligada(x, y, w, h) { R(x, y, w, h, '#1d1b24'); R(x + 1, y + 1, 3, 1, '#2e2b38'); },
  erro(x, y, w, h, t) {
    R(x, y, w, h, Math.floor(t / 250) % 2 ? '#e03131' : '#c92a2a');
    const cx = x + Math.floor(w / 2);
    R(cx - 1, y + 1, 2, h - 5, '#ffffff'); R(cx - 1, y + h - 3, 2, 2, '#ffffff');
  },
};

// ---------- pessoas ----------
// ap = { camisa, cabelo, pele, calca, estilo: 'curto'|'longo'|'coque', gravata, fone, oculos }
function olhos(x0, y0, ap, piscar) {
  if (piscar) { R(x0 + 4, y0 + 6, 1, 1, '#2b2430'); R(x0 + 7, y0 + 6, 1, 1, '#2b2430'); }
  else { R(x0 + 4, y0 + 5, 1, 2, '#2b2430'); R(x0 + 7, y0 + 5, 1, 2, '#2b2430'); }
  if (ap.oculos) { R(x0 + 3, y0 + 4, 3, 1, '#2b2430'); R(x0 + 6, y0 + 4, 3, 1, '#2b2430'); R(x0 + 3, y0 + 5, 1, 2, '#2b2430'); R(x0 + 8, y0 + 5, 1, 2, '#2b2430'); }
}
function cabecaFrente(x0, y0, ap, piscar) {
  if (ap.estilo === 'longo') R(x0 + 1, y0 + 1, 10, 10, ap.cabelo);
  R(x0 + 2, y0 + 1, 8, 8, ap.pele);
  R(x0 + 2, y0, 8, 3, ap.cabelo); R(x0 + 1, y0 + 1, 1, 4, ap.cabelo); R(x0 + 10, y0 + 1, 1, 4, ap.cabelo);
  if (ap.estilo === 'coque') R(x0 + 4, y0 - 2, 4, 3, ap.cabelo);
  olhos(x0, y0, ap, piscar);
  R(x0 + 5, y0 + 8, 2, 1, '#b5735f');
  if (ap.fone) { R(x0 + 2, y0 - 1, 8, 1, '#2b2430'); R(x0, y0 + 3, 2, 4, '#2b2430'); R(x0 + 10, y0 + 3, 2, 4, '#2b2430'); }
}
function cabecaCostas(x0, y0, ap) {
  R(x0 + 2, y0, 8, 9, ap.cabelo); R(x0 + 1, y0 + 1, 1, 6, ap.cabelo); R(x0 + 10, y0 + 1, 1, 6, ap.cabelo);
  R(x0 + 1, y0 + 5, 1, 2, ap.pele); R(x0 + 10, y0 + 5, 1, 2, ap.pele);
  if (ap.estilo === 'longo') R(x0 + 2, y0 + 8, 8, 4, ap.cabelo);
  if (ap.estilo === 'coque') R(x0 + 4, y0 - 2, 4, 3, ap.cabelo);
  if (ap.fone) { R(x0 + 2, y0 - 1, 8, 1, '#2b2430'); R(x0, y0 + 3, 2, 4, '#2b2430'); R(x0 + 10, y0 + 3, 2, 4, '#2b2430'); }
}
function corpo(x0, y0, ap, frente) {
  const escuro = 'rgba(0,0,0,.18)';
  R(x0 + 2, y0 + 9, 8, 7, ap.camisa); R(x0 + 2, y0 + 15, 8, 1, escuro); R(x0 + 2, y0 + 9, 8, 1, 'rgba(255,255,255,.22)');
  if (frente && ap.gravata) { R(x0 + 4, y0 + 9, 4, 1, '#f1f3f5'); R(x0 + 5, y0 + 10, 2, 5, '#9c2a2a'); }
}
// em pé, 12x20; dir: 'baixo' | 'cima' | 'esq' | 'dir'; passo: 0 parado, 1 ou 2 andando
export function pessoaEmPe(x0, y0, ap, dir, passo, piscar = false) {
  const calca = ap.calca || '#3a3f58';
  const pe = '#2b2430';
  if (dir === 'esq' || dir === 'dir') {
    const e = dir === 'esq';
    const fx = (v) => (e ? x0 + v : x0 + 11 - v);
    // pernas
    const a = passo === 1 ? -1 : passo === 2 ? 1 : 0;
    R(Math.min(fx(5), fx(6)), y0 + 16, 2, 3, calca); R(Math.min(fx(5 + a), fx(6 + a)), y0 + 16, 2, 3, calca);
    R(Math.min(fx(4), fx(6)), y0 + 19, 3, 1, pe);
    // corpo
    R(x0 + 3, y0 + 9, 6, 7, ap.camisa); R(x0 + 3, y0 + 9, 6, 1, 'rgba(255,255,255,.22)');
    R(Math.min(fx(6 - a), fx(7 - a)), y0 + 10, 2, 5, ap.camisa); R(Math.min(fx(6 - a), fx(7 - a)), y0 + 15, 2, 1, ap.pele);
    // cabeça de lado
    R(x0 + 3, y0 + 1, 7, 8, ap.pele); R(x0 + 3, y0, 7, 3, ap.cabelo);
    R(Math.min(fx(8), fx(9)), y0 + 1, 2, ap.estilo === 'longo' ? 11 : 6, ap.cabelo);
    if (ap.estilo === 'coque') R(Math.min(fx(8), fx(10)), y0 - 1, 3, 3, ap.cabelo);
    R(fx(4), y0 + 5, 1, piscar ? 1 : 2, '#2b2430');
    if (ap.oculos) R(Math.min(fx(3), fx(5)), y0 + 4, 3, 1, '#2b2430');
    if (ap.fone) { R(x0 + 3, y0 - 1, 7, 1, '#2b2430'); R(Math.min(fx(6), fx(7)), y0 + 3, 2, 4, '#2b2430'); }
    return;
  }
  const l = passo === 1 ? 1 : 0, r = passo === 2 ? 1 : 0;
  R(x0 + 3, y0 + 16, 2, 3 - l, calca); R(x0 + 7, y0 + 16, 2, 3 - r, calca);
  R(x0 + 3, y0 + 19 - l, 2, 1, pe); R(x0 + 7, y0 + 19 - r, 2, 1, pe);
  corpo(x0, y0, ap, dir === 'baixo');
  R(x0 + 1, y0 + 10 + r, 1, 5, ap.camisa); R(x0 + 10, y0 + 10 + l, 1, 5, ap.camisa);
  R(x0 + 1, y0 + 15 + r, 1, 1, ap.pele); R(x0 + 10, y0 + 15 + l, 1, 1, ap.pele);
  if (dir === 'cima') cabecaCostas(x0, y0, ap); else cabecaFrente(x0, y0, ap, piscar);
}
// sentado de costas (na mesa), 12x15
export function pessoaSentadaCostas(x0, y0, ap, digitando, fase) {
  cabecaCostas(x0, y0 + (digitando && fase ? 1 : 0), ap);
  R(x0 + 1, y0 + 9, 10, 6, ap.camisa); R(x0 + 1, y0 + 9, 10, 1, 'rgba(255,255,255,.25)');
  if (digitando) { R(x0, y0 + 8 - (fase ? 1 : 0), 2, 3, ap.camisa); R(x0 + 10, y0 + 8 - (fase ? 0 : 1), 2, 3, ap.camisa); }
  else { R(x0, y0 + 10, 1, 4, ap.camisa); R(x0 + 11, y0 + 10, 1, 4, ap.camisa); }
}
// sentado de frente (atrás de uma mesa ou no sofá), 12x17
export function pessoaSentadaFrente(x0, y0, ap, piscar, comPernas) {
  cabecaFrente(x0, y0, ap, piscar);
  R(x0 + 1, y0 + 9, 10, 8, ap.camisa); R(x0 + 1, y0 + 9, 10, 1, 'rgba(255,255,255,.22)');
  if (ap.gravata) { R(x0 + 4, y0 + 9, 4, 1, '#f1f3f5'); R(x0 + 5, y0 + 10, 2, 5, '#9c2a2a'); }
  R(x0, y0 + 10, 1, 6, ap.camisa); R(x0 + 11, y0 + 10, 1, 6, ap.camisa);
  if (comPernas) { R(x0 + 2, y0 + 17, 8, 2, ap.calca || '#3a3f58'); R(x0 + 2, y0 + 19, 2, 2, ap.calca || '#3a3f58'); R(x0 + 8, y0 + 19, 2, 2, ap.calca || '#3a3f58'); }
}
// sentado no chão, cochilando, 14x15
export function pessoaNoChao(x0, y0, ap) {
  const calca = ap.calca || '#3a3f58';
  R(x0 + 1, y0 + 12, 12, 3, calca); R(x0, y0 + 14, 3, 1, '#2b2430'); R(x0 + 11, y0 + 14, 3, 1, '#2b2430');
  R(x0 + 3, y0 + 6, 8, 7, ap.camisa);
  R(x0 + 2, y0 + 9, 2, 4, ap.camisa); R(x0 + 10, y0 + 9, 2, 4, ap.camisa);
  // cabeça caída para o lado
  const hx = x0 + 3, hy = y0 - 2;
  if (ap.estilo === 'longo') R(hx, hy + 1, 9, 9, ap.cabelo);
  R(hx + 1, hy + 1, 7, 7, ap.pele); R(hx + 1, hy, 7, 3, ap.cabelo);
  R(hx + 3, hy + 5, 2, 1, '#2b2430'); R(hx + 6, hy + 5, 1, 1, '#2b2430');
  if (ap.fone) { R(hx + 1, hy - 1, 7, 1, '#2b2430'); }
}

// ---------- ícones sobre a cabeça ----------
export function ampulheta(x, y, t) {
  const f = (t / 1500) % 1, vira = f > 0.9;
  R(x, y, 7, 1, '#7a5039'); R(x, y + 10, 7, 1, '#7a5039');
  R(x + 1, y + 1, 5, 9, 'rgba(255,255,255,.85)');
  R(x + 3, y + 5, 1, 1, '#f2c94c');
  const cima = Math.round((1 - f) * 3), baixo = Math.round(f * 3);
  if (!vira) { R(x + 2, y + 4 - cima, 3, cima, '#f2c94c'); R(x + 2, y + 9 - baixo, 3, baixo, '#f2c94c'); }
  else { R(x + 2, y + 6, 3, 3, '#f2c94c'); }
  R(x + 1, y + 1, 1, 9, '#7a5039'); R(x + 5, y + 1, 1, 9, '#7a5039');
}
export function exclamacao(x, y, t) {
  if (Math.floor(t / 300) % 4 === 3) return;
  R(x, y, 6, 12, '#2b2430'); R(x + 1, y + 1, 4, 7, '#ff3b3b'); R(x + 1, y + 9, 4, 2, '#ff3b3b');
}
export function zzz(x, y, t) {
  for (let i = 0; i < 3; i++) {
    const f = ((t / 1800) + i / 3) % 1;
    const a = Math.min(1, (1 - f) * 1.5).toFixed(2);
    const px = x + i * 3 + Math.sin(f * 6) * 1.5, py = y - f * 12;
    const cor = `rgba(255,255,255,${a})`;
    R(px, py, 3, 1, cor); R(px + 1, py + 1, 1, 1, cor); R(px, py + 2, 3, 1, cor);
  }
}
export function chaveInglesa(x, y) { R(x, y + 2, 2, 7, '#adb5bd'); R(x - 1, y, 4, 3, '#adb5bd'); R(x, y, 2, 1, '#2b2430'); }
export function relogioPulso(x, y) { R(x, y, 3, 3, '#f8f9fa'); R(x + 1, y + 1, 1, 1, '#2b2430'); }
export function gotaSuor(x, y, t) { const d = (t / 120) % 6; R(x, y + d, 1, 2, '#74c0fc'); R(x - 1, y + d + 1, 3, 1, '#74c0fc'); }
export function controle(x, y) { R(x, y, 6, 3, '#2b2430'); R(x + 1, y + 1, 1, 1, '#e03131'); R(x + 4, y + 1, 1, 1, '#4dabf7'); }
export function xicara(x, y, t) { R(x, y, 3, 3, '#f8f9fa'); R(x + 3, y + 1, 1, 1, '#f8f9fa'); if (Math.floor(t / 400) % 2) R(x + 1, y - 2, 1, 1, 'rgba(255,255,255,.7)'); }

// fumaça subindo de um ponto
export function fumaca(x, y, t, semente = 0) {
  for (let i = 0; i < 6; i++) {
    const f = ((t / 1400) + i / 6 + semente) % 1;
    const a = (0.55 * (1 - f)).toFixed(2), s = 2 + Math.floor(f * 4);
    R(x + Math.sin(f * 7 + i) * 3 - s / 2, y - f * 18, s, s, `rgba(90,90,100,${a})`);
  }
}
// luz de alerta girando (no alto da parede)
export function sirene(x, y, t) {
  R(x, y + 5, 8, 2, '#2b2430');
  const on = Math.floor(t / 250) % 2;
  R(x + 1, y, 6, 5, on ? '#ff3b3b' : '#a61e1e'); R(x + 2, y + 1, 2, 2, on ? '#ffc9c9' : '#d64545');
}
