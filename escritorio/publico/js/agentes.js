// Os bonecos: para onde cada um vai, como anda e como é desenhado em cada estado.

import * as A from './arte.js';
import { caminho, podeAndar, aparencia } from './planta.js';

const T = A.T;
const VELOCIDADE = 64; // pixels de arte por segundo
const ESTADOS = new Set(['livre', 'trabalhando', 'esperando', 'erro']);
const MIN_POR_CANECA = 5;
const MAX_CANECAS = 5;
const MIN_SUOR = 30;
const MIN_IMPACIENTE = 3;
const MIN_COCHILO = 15;

const centro = (p, [tx, ty]) => ({ x: p.ox + tx * T + 8, y: p.oy + ty * T + 14 });

export function minutosDesde(desde, agora) {
  return Math.max(0, (agora - desde) / 60000);
}
export function textoTempo(min) {
  if (min < 1) return 'agora';
  if (min < 60) return `há ${Math.floor(min)} min`;
  const h = Math.floor(min / 60), m = Math.floor(min % 60);
  return m ? `há ${h} h ${m} min` : `há ${h} h`;
}

export class Agente {
  constructor(pessoa) {
    this.id = pessoa.id;
    this.estado = 'livre';
    this.tarefa = '';
    this.desde = Date.now();
    this.tile = null;
    this.prox = null;
    this.caminho = [];
    this.pos = { x: 0, y: 0 };
    this.alvo = null;
    this.chaveAlvo = '';
    this.chegou = false;
    this.dir = 'baixo';
    this.andado = 0;
    this.ponto = null;
    this.trocaEm = 0;
    this.sentouEm = 0;
    this.semente = (A.hashTexto(pessoa.id) % 1000) * 7;
    this.atualizarInfo(pessoa);
  }

  atualizarInfo(pessoa) {
    this.nome = pessoa.nome || pessoa.id;
    this.cor = pessoa.cor || '#868e96';
    this.cargo = pessoa.cargo || '';
    this.ap = aparencia(pessoa);
  }

  get sentado() { return this.chegou && this.alvo && this.alvo.sentar; }

  faseEspera(agora) {
    const min = minutosDesde(this.desde, agora);
    if (min < MIN_IMPACIENTE) return 'ampulheta';
    if (min < MIN_COCHILO) return 'impaciente';
    return 'cochilando';
  }

  // Decide para onde o boneco deve ir agora.
  alvoDesejado(p, equipe, cena) {
    const assento = p.assentos[this.id];
    if (this.id === p.socorrista && this.estado !== 'erro') {
      const vitima = equipe.primeiroEmErro(this.id);
      if (vitima) { const s = equipe.lugarDeSocorro(p, vitima); if (s) return s; }
    }
    if ((this.estado === 'trabalhando' || this.estado === 'erro') && assento) {
      return { chave: 'assento', tile: assento.tile, sentar: assento };
    }
    if (this.estado === 'esperando' && assento) {
      return { chave: 'espera', tile: assento.tile, fx: assento.fx, fy: assento.fy, dir: 'baixo' };
    }
    if (this.estado === 'livre' && p.pontos.length) {
      const atual = this.ponto && this.alvo && this.alvo.ponto === this.ponto ? this.ponto : null;
      if (atual && !(this.chegou && cena.t > this.trocaEm)) return this.alvo;
      const livres = p.pontos.filter((pt) => !pt.ocupante || pt.ocupante === this.id);
      const opcoes = livres.filter((pt) => pt !== atual);
      if (atual && (!opcoes.length || Math.random() < 0.35)) { this.trocaEm = cena.t + 15000 + Math.random() * 25000; return this.alvo; }
      const escolhido = opcoes.length ? opcoes[Math.floor(Math.random() * opcoes.length)] : null;
      if (escolhido) {
        return {
          chave: `ponto:${p.pontos.indexOf(escolhido)}:${Math.random().toString(36).slice(2, 6)}`,
          tile: escolhido.tile, ponto: escolhido,
          sentar: escolhido.pose !== 'em-pe' ? escolhido : null,
          fx: escolhido.fx, fy: escolhido.fy, dir: escolhido.dir,
        };
      }
    }
    return { chave: 'corredor', tile: p.pontoEspera, dir: 'baixo' };
  }

  soltarPonto() {
    if (this.ponto && this.ponto.ocupante === this.id) this.ponto.ocupante = null;
    this.ponto = null;
  }

  definirAlvo(alvo, p) {
    if (alvo.ponto !== this.ponto) this.soltarPonto();
    if (alvo.ponto) { this.ponto = alvo.ponto; alvo.ponto.ocupante = this.id; }
    this.alvo = alvo;
    this.chaveAlvo = alvo.chave;
    if (this.chegou) {
      // levanta e volta para o centro do bloco antes de andar
      const c = centro(p, this.tile);
      this.pos = { x: c.x, y: c.y };
    }
    this.chegou = false;
    const partida = this.prox || this.tile;
    const rota = caminho(p, partida, alvo.tile);
    if (!rota) { this.posicionarNo(p, alvo.tile); return; }
    this.caminho = rota;
    if (!this.prox) this.prox = this.caminho.shift() || null;
    if (!this.prox) this.chegar(p, 0);
  }

