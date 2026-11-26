// Laço principal: recebe os dados, monta a planta, anima e desenha.
//
// Parâmetros de teste na URL:
//   ?hora=22      finge que são 22h (dia e noite)
//   ?modo=alto    força o modo celular em pé (ou ?modo=largo)

import * as A from './arte.js';
import { conectarDados } from './dados.js';
import { gerarPlanta, desenharEstatico, placas } from './planta.js';
import { Equipe } from './agentes.js';
import { Paineis, pendencias } from './paineis.js';
import { Aviso } from './aviso.js';

const tela = document.getElementById('escritorio');
const ctx = tela.getContext('2d');
const buffer = document.createElement('canvas');
const bctx = buffer.getContext('2d');
const fundo = document.createElement('canvas');
const fctx = fundo.getContext('2d');
const hudConexao = document.getElementById('conexao');
const hudHora = document.getElementById('hora');
const carregando = document.getElementById('carregando');

const params = new URLSearchParams(location.search);
const horaFixa = params.has('hora') ? Number(params.get('hora')) : null;
const modoFixo = ['alto', 'largo'].includes(params.get('modo')) ? params.get('modo') : null;

const equipe = new Equipe();
let dados = null;
let planta = null;
let chavePlanta = '';
let chaveFundo = '';
let E = 1;           // pixels da tela por pixel de arte
let dpr = 1;
let diferencaRelogio = 0;
let conectado = false;
let ultimoQuadro = performance.now();
let ultimaCena = null;
let ultimasCaixas = [];   // balões e etiquetas do último quadro (para o clique)

const paineis = new Paineis({ agora: () => agoraServidor() });
const aviso = new Aviso({ botaoSom: document.getElementById('bt-som') });

function agoraServidor() { return Date.now() + diferencaRelogio; }

function horaDoDia(agora) {
  if (horaFixa !== null && !Number.isNaN(horaFixa)) return ((horaFixa % 24) + 24) % 24;
  const d = new Date(agora);
  return d.getHours() + d.getMinutes() / 60;
}

// 0 = dia claro; ESCURO_MAX = noite (leve, para nada ficar difícil de ver)
const ESCURO_MAX = 0.26;
function escuridao(h) {
  const MAX = ESCURO_MAX;
  if (h >= 8 && h < 17) return 0;
  if (h >= 17 && h < 20) return ((h - 17) / 3) * MAX;
  if (h >= 5 && h < 8) return ((8 - h) / 3) * MAX;
  return MAX;
}

// Tela mais alta que larga (celular em pé, painel estreito): salas empilhadas.
function orientacao() {
  if (modoFixo) return modoFixo;
  return window.innerHeight > window.innerWidth ? 'alto' : 'largo';
}

function cenaBase(t) {
  const agora = agoraServidor();
  const hora = horaDoDia(agora);
  return { t, agora, hora, escuro: escuridao(hora) };
}

function reconstruir(forcar = false) {
  if (!dados) return;
  const o = orientacao();
  const chave = o + JSON.stringify(dados.salas) + JSON.stringify((dados.equipe || []).map((p) => [p.id, p.sala, p.cor, p.nome, p.cargo]));
  if (!forcar && chave === chavePlanta) return;
  chavePlanta = chave;
  planta = gerarPlanta(dados.salas, dados.equipe, o);
  buffer.width = fundo.width = planta.larguraPx;
  buffer.height = fundo.height = planta.alturaPx;
  chaveFundo = '';
  ajustarTamanho();
  equipe.reposicionar(planta, montarCena(cenaBase(performance.now())));
}

