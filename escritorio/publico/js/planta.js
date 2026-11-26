// Planta do escritório, gerada a partir de salas.json e equipe.json.
// Sala nova = uma linha a mais em salas.json. Tudo é medido em blocos de 16 pixels.
//
// "largo": duas fileiras de salas com um corredor no meio (PC).
// "alto":  salas empilhadas com o corredor na lateral (celular em pé).

import * as A from './arte.js';

const T = A.T;
const MARGEM = 16;
const ALTURA = { cima: 10, baixo: 9 };
const LARGURA_MIN = { gerente: 13, estudio: 13, copa: 13, equipe: 11, vazia: 9 };
const LARGURA_ALTO = 13;
// Linha da porta lateral (modo "alto"), contada a partir do topo da sala.
const PORTA_LATERAL = { gerente: 5, estudio: 5, copa: 4 };

export const ESTILOS = {
  gerente: { parede: '#33415a', rodape: '#232d40', piso: (x, y, w, h) => A.pisoMadeira(x, y, w, h, '#6b4a35', '#5a3d2b') },
  estudio: { parede: '#2a2638', rodape: '#1c1a26', piso: (x, y, w, h) => A.pisoGrade(x, y, w, h, '#24222e', '#2e2b3c', 16) },
  equipe: { parede: '#e6ebef', rodape: '#c2c9d0', piso: (x, y, w, h) => A.pisoXadrez(x, y, w, h, '#c9d1dc', '#bec7d3', 16) },
  copa: { parede: '#cfe6d8', rodape: '#a9c8b5', piso: (x, y, w, h) => A.pisoXadrez(x, y, w, h, '#f1e4cc', '#e3d0b0', 8) },
  vazia: { parede: '#dcd6cc', rodape: '#bfb8ac', piso: (x, y, w, h) => A.pisoConcreto(x, y, w, h) },
};
const PISO_CORREDOR = (x, y, w, h) => A.pisoMadeira(x, y, w, h, '#dcc8a6', '#cdb68f');
export const FUNDO = '#26242d';

// Aparência dos bonecos. Quem não está aqui ganha uma aparência gerada pelo id.
const APARENCIA = {
  'gerente': { cabelo: '#cfd3d8', pele: '#e8b896', estilo: 'curto', gravata: true, calca: '#2b2f3a' },
  'cacadora-virais': { cabelo: '#6b2f17', pele: '#f1c7a3', estilo: 'longo' },
  'roteirista-virais': { cabelo: '#2b2430', pele: '#c68b62', estilo: 'curto' },
  'social-virais': { cabelo: '#e0a84a', pele: '#f3cfb0', estilo: 'coque' },
  'revisora-virais': { cabelo: '#3b2418', pele: '#8d5a3b', estilo: 'longo', oculos: true },
  'editor-virais': { cabelo: '#1f1a1a', pele: '#d9a27a', estilo: 'curto', fone: true },
};
export function aparencia(pessoa) {
  const base = APARENCIA[pessoa.id];
  const r = A.sorte(A.hashTexto(pessoa.id));
  const peles = ['#f1c7a3', '#e8b896', '#c68b62', '#8d5a3b', '#f3cfb0', '#d9a27a'];
  const cabelos = ['#2b2430', '#6b2f17', '#e0a84a', '#3b2418', '#9c9590', '#1f1a1a'];
  const estilos = ['curto', 'longo', 'coque'];
  const gerada = { pele: peles[Math.floor(r() * peles.length)], cabelo: cabelos[Math.floor(r() * cabelos.length)], estilo: estilos[Math.floor(r() * estilos.length)] };
  return { calca: '#3a3f58', ...(base || gerada), camisa: pessoa.cor || '#868e96' };
}

export function tipoDeTela(pessoa) {
  const t = `${pessoa.id} ${pessoa.cargo || ''}`.toLowerCase();
  if (t.includes('gerente')) return 'painel';
  if (t.includes('cacad') || t.includes('caçad')) return 'videos';
  if (t.includes('rotei')) return 'texto';
  if (t.includes('social')) return 'hashtags';
  if (t.includes('revis')) return 'checklist';
  if (t.includes('editor')) return 'edicao';
  return 'codigo';
}

// ---------- montagem ----------
function normalizar(salasCfg, equipe) {
  const lista = (Array.isArray(salasCfg) ? salasCfg : []).filter((s) => s && s.id);
  const salas = lista.map((s) => ({
    id: String(s.id), nome: String(s.nome || s.id), tipo: ESTILOS[s.tipo] ? s.tipo : 'equipe',
    fileira: s.fileira === 'baixo' ? 'baixo' : 'cima', largura: Number(s.largura) || 0, membros: [],
  }));
  if (!salas.length) salas.push({ id: 'equipe', nome: 'Equipe', tipo: 'equipe', fileira: 'cima', largura: 0, membros: [] });
  const porId = new Map(salas.map((s) => [s.id, s]));
  const reserva = salas.find((s) => s.tipo === 'equipe') || salas[0];
  for (const pessoa of Array.isArray(equipe) ? equipe : []) {
    if (!pessoa || !pessoa.id) continue;
    (porId.get(pessoa.sala) || reserva).membros.push(pessoa);
  }
  for (const s of salas) {
    s.tipoEfetivo = s.tipo === 'equipe' && s.membros.length === 0 ? 'vazia' : s.tipo;
    s.estilo = ESTILOS[s.tipoEfetivo];
  }
  return salas;
}

