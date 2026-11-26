// Painéis da v2, por cima da planta: "Falta você", quadro dos vídeos (com o pacote
// para postar), mural de eventos e ficha de cada agente.
// Tudo é lido dos dados que o servidor manda; nada aqui grava em lugar nenhum
// (só a preferência "até onde já li o mural", no próprio navegador).

import { minutosDesde, textoTempo } from './agentes.js';

const CHAVE_MURAL = 'escritorio.muralVisto';
const ETAPAS = ['rascunho', 'revisado', 'aprovado', 'pronto', 'postado'];
const STATUS = {
  'sem-roteiro': { rotulo: 'Sem roteiro', cor: '#868e96', etapa: -1, proximo: 'Roberto escreve o roteiro' },
  rascunho: { rotulo: 'Rascunho', cor: '#adb5bd', etapa: 0, proximo: 'Renata revisa' },
  revisado: { rotulo: 'Revisado', cor: '#4dabf7', etapa: 1, proximo: 'Você aprova o roteiro', voce: true },
  ajustar: { rotulo: 'Ajustar', cor: '#ff922b', etapa: 1, proximo: 'Volta para o Roberto (ou a Samanta) corrigir' },
  aprovado: { rotulo: 'Aprovado', cor: '#b197fc', etapa: 2, proximo: 'Edu faz o vídeo' },
  pronto: { rotulo: 'Pronto', cor: '#69db7c', etapa: 3, proximo: 'Você posta', voce: true },
  postado: { rotulo: 'Postado', cor: '#748ffc', etapa: 4, proximo: '' },
};
const ESTADOS = {
  livre: { rotulo: 'Livre', cor: '#8ce99a', texto: 'Sem tarefa. Fica na copa.' },
  trabalhando: { rotulo: 'Trabalhando', cor: '#74c0fc', texto: '' },
  esperando: { rotulo: 'Esperando', cor: '#ffd43b', texto: '' },
  erro: { rotulo: 'Travou', cor: '#ff8787', texto: 'Parou com erro. Veja a sessão do Claude Code.' },
};
const TIPOS_PENDENCIA = {
  erro: { cor: '#ff8787', acao: 'Ver ficha' },
  espera: { cor: '#ffd43b', acao: 'Ver ficha' },
  pautas: { cor: '#ffd43b', acao: '' },
  aprovar: { cor: '#4dabf7', acao: 'Abrir vídeo' },
  postar: { cor: '#69db7c', acao: 'Postar' },
};

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const negrito = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const dois = (n) => String(n).padStart(2, '0');

function pessoaDe(d, id) { return (d.equipe || []).find((p) => p.id === id) || { id, nome: id, cor: '#868e96', cargo: '' }; }

// ---------- o que está esperando o dono ----------
export function pendencias(d) {
  if (!d) return [];
  const lista = [];
  const videos = Array.isArray(d.videos) ? d.videos : [];
  let esperaPautas = false;
  for (const p of d.equipe || []) {
    const st = d.agentes && d.agentes[p.id];
    if (!st) continue;
    if (st.estado === 'erro') {
      lista.push({ chave: `erro:${p.id}:${st.desde}`, tipo: 'erro', titulo: `${p.nome} travou`, detalhe: st.tarefa || 'Sem detalhe.', agente: p.id, desde: st.desde });
    } else if (st.estado === 'esperando' && /dono|voc[eê]/i.test(st.tarefa || '')) {
      if (/pauta/i.test(st.tarefa)) esperaPautas = true;
      lista.push({ chave: `espera:${p.id}:${st.desde}`, tipo: 'espera', titulo: `${p.nome} está esperando você`, detalhe: st.tarefa, agente: p.id, desde: st.desde });
    }
  }
  const hoje = d.hoje;
  if (!esperaPautas && hoje && (d.pautas || []).includes(hoje) && !videos.some((v) => v.data === hoje)) {
    lista.push({ chave: `pautas:${hoje}`, tipo: 'pautas', titulo: 'Escolher 3 pautas de hoje', detalhe: 'As pautas da Carla estão prontas. Responda no turno (/turno-crescimento).' });
  }
  for (const v of videos) {
    if (v.status === 'revisado') lista.push({ chave: `aprovar:${v.id}`, tipo: 'aprovar', titulo: 'Aprovar roteiro', detalhe: v.titulo, video: v.id });
  }
  for (const v of videos) {
    if (v.status === 'pronto') lista.push({ chave: `postar:${v.id}`, tipo: 'postar', titulo: 'Postar vídeo', detalhe: v.titulo, video: v.id });
  }
  // quem travou primeiro, depois quem espera, depois o que fazer com os vídeos
  const ordem = Object.keys(TIPOS_PENDENCIA);
  return lista.sort((a, b) => ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo));
}