function ajustarTamanho() {
  if (!planta) return;
  dpr = window.devicePixelRatio || 1;
  const alto = planta.orientacao === 'alto';
  const larguraJanela = window.innerWidth, alturaJanela = window.innerHeight;
  // Em tela baixa (celular deitado), caber só pela altura deixaria o mapa minúsculo:
  // nesse caso ele ocupa a largura toda e a página rola um pouco.
  const porAltura = Math.min(larguraJanela / planta.larguraPx, alturaJanela / planta.alturaPx);
  const porLargura = larguraJanela / planta.larguraPx;
  const rolar = alto || porAltura < porLargura * 0.8;
  document.body.classList.toggle('modo-alto', alto);
  document.body.classList.toggle('rolar', rolar);
  // mede depois de trocar as classes (a barra de rolagem muda a largura útil)
  const largura = document.documentElement.clientWidth;
  const css = rolar ? largura / planta.larguraPx : Math.min(largura / planta.larguraPx, alturaJanela / planta.alturaPx);
  let e = css * dpr;
  // escala inteira deixa o pixel art mais nítido, mas só vale se não encolher muito
  if (e >= 2 && Math.floor(e) / e > 0.88) e = Math.floor(e);
  E = Math.max(0.25, e);
  tela.width = Math.round(planta.larguraPx * E);
  tela.height = Math.round(planta.alturaPx * E);
  tela.style.width = `${tela.width / dpr}px`;
  tela.style.height = `${tela.height / dpr}px`;
}

function montarCena(base) {
  const t = base.t, agora = base.agora;
  const estudio = planta ? planta.salas.filter((s) => s.tipoEfetivo === 'estudio') : [];
  let noAr = false, claquete = false;
  for (const s of estudio) for (const m of s.membros) {
    const ag = equipe.mapa.get(m.id);
    if (ag && equipe.naMesa(m.id)) {
      noAr = true;
      if (t - ag.sentouEm < 700) claquete = true;
    }
  }
  return {
    ...base,
    noite: base.escuro > ESCURO_MAX * 0.5,
    estadoDe: (id) => (equipe.estadoDe(id) === 'trabalhando' && !equipe.naMesa(id) ? 'a-caminho' : equipe.estadoDe(id)),
    canecas: (id) => equipe.canecasDe(id, agora),
    desenharTela(id, tipo, x, y, w, h) {
      const st = id ? equipe.estadoDe(id) : 'livre';
      if (st === 'trabalhando' && equipe.naMesa(id)) (A.TELAS[tipo] || A.TELAS.codigo)(x, y, w, h, t);
      else if (st === 'erro') A.TELAS.erro(x, y, w, h, t);
      else A.TELAS.desligada(x, y, w, h);
    },
    estudioNoAr: noAr,
    claqueteAberta: claquete,
    jogando: equipe.algumNaAtividade('jogando'),
    servindoCafe: equipe.algumNaAtividade('cafe'),
  };
}

// ---------- desenho do mundo (em pixels de arte) ----------
function desenharMundo(cena) {
  const bucket = `${Math.floor(cena.hora * 12)}`; // redesenha a parte fixa a cada 5 min
  if (chaveFundo !== bucket) {
    A.usarContexto(fctx);
    desenharEstatico(planta, cena.hora);
    chaveFundo = bucket;
  }
  A.usarContexto(bctx);
  bctx.globalCompositeOperation = 'source-over';
  bctx.drawImage(fundo, 0, 0);
  for (const desenhar of planta.paredesDin) desenhar(cena);

  const lista = planta.itens.map((i) => ({ base: i.base, desenhar: () => i.desenhar(cena) }));
  for (const ag of equipe.lista) lista.push(ag.desenhavel(cena));
  lista.sort((a, b) => a.base - b.base);
  for (const d of lista) d.desenhar();

  // alarme: sala de quem travou fica piscando em vermelho
  for (const s of planta.salas) {
    if (!s.membros.some((m) => equipe.estadoDe(m.id) === 'erro')) continue;
    const x = planta.ox + s.x * A.T, y = planta.oy + s.y * A.T;
    const a = 0.1 + 0.08 * Math.sin(cena.t / 180);
    A.R(x, y + 2 * A.T, s.w * A.T, (s.h - 2) * A.T, `rgba(255,40,40,${a.toFixed(3)})`);
    A.sirene(x + (s.w * A.T) / 2 - 4, y + 2, cena.t);
  }
  for (const ag of equipe.lista) ag.efeitos(cena);

  // noite: escurece e acende as luzes
  if (cena.escuro > 0) {
    bctx.fillStyle = `rgba(10,14,40,${cena.escuro.toFixed(3)})`;
    bctx.fillRect(0, 0, buffer.width, buffer.height);
    const forca = cena.escuro / ESCURO_MAX;
    bctx.globalCompositeOperation = 'lighter';
    for (const luz of planta.luzes) {
      if (!luz.quando(cena)) continue;
      const g = bctx.createRadialGradient(luz.x, luz.y, 0, luz.x, luz.y, luz.r);
      g.addColorStop(0, `rgba(${luz.cor},${(0.32 * forca * (luz.forca ?? 1)).toFixed(3)})`);
      g.addColorStop(1, `rgba(${luz.cor},0)`);
      bctx.fillStyle = g;
      bctx.fillRect(luz.x - luz.r, luz.y - luz.r, luz.r * 2, luz.r * 2);
    }
    bctx.globalCompositeOperation = 'source-over';
  }
}