function larguraDe(s) {
  return Math.max(LARGURA_MIN[s.tipoEfetivo] || 11, s.largura || 0);
}

function montarLargo(p) {
  const cima = p.salas.filter((s) => s.fileira === 'cima');
  const baixo = p.salas.filter((s) => s.fileira === 'baixo');
  const soma = (l) => l.reduce((t, s) => t + larguraDe(s), 0);
  const W = Math.max(soma(cima), soma(baixo), 16);
  const hc = cima.length ? ALTURA.cima : 0;
  const hb = baixo.length ? ALTURA.baixo : 0;
  const colocar = (lista, y, h, lado) => {
    let x = 0;
    lista.forEach((s, i) => {
      const w = i === lista.length - 1 ? W - x : larguraDe(s);
      Object.assign(s, { x, y, w, h, porta: { lado } });
      x += w;
    });
  };
  colocar(cima, 0, hc, 'baixo');
  colocar(baixo, hc + 3, hb, 'cima');
  p.w = W; p.h = hc + 3 + hb;
  p.corredor = { x: 0, y: hc, w: W, h: 3 };
  p.entrada = { lado: 'esq', celulas: [[0, hc + 1], [0, hc + 2]] };
}

function montarAlto(p) {
  let y = 0;
  for (const s of p.salas) {
    const h = ALTURA[s.fileira];
    Object.assign(s, { x: 2, y, w: LARGURA_ALTO, h, porta: { lado: 'esq' } });
    y += h;
  }
  p.w = 2 + LARGURA_ALTO; p.h = y;
  p.corredor = { x: 0, y: 0, w: 2, h: y };
  p.entrada = { lado: 'baixo', celulas: [[0, y - 1], [1, y - 1]] };
}

const idx = (p, x, y) => y * p.w + x;
const dentro = (p, x, y) => x >= 0 && y >= 0 && x < p.w && y < p.h;

function ligar(p, a, b) {
  p.portas.add(`${a[0]},${a[1]}|${b[0]},${b[1]}`);
  p.portas.add(`${b[0]},${b[1]}|${a[0]},${a[1]}`);
}

function prepararPortas(p) {
  p.salas.forEach((s, i) => {
    const z = i;
    for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) {
      p.zona[idx(p, s.x + tx, s.y + ty)] = z;
      p.andavel[idx(p, s.x + tx, s.y + ty)] = ty >= 2 ? 1 : 0;
    }
    const porta = s.porta;
    const dc = Math.floor(s.w / 2) - 1;
    porta.celulas = [];
    if (porta.lado === 'baixo') {
      for (const x of [dc, dc + 1]) { porta.celulas.push([s.x + x, s.y + s.h - 1]); ligar(p, [s.x + x, s.y + s.h - 1], [s.x + x, s.y + s.h]); }
      porta.local = { x: dc, y: s.h - 1 };
    } else if (porta.lado === 'cima') {
      for (const x of [dc, dc + 1]) {
        for (const y of [0, 1]) { p.andavel[idx(p, s.x + x, s.y + y)] = 1; porta.celulas.push([s.x + x, s.y + y]); }
        ligar(p, [s.x + x, s.y], [s.x + x, s.y - 1]);
      }
      porta.local = { x: dc, y: 0 };
    } else {
      const dy = PORTA_LATERAL[s.tipoEfetivo] ?? s.h - 3;
      for (const y of [dy, dy + 1]) { porta.celulas.push([s.x, s.y + y]); ligar(p, [s.x, s.y + y], [s.x - 1, s.y + y]); }
      porta.local = { x: 0, y: dy };
    }
  });
  const c = p.corredor;
  for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) { p.zona[idx(p, x, y)] = -2; p.andavel[idx(p, x, y)] = 1; }
}

// Ferramentas que cada sala usa para colocar seus móveis (coordenadas locais da sala).
function contexto(p, s) {
  const X = (tx) => p.ox + (s.x + tx) * T;
  const Y = (ty) => p.oy + (s.y + ty) * T;
  return {
    s, w: s.w, h: s.h, X, Y, cx: X(0) + (s.w * T) / 2,
    bloq(tx, ty, tw = 1, th = 1) {
      for (let y = ty; y < ty + th; y++) for (let x = tx; x < tx + tw; x++) {
        if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
        p.bloqueado[idx(p, s.x + x, s.y + y)] = 1;
      }
    },
    item(base, desenhar) { p.itens.push({ base, desenhar }); },
    estatico(desenhar) { p.estaticos.push(desenhar); },
    parede(desenhar) { p.paredesDin.push(desenhar); },
    luz(l) { p.luzes.push(l); },
    assento(id, a) { p.assentos[id] = { sala: s.id, tile: [s.x + a.tx, s.y + a.ty], ...a }; },
    ponto(pt) { p.pontos.push({ sala: s.id, tile: [s.x + pt.tx, s.y + pt.ty], ocupante: null, ...pt }); },
  };
}