// ---------- post.md → legendas prontas para copiar ----------
export function lerPost(texto) {
  const secoes = [];
  let atual = null;
  for (const linha of String(texto).split(/\r?\n/)) {
    const h = linha.match(/^##\s+(.+)/);
    if (h) { atual = { titulo: h[1].trim(), linhas: [] }; secoes.push(atual); continue; }
    if (atual) atual.linhas.push(linha);
  }
  const item = (l) => /^\s*-\s/.test(l);
  const limpar = (l) => l.replace(/^\s*-\s*/, '');
  return secoes.map((s) => {
    const i = s.linhas.findIndex((l) => /^\*\*Legenda\*\*/i.test(l.trim()));
    if (i < 0) return { titulo: s.titulo, itens: s.linhas.filter(item).map(limpar) };
    const resto = s.linhas.slice(i + 1);
    const fim = resto.findIndex(item);
    const bloco = fim < 0 ? resto : resto.slice(0, fim);
    const ehTag = (l) => /^\s*#[^\s#]/.test(l);
    return {
      titulo: s.titulo,
      legenda: bloco.filter((l) => !ehTag(l)).join('\n').trim(),
      tags: bloco.filter(ehTag).map((l) => l.trim()).join(' '),
      itens: (fim < 0 ? [] : resto.slice(fim)).filter(item).map(limpar),
    };
  });
}

async function copiar(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texto); return true; }
  } catch { /* tenta do jeito antigo */ }
  // no celular pelo Wi-Fi (http) a área de transferência moderna não existe
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, texto.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

