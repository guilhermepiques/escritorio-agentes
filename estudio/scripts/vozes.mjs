// Gera uma amostra de cada voz do estúdio, para escolher ouvindo.
// Uso: npm run vozes [-- "texto opcional"]   → saida/vozes/<nome>.mp3

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const texto =
  (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined) ??
  'Só um por cento das pessoas acerta essa. Qual é a capital da Austrália? Você tem três segundos. A resposta é Camberra! Comenta aí quantas você acertou.';

const VOZES = {
  francisca: 'pt-BR-FranciscaNeural',
  antonio: 'pt-BR-AntonioNeural',
  thalita: 'pt-BR-ThalitaMultilingualNeural',
  andrew: 'en-US-AndrewMultilingualNeural',
  ava: 'en-US-AvaMultilingualNeural',
  brian: 'en-US-BrianMultilingualNeural',
  remy: 'fr-FR-RemyMultilingualNeural',
  giuseppe: 'it-IT-GiuseppeMultilingualNeural',
};

const pasta = join(ESTUDIO, 'saida', 'vozes');

// npm run vozes -- --gemini [Nome1,Nome2,...]  → amostras das vozes do Gemini (1 pedido do limite grátis por voz)
// Sem nomes, gera as que o dono ainda não ouviu.
const iG = process.argv.indexOf('--gemini');
if (iG >= 0) {
  const nomes = (process.argv[iG + 1] && !process.argv[iG + 1].startsWith('--') ? process.argv[iG + 1] : 'Laomedeia,Sulafat,Callirrhoe,Iapetus,Gacrux').split(',');
  const estilo = 'animada e natural, como uma criadora de conteúdo do TikTok';
  mkdirSync(pasta, { recursive: true });
  for (const nome of nomes) {
    const tmp = join(pasta, `gemini-${nome}`);
    mkdirSync(tmp, { recursive: true });
    writeFileSync(join(tmp, 'pedido.json'), JSON.stringify({ voz: nome, estilo, textos: [texto] }), 'utf8');
    const r = spawnSync('python', [join(ESTUDIO, 'scripts/voz_gemini.py'), '--entrada', join(tmp, 'pedido.json'), '--saida', tmp], { encoding: 'utf8' });
    if (r.status === 0) copyFileSync(join(tmp, 'cena-01.mp3'), join(pasta, `gemini-${nome}.mp3`));
    console.log(r.status === 0 ? `ok: gemini-${nome}` : `falhou: gemini-${nome} — ${r.stderr.trim().split(/\r?\n/).pop()}`);
  }
  console.log(`\nAmostras em: ${pasta}`);
  process.exit(0);
}
mkdirSync(pasta, { recursive: true });
const txt = join(pasta, 'texto.txt');
writeFileSync(txt, texto, 'utf8');
for (const [nome, id] of Object.entries(VOZES)) {
  const r = spawnSync('python', [join(ESTUDIO, 'scripts/tts.py'), '--voz', id, '--velocidade=+8%', '--texto', txt, '--mp3', join(pasta, `${nome}.mp3`), '--json', join(pasta, `${nome}.json`)], { encoding: 'utf8' });
  console.log(r.status === 0 ? `ok: ${nome}` : `falhou: ${nome} — ${r.stderr.trim()}`);
}
console.log(`\nAmostras em: ${pasta}`);
