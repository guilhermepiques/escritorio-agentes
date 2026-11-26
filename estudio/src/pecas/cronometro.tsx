import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { clamp } from '../util';

type Dados = {
  segundos?: number;
  comecaEm?: number; // s
  forma?: 'circulo' | 'barra' | 'numero';
  som?: string; // tique, toque, tic-tac, tic-tac2... ou nenhum
  tamanho?: number;
};

export const Cronometro: React.FC<PropsPeca<Dados>> = ({ dados, estilo, volumeEfeitos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segundos = dados.segundos ?? 3;
  const comeca = dados.comecaEm ?? dados.entraEm ?? 0;
  const t = frame / fps - comeca;
  const resta = Math.max(0, segundos - Math.max(0, t));
  const fracao = resta / segundos;
  const numero = Math.ceil(resta - 1e-6);
  const pulso = t >= 0 && resta > 0 ? 1 + 0.12 * Math.max(0, 1 - ((t % 1) / 0.25)) : 1;
  const cor = resta <= 1 && t >= 0 ? estilo.cores.destaque2 : estilo.cores.destaque;
  const som = dados.som ?? 'tique';

  const sons =
    som === 'nenhum'
      ? null
      : Array.from({ length: segundos }, (_, k) => (
          <Sequence key={k} from={Math.round((comeca + k) * fps)} durationInFrames={Math.round(0.3 * fps)} layout="none">
            <Audio src={staticFile(`sons/${som}.wav`)} volume={volumeEfeitos} />
          </Sequence>
        ));

  const f = fonte(estilo.fonte);
  if (dados.forma === 'barra') {
    return (
      <div style={{ width: '100%' }}>
        {sons}
        <div style={{ height: 46, borderRadius: 999, background: estilo.cores.contorno, overflow: 'hidden', border: `5px solid ${estilo.cores.contorno}` }}>
          <div style={{ width: `${fracao * 100}%`, height: '100%', borderRadius: 999, background: cor }} />
        </div>
      </div>
    );
  }
  const tam = dados.tamanho ?? 260;
  if (dados.forma === 'numero') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {sons}
        <div style={{ ...f, fontSize: tam, color: cor, transform: `scale(${pulso})`, lineHeight: 1 }}>{numero}</div>
      </div>
    );
  }
  const r = tam / 2 - 16;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {sons}
      <div style={{ position: 'relative', width: tam, height: tam, transform: `scale(${pulso})` }}>
        <svg width={tam} height={tam} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={tam / 2} cy={tam / 2} r={r} fill={estilo.cores.contorno} stroke={estilo.cores.cartao} strokeWidth={22} opacity={0.9} />
          <circle
            cx={tam / 2}
            cy={tam / 2}
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth={22}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - interpolate(fracao, [0, 1], [0, 1], clamp))}
          />
        </svg>
        <div style={{ ...f, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tam * 0.46, color: '#fff' }}>
          {numero}
        </div>
      </div>
    </div>
  );
};