// ---------- os painéis ----------
export class Paineis {
  constructor({ agora }) {
    this.agora = agora;
    this.dados = null;
    this.vista = null;        // 'falta' | 'videos' | 'mural' | 'video:<id>' | 'agente:<id>'
    this.historico = [];
    this.quemAbriu = null;
    this.chaveVideo = '';
    this.muralVisto = lerLocal(CHAVE_MURAL);
    this.novosDesde = this.muralVisto;

    this.el = {
      painel: document.getElementById('painel'),
      titulo: document.getElementById('painel-titulo'),
      corpo: document.getElementById('painel-corpo'),
      voltar: document.getElementById('painel-voltar'),
      fechar: document.getElementById('painel-fechar'),
      contFalta: document.getElementById('cont-falta'),
      contMural: document.getElementById('cont-mural'),
      btFalta: document.getElementById('bt-falta'),
      ultimo: document.getElementById('ultimo'),
    };
    this.botoes = [...document.querySelectorAll('[data-painel]')];
    for (const b of this.botoes) {
      b.addEventListener('click', () => {
        const v = b.dataset.painel;
        if (this.vista === v) this.fechar(); else this.abrir(v, b);
      });
    }
    this.el.fechar.addEventListener('click', () => this.fechar());
    this.el.voltar.addEventListener('click', () => this.voltar());
    this.el.ultimo.addEventListener('click', () => this.abrir('mural', this.el.ultimo));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.vista) this.fechar(); });
    this.el.corpo.addEventListener('click', (e) => this.cliqueNoCorpo(e));
    this.el.corpo.addEventListener('toggle', (e) => this.abriuDetalhe(e), true);
    setInterval(() => { this.mostrarUltimo(); if (this.vista && !this.vista.startsWith('video:')) this.desenhar(); }, 30000);
  }

  atualizar(dados) {
    this.dados = dados;
    const eventos = dados.eventos || [];
    // primeira vez neste navegador: começa com o mural lido (sem enxurrada de "novos")
    if (!this.muralVisto && eventos.length) { this.muralVisto = eventos[eventos.length - 1].ts; salvarLocal(CHAVE_MURAL, this.muralVisto); this.novosDesde = this.muralVisto; }
    if (this.vista === 'mural') this.marcarMuralLido();
    const falta = pendencias(dados).length;
    this.el.contFalta.textContent = String(falta);
    this.el.btFalta.classList.toggle('tem', falta > 0);
    const naoLidos = eventos.filter((e) => this.muralVisto && e.ts > this.muralVisto).length;
    this.el.contMural.textContent = String(naoLidos);
    this.el.contMural.hidden = naoLidos === 0;
    this.mostrarUltimo();
    if (!this.vista) return;
    if (this.vista.startsWith('video:')) {
      // o vídeo não é redesenhado à toa (pararia de tocar): só se a etapa ou os arquivos mudarem
      if (this.chaveDoVideo(this.vista.slice(6)) !== this.chaveVideo) this.desenhar();
    } else this.desenhar();
  }

  mostrarUltimo() {
    const d = this.dados;
    const e = d && d.eventos && d.eventos[d.eventos.length - 1];
    this.el.ultimo.hidden = !e;
    if (!e) return;
    const p = pessoaDe(d, e.agente);
    this.el.ultimo.innerHTML = `<i style="background:${esc(p.cor)}"></i><b>${esc(p.nome)}:</b> ${esc(e.texto)} <small>· ${esc(textoTempo(minutosDesde(Date.parse(e.ts), this.agora())))}</small>`;
  }

  abrir(vista, quemAbriu = null) {
    if (!this.vista) this.quemAbriu = quemAbriu || document.activeElement;
    const principal = ['falta', 'videos', 'mural'].includes(vista);
    if (principal) this.historico = [];
    else if (this.vista && this.vista !== vista) this.historico.push(this.vista);
    this.vista = vista;
    if (vista === 'mural') { this.novosDesde = this.muralVisto; this.marcarMuralLido(); }
    this.el.painel.hidden = false;
    document.body.classList.add('com-painel');
    this.desenhar(true);
    this.el.titulo.focus({ preventScroll: true });
  }

  voltar() {
    const anterior = this.historico.pop();
    if (!anterior) { this.fechar(); return; }
    this.vista = anterior;
    this.desenhar(true);
  }

  fechar() {
    this.vista = null;
    this.historico = [];
    this.el.painel.hidden = true;
    this.el.corpo.innerHTML = '';
    document.body.classList.remove('com-painel');
    this.marcarBotoes();
    if (this.quemAbriu && this.quemAbriu.focus) this.quemAbriu.focus({ preventScroll: true });
    this.quemAbriu = null;
  }

  marcarBotoes() {
    for (const b of this.botoes) b.setAttribute('aria-expanded', String(this.vista === b.dataset.painel));
  }

  marcarMuralLido() {
    const ev = (this.dados && this.dados.eventos) || [];
    if (!ev.length) return;
    this.muralVisto = ev[ev.length - 1].ts;
    salvarLocal(CHAVE_MURAL, this.muralVisto);
    this.el.contMural.hidden = true;
  }

  desenhar(doTopo = false) {
    if (!this.vista) return;
    const rolagem = doTopo ? 0 : this.el.corpo.scrollTop;
    const [tipo, ...resto] = this.vista.split(':');
    const arg = resto.join(':');
    const d = this.dados || { equipe: [], agentes: {}, eventos: [], videos: [] };
    let titulo = '', html = '';
    if (tipo === 'falta') { titulo = 'Falta você'; html = this.htmlFalta(d); }
    else if (tipo === 'videos') { titulo = 'Vídeos'; html = this.htmlVideos(d); }
    else if (tipo === 'mural') { titulo = 'Mural'; html = this.htmlMural(d); }
    else if (tipo === 'agente') { titulo = pessoaDe(d, arg).nome; html = this.htmlFicha(d, arg); }
    else if (tipo === 'video') { titulo = 'Vídeo'; html = this.htmlVideo(d, arg); this.chaveVideo = this.chaveDoVideo(arg); }
    this.el.titulo.textContent = titulo;
    this.el.voltar.hidden = this.historico.length === 0;
    this.el.corpo.innerHTML = html;
    this.el.corpo.scrollTop = rolagem;
    this.marcarBotoes();
    if (tipo === 'video') this.carregarPost(arg);
  }

  // ---------- Falta você ----------
  htmlFalta(d) {
    const lista = pendencias(d);
    if (!lista.length) return '<p class="vazio">Nada esperando você agora.</p>';
    return `<ul class="lista">${lista.map((p) => {
      const t = TIPOS_PENDENCIA[p.tipo];
      const quando = p.desde ? `<small>${esc(textoTempo(minutosDesde(Date.parse(p.desde), this.agora())))}</small>` : '';
      const alvo = p.video ? `video:${p.video}` : p.agente ? `agente:${p.agente}` : '';
      const botao = alvo && t.acao ? `<button class="acao" data-abrir="${esc(alvo)}">${t.acao}</button>` : '';
      return `<li class="cartao" style="--cor:${t.cor}"><div><strong>${esc(p.titulo)}</strong> ${quando}<p>${esc(p.detalhe)}</p></div>${botao}</li>`;
    }).join('')}</ul>`;
  }

  // ---------- Quadro dos vídeos ----------
  htmlVideos(d) {
    const videos = d.videos || [];
    if (!videos.length) return '<p class="vazio">Nenhum vídeo ainda. Eles aparecem aqui quando o Roberto escreve o primeiro roteiro do turno.</p>';
    const grupos = new Map();
    for (const v of videos) { const k = v.data || 'sem data'; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(v); }
    let html = '';
    for (const [data, lista] of grupos) {
      html += `<h3 class="grupo">${esc(nomeDoDia(data, d.hoje))}</h3><ul class="lista">`;
      for (const v of lista) {
        const s = STATUS[v.status] || STATUS.rascunho;
        const extras = [v.arquivos.post ? 'legenda ✓' : '', v.arquivos.video ? 'vídeo ✓' : ''].filter(Boolean).join(' · ');
        html += `<li><button class="cartao video${s.voce ? ' voce' : ''}" data-abrir="video:${esc(v.id)}" style="--cor:${s.cor}">
          <strong>${esc(v.titulo)}</strong>
          ${etapasHtml(v.status)}
          <span class="linha"><span class="chip" style="--cor:${s.cor}">${esc(s.rotulo)}</span>${s.proximo ? `<span>${s.voce ? '<b>' : ''}${esc(s.proximo)}${s.voce ? '</b>' : ''}</span>` : ''}</span>
          ${extras ? `<small>${extras}</small>` : ''}
        </button></li>`;
      }
      html += '</ul>';
    }
    return html;
  }

  chaveDoVideo(id) {
    const v = ((this.dados && this.dados.videos) || []).find((x) => x.id === id);
    return v ? `${v.status}|${v.titulo}|${JSON.stringify(v.arquivos)}` : 'sumiu';
  }

  // ---------- Um vídeo: etapa + pacote para postar ----------
  htmlVideo(d, id) {
    const v = (d.videos || []).find((x) => x.id === id);
    if (!v) return '<p class="vazio">Esse vídeo não está mais na lista.</p>';
    const s = STATUS[v.status] || STATUS.rascunho;
    const base = `api/video/${encodeURIComponent(v.id)}`;
    let html = `<h3 class="titulo-video">${esc(v.titulo)}</h3>
      <p class="meta">${esc([v.formato, nomeDoDia(v.data, d.hoje)].filter(Boolean).join(' · '))}</p>
      ${etapasHtml(v.status)}
      <p class="linha"><span class="chip" style="--cor:${s.cor}">${esc(s.rotulo)}</span>${s.proximo ? `<span>Próximo: ${s.voce ? '<b>' : ''}${esc(s.proximo)}${s.voce ? '</b>' : ''}</span>` : ''}</p>`;

    html += '<h4>Vídeo</h4>';
    if (v.arquivos.video) {
      html += `<video class="player" controls playsinline preload="metadata" src="${base}/video.mp4"></video>
        <a class="acao larga" href="${base}/video.mp4?baixar=1" download="${esc(v.id)}.mp4">Baixar vídeo</a>`;
    } else html += '<p class="vazio">O vídeo ainda não foi feito. O Edu faz depois que você aprova o roteiro.</p>';

    html += '<h4>Legenda e hashtags</h4>';
    html += v.arquivos.post ? '<div id="post-conteudo"><p class="vazio">Carregando…</p></div>' : '<p class="vazio">A legenda ainda não foi escrita. A Samanta escreve depois do roteiro.</p>';

    for (const [arq, nome] of [['roteiro', 'Roteiro'], ['revisao', 'Revisão']]) {
      if (v.arquivos[arq]) html += `<details data-arquivo="${base}/${arq}.md"><summary>${nome}</summary><pre class="texto">Carregando…</pre></details>`;
    }
    return html;
  }

  async carregarPost(id) {
    const caixa = this.el.corpo.querySelector('#post-conteudo');
    if (!caixa) return;
    let texto;
    try {
      const r = await fetch(`api/video/${encodeURIComponent(id)}/post.md`, { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      texto = await r.text();
    } catch { caixa.innerHTML = '<p class="vazio">Não consegui ler o post.md.</p>'; return; }
    if (this.vista !== `video:${id}`) return;
    const secoes = lerPost(texto);
    const legendas = secoes.filter((s) => 'legenda' in s);
    if (!legendas.length) { caixa.innerHTML = `<pre class="texto">${esc(texto)}</pre><button class="acao" data-copiar-tudo>Copiar tudo</button>`; this.textoCru = texto; return; }
    this.copias = [];
    caixa.innerHTML = secoes.map((s) => {
      if (!('legenda' in s)) {
        const marcavel = /checklist/i.test(s.titulo);
        return `<div class="secao"><h5>${esc(s.titulo)}</h5><ul class="itens">${s.itens.map((i) => {
          const sem = i.replace(/^\[[ xX]\]\s*/, '');
          return marcavel ? `<li><label><input type="checkbox"> ${negrito(sem)}</label></li>` : `<li>${negrito(sem)}</li>`;
        }).join('')}</ul></div>`;
      }
      const n = this.copias.push([s.legenda, s.tags].filter(Boolean).join('\n\n')) - 1;
      return `<div class="secao"><h5>${esc(s.titulo)}</h5>
        <div class="legenda"><p>${esc(s.legenda).replace(/\n/g, '<br>')}</p>${s.tags ? `<p class="tags">${esc(s.tags)}</p>` : ''}</div>
        <button class="acao larga" data-copiar="${n}">Copiar legenda + hashtags</button>
        ${s.itens.length ? `<ul class="itens">${s.itens.map((i) => `<li>${negrito(i)}</li>`).join('')}</ul>` : ''}</div>`;
    }).join('');
  }

  async abriuDetalhe(e) {
    const det = e.target;
    if (!(det instanceof HTMLDetailsElement) || !det.open || det.dataset.lido) return;
    const pre = det.querySelector('pre');
    try {
      const r = await fetch(det.dataset.arquivo, { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      pre.textContent = await r.text();
      det.dataset.lido = '1';
    } catch { pre.textContent = 'Não consegui ler o arquivo.'; }
  }

  // ---------- Mural ----------
  htmlMural(d) {
    const ev = [...(d.eventos || [])].reverse();
    if (!ev.length) return '<p class="vazio">Nenhum evento ainda. Os agentes escrevem aqui o que acontece no turno.</p>';
    const ids = new Set((d.videos || []).map((v) => v.id));
    return `<ol class="mural">${ev.map((e) => {
      const p = pessoaDe(d, e.agente);
      const novo = this.novosDesde && e.ts > this.novosDesde;
      const ref = e.ref && ids.has(e.ref) ? `<button class="link" data-abrir="video:${esc(e.ref)}">ver vídeo</button>` : '';
      return `<li class="${novo ? 'novo' : ''}"><time datetime="${esc(e.ts)}">${esc(horaCurta(e.ts, d.hoje))}</time>
        <div><button class="pessoa" data-abrir="agente:${esc(p.id)}"><i style="background:${esc(p.cor)}"></i>${esc(p.nome)}</button>
        <span>${esc(e.texto)}</span> ${ref}</div></li>`;
    }).join('')}</ol>`;
  }

  // ---------- Ficha do agente ----------
  htmlFicha(d, id) {
    const p = pessoaDe(d, id);
    const st = (d.agentes && d.agentes[id]) || { estado: 'livre' };
    const e = ESTADOS[st.estado] || ESTADOS.livre;
    const sala = (d.salas || []).find((s) => s.id === p.sala);
    const desde = Date.parse(st.desde);
    const tempo = Number.isNaN(desde) ? '' : `desde ${horaCurta(st.desde, d.hoje)} · ${textoTempo(minutosDesde(desde, this.agora()))}`;
    const eventos = (d.eventos || []).filter((x) => x.agente === id).reverse().slice(0, 8);
    const ids = new Set((d.videos || []).map((v) => v.id));
    return `<div class="ficha" style="--cor:${esc(p.cor)}">
        <p class="quem"><i></i><span><strong>${esc(p.nome)}</strong><br><small>${esc([p.cargo, sala && sala.nome].filter(Boolean).join(' · '))}</small></span></p>
        <p class="linha"><span class="chip" style="--cor:${e.cor}">${e.rotulo}</span><small>${esc(tempo)}</small></p>
        ${st.tarefa ? `<p class="tarefa">${esc(st.tarefa)}</p>` : ''}
        ${e.texto ? `<p class="meta">${esc(e.texto)}</p>` : ''}
      </div>
      <h4>Últimos eventos</h4>
      ${eventos.length ? `<ol class="mural">${eventos.map((x) => `<li><time datetime="${esc(x.ts)}">${esc(horaCurta(x.ts, d.hoje))}</time><div><span>${esc(x.texto)}</span>${x.ref && ids.has(x.ref) ? ` <button class="link" data-abrir="video:${esc(x.ref)}">ver vídeo</button>` : ''}</div></li>`).join('')}</ol>` : '<p class="vazio">Nada no mural ainda.</p>'}`;
  }

  // ---------- cliques dentro do painel ----------
  async cliqueNoCorpo(e) {
    const abrir = e.target.closest('[data-abrir]');
    if (abrir) { this.abrir(abrir.dataset.abrir); return; }
    const botao = e.target.closest('[data-copiar], [data-copiar-tudo]');
    if (!botao) return;
    const texto = botao.hasAttribute('data-copiar-tudo') ? this.textoCru : this.copias[Number(botao.dataset.copiar)];
    const original = botao.dataset.original || botao.textContent;
    botao.dataset.original = original;
    const ok = await copiar(texto || '');
    botao.textContent = ok ? 'Copiado ✓' : 'Não deu: segure o texto e copie';
    botao.classList.toggle('ok', ok);
    setTimeout(() => { botao.textContent = original; botao.classList.remove('ok'); }, 1800);
  }
}

function etapasHtml(status) {
  const s = STATUS[status] || STATUS.rascunho;
  const ajuste = status === 'ajustar';
  return `<span class="etapas" style="--cor:${s.cor}" role="img" aria-label="Etapa: ${esc(s.rotulo)}">${ETAPAS.map((nome, i) => {
    const cls = i < s.etapa || (i === s.etapa && !ajuste) ? 'feita' : i === s.etapa && ajuste ? 'ajuste' : '';
    return `<span class="${cls}" title="${nome}"></span>`;
  }).join('')}</span>`;
}

function nomeDoDia(data, hoje) {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return data || '';
  if (data === hoje) return 'Hoje';
  const h = hoje ? new Date(`${hoje}T12:00:00`) : new Date();
  const ontem = new Date(h.getTime() - 86400000);
  if (data === `${ontem.getFullYear()}-${dois(ontem.getMonth() + 1)}-${dois(ontem.getDate())}`) return 'Ontem';
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

function horaCurta(ts, hoje) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const dia = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  const hora = `${dois(d.getHours())}:${dois(d.getMinutes())}`;
  return dia === hoje ? hora : `${dia.slice(8, 10)}/${dia.slice(5, 7)} ${hora}`;
}

function lerLocal(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } }
function salvarLocal(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } }
