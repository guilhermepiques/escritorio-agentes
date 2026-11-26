// Modelos 3D low-poly feitos só de formas simples (nada baixado, nada pago).
// Todo modelo tem a origem no CHÃO, no centro da base: posicao [x, 0, z] o deixa em pé no chão.
// Modelo novo: escreva o componente aqui e ponha uma linha no MODELOS (formato  'nome': Componente,
// uma por linha — o render.mjs lê esta lista). Documente no CATALOGO.md.
import React, { createContext, useContext } from 'react';
import type {} from '@react-three/fiber';
import * as THREE from 'three';

/** Acabamento do objeto inteiro (vem do video.json). */
export type Acabamento = { opacidade: number; brilho: number; emissivo?: string; forca: number };
export const ContextoAcabamento = createContext<Acabamento>({ opacidade: 1, brilho: 0, forca: 0 });

/** Material low-poly: faces chapadas, pouco brilho. */
export const Mat: React.FC<{ c: string; metal?: number; brilho?: number }> = ({ c, metal, brilho }) => {
  const a = useContext(ContextoAcabamento);
  return (
    <meshStandardMaterial
      color={c}
      flatShading
      roughness={brilho !== undefined ? 1 - brilho : 0.85 - a.brilho * 0.6}
      metalness={metal ?? a.brilho * 0.5}
      transparent={a.opacidade < 1}
      opacity={a.opacidade}
      emissive={a.emissivo ?? '#000000'}
      emissiveIntensity={a.emissivo ? a.forca : 0}
    />
  );
};

export type PropsModelo = {
  /** cor de uma parte: o que veio em "cores" (ou "cor" para a principal) ou o padrão */
  cor: (parte: string, padrao: string) => string;
  /** segundos desde o começo da cena */
  t: number;
  acao?: string;
  dados: Record<string, unknown>;
};

const PELE = '#f1c7a0';

// ---------- formas básicas (tamanho 1; mude com "escala") ----------

const Caixa: React.FC<PropsModelo> = ({ cor }) => (
  <mesh position={[0, 0.5, 0]}>
    <boxGeometry args={[1, 1, 1]} />
    <Mat c={cor('principal', '#d9d9d9')} />
  </mesh>
);

const Cilindro: React.FC<PropsModelo> = ({ cor, dados }) => (
  <mesh position={[0, 0.5, 0]}>
    <cylinderGeometry args={[0.5, 0.5, 1, Number(dados.lados ?? 16)]} />
    <Mat c={cor('principal', '#d9d9d9')} />
  </mesh>
);

const Esfera: React.FC<PropsModelo> = ({ cor, dados }) => (
  <mesh position={[0, 0.5, 0]}>
    <icosahedronGeometry args={[0.5, Number(dados.detalhe ?? 2)]} />
    <Mat c={cor('principal', '#d9d9d9')} />
  </mesh>
);

const Cone: React.FC<PropsModelo> = ({ cor, dados }) => (
  <mesh position={[0, 0.5, 0]}>
    <coneGeometry args={[0.5, 1, Number(dados.lados ?? 12)]} />
    <Mat c={cor('principal', '#d9d9d9')} />
  </mesh>
);

const Plano: React.FC<PropsModelo> = ({ cor }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
    <planeGeometry args={[1, 1]} />
    <Mat c={cor('principal', '#d9d9d9')} />
  </mesh>
);

const Pedra: React.FC<PropsModelo> = ({ cor }) => (
  <mesh position={[0, 0.45, 0]}>
    <icosahedronGeometry args={[0.5, 1]} />
    <Mat c={cor('principal', '#a9a9a9')} />
  </mesh>
);

const Seta: React.FC<PropsModelo> = ({ cor }) => (
  // aponta para cima (+y); gire com "rotacao"
  <group>
    <mesh position={[0, 0.35, 0]}>
      <cylinderGeometry args={[0.12, 0.12, 0.7, 10]} />
      <Mat c={cor('principal', '#ff8a3d')} />
    </mesh>
    <mesh position={[0, 0.85, 0]}>
      <coneGeometry args={[0.28, 0.35, 12]} />
      <Mat c={cor('principal', '#ff8a3d')} />
    </mesh>
  </group>
);

// ---------- cenário ----------