  posicionarNo(p, tile) {
    this.tile = tile.slice();
    this.prox = null;
    this.caminho = [];
    const c = centro(p, this.tile);
    this.pos = { x: c.x, y: c.y };
    this.chegar(p, 0);
  }

  posicionarDireto(p, equipe, cena) {
    this.soltarPonto();
    this.alvo = null;
    this.chaveAlvo = '';
    this.chegou = false;
    const alvo = this.alvoDesejado(p, equipe, cena);
    if (alvo.ponto) { this.ponto = alvo.ponto; alvo.ponto.ocupante = this.id; }
    this.alvo = alvo;
    this.chaveAlvo = alvo.chave;
    this.posicionarNo(p, alvo.tile);
    this.sentouEm = -99999;
  }

  chegar(p, t) {
    this.chegou = true;
    const a = this.alvo;
    if (!a) return;
    if (a.sentar) { this.sentouEm = t; }
    else {
      const c = centro(p, this.tile);
      this.pos = { x: a.fx ?? c.x, y: a.fy ?? c.y };
      this.dir = a.dir || 'baixo';
    }
    if (a.ponto) this.trocaEm = t + 15000 + Math.random() * 25000;
  }

  atualizar(dt, p, equipe, cena) {
    const alvo = this.alvoDesejado(p, equipe, cena);
    if (alvo.chave !== this.chaveAlvo) this.definirAlvo(alvo, p);
    if (!this.prox) return;
    const destino = centro(p, this.prox);
    const dx = destino.x - this.pos.x, dy = destino.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    const passo = VELOCIDADE * dt;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'dir' : 'esq'; else if (dy !== 0) this.dir = dy > 0 ? 'baixo' : 'cima';
    if (dist <= passo) {
      this.pos = destino;
      this.andado += dist;
      this.tile = this.prox;
      this.prox = this.caminho.shift() || null;
      if (!this.prox) this.chegar(p, cena.t);
    } else {
      this.pos = { x: this.pos.x + (dx / dist) * passo, y: this.pos.y + (dy / dist) * passo };
      this.andado += passo;
    }
  }

  // posição da cabeça (topo), para ícones e balões
  cabeca(cena) {
    if (this.sentado) return { x: this.alvo.sentar.sx + 6, y: this.alvo.sentar.sy };
    if (this.chegou && this.estado === 'esperando' && this.faseEspera(cena.agora) === 'cochilando' && this.alvo.chave === 'espera') return { x: this.pos.x, y: this.pos.y - 16 };
    return { x: this.pos.x, y: this.pos.y - 20 };
  }

  desenhavel(cena) {
    const piscar = ((cena.t + this.semente) % 4200) < 140;
    if (this.sentado) {
      const s = this.alvo.sentar;
      return {
        base: s.sort,
        desenhar: () => {
          if (s.pose === 'sentado-costas') A.pessoaSentadaCostas(s.sx, s.sy, this.ap, this.estado === 'trabalhando' && this.alvo.chave === 'assento', Math.floor((cena.t + this.semente) / 170) % 2);
          else A.pessoaSentadaFrente(s.sx, s.sy, this.ap, piscar, s.comPernas);
        },
      };
    }
    const x = Math.round(this.pos.x), y = Math.round(this.pos.y);
    return {
      base: y,
      desenhar: () => {
        const esperando = this.chegou && this.estado === 'esperando' && this.alvo && this.alvo.chave === 'espera';
        const fase = esperando ? this.faseEspera(cena.agora) : null;
        if (fase === 'cochilando') { A.pessoaNoChao(x - 7, y - 14, this.ap); return; }
        let passo = 0;
        if (!this.chegou) passo = (Math.floor(this.andado / 5) % 2) + 1;
        else if (fase === 'impaciente' && Math.floor((cena.t + this.semente) / 3000) % 3 !== 2) passo = Math.floor(cena.t / 220) % 2;
        A.pessoaEmPe(x - 6, y - 20, this.ap, this.dir, passo, piscar);
      },
    };
  }

