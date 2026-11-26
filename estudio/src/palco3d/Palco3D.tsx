// Palco 3D: uma cena inteira em 3D low-poly, por trás das peças e da legenda.
// Tudo é guiado por useCurrentFrame() (regra do Remotion: nada de useFrame nem animação própria).
import React, { useLayoutEffect, useRef } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Objeto3D, Palco3D as TPalco } from '../tipos';
import { CURVAS, amostrar, cl01, graus, lerp, lerp3, v3, type V3 } from './anim';
import { ContextoAcabamento, MODELOS, PARTE_PRINCIPAL } from './modelos';

const LUZES: Record<string, { ceu: string; chao: string; hemi: number; sol: number; corSol: string; amb: number }> = {
  dia: { ceu: '#e3f3ff', chao: '#c9a985', hemi: 0.9, sol: 1.7, corSol: '#fff6e5', amb: 0.25 },
  tarde: { ceu: '#ffe1c4', chao: '#a8876a', hemi: 0.75, sol: 1.6, corSol: '#ffc58a', amb: 0.2 },
  noite: { ceu: '#2b3a66', chao: '#1d2233', hemi: 0.45, sol: 0.55, corSol: '#aebdff', amb: 0.15 },
  estudio: { ceu: '#ffffff', chao: '#bbbbbb', hemi: 1, sol: 1.2, corSol: '#ffffff', amb: 0.35 },
};

/** Câmera animada por pontos-chave, com uma deriva leve para nunca ficar parada. */
const Camera: React.FC<{ palco: TPalco; t: number }> = ({ palco, t }) => {
  const { camera } = useThree();
  const chaves = palco.camera ?? [];
  let pos = amostrar<V3>(chaves, 'posicao', t, [7, 6, 11], lerp3);
  const alvo = amostrar<V3>(chaves, 'olhaPara', t, [0, 1, 0], lerp3);
  const fov = amostrar<number>(chaves, 'fov', t, 50, lerp);
  const d = palco.deriva ?? 0.15;
  if (d) pos = [pos[0] + Math.sin(t * 0.7) * d, pos[1] + Math.sin(t * 0.9 + 1) * d * 0.5, pos[2] + Math.cos(t * 0.6) * d];
  const tr = palco.tremor;
  if (tr && t >= tr.de && t <= tr.ate) {
    const f = tr.forca ?? 0.15;
    pos = [pos[0] + Math.sin(t * 61) * f, pos[1] + Math.sin(t * 47 + 2) * f, pos[2]];
  }
  camera.position.set(...pos);
  camera.lookAt(...alvo);
  if ('fov' in camera && camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/** Liga sombra em todas as malhas do grupo. */
const ComSombra: React.FC<{ children: React.ReactNode; sombra: boolean }> = ({ children, sombra }) => {
  const ref = useRef<Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = o as any;
      if (m.isMesh) {
        m.castShadow = sombra;
        m.receiveShadow = true;
      }
    });
  });
  return <group ref={ref}>{children}</group>;
};