const Casa: React.FC<PropsModelo> = ({ cor }) => (
  <group>
    <mesh position={[0, 0.8, 0]}>
      <boxGeometry args={[2, 1.6, 2]} />
      <Mat c={cor('parede', '#f3d2a2')} />
    </mesh>
    {/* telhado de duas águas: caixa girada 45° (a metade de baixo fica dentro da parede) */}
    <mesh position={[0, 1.6, 0]} rotation={[Math.PI / 4, 0, 0]}>
      <boxGeometry args={[2.25, 1.5, 1.5]} />
      <Mat c={cor('telhado', '#d6524a')} />
    </mesh>
    <mesh position={[0, 0.5, 1.01]}>
      <boxGeometry args={[0.5, 1, 0.04]} />
      <Mat c={cor('porta', '#5a3b2a')} />
    </mesh>
    {[-0.6, 0.6].map((x) => (
      <mesh key={x} position={[x, 1.05, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.04]} />
        <Mat c={cor('janela', '#9fd6f5')} />
      </mesh>
    ))}
  </group>
);

const Predio: React.FC<PropsModelo> = ({ cor, dados }) => {
  const andares = Math.max(1, Math.round(Number(dados.andares ?? 5)));
  const alt = andares * 0.9 + 0.3;
  return (
    <group>
      <mesh position={[0, alt / 2, 0]}>
        <boxGeometry args={[2.4, alt, 2.4]} />
        <Mat c={cor('parede', '#e8d9c8')} />
      </mesh>
      {Array.from({ length: andares }, (_, a) =>
        [-0.75, 0, 0.75].map((x) => (
          <mesh key={`${a}-${x}`} position={[x, 0.65 + a * 0.9, 1.21]}>
            <boxGeometry args={[0.45, 0.5, 0.04]} />
            <Mat c={cor('janela', '#9fd6f5')} />
          </mesh>
        )),
      )}
    </group>
  );
};

const Arvore: React.FC<PropsModelo> = ({ cor }) => (
  <group>
    <mesh position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.12, 0.16, 1, 7]} />
      <Mat c={cor('tronco', '#7a5236')} />
    </mesh>
    <mesh position={[0, 1.45, 0]}>
      <icosahedronGeometry args={[0.75, 0]} />
      <Mat c={cor('copa', '#4caf50')} />
    </mesh>
  </group>
);

const Rua: React.FC<PropsModelo> = ({ cor, dados }) => {
  const comp = Number(dados.comprimento ?? 40);
  const larg = Number(dados.largura ?? 6);
  const calc = 2.2;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[larg, comp]} />
        <Mat c={cor('asfalto', '#2f3033')} />
      </mesh>
      {dados.faixas !== false ? (
        <>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, comp]} />
              <Mat c={cor('faixa', '#f2c230')} />
            </mesh>
          ))}
          {[-larg / 2 + 0.3, larg / 2 - 0.3].map((x) => (
            <mesh key={x} position={[x, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.1, comp]} />
              <Mat c={cor('borda', '#f4f4f4')} />
            </mesh>
          ))}
        </>
      ) : null}
      {dados.calcadas !== false
        ? [-1, 1].map((lado) => (
            <mesh key={lado} position={[lado * (larg / 2 + calc / 2), 0.1, 0]}>
              <boxGeometry args={[calc, 0.2, comp]} />
              <Mat c={cor('calcada', '#cfcfcf')} />
            </mesh>
          ))
        : null}
    </group>
  );
};

const Poste: React.FC<PropsModelo> = ({ cor }) => (
  <group>
    <mesh position={[0, 1.6, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 3.2, 8]} />
      <Mat c={cor('principal', '#5b5f66')} />
    </mesh>
    <mesh position={[0.35, 3.15, 0]}>
      <boxGeometry args={[0.8, 0.08, 0.08]} />
      <Mat c={cor('principal', '#5b5f66')} />
    </mesh>
    <mesh position={[0.7, 3.05, 0]}>
      <boxGeometry args={[0.3, 0.12, 0.2]} />
      <Mat c={cor('lampada', '#fff4c2')} />
    </mesh>
  </group>
);

const Nuvem: React.FC<PropsModelo> = ({ cor }) => (
  <group>
    {(
      [
        [0, 0, 0, 0.8],
        [0.8, -0.1, 0, 0.6],
        [-0.8, -0.1, 0.1, 0.65],
        [0.3, 0.35, -0.1, 0.55],
      ] as const
    ).map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <icosahedronGeometry args={[r, 1]} />
        <Mat c={cor('principal', '#ffffff')} />
      </mesh>
    ))}
  </group>
);

// ---------- personagens e veículos ----------

