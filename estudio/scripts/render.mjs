// Estúdio de vídeo — transforma um video.json em video.mp4 (1080x1920, H.264 + AAC).
//
//   npm run render  -- <pasta-do-video | arquivo.json>   → gera o mp4
//   npm run quadros -- <pasta-do-video | arquivo.json>   → só as imagens paradas (rápido)
//
// Opções: --saida <arquivo.mp4>   --sem-cache (gera as vozes de novo)
// Formato do video.json: README.md. Cardápio de peças, estilos e vozes: CATALOGO.md.

import { bundle } from '@remotion/bundler';
import { openBrowser, renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;

// ---------- utilidades ----------

class ErroRoteiro extends Error {}
const falhar = (msg) => {
  throw new ErroRoteiro(msg);
};
const sha = (s) => createHash('sha1').update(s).digest('hex');
const normal = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const arred = (n) => Math.round(n * 1000) / 1000;
const ehObjeto = (v) => v && typeof v === 'object' && !Array.isArray(v);
function mesclar(base, extra) {
  const r = { ...base };
  for (const [k, v] of Object.entries(extra ?? {})) r[k] = ehObjeto(v) && ehObjeto(base?.[k]) ? mesclar(base[k], v) : v;
  return r;
}

// ---------- o que existe no estúdio (lido dos próprios arquivos) ----------

const ATALHOS = JSON.parse(readFileSync(join(ESTUDIO, 'src/estilos/atalhos.json'), 'utf8'));
const MODELOS = [...readFileSync(join(ESTUDIO, 'src/palco3d/modelos.tsx'), 'utf8').matchAll(/^\s+'([a-z0-9-]+)':\s*\w+,\s*$/gm)].map((m) => m[1]);
const PECAS = [...readFileSync(join(ESTUDIO, 'src/pecas/index.ts'), 'utf8').matchAll(/^\s+'([a-z0-9-]+)':\s*\w+,\s*$/gm)].map((m) => m[1]);
const FONTES = [...readFileSync(join(ESTUDIO, 'src/estilos/fontes.ts'), 'utf8').matchAll(/^\s+(?:'([^']+)'|(\w+)):\s*\[/gm)].map((m) => m[1] ?? m[2]);
const SONS = readdirSync(join(ESTUDIO, 'public/sons')).filter((f) => f.endsWith('.wav')).map((f) => f.slice(0, -4));
const PASTA_EMOJI3D = join(ESTUDIO, 'node_modules/@lobehub/fluent-emoji-3d/assets');
const VOZES = {
  francisca: 'pt-BR-FranciscaNeural',
  antonio: 'pt-BR-AntonioNeural',
  thalita: 'pt-BR-ThalitaMultilingualNeural',
  // vozes multilíngues: falam português, algumas com sotaque leve
  andrew: 'en-US-AndrewMultilingualNeural',
  ava: 'en-US-AvaMultilingualNeural',
  brian: 'en-US-BrianMultilingualNeural',
  remy: 'fr-FR-RemyMultilingualNeural',
  giuseppe: 'it-IT-GiuseppeMultilingualNeural',
};
// vozes prontas do Gemini (motor "gemini"); o tom vem do campo "estilo" da voz
const VOZES_GEMINI = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'];
const VOZES_GEMINI_VETADAS = ['Puck']; // o dono ouviu e reprovou
const ENTRADAS = ['corte', 'deslizar', 'zoom', 'piscar', 'subir', 'continua'];
// transições oficiais do Remotion (Video.tsx): a cena nova entra por cima da anterior
const TRANSICOES = ['cortina', 'cortina-diagonal', 'empurrar', 'empurrar-cima', 'virar', 'cubo', 'relogio', 'iris', 'dissolver', 'soco'];
const SOBREPOSICAO = 12 / FPS;
const FUNDOS = ['chapado', 'degrade', 'bolinhas', 'listras', 'formas', 'grade', 'raios', 'emojis', 'manchas'];
const ANIMACOES = ['pop', 'deslizar', 'subir', 'zoom', 'maquina', 'girar'];

// ---------- argumentos ----------

const args = process.argv.slice(2);
const soQuadros = args.includes('--quadros');
const semCache = args.includes('--sem-cache');
const iSaida = args.indexOf('--saida');
const saidaPedida = iSaida >= 0 ? args[iSaida + 1] : undefined;
const entradaArg = args.find((a, i) => !a.startsWith('--') && (iSaida < 0 || i !== iSaida + 1));
const base = process.env.INIT_CWD ?? process.cwd();

if (!entradaArg) {
  console.error('Uso: npm run render -- <pasta-do-video | arquivo.json>   (ou npm run quadros -- ...)');
  process.exit(1);
}

let arquivoJson = resolve(base, entradaArg);
if (existsSync(arquivoJson) && statSync(arquivoJson).isDirectory()) arquivoJson = join(arquivoJson, 'video.json');
if (!existsSync(arquivoJson)) {
  console.error(`Não achei o arquivo: ${arquivoJson}`);
  process.exit(1);
}

// saída: video.json → mesma pasta; outro nome → estudio/saida/<nome>.mp4
const ehVideoJson = basename(arquivoJson) === 'video.json';
const nome = ehVideoJson ? basename(dirname(arquivoJson)) : basename(arquivoJson, '.json');
const saidaMp4 = saidaPedida ? resolve(base, saidaPedida) : ehVideoJson ? join(dirname(arquivoJson), 'video.mp4') : join(ESTUDIO, 'saida', `${nome}.mp4`);
const pastaQuadros = ehVideoJson && !saidaPedida ? join(dirname(arquivoJson), 'quadros') : join(dirname(saidaMp4), `${basename(saidaMp4, '.mp4')}-quadros`);

// ---------- estilo ----------

function montarEstilo(camadas, onde) {
  let estilo;
  for (const c of camadas) {
    if (!c) continue;
    if (c.atalho !== undefined) {
      if (!ATALHOS[c.atalho]) falhar(`${onde}: atalho de estilo "${c.atalho}" não existe. Opções: ${Object.keys(ATALHOS).join(', ')}`);
      estilo = structuredClone(ATALHOS[c.atalho]);
    }
    if (!estilo) falhar(`${onde}: escolha um estilo com "atalho" (${Object.keys(ATALHOS).join(', ')}) e altere o que quiser.`);
    const { atalho, ...resto } = c;
    estilo = mesclar(estilo, resto);
  }
  if (!estilo) falhar('O vídeo precisa de "estilo" (com "atalho"). Veja o CATALOGO.md.');
  for (const campo of ['fonte', 'fonteApoio'])
    if (!FONTES.includes(estilo[campo])) falhar(`${onde}: fonte "${estilo[campo]}" não existe. Opções: ${FONTES.join(', ')}`);
  if (!FUNDOS.includes(estilo.fundo?.tipo)) falhar(`${onde}: fundo "${estilo.fundo?.tipo}" não existe. Opções: ${FUNDOS.join(', ')}`);
  if (!ANIMACOES.includes(estilo.animacao)) falhar(`${onde}: animação "${estilo.animacao}" não existe. Opções: ${ANIMACOES.join(', ')}`);
  if (estilo.emoji !== undefined && !['plano', '3d'].includes(estilo.emoji)) falhar(`${onde}: emoji "${estilo.emoji}" não existe (plano ou 3d)`);
  return estilo;
}

// ---------- voz ----------

function montarVoz(camadas, onde) {
  const v = Object.assign({}, ...camadas.filter(Boolean));
  if (v.motor === 'gemini') {
    const nome = VOZES_GEMINI.find((n) => n.toLowerCase() === String(v.nome ?? '').toLowerCase());
    if (!nome) falhar(`${onde}: voz do Gemini "${v.nome}" não existe. Opções: ${VOZES_GEMINI.join(', ')}`);
    if (VOZES_GEMINI_VETADAS.includes(nome)) falhar(`${onde}: a voz "${nome}" foi vetada pelo dono. Boas: Kore, Charon, Sadachbia (ver CATALOGO)`);
    return { motor: 'gemini', id: nome, estilo: v.estilo ?? 'com naturalidade, como numa conversa animada' };
  }
  if (v.motor && v.motor !== 'edge') falhar(`${onde}: motor de voz "${v.motor}" não existe (edge ou gemini)`);
  if (!v.nome) falhar(`${onde}: falta escolher a voz ("voz": {"nome": ...}). Opções: ${Object.keys(VOZES).join(', ')}`);
  const id = VOZES[v.nome] ?? (/Neural$/.test(v.nome) ? v.nome : null);
  if (!id) falhar(`${onde}: voz "${v.nome}" não existe. Opções: ${Object.keys(VOZES).join(', ')}`);
  const pct = (x) => (typeof x === 'number' ? `${x >= 0 ? '+' : ''}${x}%` : x ?? '+0%');
  const hz = (x) => (typeof x === 'number' ? `${x >= 0 ? '+' : ''}${x}Hz` : x ?? '+0Hz');
  return { id, velocidade: pct(v.velocidade), tom: hz(v.tom) };
}

function gerarVoz(texto, voz, pastaCache) {
  const chave = sha(JSON.stringify([texto, voz.id, voz.velocidade, voz.tom]));
  const mp3 = join(pastaCache, `${chave}.mp3`);
  const js = join(pastaCache, `${chave}.json`);
  if (semCache || !existsSync(mp3) || !existsSync(js)) {
    const txt = join(pastaCache, `${chave}.txt`);
    writeFileSync(txt, texto, 'utf8');
    const r = spawnSync(
      'python',
      [join(ESTUDIO, 'scripts/tts.py'), '--voz', voz.id, `--velocidade=${voz.velocidade}`, `--tom=${voz.tom}`, '--texto', txt, '--mp3', mp3, '--json', js],
      { encoding: 'utf8' },
    );
    if (r.status !== 0) throw new Error(`Falha na voz: ${r.stderr || r.stdout || r.error}`);
  }
  const palavras = JSON.parse(readFileSync(js, 'utf8')).palavras;
  const p = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], { encoding: 'utf8' });
  const duracao = parseFloat(p.stdout);
  if (!duracao) throw new Error(`Não consegui medir o áudio da voz (${mp3}). O ffmpeg está instalado?`);
  // o fim real da fala é a última palavra (o mp3 tem um pouco de silêncio no fim)
  const fimFala = palavras.length ? palavras[palavras.length - 1].fim : duracao;
  return { mp3, palavras, duracao, fimFala };
}