// ---------- móveis de cada tipo de sala ----------
function mobiliarGerente(c) {
  const { X, Y, w } = c;
  const cx = X(6) + 8 + (w - 13) * 8;
  const t6 = Math.round((cx - X(0) - 8) / T);
  const jw = Math.min(150, w * T - 96);
  c.estatico((hora) => A.janelaCidade(cx - Math.round(jw / 2), Y(0) + 4, jw, 18, hora));
  c.estatico(() => A.prateleiraTrofeus(X(w - 3) + 2, Y(0) + 4));
  c.estatico(() => A.tapete(cx - 48, Y(3) + 2, 96, 60, '#c9a24a', '#7a2e3a', '#e0c27a'));
  c.item(Y(3), () => A.estante(X(0) + 3, Y(3) - 30, 26, 30)); c.bloq(0, 2, 2, 1);
  c.item(Y(3), () => A.plantaGrande(X(w - 1), Y(3) - 26)); c.bloq(w - 1, 2);

  const dono = c.s.membros[0];
  const dx = cx - 36;
  c.item(Y(4) - 2, () => A.cadeiraExecutiva(cx - 9, Y(4) - 27));
  c.item(Y(5), (cena) => {
    A.mesaExecutiva(dx, Y(4), 72);
    A.notebook(cx - 8, Y(4) - 6, (x, y, ww, hh) => cena.desenharTela(dono && dono.id, 'painel', x, y, ww, hh));
    if (dono) { A.canecas(dx + 14, Y(4) + 1, cena.canecas(dono.id)); if (cena.estadoDe(dono.id) === 'erro') A.fumaca(cx, Y(4) - 8, cena.t); }
  });
  c.bloq(t6 - 2, 4, 5, 1);
  if (dono) {
    c.assento(dono.id, { tx: t6, ty: 3, pose: 'sentado-frente', sx: cx - 6, sy: Y(4) - 17, sort: Y(4) - 1, fx: cx, fy: Y(4) - 1, tela: 'painel' });
    c.luz({ x: cx, y: Y(4) - 2, r: 14, cor: '120,190,255', quando: (cena) => cena.estadoDe(dono.id) === 'trabalhando' });
  }
  c.item(Y(6), () => { A.poltronaCostas(X(t6 - 1), Y(5) + 2, '#2f6f73', '#1f4f52'); A.poltronaCostas(X(t6 + 1), Y(5) + 2, '#2f6f73', '#1f4f52'); });
  c.bloq(t6 - 1, 5); c.bloq(t6 + 1, 5);
  c.item(Y(8), () => A.mesaCentro(X(1) + 4, Y(7) + 2, 40, 12)); c.bloq(1, 7, 3, 1);
  c.item(Y(9), () => A.sofaCostas(X(1) + 4, Y(8) + 1, 40, '#a0673f', '#6b432c')); c.bloq(1, 8, 3, 1);
  c.item(Y(9), (cena) => A.luminaria(X(0) + 3, Y(9) - 25, cena.noite)); c.bloq(0, 8);
  c.luz({ x: X(0) + 8, y: Y(9) - 20, r: 40, cor: '255,214,140', quando: () => true });
  c.item(Y(9), () => A.minibar(X(w - 2) + 8, Y(8))); c.bloq(w - 2, 8, 2, 1);
}

function mobiliarEstudio(c) {
  const { X, Y, w } = c;
  const dono = c.s.membros[0];
  c.estatico(() => { A.espuma(X(0), Y(0), w * T, 2 * T - 3); A.R(X(0), Y(0) + 1, w * T, 1, '#b197fc'); });
  c.estatico(() => A.telaVerde(X(w - 5) + 4, Y(0) + 6, 72, Y(2), 24));
  c.parede((cena) => A.placaNoAr(X(0) + 6, Y(0) + 7, cena.estudioNoAr, cena.t));
  c.luz({ x: X(0) + 20, y: Y(0) + 12, r: 22, cor: '255,60,60', quando: (cena) => cena.estudioNoAr });

  c.item(Y(4), (cena) => {
    const id = dono && dono.id;
    A.ilhaEdicao(X(1), Y(3), 80);
    const mid = X(1) + 40;
    [[-35, 3], [-11, -1], [13, 3]].forEach(([dx, dy]) => A.monitor(mid + dx, Y(3) - 17 + dy, 22, 14, (x, y, ww, hh) => cena.desenharTela(id, 'edicao', x, y, ww, hh)));
    A.microfoneBraco(X(5) + 10, Y(3) - 2);
    if (id && cena.estadoDe(id) === 'trabalhando') A.ondasSom(X(5) - 3, Y(3) - 16, cena.t);
    if (id) { A.canecas(X(1) + 3, Y(3) - 2, cena.canecas(id)); if (cena.estadoDe(id) === 'erro') A.fumaca(mid, Y(3) - 18, cena.t); }
  });
  c.bloq(1, 3, 5, 1);
  if (dono) {
    c.assento(dono.id, { tx: 3, ty: 4, pose: 'sentado-costas', sx: X(3) + 2, sy: Y(4) - 7, sort: Y(4) + 8, fx: X(3) + 8, fy: Y(4) + 14, tela: 'edicao' });
    c.luz({ x: X(1) + 40, y: Y(3) - 10, r: 24, cor: '120,170,255', quando: (cena) => cena.estadoDe(dono.id) === 'trabalhando' });
  }
  c.item(Y(4) + 9, () => A.cadeira(X(3) + 1, Y(4) + 4, '#5f3dc4'));
  c.item(Y(4), (cena) => A.ringLight(X(6) + 1, Y(4) - 30, cena.estudioNoAr)); c.bloq(6, 3);
  c.item(Y(5), (cena) => { A.softbox(X(w - 5) + 2, Y(5) - 21, cena.estudioNoAr); A.softbox(X(w - 1) + 2, Y(5) - 21, cena.estudioNoAr); });
  c.bloq(w - 5, 4); c.bloq(w - 1, 4);
  c.luz({ x: X(w - 3), y: Y(4), r: 34, cor: '255,250,225', quando: (cena) => cena.estudioNoAr });
  c.item(Y(6), (cena) => A.cameraTripe(X(w - 3) - 2, Y(6) - 19, cena.estudioNoAr, cena.t)); c.bloq(w - 3, 5);
  c.item(Y(8), (cena) => { A.mesinha(X(1) + 2, Y(7) + 2, 26); A.claquete(X(1) + 7, Y(7) - 9, cena.claqueteAberta); }); c.bloq(1, 7, 2, 1);
  c.item(Y(8), () => A.caseEquipamento(X(3), Y(8) - 22)); c.bloq(3, 7);
  c.item(Y(9), () => A.prateleiraEquipamento(X(w - 3) + 2, Y(9) - 24)); c.bloq(w - 3, 8, 3, 1);
  c.item(Y(8) + 2, () => A.sofaCostas(X(w - 6) + 4, Y(7) + 1, 40, '#5f3dc4', '#3b2a80')); c.bloq(w - 6, 7, 3, 1);
  c.item(Y(10), () => A.planta(X(0) + 2, Y(10) - 18)); c.bloq(0, 9);
}