const Boneco: React.FC<PropsModelo> = ({ cor, t, acao }) => {
  const andando = acao === 'andar';
  const passo = andando ? Math.sin(t * 7) * 0.6 : 0;
  const aceno = acao === 'acenar' ? -2.6 + Math.sin(t * 9) * 0.35 : -passo * 0.8;
  const pulo = acao === 'pular' ? Math.abs(Math.sin(t * 5)) * 0.35 : 0;
  return (
    <group position={[0, pulo, 0]}>
      {[-0.13, 0.13].map((x, i) => (
        <group key={x} position={[x, 0.75, 0]} rotation={[i ? passo : -passo, 0, 0]}>
          <mesh position={[0, -0.375, 0]}>
            <boxGeometry args={[0.2, 0.75, 0.22]} />
            <Mat c={cor('calca', '#2d3a55')} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <Mat c={cor('camisa', '#e23b3b')} />
      </mesh>
      {/* braço esquerdo */}
      <group position={[-0.36, 1.4, 0]} rotation={[passo * 0.8, 0, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.16, 0.64, 0.18]} />
          <Mat c={cor('camisa', '#e23b3b')} />
        </mesh>
      </group>
      {/* braço direito (acena) */}
      <group position={[0.36, 1.4, 0]} rotation={[acao === 'acenar' ? 0 : aceno, 0, acao === 'acenar' ? aceno : 0]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.16, 0.64, 0.18]} />
          <Mat c={cor('camisa', '#e23b3b')} />
        </mesh>
      </group>
      <mesh position={[0, 1.68, 0]}>
        <icosahedronGeometry args={[0.24, 1]} />
        <Mat c={cor('pele', PELE)} />
      </mesh>
      <mesh position={[0, 1.86, -0.02]}>
        <boxGeometry args={[0.44, 0.14, 0.44]} />
        <Mat c={cor('cabelo', '#4a2e1f')} />
      </mesh>
    </group>
  );
};

const Roda: React.FC<{ x: number; z: number; giro: number; r?: number }> = ({ x, z, giro, r = 0.35 }) => (
  <mesh position={[x, r, z]} rotation={[giro, 0, Math.PI / 2]}>
    <cylinderGeometry args={[r, r, 0.28, 14]} />
    <Mat c="#1e1e1e" />
  </mesh>
);

const Carro: React.FC<PropsModelo> = ({ cor, t, acao }) => {
  const giro = acao === 'rodar' ? t * 10 : 0;
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.6, 0.6, 3.2]} />
        <Mat c={cor('principal', '#d93636')} />
      </mesh>
      <mesh position={[0, 1.1, -0.2]}>
        <boxGeometry args={[1.4, 0.5, 1.7]} />
        <Mat c={cor('vidro', '#a9dcf2')} />
      </mesh>
      {[-0.8, 0.8].map((x) => [-1, 1].map((z) => <Roda key={`${x}${z}`} x={x} z={z} giro={giro} />))}
    </group>
  );
};

const Caminhao: React.FC<PropsModelo> = ({ cor, t, acao, dados }) => {
  const giro = acao === 'rodar' ? t * 9 : 0;
  return (
    <group>
      <mesh position={[0, 1.15, 1.7]}>
        <boxGeometry args={[2, 1.6, 1.4]} />
        <Mat c={cor('cabine', '#e8b931')} />
      </mesh>
      <mesh position={[0, 1.45, 2.3]}>
        <boxGeometry args={[1.8, 0.6, 0.3]} />
        <Mat c={cor('vidro', '#a9dcf2')} />
      </mesh>
      <mesh position={[0, 1.1, -0.6]}>
        <boxGeometry args={[2.1, 1.2, 3]} />
        <Mat c={cor('cacamba', '#e8b931')} />
      </mesh>
      {dados.carga ? (
        <mesh position={[0, 1.75, -0.6]} scale={[1.8, 0.35, 2.6]}>
          <icosahedronGeometry args={[0.6, 1]} />
          <Mat c={cor('carga', '#9a9a9a')} />
        </mesh>
      ) : null}
      {[-0.95, 0.95].map((x) => [-1.3, 0.2, 1.7].map((z) => <Roda key={`${x}${z}`} x={x} z={z} giro={giro} r={0.42} />))}
    </group>
  );
};


// ---------- avião e asa ----------

