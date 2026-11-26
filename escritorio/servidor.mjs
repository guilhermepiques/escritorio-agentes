#!/usr/bin/env node
// Servidor do escritório visual. Node puro, sem dependências.
//
// Uso:
//   node escritorio/servidor.mjs [--porta 4800] [--raiz <pasta>]
//
// --raiz aponta para outra pasta com a mesma estrutura do projeto
// (escritorio/equipe.json, escritorio/salas.json, estado/agentes/*.json,
// estado/eventos.jsonl, crescimento/). Serve para testar sem mexer no estado real.
//
// Rotas:
//   /              a página (escritorio/publico/)
//   /api/estado    tudo de uma vez, em JSON
//   /api/eventos   o mesmo, ao vivo (Server-Sent Events), a cada mudança
//   /api/video/<id>/<arquivo>   roteiro.md, post.md, revisao.md ou video.mp4
//                  de crescimento/videos/<id>/ (?baixar=1 baixa o vídeo)
//   /api/saude     usado pelo atalho para saber se já está ligado
//   /api/desligar  (POST, só deste PC) desliga o servidor
//
// O servidor só LÊ: nunca grava em estado/ nem em crescimento/.

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.join(AQUI, 'publico');

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const PORTA = Number(argumento('porta', process.env.ESCRITORIO_PORTA || 4800));
const RAIZ = path.resolve(argumento('raiz', path.join(AQUI, '..')));
const ARQ = {
  equipe: path.join(RAIZ, 'escritorio', 'equipe.json'),
  salas: path.join(RAIZ, 'escritorio', 'salas.json'),
  agentes: path.join(RAIZ, 'estado', 'agentes'),
  eventos: path.join(RAIZ, 'estado', 'eventos.jsonl'),
  videos: path.join(RAIZ, 'crescimento', 'videos'),
  pautas: path.join(RAIZ, 'crescimento', 'pautas'),
};
const MAX_EVENTOS = 40;
const MAX_VIDEOS = 30;   // os mais novos (a pasta começa pela data)
const MAX_PAUTAS = 7;
const ID_VIDEO = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ARQUIVOS_VIDEO = {
  'roteiro.md': 'text/plain; charset=utf-8',
  'post.md': 'text/plain; charset=utf-8',
  'revisao.md': 'text/plain; charset=utf-8',
  'video.mp4': 'video/mp4',
};
const dois = (n) => String(n).padStart(2, '0');
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

// ---------- leitura dos arquivos ----------
// Se um arquivo estiver sendo gravado (JSON pela metade), fica a última leitura boa.
const ultimaBoa = new Map();

function lerJson(arquivo, padrao) {
  try {
    const valor = JSON.parse(fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, ''));
    ultimaBoa.set(arquivo, valor);
    return valor;
  } catch (erro) {
    if (erro.code === 'ENOENT') { ultimaBoa.delete(arquivo); return padrao; }
    return ultimaBoa.has(arquivo) ? ultimaBoa.get(arquivo) : padrao;
  }
}

function lerAgentes() {
  const agentes = {};
  let nomes = [];
  try { nomes = fs.readdirSync(ARQ.agentes); } catch { return agentes; }
  for (const nome of nomes) {
    if (!nome.endsWith('.json')) continue;
    const a = lerJson(path.join(ARQ.agentes, nome), null);
    if (a && typeof a.id === 'string') agentes[a.id] = a;
  }
  return agentes;
}