// ---------- textos (em resolução da tela, para ficarem nítidos) ----------
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
function fonte(px, peso = 600) { return `${peso} ${Math.round(px)}px system-ui, "Segoe UI", Roboto, sans-serif`; }

function caixa(x, y, w, h, r, preenchimento, borda) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = preenchimento; ctx.fill();
  if (borda) { ctx.lineWidth = Math.max(1, dpr); ctx.strokeStyle = borda; ctx.stroke(); }
}

function cortar(texto, larguraMax) {
  if (ctx.measureText(texto).width <= larguraMax) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > larguraMax) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

// Os textos crescem e encolhem junto com o mapa (E), com um mínimo para continuar legível.
function tamanhoPlaca() { return limitar(E * 4.8, 7.5 * dpr, 12 * dpr); }
function tamanhoBalao() { return limitar(E * 5.2, 8 * dpr, 13 * dpr); }

function desenharPlacas() {
  const f = tamanhoPlaca();
  ctx.font = fonte(f, 700);
  ctx.textBaseline = 'middle';
  for (const pl of placas(planta)) {
    const w = ctx.measureText(pl.texto).width + f * 1.1, h = f * 1.7;
    let x = pl.x * E;
    if (pl.alinha === 'centro') x -= w / 2;
    const y = pl.y * E - h / 2;
    caixa(x, y, w, h, f * 0.35, '#232836', '#c9a24a');
    ctx.fillStyle = '#f8f4ec';
    ctx.fillText(pl.texto, x + f * 0.55, y + h / 2 + 0.5);
  }
}

const CORES_BALAO = {
  trabalhando: { fundo: '#fdfcf8', borda: '#adb5bd', sub: '#868e96' },
  esperando: { fundo: '#fff6db', borda: '#f59f00', sub: '#a0670a' },
  erro: { fundo: '#fff0f0', borda: '#e03131', sub: '#c92a2a' },
};