/** Avião de passageiros low-poly, nariz para +z, ~9 m de comprimento, 10 m de envergadura. Base em y=0 (rodas). */
const Aviao: React.FC<PropsModelo> = ({ cor }) => {
  const corpo = cor('principal', '#f4f6f8');
  const azul = cor('detalhe', '#2f6fd6');
  return (
    <group position={[0, 0.9, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 7, 10]} />
        <Mat c={corpo} />
      </mesh>
      <mesh position={[0, 0, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.7, 1.3, 10]} />
        <Mat c={azul} />
      </mesh>
      <mesh position={[0, -0.02, -4.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.7, 1.6, 10]} />
        <Mat c={corpo} />
      </mesh>
      <mesh position={[0, 0.2, 2.8]}>
        <boxGeometry args={[1.0, 0.25, 0.5]} />
        <Mat c="#27384f" />
      </mesh>
      <mesh position={[0, 0.02, 0]} scale={[1.45, 1.45, 1]}>
        <boxGeometry args={[0.96, 0.08, 4.6]} />
        <Mat c={azul} />
      </mesh>
      {[-1, 1].map((l) => (
        <group key={l}>
          {/* asa enflechada */}
          <mesh position={[l * 3.2, -0.25, -0.4]} rotation={[0, l * 0.5, l * 0.05]}>
            <boxGeometry args={[4.4, 0.18, 1.6]} />
            <Mat c={corpo} />
          </mesh>
          <mesh position={[l * 5.2, -0.1, -1.4]} rotation={[0, l * 0.5, 0]}>
            <boxGeometry args={[0.1, 0.7, 0.8]} />
            <Mat c={azul} />
          </mesh>
          {/* motor */}
          <mesh position={[l * 2.6, -0.95, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 1.6, 10]} />
            <Mat c="#d5dae0" />
          </mesh>
          <mesh position={[l * 2.6, -0.95, 1.32]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.06, 10]} />
            <Mat c="#2a2e35" />
          </mesh>
          <mesh position={[l * 2.6, -0.55, 0.5]}>
            <boxGeometry args={[0.15, 0.45, 0.9]} />
            <Mat c="#aeb4bc" />
          </mesh>
          {/* estabilizador horizontal */}
          <mesh position={[l * 1.3, 0.2, -4.0]} rotation={[0, l * 0.5, 0]}>
            <boxGeometry args={[2.0, 0.1, 0.9]} />
            <Mat c={corpo} />
          </mesh>
        </group>
      ))}
      {/* deriva (cauda vertical) */}
      <mesh position={[0, 1.2, -3.9]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.12, 1.9, 1.3]} />
        <Mat c={azul} />
      </mesh>
      {/* trem de pouso */}
      {[[0, 3], [-0.6, 0], [0.6, 0]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -0.55, z]}>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
          <Mat c="#2a2e35" />
        </mesh>
      ))}
    </group>
  );
};

/** Perfil de asa (corte) extrudado: grosso na frente (-x), fino atrás (+x), inclinado. 4 m de corda, 3 m de largura (z). */
const AsaCorte: React.FC<PropsModelo> = ({ cor, dados }) => {
  const geo = React.useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-2, 0);
    sh.quadraticCurveTo(-1.9, 0.62, -0.8, 0.62);
    sh.quadraticCurveTo(0.8, 0.5, 2, 0.04);
    sh.lineTo(2, -0.02);
    sh.quadraticCurveTo(0.6, -0.1, -0.8, -0.18);
    sh.quadraticCurveTo(-1.85, -0.2, -2, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -1.5);
    return g;
  }, []);
  const incl = Number(dados.inclinacao ?? 8);
  return (
    <group position={[0, 0.5, 0]} rotation={[0, 0, (-incl * Math.PI) / 180]}>
      <mesh geometry={geo} scale={[1, 1.6, 1]}>
        <Mat c={cor('principal', '#f4f6f8')} />
      </mesh>
    </group>
  );
};

/** Parte que o campo "cor" pinta em cada modelo (os outros usam "principal"). */
export const PARTE_PRINCIPAL: Record<string, string[]> = {
  casa: ['parede'],
  predio: ['parede'],
  arvore: ['copa'],
  rua: ['asfalto'],
  boneco: ['camisa'],
  caminhao: ['cabine', 'cacamba'],
};

/** Modelos que podem ir em "modelo" no palco3d. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODELOS: Record<string, React.FC<PropsModelo>> = {
  'caixa': Caixa,
  'cilindro': Cilindro,
  'esfera': Esfera,
  'cone': Cone,
  'plano': Plano,
  'pedra': Pedra,
  'seta': Seta,
  'casa': Casa,
  'predio': Predio,
  'arvore': Arvore,
  'rua': Rua,
  'poste': Poste,
  'nuvem': Nuvem,
  'boneco': Boneco,
  'carro': Carro,
  'caminhao': Caminhao,
  'aviao': Aviao,
  'asa-corte': AsaCorte,
};