function mobiliarEquipe(c) {
  const { X, Y, w, h } = c;
  const cx = c.cx;
  c.estatico((hora) => A.janela(X(0) + 8, Y(0) + 6, 28, 16, hora));
  c.estatico(() => A.quadroBranco(Math.round(cx) - 26, Y(0) + 5, 52, 18));
  c.estatico((hora) => A.janela(X(w) - 36, Y(0) + 6, 28, 16, hora));
  c.estatico((hora) => A.relogio(Math.round(cx) + 32, Y(0) + 7, hora));

  // mesas em duas colunas, uma de cada lado do corredor central
  const a = Math.floor((w - 3) / 2);
  const colunas = [];
  for (let k = 0; k < 6; k++) {
    const l = a - 3 - k * 4, r = a + 3 + k * 4;
    if (l >= 1) colunas.push(l);
    if (r + 3 <= w - 1) colunas.push(r);
    if (l < 1 && r + 3 > w - 1) break;
  }
  const vagas = [];
  for (let ty = 3; ty + 1 <= h - 2; ty += 3) for (const col of colunas) vagas.push({ col, ty });

  c.s.membros.forEach((pessoa, i) => {
    const v = vagas[i];
    if (!v) return;
    const { col, ty } = v;
    const tela = tipoDeTela(pessoa);
    c.item(Y(ty + 1), (cena) => {
      A.mesaTrabalho(X(col) + 1, Y(ty), 46);
      A.monitor(X(col) + 14, Y(ty) - 16, 20, 14, (x, y, ww, hh) => cena.desenharTela(pessoa.id, tela, x, y, ww, hh));
      A.canecas(X(col) + 4, Y(ty) - 6, cena.canecas(pessoa.id));
      if (cena.estadoDe(pessoa.id) === 'erro') A.fumaca(X(col) + 24, Y(ty) - 18, cena.t);
    });
    c.bloq(col, ty, 3, 1);
    c.item(Y(ty + 1) + 9, () => A.cadeira(X(col + 1) + 1, Y(ty + 1) + 4, '#3b3f4e'));
    c.assento(pessoa.id, { tx: col + 1, ty: ty + 1, pose: 'sentado-costas', sx: X(col + 1) + 2, sy: Y(ty + 1) - 7, sort: Y(ty + 1) + 8, fx: X(col + 1) + 8, fy: Y(ty + 1) + 14, tela });
    c.luz({ x: X(col) + 24, y: Y(ty) - 10, r: 16, cor: '120,190,255', quando: (cena) => cena.estadoDe(pessoa.id) === 'trabalhando' });
  });

  c.item(Y(3), () => A.planta(X(0) + 2, Y(3) - 18)); c.bloq(0, 2);
  c.item(Y(3), () => A.impressora(X(w - 1) - 3, Y(3) - 20)); c.bloq(w - 1, 2);
  c.item(Y(h), () => A.bebedouro(X(w - 1) + 2, Y(h) - 22)); c.bloq(w - 1, h - 1);
  c.item(Y(h), () => A.planta(X(0) + 2, Y(h) - 18)); c.bloq(0, h - 1);
}