  // ícones por cima de tudo (no buffer de arte)
  efeitos(cena) {
    const h = this.cabeca(cena);
    if (this.estado === 'erro') A.exclamacao(h.x + 7, h.y - 6, cena.t);
    if (this.estado === 'esperando' && this.chegou && this.alvo.chave === 'espera') {
      const fase = this.faseEspera(cena.agora);
      if (fase === 'cochilando') A.zzz(h.x + 4, h.y - 3, cena.t);
      else {
        A.ampulheta(h.x + 7, h.y - 8, cena.t);
        if (fase === 'impaciente' && Math.floor((cena.t + this.semente) / 3000) % 3 === 2) A.relogioPulso(h.x - 9, h.y + 10);
      }
    }
    if (this.estado === 'trabalhando' && this.sentado && minutosDesde(this.desde, cena.agora) >= MIN_SUOR) A.gotaSuor(h.x + 7, h.y + 1, cena.t);
    if (this.chegou && this.alvo) {
      if (this.alvo.socorro) A.chaveInglesa(h.x + 8, h.y + 9);
      const atv = this.alvo.ponto && this.alvo.ponto.atividade;
      if (atv === 'jogando') A.controle(h.x - 3, h.y + 9);
      if (atv === 'cafe' || atv === 'sofa' || atv === 'conversa') { if ((this.semente % 2) === 0 || atv === 'cafe') A.xicara(h.x + 6, h.y + 11, cena.t); }
    }
  }

  canecas(agora) {
    if (this.estado !== 'trabalhando') return 0;
    return Math.min(MAX_CANECAS, Math.floor(minutosDesde(this.desde, agora) / MIN_POR_CANECA));
  }

  // dados para o balão e a etiqueta (desenhados depois, em resolução da tela)
  rotulo(cena) {
    const h = this.cabeca(cena);
    const min = minutosDesde(this.desde, cena.agora);
    let balao = null;
    if (this.estado === 'trabalhando') balao = { texto: this.tarefa || 'Trabalhando', sub: textoTempo(min), tipo: 'trabalhando' };
    if (this.estado === 'esperando') balao = { texto: this.tarefa || 'Esperando', sub: `esperando ${textoTempo(min)}`, tipo: 'esperando' };
    if (this.estado === 'erro') balao = { texto: this.tarefa || 'Travou', sub: `travou ${textoTempo(min)}`, tipo: 'erro' };
    return { id: this.id, x: h.x, y: h.y - 1, nome: this.nome, cor: this.cor, balao };
  }
}

export class Equipe {
  constructor() { this.mapa = new Map(); }

  get lista() { return [...this.mapa.values()]; }

  sincronizar(dados, agora) {
    const vistos = new Set();
    for (const pessoa of Array.isArray(dados.equipe) ? dados.equipe : []) {
      if (!pessoa || !pessoa.id) continue;
      vistos.add(pessoa.id);
      let ag = this.mapa.get(pessoa.id);
      if (!ag) { ag = new Agente(pessoa); this.mapa.set(pessoa.id, ag); } else ag.atualizarInfo(pessoa);
      const st = dados.agentes && dados.agentes[pessoa.id];
      const estado = st && ESTADOS.has(st.estado) ? st.estado : 'livre';
      ag.estado = estado;
      ag.tarefa = st && st.tarefa ? String(st.tarefa) : '';
      ag.desde = (st && Date.parse(st.desde)) || agora;
    }
    for (const [id, ag] of this.mapa) if (!vistos.has(id)) { ag.soltarPonto(); this.mapa.delete(id); }
  }

  reposicionar(p, cena) {
    for (const ag of this.mapa.values()) { ag.ponto = null; ag.tile = null; }
    for (const ag of this.mapa.values()) ag.posicionarDireto(p, this, cena);
  }

  atualizar(dt, p, cena) {
    for (const ag of this.mapa.values()) {
      if (!ag.tile) ag.posicionarDireto(p, this, cena);
      ag.atualizar(dt, p, this, cena);
    }
  }

  primeiroEmErro(excetoId) {
    for (const ag of this.mapa.values()) if (ag.id !== excetoId && ag.estado === 'erro') return ag;
    return null;
  }

  lugarDeSocorro(p, vitima) {
    const a = p.assentos[vitima.id];
    if (!a) return null;
    const [x, y] = a.tile;
    for (const [dx, dy, dir] of [[-1, 0, 'dir'], [1, 0, 'esq'], [0, 1, 'cima'], [0, -1, 'baixo']]) {
      if (podeAndar(p, x + dx, y + dy)) return { chave: `socorro:${vitima.id}`, tile: [x + dx, y + dy], dir, socorro: true };
    }
    return null;
  }

  estadoDe(id) { const ag = this.mapa.get(id); return ag ? ag.estado : 'livre'; }
  // trabalhando e já sentado no próprio lugar (a tela só acende quando a pessoa chega)
  naMesa(id) { const ag = this.mapa.get(id); return !!(ag && ag.estado === 'trabalhando' && ag.sentado && ag.alvo.chave === 'assento'); }
  canecasDe(id, agora) { const ag = this.mapa.get(id); return ag ? ag.canecas(agora) : 0; }
  algumNaAtividade(atividade) {
    for (const ag of this.mapa.values()) if (ag.chegou && ag.alvo && ag.alvo.ponto && ag.alvo.ponto.atividade === atividade && ag.estado === 'livre') return true;
    return false;
  }
}