// Lê só o fim do arquivo de eventos: ele cresce para sempre.
function lerEventos() {
  let fd;
  try {
    fd = fs.openSync(ARQ.eventos, 'r');
    const tamanho = fs.fstatSync(fd).size;
    const ler = Math.min(tamanho, 64 * 1024);
    const buf = Buffer.alloc(ler);
    fs.readSync(fd, buf, 0, ler, tamanho - ler);
    const linhas = buf.toString('utf8').split('\n').filter(Boolean);
    if (ler < tamanho) linhas.shift(); // a primeira pode ter vindo cortada
    const eventos = [];
    for (const linha of linhas.slice(-MAX_EVENTOS)) {
      try { eventos.push(JSON.parse(linha)); } catch { /* linha incompleta */ }
    }
    return eventos;
  } catch {
    return [];
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

// ---------- vídeos e pautas (crescimento/) ----------
function pastasDeVideo() {
  try {
    return fs.readdirSync(ARQ.videos, { withFileTypes: true })
      .filter((d) => d.isDirectory() && ID_VIDEO.test(d.name))
      .map((d) => d.name).sort().reverse().slice(0, MAX_VIDEOS);
  } catch { return []; }
}

function existeArquivo(arq) {
  try { return fs.statSync(arq).isFile(); } catch { return false; }
}

// Só o começo do roteiro.md: título, status e formato ficam no topo.
function inicioDoArquivo(arq, bytes = 2048) {
  let fd;
  try {
    fd = fs.openSync(arq, 'r');
    const buf = Buffer.alloc(bytes);
    const lidos = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.toString('utf8', 0, lidos).replace(/^﻿/, '');
  } catch { return ''; } finally { if (fd !== undefined) fs.closeSync(fd); }
}

function lerVideos() {
  return pastasDeVideo().map((id) => {
    const pasta = path.join(ARQ.videos, id);
    const tem = {};
    for (const nome of Object.keys(ARQUIVOS_VIDEO)) tem[nome.split('.')[0]] = existeArquivo(path.join(pasta, nome));
    const topo = tem.roteiro ? inicioDoArquivo(path.join(pasta, 'roteiro.md')) : '';
    const achar = (re) => ((topo.match(re) || [])[1] || '').trim();
    return {
      id,
      data: (id.match(/^\d{4}-\d{2}-\d{2}/) || [''])[0],
      titulo: achar(/^#\s+(.+)$/m) || id,
      status: achar(/^status:\s*([\p{L}-]+)/mu).toLowerCase() || (tem.roteiro ? 'rascunho' : 'sem-roteiro'),
      formato: achar(/^formato:\s*(.+)$/m),
      arquivos: tem,
    };
  });
}

function lerPautas() {
  try {
    return fs.readdirSync(ARQ.pautas).filter((n) => /^\d{4}-\d{2}-\d{2}\.md$/.test(n))
      .map((n) => n.slice(0, 10)).sort().reverse().slice(0, MAX_PAUTAS);
  } catch { return []; }
}

function montarEstado() {
  return {
    equipe: lerJson(ARQ.equipe, []),
    salas: lerJson(ARQ.salas, []),
    agentes: lerAgentes(),
    eventos: lerEventos(),
    videos: lerVideos(),
    pautas: lerPautas(),
    hoje: hojeLocal(),
    agora: new Date().toISOString(),
  };
}

// Assinatura barata (tamanho + data de cada arquivo) para saber se algo mudou.
function assinatura() {
  const partes = [hojeLocal()];
  const marca = (arq) => { try { const s = fs.statSync(arq); partes.push(arq, s.size, s.mtimeMs); } catch { partes.push(arq, '-'); } };
  marca(ARQ.equipe); marca(ARQ.salas); marca(ARQ.eventos);
  try { for (const n of fs.readdirSync(ARQ.agentes).sort()) marca(path.join(ARQ.agentes, n)); } catch { partes.push('sem-agentes'); }
  for (const id of pastasDeVideo()) for (const nome of Object.keys(ARQUIVOS_VIDEO)) marca(path.join(ARQ.videos, id, nome));
  partes.push(lerPautas().join(','));
  return partes.join('|');
}

// ---------- ao vivo (SSE) ----------
const clientes = new Set();
let ultimaAssinatura = '';
let ultimoEstado = montarEstado();

// "agora" vai sempre com a hora do envio: a página acerta o relógio por ele.
// (O estado guardado pode ser de muito antes, da última mudança nos arquivos.)
const comHora = (estado) => JSON.stringify({ ...estado, agora: new Date().toISOString() });

function enviar(res, estado) {
  res.write(`event: estado\ndata: ${comHora(estado)}\n\n`);
}

function verificar() {
  const nova = assinatura();
  if (nova === ultimaAssinatura) return;
  ultimaAssinatura = nova;
  ultimoEstado = montarEstado();
  for (const res of clientes) enviar(res, ultimoEstado);
}

let agendado = null;
function verificarLogo() {
  clearTimeout(agendado);
  agendado = setTimeout(verificar, 80);
}

// fs.watch avisa na hora; o polling garante, caso o aviso falhe (acontece no Windows).
function vigiar(pasta, { criar = true, recursivo = false } = {}) {
  try {
    if (criar) fs.mkdirSync(pasta, { recursive: true });
    fs.watch(pasta, { persistent: false, recursive: recursivo }, verificarLogo).on('error', () => {});
  } catch { /* fica só o polling */ }
}
vigiar(path.dirname(ARQ.equipe));
vigiar(ARQ.agentes);
vigiar(path.dirname(ARQ.eventos));
// crescimento/ é dos agentes: o servidor não cria nada lá, só olha.
vigiar(ARQ.videos, { criar: false, recursivo: true });
vigiar(ARQ.pautas, { criar: false });
setInterval(verificar, 1000);
setInterval(() => { for (const res of clientes) res.write(': ainda aqui\n\n'); }, 25000);
verificar();

// ---------- arquivos da página ----------
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function servirArquivo(req, res, caminhoUrl) {
  let relativo;
  try { relativo = decodeURIComponent(caminhoUrl); } catch { relativo = '/'; }
  if (relativo.endsWith('/')) relativo += 'index.html';
  const arquivo = path.normalize(path.join(PUBLICO, relativo));
  if (!arquivo.startsWith(PUBLICO + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : dados);
  });
}

// Arquivos de um vídeo. O vídeo aceita pedaços (Range): o celular precisa disso para tocar.
function servirDoVideo(req, res, idBruto, nome, baixar) {
  let id;
  try { id = decodeURIComponent(idBruto); } catch { id = ''; }
  const tipo = ARQUIVOS_VIDEO[nome];
  if (!tipo || !ID_VIDEO.test(id)) { res.writeHead(404).end(); return; }
  const arquivo = path.join(ARQ.videos, id, nome);
  if (!arquivo.startsWith(ARQ.videos + path.sep)) { res.writeHead(403).end(); return; }
  let st;
  try { st = fs.statSync(arquivo); } catch { st = null; }
  if (!st || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Ainda não existe.'); return; }

  const base = { 'Content-Type': tipo, 'Cache-Control': 'no-cache' };
  if (nome !== 'video.mp4') {
    fs.readFile(arquivo, (erro, dados) => {
      if (erro) { res.writeHead(500).end(); return; }
      res.writeHead(200, base).end(req.method === 'HEAD' ? undefined : dados);
    });
    return;
  }
  base['Accept-Ranges'] = 'bytes';
  if (baixar) base['Content-Disposition'] = `attachment; filename="${id}.mp4"`;
  const tam = st.size;
  let ini = 0, fim = tam - 1, status = 200;
  const pedaco = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (req.headers.range) {
    if (!pedaco || (pedaco[1] === '' && pedaco[2] === '')) { res.writeHead(416, { 'Content-Range': `bytes */${tam}` }).end(); return; }
    if (pedaco[1] === '') { ini = Math.max(0, tam - Number(pedaco[2])); }
    else { ini = Number(pedaco[1]); if (pedaco[2] !== '') fim = Math.min(Number(pedaco[2]), tam - 1); }
    if (ini > fim || ini >= tam) { res.writeHead(416, { 'Content-Range': `bytes */${tam}` }).end(); return; }
    status = 206;
    base['Content-Range'] = `bytes ${ini}-${fim}/${tam}`;
  }
  base['Content-Length'] = fim - ini + 1;
  res.writeHead(status, base);
  if (req.method === 'HEAD' || tam === 0) { res.end(); return; }
  fs.createReadStream(arquivo, { start: ini, end: fim }).on('error', () => res.destroy()).pipe(res);
}

const DESTE_PC = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const servidor = http.createServer((req, res) => {
  const { pathname, searchParams } = new URL(req.url, 'http://localhost');
  // Desligar: só aceito pedidos do próprio PC (usado por desligar-escritorio.vbs).
  if (req.method === 'POST' && pathname === '/api/desligar') {
    if (!DESTE_PC.has(req.socket.remoteAddress)) { res.writeHead(403).end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Escritório desligado.');
    console.log('Desligando a pedido deste PC.');
    setTimeout(() => process.exit(0), 100);
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }

  if (pathname === '/api/saude') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ app: 'escritorio', ok: true }));
    return;
  }
  if (pathname === '/api/estado') {
    verificar();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(comHora(ultimoEstado));
    return;
  }
  if (pathname === '/api/eventos') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n');
    clientes.add(res);
    enviar(res, ultimoEstado);
    req.on('close', () => clientes.delete(res));
    return;
  }
  const doVideo = pathname.match(/^\/api\/video\/([^/]+)\/([^/]+)$/);
  if (doVideo) { servirDoVideo(req, res, doVideo[1], doVideo[2], searchParams.has('baixar')); return; }
  servirArquivo(req, res, pathname);
});

function enderecosDaRede() {
  const lista = [];
  for (const placas of Object.values(os.networkInterfaces())) {
    for (const p of placas || []) if (p.family === 'IPv4' && !p.internal) lista.push(p.address);
  }
  return lista;
}

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.log(`A porta ${PORTA} já está em uso: o escritório provavelmente já está ligado.`);
    console.log(`Abra http://localhost:${PORTA}`);
    process.exit(0);
  }
  console.error('Erro no servidor do escritório:', erro.message);
  process.exit(1);
});

servidor.listen(PORTA, '0.0.0.0', () => {
  console.log('Escritório ligado.');
  console.log(`  Neste PC:  http://localhost:${PORTA}`);
  for (const ip of enderecosDaRede()) console.log(`  No celular (mesmo Wi-Fi): http://${ip}:${PORTA}`);
  console.log(`  Dados lidos de: ${RAIZ}`);
});