function desenharRotulos(cena) {
  const rotulos = equipe.lista.map((ag) => ag.rotulo(cena));
  const f = tamanhoBalao();
  const pequena = f * 0.86;
  const pad = f * 0.5, ponto = f * 0.62, linha = f * 1.22, folga = 3 * dpr;

  // mede tudo primeiro: etiqueta simples (livre) ou balão (com tarefa)
  const caixas = rotulos.map((r) => {
    const hx = r.x * E, hy = r.y * E;
    if (!r.balao) {
      ctx.font = fonte(pequena, 700);
      const w = ctx.measureText(r.nome).width + pequena * 0.9, h = pequena * 1.5;
      return { r, etiqueta: true, hx, hy, w, h, x: limitar(hx - w / 2, 2, tela.width - w - 2), y: Math.max(2, hy - h - 2 * dpr) };
    }
    ctx.font = fonte(f, 700);
    const wNome = ctx.measureText(r.nome).width;
    ctx.font = fonte(pequena, 500);
    const sub = ` · ${r.balao.sub}`;
    const wSub = ctx.measureText(sub).width;
    ctx.font = fonte(f, 500);
    const texto = cortar(r.balao.texto, Math.max(130 * dpr, E * 56));
    const w = Math.max(ponto + wNome + wSub, ctx.measureText(texto).width) + pad * 2;
    const h = linha * 2 + pad * 0.9;
    return { r, sub, texto, wNome, hx, hy, w, h, x: limitar(hx - w / 2, 2, tela.width - w - 2), y: Math.max(2, hy - h - 6 * dpr) };
  });

  // afasta o que se encosta: primeiro para o lado (longe do vizinho), depois para cima
  const encosta = (a, b) => a.x < b.x + b.w + folga && b.x < a.x + a.w + folga && a.y < b.y + b.h + folga && b.y < a.y + a.h + folga;
  const colocados = [];
  for (const b of [...caixas].sort((a, c) => c.hy - a.hy || a.hx - c.hx)) {
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const o = colocados.find((c) => encosta(b, c));
      if (!o) break;
      const paraDireita = b.hx > o.hx || (b.hx === o.hx && b.r.nome > o.r.nome);
      const nx = paraDireita ? o.x + o.w + folga : o.x - b.w - folga;
      const desvio = Math.abs(nx + b.w / 2 - b.hx);
      if (tentativa < 3 && nx >= 2 && nx + b.w <= tela.width - 2 && desvio < b.w * 1.2) b.x = nx;
      else b.y = Math.max(2, o.y - b.h - folga);
    }
    colocados.push(b);
  }

  ultimasCaixas = caixas;
  for (const b of caixas) if (b.etiqueta) desenharEtiqueta(b, pequena);
  for (const b of caixas.filter((c) => !c.etiqueta).sort((a, c) => a.y - c.y)) desenharBalao(b, f, pequena, pad, ponto, linha);
}

function desenharEtiqueta({ r, x, y, w, h, hx, hy }, pequena) {
  // fio ligando a etiqueta à cabeça quando ela precisou sair do lugar
  if (Math.abs(x + w / 2 - hx) > w * 0.6 || y + h < hy - 6 * dpr) {
    ctx.strokeStyle = 'rgba(20,18,26,.6)'; ctx.lineWidth = Math.max(1, dpr);
    ctx.beginPath(); ctx.moveTo(limitar(hx, x + 3, x + w - 3), y + h); ctx.lineTo(hx, hy - 1 * dpr); ctx.stroke();
  }
  caixa(x, y, w, h, h / 2, 'rgba(20,18,26,.85)');
  ctx.fillStyle = r.cor; ctx.fillRect(x + h * 0.35, y + h - Math.max(1.5, dpr * 1.5), w - h * 0.7, Math.max(1.5, dpr * 1.5));
  ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.font = fonte(pequena, 700);
  ctx.fillText(r.nome, x + pequena * 0.45, y + h / 2);
}

// balão compacto: "● Nome · há 12 min" e, embaixo, a tarefa
function desenharBalao({ r, sub, texto, wNome, hx, x, y, w, h }, f, pequena, pad, ponto, linha) {
  const cores = CORES_BALAO[r.balao.tipo];
  caixa(x, y, w, h, f * 0.4, cores.fundo, cores.borda);
  const px = limitar(hx, x + 8 * dpr, x + w - 8 * dpr);
  ctx.beginPath(); ctx.moveTo(px - 4 * dpr, y + h - 0.5); ctx.lineTo(px, y + h + 5 * dpr); ctx.lineTo(px + 4 * dpr, y + h - 0.5); ctx.closePath();
  ctx.fillStyle = cores.fundo; ctx.fill(); ctx.strokeStyle = cores.borda; ctx.lineWidth = Math.max(1, dpr); ctx.stroke();
  ctx.fillRect(px - 3.5 * dpr, y + h - 2 * dpr, 7 * dpr, 2.5 * dpr);
  ctx.textBaseline = 'middle';
  const y1 = y + pad * 0.45 + linha / 2, y2 = y1 + linha;
  ctx.fillStyle = r.cor; ctx.beginPath(); ctx.arc(x + pad + f * 0.22, y1, f * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.font = fonte(f, 700); ctx.fillStyle = '#212529'; ctx.fillText(r.nome, x + pad + ponto, y1);
  ctx.font = fonte(pequena, 500); ctx.fillStyle = cores.sub; ctx.fillText(sub, x + pad + ponto + wNome, y1 + 0.5);
  ctx.font = fonte(f, 500); ctx.fillStyle = '#343a40'; ctx.fillText(texto, x + pad, y2);
}

// ---------- laço ----------
function quadro(t) {
  const dt = Math.min(0.1, (t - ultimoQuadro) / 1000);
  ultimoQuadro = t;
  tamanhoMudou(); // garantia: alguns navegadores não avisam o resize
  if (planta) {
    const cena = montarCena(cenaBase(t));
    ultimaCena = cena;
    equipe.atualizar(dt, planta, cena);
    desenharMundo(cena);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, tela.width, tela.height);
    ctx.drawImage(buffer, 0, 0, tela.width, tela.height);
    desenharPlacas();
    desenharRotulos(cena);
  }
  requestAnimationFrame(quadro);
}