function mobiliarVazia(c) {
  const { X, Y, w, h } = c;
  c.estatico(() => A.placaEmBreve(X(w) - 60, Y(0) + 9));
  c.estatico(() => { for (let x = X(1); x < X(w - 1); x += 8) A.R(x, Y(h) - 24, 4, 2, ((x - X(1)) / 8) % 2 ? '#2b2430' : '#fab005'); });
  c.item(Y(4), () => { A.caixa(X(1), Y(3) + 2); A.caixa(X(1) + 13, Y(3) + 2); A.caixa(X(1) + 6, Y(3) - 7); }); c.bloq(1, 3, 2, 1);
  c.item(Y(4), () => A.escada(X(w - 2) + 2, Y(4) - 26)); c.bloq(w - 2, 3);
  c.item(Y(h - 1), () => { A.caixa(X(w - 3), Y(h - 2) + 2); A.caixa(X(w - 4) + 2, Y(h - 2) + 4); });
  c.bloq(w - 4, h - 2, 2, 1);
}

function mobiliarCopa(c) {
  const { X, Y, w, h } = c;
  const larga = w >= 16;
  const dc = Math.floor(w / 2) - 1;
  c.estatico(() => A.cardapio(X(1) + 18, Y(0) + 5));
  c.estatico((hora) => A.relogio(X(dc + 2) + 10, Y(0) + 8, hora));
  if (larga) c.estatico(() => A.quadroArte(X(dc + 3) + 10, Y(0) + 6, 22, 16, 11));

  c.item(Y(3), () => A.geladeira(X(0), Y(3))); c.bloq(0, 2);
  c.item(Y(3), (cena) => { A.bancada(X(1), Y(2), 64); A.cafeteira(X(1) + 6, Y(2), cena.t, cena.servindoCafe); A.microondas(X(3) + 12, Y(2)); });
  c.bloq(1, 2, 4, 1);
  if (larga) { c.item(Y(3), () => A.maquinaSalgadinho(X(5) - 2, Y(3))); c.bloq(5, 2); }

  // canto do videogame
  c.parede((cena) => A.tvGame(X(w - 4) + 2, Y(0) + 9, 44, cena.jogando, cena.t));
  c.luz({ x: X(w - 4) + 24, y: Y(0) + 18, r: 30, cor: '140,200,255', quando: (cena) => cena.jogando });
  c.item(Y(3), () => A.rackTv(X(w - 4) + 2, Y(2) + 2, 44)); c.bloq(w - 4, 2, 3, 1);
  c.estatico(() => A.tapetinho(X(w - 5) + 4, Y(3) + 2, 72, 40));
  for (const tx of [w - 4, w - 2]) {
    const cor = tx === w - 4 ? ['#fd7e14', '#d9480f'] : ['#4dabf7', '#1c7ed6'];
    c.item(Y(5), () => A.puff(X(tx), Y(4) + 3, cor[0], cor[1])); c.bloq(tx, 4);
    c.ponto({ tx, ty: 5, pose: 'sentado-costas', sx: X(tx) + 2, sy: Y(4) - 5, sort: Y(5) + 1, atividade: 'jogando' });
  }

  // mesinha redonda com banquetas
  const tl = Math.max(3, Math.floor(w * 0.25));
  c.item(Y(6), () => A.mesaRedonda(X(tl) + 2, Y(5) - 6)); c.bloq(tl, 5, 2, 1);
  const bancos = [
    { bx: tl, by: 4, dx: 8, dy: 4, ax: tl, ay: 3, pose: 'sentado-frente', sy: -6, sort: Y(4) + 10, cor: '#d6336c' },
    { bx: tl + 1, by: 6, dx: 2, dy: 2, ax: tl + 1, ay: 7, pose: 'sentado-costas', sy: -6, sort: Y(7) + 1, cor: '#4263eb' },
    { bx: tl - 1, by: 5, dx: 4, dy: 3, ax: tl - 2, ay: 5, pose: 'sentado-frente', sy: -7, sort: Y(6) + 1, cor: '#f59f00' },
    { bx: tl + 2, by: 5, dx: 0, dy: 3, ax: tl + 3, ay: 5, pose: 'sentado-frente', sy: -7, sort: Y(6) + 1, cor: '#2f9e44' },
  ];
  for (const b of bancos) {
    const bx = X(b.bx) + b.dx, by = Y(b.by) + b.dy;
    c.item(by + 12, () => A.banqueta(bx, by, b.cor)); c.bloq(b.bx, b.by);
    c.ponto({ tx: b.ax, ty: b.ay, pose: b.pose, sx: bx, sy: by + b.sy, sort: b.sort, atividade: 'conversa', comPernas: b.pose === 'sentado-frente' });
  }

  if (larga) {
    c.item(Y(8), () => A.sofaFrente(X(1) + 4, Y(7) - 2, 56, '#e8590c', '#b8440a')); c.bloq(1, 7, 4, 1);
    for (let i = 0; i < 3; i++) c.ponto({ tx: 1 + i + (i > 0 ? 1 : 0), ty: 8, pose: 'sentado-frente', sx: X(1) + 8 + i * 17, sy: Y(7) - 8, sort: Y(8) + 1, atividade: 'sofa', comPernas: true });
  }
  c.item(Y(h), () => A.bebedouro(X(w - 1) + 2, Y(h) - 22)); c.bloq(w - 1, h - 1);
  c.item(Y(h), () => A.planta(X(0) + 2, Y(h) - 18)); c.bloq(0, h - 1);

  // em pé: café, geladeira e água
  c.ponto({ tx: 1, ty: 3, pose: 'em-pe', dir: 'cima', fx: X(1) + 10, fy: Y(3) + 13, atividade: 'cafe' });
  c.ponto({ tx: 0, ty: 3, pose: 'em-pe', dir: 'cima', fx: X(0) + 8, fy: Y(3) + 13, atividade: 'geladeira' });
  c.ponto({ tx: w - 2, ty: h - 1, pose: 'em-pe', dir: 'dir', fx: X(w - 2) + 8, fy: Y(h - 1) + 14, atividade: 'agua' });
}

