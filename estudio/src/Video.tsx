import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming, type TransitionPresentation } from '@remotion/transitions';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { cube } from '@remotion/transitions/cube';
import { fade } from '@remotion/transitions/fade';
import { flip } from '@remotion/transitions/flip';
import { iris } from '@remotion/transitions/iris';
import { pushCut } from '@remotion/transitions/push-cut';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { PropsVideo } from './tipos';
import { Cena } from './Cena';
import { ContextoEmoji3D } from './EmojiArte';
import { fonte } from './estilos/fontes';

/** Transições oficiais do Remotion: a cena nova entra por cima da anterior (0,4 s de sobreposição). */
export const QUADROS_TRANSICAO = 12;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSICOES: Record<string, () => TransitionPresentation<any>> = {
  cortina: () => wipe({ direction: 'from-left' }),
  'cortina-diagonal': () => wipe({ direction: 'from-top-left' }),
  empurrar: () => slide({ direction: 'from-right' }),
  'empurrar-cima': () => slide({ direction: 'from-bottom' }),
  virar: () => flip({ direction: 'from-right' }),
  cubo: () => cube({ direction: 'from-right' }),
  relogio: () => clockWipe({ width: 1080, height: 1920 }),
  iris: () => iris({ width: 1080, height: 1920 }),
  dissolver: () => fade(),
  soco: () => pushCut(),
};

export const Video: React.FC<PropsVideo & { textos?: string[] }> = ({ cenas, legenda, volumes, textos, emoji3d }) => {
  const { fps } = useVideoConfig();
  // carrega as fontes usadas antes do primeiro quadro
  cenas.forEach((c) => {
    fonte(c.estilo.fonte);
    fonte(c.estilo.fonteApoio);
  });
  if (legenda.fonte) fonte(legenda.fonte);

  const itens: React.ReactNode[] = [];
  cenas.forEach((cena, i) => {
    const de = Math.round(cena.inicio * fps);
    const quadros = Math.max(QUADROS_TRANSICAO + 1, Math.round((cena.inicio + cena.duracao) * fps) - de);
    const transicao = i > 0 ? TRANSICOES[cena.entrada] : undefined;
    if (transicao) {
      itens.push(
        <TransitionSeries.Transition key={`t${i}`} presentation={transicao()} timing={linearTiming({ durationInFrames: QUADROS_TRANSICAO })} />,
      );
    }
    itens.push(
      <TransitionSeries.Sequence key={`c${i}`} durationInFrames={quadros}>
        <Cena cena={cena} legenda={legenda} volumes={volumes} inicioGlobal={de} textoNarracao={textos?.[i] ?? ''} />
      </TransitionSeries.Sequence>,
    );
  });

  return (
    <ContextoEmoji3D.Provider value={emoji3d ?? {}}>
      <AbsoluteFill style={{ background: '#000' }}>
        <TransitionSeries>{itens}</TransitionSeries>
      </AbsoluteFill>
    </ContextoEmoji3D.Provider>
  );
};
