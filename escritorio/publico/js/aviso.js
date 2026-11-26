// Aviso quando precisam do dono: som, aba piscando e um ponto vermelho no ícone da aba.
//
// O navegador só deixa tocar som depois de um clique na página. Por isso o som
// começa desligado: o botão do sino liga (e esse clique já destrava o áudio).
// Avisos do sistema (notificação do Windows/celular) exigem HTTPS: ficam de fora.

const CHAVE_SOM = 'escritorio.som';
const TITULO = 'Escritório';
const ICONE = (ponto) => "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%2326242d'/%3E%3Crect x='2' y='4' width='12' height='9' fill='%23efeae2'/%3E%3Crect x='4' y='6' width='3' height='3' fill='%238fc8ec'/%3E%3Crect x='9' y='6' width='3' height='3' fill='%238fc8ec'/%3E%3Crect x='7' y='10' width='2' height='3' fill='%235b3a29'/%3E"
  + (ponto ? "%3Ccircle cx='12' cy='4' r='4' fill='%23fa5252' stroke='%2326242d'/%3E" : '') + '%3C/svg%3E';

export class Aviso {
  constructor({ botaoSom, aoAvisar }) {
    this.botao = botaoSom;
    this.aoAvisar = aoAvisar;
    this.somLigado = lerPreferencia() === '1';
    this.audio = null;
    this.chaves = null;      // pendências já vistas (null = ainda não recebeu nada)
    this.total = 0;
    this.piscando = null;
    this.icone = document.querySelector('link[rel="icon"]');

    this.botao.addEventListener('click', () => this.alternarSom());
    // qualquer toque na página destrava o áudio, se o som estiver ligado
    const destravar = () => { if (this.somLigado) this.contexto(); };
    document.addEventListener('pointerdown', destravar, { passive: true });
    document.addEventListener('keydown', destravar);
    // voltou para a aba: para de piscar
    const parar = () => { if (!document.hidden && document.hasFocus()) this.pararDePiscar(); };
    document.addEventListener('visibilitychange', parar);
    window.addEventListener('focus', parar);
    this.mostrarBotao();
  }

  contexto() {
    try {
      if (!this.audio) this.audio = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audio.state === 'suspended') this.audio.resume();
    } catch { this.audio = null; }
    return this.audio;
  }

  alternarSom() {
    this.somLigado = !this.somLigado;
    salvarPreferencia(this.somLigado ? '1' : '0');
    this.mostrarBotao();
    if (this.somLigado) this.tocar('pendencia'); // confirma que está funcionando
  }

  mostrarBotao() {
    this.botao.setAttribute('aria-pressed', String(this.somLigado));
    this.botao.title = this.somLigado ? 'Som do aviso ligado (clique para desligar)' : 'Som do aviso desligado (clique para ligar)';
    this.botao.setAttribute('aria-label', this.botao.title);
  }

  // "plim" curto, feito na hora (sem arquivo de som). Erro: duas notas descendo.
  tocar(tipo) {
    if (!this.somLigado) return;
    const ac = this.contexto();
    if (!ac) return;
    const notas = tipo === 'erro' ? [[660, 0], [440, 0.16], [440, 0.32]] : [[880, 0], [1320, 0.13]];
    const t0 = ac.currentTime + 0.02;
    for (const [freq, atraso] of notas) {
      const osc = ac.createOscillator(), vol = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(0.0001, t0 + atraso);
      vol.gain.exponentialRampToValueAtTime(0.18, t0 + atraso + 0.015);
      vol.gain.exponentialRampToValueAtTime(0.0001, t0 + atraso + 0.22);
      osc.connect(vol).connect(ac.destination);
      osc.start(t0 + atraso);
      osc.stop(t0 + atraso + 0.25);
    }
  }

  // Recebe a lista de pendências a cada atualização dos dados.
  verificar(lista) {
    const chaves = new Set(lista.map((p) => p.chave));
    const novas = this.chaves ? lista.filter((p) => !this.chaves.has(p.chave)) : [];
    this.chaves = chaves;
    this.total = lista.length;
    this.mostrarTitulo();
    if (!novas.length) return;
    this.tocar(novas.some((p) => p.tipo === 'erro') ? 'erro' : 'pendencia');
    if (document.hidden || !document.hasFocus()) this.piscar(novas[0]);
    if (this.aoAvisar) this.aoAvisar(novas);
  }

  mostrarTitulo() {
    if (this.piscando) return;
    document.title = this.total ? `(${this.total}) ${TITULO}` : TITULO;
    if (this.icone) this.icone.href = ICONE(this.total > 0);
  }

  piscar(primeira) {
    this.pararDePiscar();
    const chamada = primeira.tipo === 'erro' ? '⚠ Alguém travou' : '● Falta você';
    let ligado = false;
    this.piscando = setInterval(() => {
      ligado = !ligado;
      document.title = ligado ? chamada : `(${this.total}) ${TITULO}`;
      if (this.icone) this.icone.href = ICONE(ligado || this.total > 0);
    }, 1000);
  }

  pararDePiscar() {
    if (!this.piscando) return;
    clearInterval(this.piscando);
    this.piscando = null;
    this.mostrarTitulo();
  }
}

function lerPreferencia() { try { return localStorage.getItem(CHAVE_SOM); } catch { return null; } }
function salvarPreferencia(v) { try { localStorage.setItem(CHAVE_SOM, v); } catch { /* modo privado */ } }