const MOBILIA = { gerente: mobiliarGerente, estudio: mobiliarEstudio, equipe: mobiliarEquipe, vazia: mobiliarVazia, copa: mobiliarCopa };

// Luz de teto de cada sala (só aparece à noite). Cor e força combinam com a sala:
// escritório branco e frio, gerente e copa quentes, estúdio lilás e mais fraco,
// sala vazia quase apagada.
const LUZ_TETO = {
  equipe: { cor: '228,236,255', forca: 0.8 },
  gerente: { cor: '255,208,150', forca: 0.75 },
  estudio: { cor: '196,178,255', forca: 0.7 },
  copa: { cor: '255,224,168', forca: 0.8 },
  vazia: { cor: '235,228,212', forca: 0.4 },
};
function iluminarSala(p, s) {
  const tom = LUZ_TETO[s.tipoEfetivo];
  if (!tom) return;
  const piso = s.h - 2;                               // as 2 primeiras fileiras são parede
  const colunas = Math.max(2, Math.round(s.w / 5));
  const linhas = piso >= 6 ? [0.3, 0.78] : [0.5];
  for (const f of linhas) for (let i = 0; i < colunas; i++) {
    p.luzes.push({
      x: p.ox + (s.x + ((i + 0.5) * s.w) / colunas) * T,
      y: p.oy + (s.y + 2 + piso * f) * T,
      r: 50, cor: tom.cor, forca: tom.forca, quando: () => true,
    });
  }
}

function mobiliarCorredor(p) {
  const X = (tx) => p.ox + tx * T, Y = (ty) => p.oy + ty * T;
  const c = p.corredor;
  const bloq = (x, y) => { if (dentro(p, x, y)) p.bloqueado[idx(p, x, y)] = 1; };
  const portasPerto = new Set();
  for (const s of p.salas) for (const [x, y] of s.porta.celulas) for (let d = -1; d <= 1; d++) {
    if (s.porta.lado === 'esq') portasPerto.add(`${x - 1},${y + d}`); else portasPerto.add(`${x + d},${s.porta.lado === 'baixo' ? y + 1 : y - 1}`);
  }
  const livre = (x, y) => !portasPerto.has(`${x},${y}`);
  const enfeites = [
    (x, y) => p.itens.push({ base: Y(y + 1), desenhar: () => A.plantaGrande(X(x), Y(y + 1) - 26) }),
    (x, y) => p.itens.push({ base: Y(y + 1), desenhar: () => A.bebedouro(X(x) + 2, Y(y + 1) - 22) }),
    (x, y) => p.itens.push({ base: Y(y + 1), desenhar: () => A.planta(X(x) + 2, Y(y + 1) - 18) }),
  ];
  if (p.orientacao === 'largo') {
    p.estaticos.push(() => A.tapeteCorredor(X(4), Y(c.y + 1) + 3, (c.w - 5) * T, 10));
    // recepção na entrada
    p.itens.push({ base: Y(c.y + 1), desenhar: () => A.balcaoRecepcao(X(0) + 4, Y(c.y) - 2, 40) });
    bloq(0, c.y); bloq(1, c.y); bloq(2, c.y);
    p.itens.push({ base: Y(c.y + 3), desenhar: () => A.plantaGrande(X(c.w - 1), Y(c.y + 3) - 26) }); bloq(c.w - 1, c.y + 2);
    let n = 0;
    for (let x = 5; x < c.w - 2; x++) {
      if (!livre(x, c.y) || !livre(x + 1, c.y) || !livre(x - 1, c.y)) continue;
      enfeites[n % enfeites.length](x, c.y); bloq(x, c.y); n++; x += 4;
    }
    for (let i = 4; i < c.w - 2; i += 7) p.luzes.push({ x: X(i) + 8, y: Y(c.y + 1) + 8, r: 46, cor: '255,226,170', quando: () => true });
  } else {
    p.estaticos.push(() => A.R(X(0) + 12, Y(0) + 4, 8, c.h * T - 8, '#3d7a80'));
    let n = 0;
    for (let y = 2; y < c.h - 2; y++) {
      if (!livre(0, y) || !livre(0, y - 1) || !livre(0, y + 1)) continue;
      enfeites[n % enfeites.length](0, y); bloq(0, y); n++; y += 5;
    }
    for (let i = 3; i < c.h; i += 8) p.luzes.push({ x: X(1), y: Y(i), r: 40, cor: '255,226,170', quando: () => true });
  }
}