// Gemini: um pedido por vídeo (por voz), cortado por cena com o Whisper local
function gerarVozesGemini(grupos, pastaCache) {
  const resultados = new Map();
  for (const [chaveGrupo, { voz, textos }] of grupos) {
    const chave = sha(JSON.stringify(['gemini', voz.id, voz.estilo, textos, process.env.ESTUDIO_TESTE_SEM_GEMINI ?? '']));
    const pasta = join(pastaCache, `gemini-${chave}`);
    const arq = join(pasta, 'resultado.json');
    if (semCache || !existsSync(arq)) {
      mkdirSync(pasta, { recursive: true });
      const pedido = join(pasta, 'pedido.json');
      writeFileSync(pedido, JSON.stringify({ voz: voz.id, estilo: voz.estilo, textos }), 'utf8');
      console.log(`      voz do Gemini (${voz.id}): ${textos.length} cenas num pedido só...`);
      const r = spawnSync('python', [join(ESTUDIO, 'scripts/voz_gemini.py'), '--entrada', pedido, '--saida', pasta], { encoding: 'utf8' });
      if (r.status !== 0) throw new Error(`Falha na voz do Gemini: ${(r.stderr || r.stdout || r.error || '').toString().trim().split(/\r?\n/).slice(-3).join(' ')}`);
    }
    resultados.set(chaveGrupo, JSON.parse(readFileSync(arq, 'utf8')).cenas);
  }
  return resultados;
}

