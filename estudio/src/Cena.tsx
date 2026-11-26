import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Cena as TCena, Legenda as TLegenda, Peca } from './tipos';
import { Fundo } from './Fundo';
import { Palco3D } from './palco3d/Palco3D';
import { Legenda } from './Legenda';
import { REGISTRO } from './pecas';
import { SEGURO, clamp, useEntrada } from './util';

/** Uma peça com a entrada animada e a saída (saiEm), conforme o estilo. */
const PecaAnimada: React.FC<{ peca: Peca; cena: TCena; volumeEfeitos: number }> = ({ peca, cena, volumeEfeitos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // numa cena "continua" as peças já estão no lugar, exceto as que têm `entraEm` (entram nesse momento)
  const continua = cena.entrada === 'continua' && peca.entraEm === undefined;
  const animacao = (peca.animacao as TCena['estilo']['animacao']) ?? cena.estilo.animacao;
  const semEntrada = continua || peca.animacao === 'nenhuma'; // 'nenhuma': a peça cuida da própria entrada
  const entrada = useEntrada(animacao, peca.entraEm ?? 0, semEntrada);
  const Comp = REGISTRO[peca.tipo];
  const saida = peca.saiEm !== undefined ? interpolate(frame, [peca.saiEm * fps, peca.saiEm * fps + 6], [1, 0], clamp) : 1;
  if (!Comp) {
    return <div style={{ background: '#fff', color: 'red', fontSize: 50, padding: 20 }}>PEÇA DESCONHECIDA: {peca.tipo}</div>;
  }
  return (
    <div style={{ width: '100%', marginTop: peca.margemTopo as number | undefined, marginLeft: peca.margemEsquerda as number | undefined, ...entrada, opacity: (entrada.opacity as number | undefined ?? 1) * saida }}>
      <Comp dados={peca} estilo={cena.estilo} duracaoCena={cena.duracao} volumeEfeitos={volumeEfeitos} continua={continua} />
    </div>
  );
};

export const Cena: React.FC<{
  cena: TCena;
  legenda: TLegenda;
  volumes: { narracao: number; efeitos: number };
  inicioGlobal: number;
  textoNarracao: string;
}> = ({ cena, legenda, volumes, inicioGlobal, textoNarracao }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // transição de entrada da cena inteira
  const p = interpolate(frame, [0, 8], [0, 1], clamp);
  let transicao: React.CSSProperties = {};
  if (cena.entrada === 'deslizar') transicao = { transform: `translateX(${(1 - p) * 1080}px)` };
  if (cena.entrada === 'subir') transicao = { transform: `translateY(${(1 - p) * 1920}px)` };
  if (cena.entrada === 'zoom') transicao = { transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`, opacity: p };
  const flash = cena.entrada === 'piscar' ? interpolate(frame, [0, 6], [0.9, 0], clamp) : 0;

  // espaço reservado para a legenda
  const alturaLegenda = legenda.modo === 'desligada' || !cena.narracao ? 0 : Math.round(legenda.tamanho * 2.5 + 40);
  const area: React.CSSProperties = {
    position: 'absolute',
    left: SEGURO.esquerda,
    right: SEGURO.direita,
    top: SEGURO.topo + (legenda.posicao === 'cima' ? alturaLegenda : 0),
    bottom: SEGURO.base + (legenda.posicao === 'baixo' ? alturaLegenda : 0),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 44,
  };

  const em = cena.narracao?.em ?? 0;
  const palavras = (cena.narracao?.palavras ?? []).map((w) => ({ ...w, inicio: w.inicio + em, fim: w.fim + em }));

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill style={transicao}>
        {cena.palco3d ? <Palco3D palco={cena.palco3d} /> : <Fundo estilo={cena.estilo} inicioGlobal={inicioGlobal} />}
        <div style={area}>
          {cena.pecas.map((peca, i) => (
            <PecaAnimada key={i} peca={peca} cena={cena} volumeEfeitos={volumes.efeitos} />
          ))}
        </div>
        <Legenda config={legenda} estilo={cena.estilo} palavras={palavras} texto={textoNarracao} />
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: '#fff', opacity: flash }} /> : null}
      {cena.narracao ? (
        <Sequence from={Math.round(em * fps)} layout="none">
          <Audio src={staticFile(cena.narracao.arquivo)} volume={volumes.narracao} />
        </Sequence>
      ) : null}
      {cena.efeitos.map((e, i) => (
        <Sequence key={i} from={Math.round(e.em * fps)} layout="none">
          <Audio src={staticFile(`sons/${e.som}.wav`)} volume={(e.volume ?? 1) * volumes.efeitos} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