export function gerarPlanta(salasCfg, equipe, orientacao) {
  const p = {
    orientacao, salas: normalizar(salasCfg, equipe), portas: new Set(),
    itens: [], estaticos: [], paredesDin: [], luzes: [], assentos: {}, pontos: [],
  };
  if (orientacao === 'alto') montarAlto(p); else montarLargo(p);
  p.ox = MARGEM; p.oy = MARGEM;
  p.larguraPx = p.w * T + MARGEM * 2;
  p.alturaPx = p.h * T + MARGEM * 2;
  p.zona = new Int16Array(p.w * p.h).fill(-1);
  p.andavel = new Uint8Array(p.w * p.h);
  p.bloqueado = new Uint8Array(p.w * p.h);
  prepararPortas(p);
  for (const s of p.salas) MOBILIA[s.tipoEfetivo](contexto(p, s));
  for (const s of p.salas) iluminarSala(p, s);
  mobiliarCorredor(p);
  // garantia: porta e o bloco logo depois dela nunca ficam bloqueados
  for (const s of p.salas) for (const [x, y] of s.porta.celulas) {
    p.bloqueado[idx(p, x, y)] = 0;
    const [ix, iy] = s.porta.lado === 'baixo' ? [x, y - 1] : s.porta.lado === 'cima' ? [x, y + 2] : [x + 1, y];
    if (dentro(p, ix, iy) && p.zona[idx(p, ix, iy)] === p.zona[idx(p, x, y)]) p.bloqueado[idx(p, ix, iy)] = 0;
  }
  // assentos e pontos nunca ficam bloqueados
  for (const a of Object.values(p.assentos)) p.bloqueado[idx(p, a.tile[0], a.tile[1])] = 0;
  for (const pt of p.pontos) p.bloqueado[idx(p, pt.tile[0], pt.tile[1])] = 0;
  const salaGerente = p.salas.find((s) => s.tipoEfetivo === 'gerente');
  p.socorrista = salaGerente && salaGerente.membros[0] ? salaGerente.membros[0].id : null;
  p.salaDe = {};
  for (const s of p.salas) for (const m of s.membros) p.salaDe[m.id] = s;
  p.pontoEspera = p.orientacao === 'largo' ? [3, p.corredor.y + 1] : [1, Math.max(0, p.h - 3)];
  return p;
}

// ---------- caminhos ----------
export function podeAndar(p, x, y) {
  return dentro(p, x, y) && p.andavel[idx(p, x, y)] === 1 && p.bloqueado[idx(p, x, y)] === 0;
}
function passagem(p, a, b) {
  const za = p.zona[idx(p, a[0], a[1])], zb = p.zona[idx(p, b[0], b[1])];
  return za === zb || p.portas.has(`${a[0]},${a[1]}|${b[0]},${b[1]}`);
}
// Busca em largura na grade. Devolve a lista de blocos até o destino (sem o de partida).
export function caminho(p, de, para) {
  if (de[0] === para[0] && de[1] === para[1]) return [];
  const total = p.w * p.h;
  const veio = new Int32Array(total).fill(-1);
  const inicio = idx(p, de[0], de[1]), fim = idx(p, para[0], para[1]);
  const fila = [inicio];
  veio[inicio] = inicio;
  const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    if (atual === fim) break;
    const ax = atual % p.w, ay = Math.floor(atual / p.w);
    for (const [dx, dy] of viz) {
      const nx = ax + dx, ny = ay + dy;
      if (!dentro(p, nx, ny)) continue;
      const n = idx(p, nx, ny);
      if (veio[n] !== -1) continue;
      if (n !== fim && !podeAndar(p, nx, ny)) continue;
      if (n === fim && !(p.andavel[n] === 1)) continue;
      if (!passagem(p, [ax, ay], [nx, ny])) continue;
      veio[n] = atual;
      fila.push(n);
    }
  }
  if (veio[fim] === -1) return null;
  const lista = [];
  for (let n = fim; n !== inicio; n = veio[n]) lista.push([n % p.w, Math.floor(n / p.w)]);
  return lista.reverse();
}

