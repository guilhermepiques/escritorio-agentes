#!/usr/bin/env node
// Avisa o escritório visual do que cada agente está fazendo.
// Sem dependências. Uso:
//   node ferramentas/escritorio.mjs status <id> <livre|trabalhando|esperando|erro> [tarefa]
//   node ferramentas/escritorio.mjs evento <id> <texto> [ref]
//
// Arquivos (lidos pelo escritório visual):
//   estado/agentes/<id>.json  {"id","estado","tarefa","desde"}
//   estado/eventos.jsonl      {"ts","agente","texto","ref"?} (uma linha por evento)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_AGENTES = path.join(RAIZ, 'estado', 'agentes');
const EVENTOS = path.join(RAIZ, 'estado', 'eventos.jsonl');
const ESTADOS = ['livre', 'trabalhando', 'esperando', 'erro'];
const MAX_TEXTO = 140;

function sair(msg) {
  console.error(msg);
  console.error('Uso:\n  status <id> <livre|trabalhando|esperando|erro> [tarefa]\n  evento <id> <texto> [ref]');
  process.exit(1);
}

function validarId(id) {
  if (!id || !/^[a-z0-9-]+$/.test(id)) sair(`id inválido: "${id ?? ''}" (use minúsculas, números e hífen)`);
}

function curto(texto) {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  return t.length > MAX_TEXTO ? t.slice(0, MAX_TEXTO - 1) + '…' : t;
}

// Grava num arquivo temporário e renomeia, para o escritório nunca ler um JSON pela metade.
function gravarAtomico(arquivo, conteudo) {
  const tmp = `${arquivo}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, conteudo, 'utf8');
  try {
    fs.renameSync(tmp, arquivo);
  } catch {
    // No Windows o rename falha se o arquivo estiver aberto por outro programa.
    fs.writeFileSync(arquivo, conteudo, 'utf8');
    fs.rmSync(tmp, { force: true });
  }
}

function registrarEvento(agente, texto, ref) {
  const linha = { ts: new Date().toISOString(), agente, texto: curto(texto) };
  if (ref) linha.ref = curto(ref);
  fs.mkdirSync(path.dirname(EVENTOS), { recursive: true });
  fs.appendFileSync(EVENTOS, JSON.stringify(linha) + '\n', 'utf8');
}

const [cmd, id, ...resto] = process.argv.slice(2);

if (cmd === 'status') {
  validarId(id);
  const [estado, ...tarefaPartes] = resto;
  if (!ESTADOS.includes(estado)) sair(`estado inválido: "${estado ?? ''}"`);
  const tarefa = curto(tarefaPartes.join(' '));
  const arquivo = path.join(PASTA_AGENTES, `${id}.json`);
  fs.mkdirSync(PASTA_AGENTES, { recursive: true });

  // "desde" só muda quando o estado ou a tarefa mudam.
  let desde = new Date().toISOString();
  try {
    const antes = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    if (antes.estado === estado && antes.tarefa === tarefa && antes.desde) desde = antes.desde;
  } catch { /* primeiro status deste agente */ }

  gravarAtomico(arquivo, JSON.stringify({ id, estado, tarefa, desde }, null, 2) + '\n');
  if (estado === 'erro') registrarEvento(id, `Travou: ${tarefa || 'sem motivo informado'}`);
  console.log(`ok: ${id} → ${estado}${tarefa ? ` (${tarefa})` : ''}`);
} else if (cmd === 'evento') {
  validarId(id);
  const [texto, ref] = resto;
  if (!texto) sair('falta o texto do evento');
  registrarEvento(id, texto, ref);
  console.log(`ok: evento de ${id}`);
} else {
  sair(`comando desconhecido: "${cmd ?? ''}"`);
}