// ---------- tempos ("fim-da-narracao", "palavra:Camberra+0.3"...) ----------

const CAMPOS_TEMPO = ['entraEm', 'saiEm', 'comecaEm', 'revelarEm', 'em', 'chacoalhaEm', 'calorEm', 'ondasEm', 'quentesEm', 'friosEm'];

function resolverTempo(valor, ctx, onde) {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string') falhar(`${onde}: tempo inválido (${JSON.stringify(valor)})`);
  let texto = valor.trim();
  let ajuste = 0;
  const m = texto.match(/([+-]\s*\d+(?:[.,]\d+)?)\s*$/);
  if (m && !/^-?\d+([.,]\d+)?$/.test(texto)) {
    ajuste = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
    texto = texto.slice(0, m.index).trim();
  }
  if (/^-?\d+([.,]\d+)?$/.test(texto)) return parseFloat(texto.replace(',', '.')) + ajuste;
  if (texto === 'inicio') return ajuste;
  if (texto === 'fim-da-narracao') {
    if (ctx.fimNarracao === undefined) falhar(`${onde}: "fim-da-narracao" numa cena sem narração`);
    return ctx.fimNarracao + ajuste;
  }
  if (texto === 'fim-do-cronometro') {
    if (ctx.fimCronometro === undefined) falhar(`${onde}: "fim-do-cronometro" numa cena sem cronômetro (ou o cronômetro depende disso)`);
    return ctx.fimCronometro + ajuste;
  }
  const mp = texto.match(/^(palavra|fim-da-palavra):(.+?)(?:#(\d+))?$/);
  if (mp) {
    const alvo = normal(mp[2].trim().split(/\s+/)[0]);
    const n = Number(mp[3] ?? 1);
    const achadas = ctx.palavras.filter((p) => normal(p.texto) === alvo);
    if (achadas.length < n)
      falhar(`${onde}: a palavra "${mp[2]}" não aparece ${n > 1 ? `${n} vezes ` : ''}na narração da cena. Narração: "${ctx.textoNarracao ?? ''}"`);
    const p = achadas[n - 1];
    return (mp[1] === 'palavra' ? p.inicio : p.fim) + ajuste;
  }
  falhar(`${onde}: não entendi o tempo "${valor}". Use segundos (2.5), "inicio", "fim-da-narracao", "fim-do-cronometro", "palavra:X" ou "fim-da-palavra:X", com ajuste opcional (+0.3).`);
}

function resolverPeca(peca, ctx, onde) {
  const r = { ...peca };
  for (const campo of CAMPOS_TEMPO) if (r[campo] !== undefined) r[campo] = arred(resolverTempo(r[campo], ctx, `${onde}, campo "${campo}"`));
  if (Array.isArray(r.tempos)) r.tempos = r.tempos.map((t, i) => arred(resolverTempo(t, ctx, `${onde}, tempos[${i}]`)));
  return r;
}

// ---------- palco 3D ----------

const LUZES3D = ['dia', 'tarde', 'noite', 'estudio'];
const ENTRADAS3D = ['crescer', 'cair', 'subir', 'nenhuma'];
const ehV3 = (v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number');

/** Confere o palco3d e troca os tempos ("palavra:X"...) por segundos. Devolve [palco, até quando precisa]. */
function resolverPalco(palco, ctx, onde) {
  if (!ehObjeto(palco)) falhar(`${onde}: "palco3d" precisa ser um objeto { luz, camera, objetos }`);
  const r = { ...palco };
  let precisa = 0;
  const tempo = (v, o) => {
    const s = arred(resolverTempo(v, ctx, o));
    precisa = Math.max(precisa, s);
    return s;
  };
  if (r.luz !== undefined && !LUZES3D.includes(r.luz)) falhar(`${onde}: luz "${r.luz}" não existe. Opções: ${LUZES3D.join(', ')}`);
  if (r.tremor) r.tremor = { ...r.tremor, de: tempo(r.tremor.de ?? 0, `${onde}, tremor.de`), ate: tempo(r.tremor.ate ?? 0, `${onde}, tremor.ate`) };
  r.camera = (r.camera ?? []).map((c, i) => {
    const o = `${onde}, camera[${i}]`;
    for (const k of ['posicao', 'olhaPara']) if (c[k] !== undefined && !ehV3(c[k])) falhar(`${o}: "${k}" precisa ser [x, y, z]`);
    return { ...c, em: tempo(c.em ?? 0, `${o}, em`) };
  });
  r.objetos = (r.objetos ?? []).map((ob, i) => {
    const o = `${onde}, objeto ${i + 1}`;
    if (!MODELOS.includes(ob?.modelo)) falhar(`${o}: modelo "${ob?.modelo}" não existe. Opções: ${MODELOS.join(', ')}`);
    for (const k of ['posicao', 'rotacao']) if (ob[k] !== undefined && !ehV3(ob[k])) falhar(`${o}: "${k}" precisa ser [x, y, z]`);
    if (ob.entrada !== undefined && !ENTRADAS3D.includes(ob.entrada)) falhar(`${o}: entrada "${ob.entrada}" não existe. Opções: ${ENTRADAS3D.join(', ')}`);
    const x = { ...ob };
    if (x.entraEm !== undefined) x.entraEm = tempo(x.entraEm, `${o}, entraEm`);
    if (x.saiEm !== undefined) x.saiEm = tempo(x.saiEm, `${o}, saiEm`);
    x.movimentos = (x.movimentos ?? []).map((m, j) => ({ ...m, de: tempo(m.de ?? 0, `${o}, movimento ${j + 1}, de`), ate: tempo(m.ate ?? 0, `${o}, movimento ${j + 1}, ate`) }));
    if (x.repetir && x.entraEm !== undefined) {
      const q = x.repetir.quantidade;
      const n = typeof q === 'number' ? q : Array.isArray(q) ? q.reduce((a, b) => a * b, 1) : 1;
      precisa = Math.max(precisa, x.entraEm + (x.repetir.atraso ?? 0) * (n - 1));
    }
    return x;
  });
  return [r, precisa];
}

// ---------- montar o vídeo ----------

function carregarJson() {
  try {
    return JSON.parse(readFileSync(arquivoJson, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    falhar(`O video.json não é um JSON válido: ${e.message}`);
  }
}

function montar(video, pastaPublica, pastaCache) {
  if (!Array.isArray(video.cenas) || !video.cenas.length) falhar('O video.json precisa de "cenas" (lista com pelo menos uma cena).');
  const estiloVideo = montarEstilo([video.estilo], 'estilo do vídeo');
  const legenda = mesclar({ modo: 'karaoke', palavrasPorVez: 3, posicao: 'baixo', tamanho: 72, caixa: false, maiusculas: false }, video.legenda ?? {});
  if (!['karaoke', 'palavra', 'frase', 'desligada'].includes(legenda.modo)) falhar(`legenda: modo "${legenda.modo}" não existe (karaoke, palavra, frase, desligada)`);
  if (legenda.fonte && !FONTES.includes(legenda.fonte)) falhar(`legenda: fonte "${legenda.fonte}" não existe`);
  const volumes = mesclar({ narracao: 1, efeitos: 0.5 }, video.volumes ?? {});

  mkdirSync(join(pastaPublica, 'narracao'), { recursive: true });

  // vozes do Gemini primeiro: todas as cenas da mesma voz vão num pedido só
  const grupos = new Map();
  const posGemini = new Map(); // índice da cena → [grupo, posição]
  video.cenas.forEach((c, i) => {
    if (!c.narracao || !String(c.narracao).trim()) return;
    const voz = montarVoz([video.voz, c.voz], `cena ${i + 1}`);
    if (voz.motor !== 'gemini') return;
    const g = `${voz.id}|${voz.estilo}`;
    if (!grupos.has(g)) grupos.set(g, { voz, textos: [] });
    posGemini.set(i, [g, grupos.get(g).textos.length]);
    grupos.get(g).textos.push(String(c.narracao).trim());
  });
  const vozesGemini = grupos.size ? gerarVozesGemini(grupos, pastaCache) : new Map();

  const cenas = [];
  const textos = [];
  let inicio = 0;

  video.cenas.forEach((c, i) => {
    const onde = `cena ${i + 1}`;
    const entrada = c.entrada ?? 'corte';
    if (!ENTRADAS.includes(entrada) && !TRANSICOES.includes(entrada))
      falhar(`${onde}: entrada "${entrada}" não existe. Opções: ${[...ENTRADAS, ...TRANSICOES].join(', ')}`);
    // transição oficial: a cena começa 0,4 s antes do fim da anterior (entra por cima)
    if (i > 0 && TRANSICOES.includes(entrada)) inicio -= SOBREPOSICAO;
    const estilo = c.estilo ? montarEstilo([video.estilo, c.estilo], `${onde}, estilo`) : estiloVideo;
    const pecasBrutas = c.pecas ?? [];
    if (!Array.isArray(pecasBrutas)) falhar(`${onde}: "pecas" precisa ser uma lista`);
    pecasBrutas.forEach((p, j) => {
      if (!PECAS.includes(p?.tipo)) falhar(`${onde}, peça ${j + 1}: tipo "${p?.tipo}" não existe. Opções: ${PECAS.join(', ')}`);
    });

    // narração
    let narracao;
    const ctx = { palavras: [], textoNarracao: c.narracao };
    if (c.narracao && String(c.narracao).trim()) {
      const voz = montarVoz([video.voz, c.voz], onde);
      const gerada = posGemini.has(i)
        ? vozesGemini.get(posGemini.get(i)[0])[posGemini.get(i)[1]]
        : gerarVoz(String(c.narracao).trim(), voz, pastaCache);
      const em = c.narracaoEm !== undefined ? resolverTempo(c.narracaoEm, ctx, `${onde}, narracaoEm`) : 0.1;
      const arquivo = `narracao/cena-${String(i + 1).padStart(2, '0')}.mp3`;
      cpSync(gerada.mp3, join(pastaPublica, arquivo));
      narracao = { arquivo, em: arred(em), duracao: arred(gerada.duracao), palavras: gerada.palavras };
      ctx.palavras = gerada.palavras.map((p) => ({ ...p, inicio: p.inicio + em, fim: p.fim + em }));
      ctx.fimNarracao = em + gerada.fimFala;
      textos.push(String(c.narracao));
    } else textos.push('');

    // cronômetros primeiro (outros tempos podem depender do fim deles)
    const pecas = pecasBrutas.map((p) => ({ ...p }));
    let precisa = 0;
    pecas.forEach((p, j) => {
      if (p.tipo !== 'cronometro') return;
      pecas[j] = resolverPeca(p, ctx, `${onde}, peça ${j + 1} (cronometro)`);
      const fim = (pecas[j].comecaEm ?? pecas[j].entraEm ?? 0) + (pecas[j].segundos ?? 3);
      ctx.fimCronometro = Math.max(ctx.fimCronometro ?? 0, fim);
      precisa = Math.max(precisa, fim + 0.3);
    });
    pecas.forEach((p, j) => {
      if (p.tipo === 'cronometro') return;
      pecas[j] = resolverPeca(p, ctx, `${onde}, peça ${j + 1} (${p.tipo})`);
      const q = pecas[j];
      if (q.revelarEm !== undefined) precisa = Math.max(precisa, q.revelarEm + 1.2);
      if (q.tipo === 'numero') precisa = Math.max(precisa, (q.comecaEm ?? q.entraEm ?? 0) + (q.duracaoContagem ?? 1.2) + 0.5);
      if (q.tempos?.length) precisa = Math.max(precisa, Math.max(...q.tempos) + 0.8);
      if (q.entraEm !== undefined) precisa = Math.max(precisa, q.entraEm + 0.6);
    });

    let palco3d;
    if (c.palco3d !== undefined) {
      const [p3, ate] = resolverPalco(c.palco3d, ctx, `${onde}, palco3d`);
      palco3d = p3;
      precisa = Math.max(precisa, ate + 0.4);
    }

    const efeitos = (c.efeitos ?? []).map((e, j) => {
      if (!SONS.includes(e.som)) falhar(`${onde}, efeito ${j + 1}: som "${e.som}" não existe. Opções: ${SONS.join(', ')}`);
      const em = arred(resolverTempo(e.em ?? 0, ctx, `${onde}, efeito ${j + 1}`));
      precisa = Math.max(precisa, em + 0.2);
      return { som: e.som, em, volume: e.volume };
    });

    const pausa = c.pausaDepois ?? 0.35;
    const pelaFala = ctx.fimNarracao !== undefined ? ctx.fimNarracao + pausa : 0;
    const duracao = Math.max(c.duracao ?? 0, pelaFala, precisa, SOBREPOSICAO * 2);
    if (!duracao) falhar(`${onde}: sem narração e sem "duracao". Diga quanto tempo a cena fica na tela.`);

    cenas.push({ inicio: arred(inicio), duracao: arred(duracao), entrada, estilo, pecas, narracao, efeitos, palco3d });
    inicio += duracao;
  });

  // emojis 3D (Fluent Emoji, MIT): copia só os usados nas cenas com estilo emoji "3d"
  const emoji3d = {};
  const usa3d = cenas.some((c) => c.estilo.emoji === '3d');
  if (usa3d) {
    mkdirSync(join(pastaPublica, 'emoji3d'), { recursive: true });
    const textos3d = JSON.stringify(cenas.filter((c) => c.estilo.emoji === '3d').map((c) => [c.pecas, c.estilo.fundo]));
    for (const [e] of textos3d.matchAll(/\p{RGI_Emoji}/gv)) {
      if (emoji3d[e]) continue;
      const cod = [...e].map((ch) => ch.codePointAt(0).toString(16).padStart(4, '0'));
      const tentativas = [cod.join('-'), cod.filter((c) => c !== 'fe0f').join('-'), [...cod, 'fe0f'].join('-')];
      const achado = tentativas.find((n) => existsSync(join(PASTA_EMOJI3D, `${n}.webp`)));
      if (!achado) continue; // sem versão 3D: o vídeo usa o emoji plano
      cpSync(join(PASTA_EMOJI3D, `${achado}.webp`), join(pastaPublica, 'emoji3d', `${achado}.webp`));
      emoji3d[e] = `emoji3d/${achado}.webp`;
    }
  }

  return { legenda, volumes, cenas, textos, emoji3d, duracaoTotal: arred(inicio) };
}

// ---------- principal ----------

async function principal() {
  const video = carregarJson();
  const trabalho = join(ESTUDIO, '.trabalho', `${nome}-${sha(arquivoJson).slice(0, 8)}`);
  const pastaPublica = join(trabalho, 'publico');
  const pastaCache = join(ESTUDIO, '.trabalho', 'cache-voz');
  rmSync(pastaPublica, { recursive: true, force: true });
  mkdirSync(pastaCache, { recursive: true });
  cpSync(join(ESTUDIO, 'public'), pastaPublica, { recursive: true });

  console.log(`[1/3] Voz e tempos (${video.cenas?.length ?? 0} cenas)...`);
  const props = montar(video, pastaPublica, pastaCache);
  writeFileSync(join(trabalho, 'props.json'), JSON.stringify(props, null, 2));
  const dur = props.duracaoTotal;
  console.log(`      duração: ${dur.toFixed(1)} s`);
  const avisos = [];
  if (dur < 15) avisos.push(`vídeo curto (${dur.toFixed(1)} s): o combinado é de 15 a 45 s`);
  if (dur > 45) avisos.push(`vídeo longo (${dur.toFixed(1)} s): o combinado é de 15 a 45 s`);

  console.log('[2/3] Preparando a animação...');
  const serveUrl = await bundle({ entryPoint: join(ESTUDIO, 'src/index.ts'), publicDir: pastaPublica });
  const composition = await selectComposition({ serveUrl, id: 'Video', inputProps: props });

  // quadros: um no gancho (0,6 s) e um perto do fim de cada cena
  const momentos = [0.6, ...props.cenas.map((c) => c.inicio + c.duracao * 0.8)];
  rmSync(pastaQuadros, { recursive: true, force: true });
  mkdirSync(pastaQuadros, { recursive: true });
  // "angle" liga o WebGL no Chrome sem tela (necessário para o palco 3D)
  const navegador = await openBrowser('chrome', { chromiumOptions: { gl: 'angle' } });
  try {
    console.log(`[3/3] ${soQuadros ? 'Quadros' : 'Quadros de conferência'} (${momentos.length})...`);
    for (const [i, t] of momentos.entries()) {
      const frame = Math.min(composition.durationInFrames - 1, Math.round(t * FPS));
      await renderStill({
        composition,
        serveUrl,
        inputProps: props,
        frame,
        output: join(pastaQuadros, `q${String(i + 1).padStart(2, '0')}.png`),
        puppeteerInstance: navegador,
        chromiumOptions: { gl: 'angle' },
      });
    }
    const colunas = Math.min(momentos.length, 5);
    const linhas = Math.ceil(momentos.length / colunas);
    spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '1', '-i', join(pastaQuadros, 'q%02d.png'), '-vf', `scale=270:480,tile=${colunas}x${linhas}:padding=8:color=white`, '-frames:v', '1', join(pastaQuadros, 'quadros.png')]);
    console.log(`      quadros: ${join(pastaQuadros, 'quadros.png')}`);

    if (!soQuadros) {
      console.log('      renderizando o vídeo...');
      mkdirSync(dirname(saidaMp4), { recursive: true });
      let ultimo = -1;
      const t0 = Date.now();
      await renderMedia({
        composition,
        serveUrl,
        inputProps: props,
        codec: 'h264',
        audioCodec: 'aac',
        pixelFormat: 'yuv420p',
        crf: 20,
        outputLocation: saidaMp4,
        puppeteerInstance: navegador,
        chromiumOptions: { gl: 'angle' },
        onProgress: ({ progress }) => {
          const p = Math.floor(progress * 10);
          if (p !== ultimo) {
            ultimo = p;
            process.stdout.write(`      ${p * 10}%\n`);
          }
        },
      });
      // volume no padrão das redes (-14 LUFS), sem mexer na imagem
      const bruto = saidaMp4.replace(/\.mp4$/, '.bruto.mp4');
      rmSync(bruto, { force: true });
      cpSync(saidaMp4, bruto);
      const norm = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', bruto, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', saidaMp4], { encoding: 'utf8' });
      if (norm.status !== 0) {
        cpSync(bruto, saidaMp4);
        avisos.push(`não consegui ajustar o volume (${norm.stderr?.trim()}); o vídeo saiu com o volume original`);
      }
      rmSync(bruto, { force: true });
      const segs = ((Date.now() - t0) / 1000).toFixed(0);
      const info = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height:format=duration', '-of', 'json', saidaMp4], { encoding: 'utf8' });
      const j = JSON.parse(info.stdout);
      const v = j.streams.find((s) => s.width);
      const a = j.streams.find((s) => !s.width);
      console.log(`\nPRONTO: ${saidaMp4}`);
      console.log(`  ${v.width}x${v.height} ${v.codec_name} + ${a?.codec_name ?? 'SEM ÁUDIO'} — ${parseFloat(j.format.duration).toFixed(1)} s — renderizado em ${segs} s`);
    } else {
      console.log('\nPRONTO (só quadros).');
    }
  } finally {
    await navegador.close({ silent: true });
  }
  for (const a of avisos) console.log(`AVISO: ${a}`);
}

principal().catch((e) => {
  if (e instanceof ErroRoteiro) console.error(`\nERRO NO video.json: ${e.message}`);
  else console.error(`\nERRO: ${e.stack ?? e}`);
  process.exit(1);
});