// ---------- parte estática (pisos, paredes, decoração de parede) ----------
export function desenharEstatico(p, hora) {
  const X = (tx) => p.ox + tx * T, Y = (ty) => p.oy + ty * T;
  A.R(0, 0, p.larguraPx, p.alturaPx, FUNDO);
  // sombra do prédio
  A.R(X(0) - 6, Y(p.h) + 6, p.w * T + 12, 6, 'rgba(0,0,0,.25)');

  const c = p.corredor;
  PISO_CORREDOR(X(c.x), Y(c.y), c.w * T, c.h * T);
  for (const s of p.salas) {
    const e = s.estilo;
    e.piso(X(s.x), Y(s.y + 2), s.w * T, (s.h - 2) * T);
    A.R(X(s.x), Y(s.y), s.w * T, 2 * T, e.parede);
    A.R(X(s.x), Y(s.y + 2) - 3, s.w * T, 3, e.rodape);
    A.R(X(s.x), Y(s.y + 2), s.w * T, 2, 'rgba(0,0,0,.14)');
  }
  for (const desenhar of p.estaticos) desenhar(hora);

  // vãos das portas que atravessam a parede do fundo
  for (const s of p.salas) if (s.porta.lado === 'cima') {
    const x0 = X(s.x + s.porta.local.x);
    s.estilo.piso(x0, Y(s.y), 2 * T, 2 * T);
    A.R(x0 - 3, Y(s.y), 3, 2 * T, '#8d7f6c'); A.R(x0 + 2 * T, Y(s.y), 3, 2 * T, '#8d7f6c');
    A.R(x0, Y(s.y), 2 * T, 3, 'rgba(0,0,0,.18)');
  }

  // paredes internas (finas), dividindo as salas
  const PI = '#e8e2d8', SOMBRA = '#bdb4a6';
  const linhaH = (x, y, w) => { A.R(x, y - 2, w, 4, PI); A.R(x, y + 2, w, 1, SOMBRA); };
  const linhaV = (x, y, h) => { A.R(x - 2, y - 2, 4, h + 4, PI); A.R(x + 2, y, 1, h, 'rgba(0,0,0,.12)'); };
  for (const s of p.salas) {
    linhaH(X(s.x), Y(s.y), s.w * T); linhaH(X(s.x), Y(s.y + s.h), s.w * T);
    linhaV(X(s.x), Y(s.y), s.h * T); linhaV(X(s.x + s.w), Y(s.y), s.h * T);
  }

  // paredes de vidro (lado da porta da sala do gerente)
  for (const s of p.salas) if (s.tipoEfetivo === 'gerente') {
    if (s.porta.lado === 'baixo') { A.R(X(s.x) + 2, Y(s.y + s.h) - 2, s.w * T - 4, 4, '#8fd0e6'); for (let i = 4; i < s.w * T; i += 7) A.R(X(s.x) + i, Y(s.y + s.h) - 1, 2, 1, '#e3f6fc'); }
    if (s.porta.lado === 'esq') { A.R(X(s.x) - 2, Y(s.y) + 2, 4, s.h * T - 4, '#8fd0e6'); for (let i = 4; i < s.h * T; i += 7) A.R(X(s.x) - 1, Y(s.y) + i, 1, 2, '#e3f6fc'); }
  }

  // portas
  const SOLEIRA = '#cbb894', BATENTE = '#8d7f6c';
  for (const s of p.salas) {
    const { lado, local } = s.porta;
    if (lado === 'baixo' || lado === 'cima') {
      const x0 = X(s.x + local.x), y0 = lado === 'baixo' ? Y(s.y + s.h) : Y(s.y);
      A.R(x0, y0 - 3, 2 * T, 6, SOLEIRA); A.R(x0 - 2, y0 - 4, 3, 8, BATENTE); A.R(x0 + 2 * T - 1, y0 - 4, 3, 8, BATENTE);
    } else {
      const y0 = Y(s.y + local.y), x0 = X(s.x);
      A.R(x0 - 3, y0, 6, 2 * T, SOLEIRA); A.R(x0 - 4, y0 - 2, 8, 3, BATENTE); A.R(x0 - 4, y0 + 2 * T - 1, 8, 3, BATENTE);
    }
  }

  // parede externa (grossa)
  const ext = (x, y, w, h) => A.R(x, y, w, h, '#efeae2');
  const W = p.w * T, H = p.h * T, x0 = X(0), y0 = Y(0);
  ext(x0 - 8, y0 - 8, W + 16, 8); ext(x0 - 8, y0 + H, W + 16, 8); ext(x0 - 8, y0 - 8, 8, H + 16); ext(x0 + W, y0 - 8, 8, H + 16);
  const CONTORNO = '#8c8476';
  A.R(x0 - 9, y0 - 9, W + 18, 1, CONTORNO); A.R(x0 - 9, y0 + H + 8, W + 18, 1, CONTORNO);
  A.R(x0 - 9, y0 - 9, 1, H + 18, CONTORNO); A.R(x0 + W + 8, y0 - 9, 1, H + 18, CONTORNO);
  A.R(x0, y0 - 1, W, 1, '#cfc7ba'); A.R(x0 - 8, y0 + H + 7, W + 16, 1, '#bdb4a6');
  // entrada
  const ent = p.entrada.celulas;
  if (p.entrada.lado === 'esq') {
    const ey = Y(ent[0][1]);
    PISO_CORREDOR(x0 - 9, ey, 9, 2 * T);
    A.R(x0 - 10, ey - 3, 3, 3, BATENTE); A.R(x0 - 10, ey + 2 * T, 3, 3, BATENTE);
    A.R(x0 + 1, ey + 3, 10, 2 * T - 6, '#7a4a2a'); A.R(x0 + 3, ey + 5, 6, 2 * T - 10, '#8f5a35');
  } else {
    const ex = X(ent[0][0]);
    PISO_CORREDOR(ex, y0 + H, 2 * T, 9);
    A.R(ex - 3, y0 + H + 6, 3, 3, BATENTE); A.R(ex + 2 * T, y0 + H + 6, 3, 3, BATENTE);
    A.R(ex + 3, y0 + H - 10, 2 * T - 6, 9, '#7a4a2a'); A.R(ex + 5, y0 + H - 8, 2 * T - 10, 5, '#8f5a35');
  }
}

// Onde vai a plaquinha com o nome de cada sala (em pixels de arte).
export function placas(p) {
  const X = (tx) => p.ox + tx * T, Y = (ty) => p.oy + ty * T;
  return p.salas.map((s) => {
    const { lado, local } = s.porta;
    if (lado === 'baixo') return { texto: s.nome, x: X(s.x + local.x + 2) + 4, y: Y(s.y + s.h), alinha: 'esq' };
    if (lado === 'cima') return { texto: s.nome, x: X(s.x + local.x + 2) + 4, y: Y(s.y), alinha: 'esq' };
    return { texto: s.nome, x: X(s.x) + (s.w * T) / 2, y: Y(s.y), alinha: 'centro' };
  });
}
