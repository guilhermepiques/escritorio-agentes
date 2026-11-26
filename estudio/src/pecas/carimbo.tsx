import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';
import { aleatorio, clamp } from '../util';

type Dados = {
  texto: string; // "MITO", "VERDADE"
  cor?: string; // padrão: destaque
  tamanho?: number; // px da letra (padrão 120)
  angulo?: number; // graus (padrão -12)
};

/**
 * Carimbo de borda dupla que "bate" em `entraEm`: de 130% para 100% em 0,15 s, com tremor curto e tinta falhada.
 * Ocupa altura 0 na pilha: ponha-o ANTES do cartão (e dê `margemTopo: -44` ao cartão); o carimbo fica sobre o canto direito de cima do cartão. Use `animacao: "nenhuma"`.
 */
export const Carimbo: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - (dados.entraEm ?? 0);
  if (t < 0) return <div style={{ height: 0 }} />;
  const cor = dados.cor ?? estilo.cores.destaque;
  const tam = dados.tamanho ?? 120;
  const bate = interpolate(t, [0, 0.15], [1.3, 1], clamp);
  const cai = interpolate(t, [0, 0.15], [-170, 0], clamp);
  const tremor = t > 0.15 && t < 0.45 ? Math.sin(t * 90) * 8 * (1 - (t - 0.15) / 0.3) : 0;
  const aparece = interpolate(t, [0, 0.05], [0, 1], clamp);
  const falhas = Array.from({ length: 40 }, (_, i) => ({ x: aleatorio(i + 3) * 100, y: aleatorio(i + 91) * 100, r: 0.4 + aleatorio(i + 7) * 1.4 }));
  return (
    <div style={{ height: 0, position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'absolute',
          right: -20,
          bottom: -40,
          opacity: aparece,
          transform: `translate(${tremor}px, ${cai}px) rotate(${dados.angulo ?? -12}deg) scale(${bate})`,
        }}
      >
        <div style={{ border: `9px solid ${cor}`, borderRadius: 14, padding: 8 }}>
          <div style={{ border: `4px solid ${cor}`, borderRadius: 8, padding: `0 ${tam * 0.26}px`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ ...fonte(estilo.fonte), fontSize: tam, lineHeight: 1.2, color: cor, letterSpacing: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {dados.texto}
            </div>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {falhas.map((f, i) => (
                <ellipse key={i} cx={f.x} cy={f.y} rx={f.r * 0.5} ry={f.r * 1.3} fill={estilo.cores.fundo} opacity={0.8} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