function atualizarHud() {
  hudConexao.textContent = conectado ? 'ao vivo' : 'reconectando…';
  hudConexao.classList.toggle('off', !conectado);
  // horas e minutos inteiros (a conta com fração errava: 39 min virava 38,999… e aparecia 38)
  let hh, mm;
  if (horaFixa !== null && !Number.isNaN(horaFixa)) { const total = Math.round(horaDoDia(0) * 60); hh = Math.floor(total / 60) % 24; mm = total % 60; }
  else { const d = new Date(agoraServidor()); hh = d.getHours(); mm = d.getMinutes(); }
  hudHora.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

conectarDados({
  aoReceber(novo) {
    const t = Date.parse(novo.agora);
    if (!Number.isNaN(t)) diferencaRelogio = t - Date.now();
    dados = novo;
    equipe.sincronizar(dados, agoraServidor());
    reconstruir();
    carregando.hidden = true;
    paineis.atualizar(dados);
    aviso.verificar(pendencias(dados));
  },
  aoMudarConexao(ok) { conectado = ok; atualizarHud(); },
});

// ---------- clique num boneco (ou no balão dele) abre a ficha ----------
function agenteEm(clientX, clientY) {
  if (!planta || !ultimaCena) return null;
  const r = tela.getBoundingClientRect();
  const px = (clientX - r.left) * (tela.width / r.width);
  const py = (clientY - r.top) * (tela.height / r.height);
  // balões e etiquetas primeiro: ficam por cima de tudo
  for (let i = ultimasCaixas.length - 1; i >= 0; i--) {
    const b = ultimasCaixas[i];
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.r.id;
  }
  // depois o corpo: o mais perto do toque, dentro de um raio (maior no celular)
  let melhor = null, menor = Infinity;
  const raio = Math.max(13 * E, 22 * dpr);
  for (const ag of equipe.lista) {
    const h = ag.cabeca(ultimaCena);
    const d = Math.hypot(px - h.x * E, py - (h.y + 10) * E);
    if (d < raio && d < menor) { menor = d; melhor = ag.id; }
  }
  return melhor;
}
tela.addEventListener('click', (e) => {
  const id = agenteEm(e.clientX, e.clientY);
  if (id) paineis.abrir(`agente:${id}`, tela);
});
tela.addEventListener('mousemove', (e) => { tela.style.cursor = agenteEm(e.clientX, e.clientY) ? 'pointer' : ''; });

// Tamanho da tela mudou (janela redimensionada, celular girado, painel aberto):
// escolhe a planta de novo e reposiciona os bonecos, sem perder o estado de ninguém.
let esperaResize = null;
let ultimoTamanho = '';
function tamanhoMudou() {
  const chave = `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`;
  if (chave === ultimoTamanho) return;
  ultimoTamanho = chave;
  clearTimeout(esperaResize);
  esperaResize = setTimeout(() => { reconstruir(); ajustarTamanho(); }, 150);
}
window.addEventListener('resize', tamanhoMudou);
window.addEventListener('orientationchange', tamanhoMudou);
if (window.visualViewport) window.visualViewport.addEventListener('resize', tamanhoMudou);
setInterval(atualizarHud, 1000);
atualizarHud();
requestAnimationFrame(quadro);