const UmObjeto: React.FC<{ o: Objeto3D; t: number; fps: number; atraso: number; desloc: V3; giroVar: number; escVar: number }> = ({
  o,
  t,
  fps,
  atraso,
  desloc,
  giroVar,
  escVar,
}) => {
  const Modelo = MODELOS[o.modelo];
  if (!Modelo) return null;
  const entra = (o.entraEm ?? 0) + atraso;
  if (o.entraEm !== undefined && t < entra) return null;
  if (o.saiEm !== undefined && o.saida === 'sumir' && t >= o.saiEm) return null;

  // posição, rotação e escala base + movimentos em sequência
  let pos = v3(o.posicao, [0, 0, 0]);
  let rot = v3(o.rotacao, [0, 0, 0]);
  let esc = v3(o.escala, [1, 1, 1]);
  let opac = o.opacidade ?? 1;
  for (const m of [...(o.movimentos ?? [])].sort((a, b) => a.de - b.de)) {
    if (t <= m.de) break;
    const curva = CURVAS[m.suave ?? 'suave'] ?? CURVAS.suave;
    const p = curva(cl01((t - m.de) / Math.max(0.001, m.ate - m.de)));
    if (m.posicao) pos = lerp3(pos, m.posicao, p);
    if (m.rotacao) rot = lerp3(rot, m.rotacao, p);
    if (m.escala !== undefined) esc = lerp3(esc, v3(m.escala, [1, 1, 1]), p);
    if (m.opacidade !== undefined) opac = lerp(opac, m.opacidade, p);
  }
  if (o.girar) rot = [rot[0] + o.girar[0] * t, rot[1] + o.girar[1] * t, rot[2] + o.girar[2] * t];
  rot = [rot[0], rot[1] + giroVar, rot[2]];
  esc = [esc[0] * escVar, esc[1] * escVar, esc[2] * escVar];

  // entrada e saída animadas
  const entrada = o.entrada ?? (o.entraEm !== undefined ? 'crescer' : 'nenhuma');
  const mola = o.entraEm !== undefined ? spring({ frame: Math.round((t - entra) * fps), fps, config: { damping: 11, stiffness: 120 } }) : 1;
  if (entrada === 'crescer') esc = [esc[0] * mola, esc[1] * mola, esc[2] * mola];
  if (entrada === 'cair') pos = [pos[0], pos[1] + (1 - mola) * 7, pos[2]];
  if (entrada === 'subir') pos = [pos[0], pos[1] - (1 - mola) * 4, pos[2]];
  if (o.saiEm !== undefined && o.saida !== 'sumir') {
    const s = 1 - cl01((t - o.saiEm) / 0.35);
    if (s <= 0) return null;
    esc = [esc[0] * s, esc[1] * s, esc[2] * s];
  }

  // "cor" pinta a parte principal do modelo; "cores" pinta qualquer parte pelo nome
  const principais = PARTE_PRINCIPAL[o.modelo] ?? ['principal'];
  const cor = (parte: string, padrao: string) =>
    o.cores?.[parte] ?? (o.cor && principais.includes(parte) ? o.cor : undefined) ?? padrao;
  return (
    <ContextoAcabamento.Provider value={{ opacidade: opac, brilho: o.brilho ?? 0, emissivo: o.brilhoProprio, forca: o.forcaBrilho ?? 0.8 }}>
      <group position={[pos[0] + desloc[0], pos[1] + desloc[1], pos[2] + desloc[2]]} rotation={graus(rot)} scale={esc}>
        <ComSombra sombra={o.sombra !== false}>
          <Modelo cor={cor} t={t} acao={o.acao} dados={o as unknown as Record<string, unknown>} />
        </ComSombra>
      </group>
    </ContextoAcabamento.Provider>
  );
};

/** Um objeto do palco (ou vários, com "repetir"). */
const Objeto: React.FC<{ o: Objeto3D; i: number; t: number; fps: number }> = ({ o, i, t, fps }) => {
  const r = o.repetir;
  if (!r) return <UmObjeto o={o} t={t} fps={fps} atraso={0} desloc={[0, 0, 0]} giroVar={0} escVar={1} />;
  const [nx, ny, nz] = v3(r.quantidade, [1, 1, 1]).map((n) => Math.max(1, Math.round(n)));
  const [dx, dy, dz] = v3(r.espaco, [1.1, 1.1, 1.1]);
  const variar = r.variar ?? 0;
  const copias: React.ReactNode[] = [];
  let k = 0;
  for (let y = 0; y < ny; y++)
    for (let z = 0; z < nz; z++)
      for (let x = 0; x < nx; x++) {
        const semente = `${i}-${k}`;
        const jx = (random(`x${semente}`) - 0.5) * variar * dx * 0.4;
        const jz = (random(`z${semente}`) - 0.5) * variar * dz * 0.4;
        copias.push(
          <UmObjeto
            key={k}
            o={o}
            t={t}
            fps={fps}
            atraso={(r.atraso ?? 0) * k}
            desloc={[(x - (nx - 1) / 2) * dx + jx, y * dy, (z - (nz - 1) / 2) * dz + jz]}
            giroVar={random(`r${semente}`) * variar * 360}
            escVar={1 + (random(`e${semente}`) - 0.5) * variar * 0.5}
          />,
        );
        k++;
      }
  return <>{copias}</>;
};

export const Palco3D: React.FC<{ palco: TPalco }> = ({ palco }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const luz = LUZES[palco.luz ?? 'dia'] ?? LUZES.dia;
  const ceu = palco.ceu ?? luz.ceu;
  const chao = palco.chao === false ? null : (palco.chao ?? '#9ccf7c');
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: 50, near: 0.1, far: 400, position: [7, 6, 11] }} gl={{ antialias: true }}>
      <color attach="background" args={[ceu]} />
      {palco.neblina !== false ? <fog attach="fog" args={[ceu, 30, 90]} /> : null}
      <hemisphereLight args={[luz.ceu, luz.chao, luz.hemi]} />
      <ambientLight intensity={luz.amb} />
      <directionalLight
        position={[9, 16, 7]}
        intensity={luz.sol}
        color={luz.corSol}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-far={80}
        shadow-bias={-0.0004}
      />
      <Camera palco={palco} t={t} />
      {chao ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color={chao} flatShading roughness={1} />
        </mesh>
      ) : null}
      {(palco.objetos ?? []).map((o, i) => (
        <Objeto key={i} o={o} i={i} t={t} fps={fps} />
      ))}
    </ThreeCanvas>
  );
};
