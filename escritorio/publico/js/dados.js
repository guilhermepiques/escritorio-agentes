// De onde vêm os dados do escritório.
// Hoje: o servidor local (escritorio/servidor.mjs), ao vivo por Server-Sent Events.
// Para hospedar em outro lugar (ex.: Vercel), basta trocar este arquivo por outro
// que chame aoReceber() com o mesmo formato:
//   { equipe: [...], salas: [...], agentes: { id: {...} }, eventos: [...],
//     videos: [{ id, data, titulo, status, formato, arquivos: { roteiro, post, revisao, video } }],
//     pautas: ['AAAA-MM-DD', ...], hoje: 'AAAA-MM-DD', agora: ISO }
// Os arquivos de cada vídeo vêm de api/video/<id>/<arquivo> (ver servidor.mjs).

export function conectarDados({ aoReceber, aoMudarConexao }) {
  const receber = (texto) => {
    try { aoReceber(typeof texto === 'string' ? JSON.parse(texto) : texto); }
    catch (erro) { console.warn('Escritório: dados inválidos recebidos', erro); }
  };

  if (!('EventSource' in window)) {
    const buscar = async () => {
      try {
        const r = await fetch('api/estado', { cache: 'no-store' });
        if (!r.ok) throw new Error(String(r.status));
        receber(await r.json());
        aoMudarConexao(true);
      } catch { aoMudarConexao(false); }
      setTimeout(buscar, 3000);
    };
    buscar();
    return;
  }

  // O EventSource se reconecta sozinho se o servidor cair e voltar.
  const fonte = new EventSource('api/eventos');
  fonte.addEventListener('estado', (e) => { aoMudarConexao(true); receber(e.data); });
  fonte.addEventListener('open', () => aoMudarConexao(true));
  fonte.addEventListener('error', () => aoMudarConexao(false));
}
