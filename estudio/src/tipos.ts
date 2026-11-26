// Tipos dos dados que chegam ao vídeo, já processados pelo scripts/render.mjs
// (tempos em segundos, contados do começo da cena).

export type Cores = {
  fundo: string;
  fundo2: string;
  texto: string;
  destaque: string;
  destaque2: string;
  contorno: string;
  cartao: string;
  cartaoTexto: string;
};

export type TipoFundo =
  | 'chapado'
  | 'degrade'
  | 'bolinhas'
  | 'listras'
  | 'formas'
  | 'grade'
  | 'raios'
  | 'emojis'
  | 'manchas';

export type Animacao = 'pop' | 'deslizar' | 'subir' | 'zoom' | 'maquina' | 'girar';

export type Estilo = {
  cores: Cores;
  fonte: string;
  fonteApoio: string;
  fundo: { tipo: TipoFundo; movimento?: boolean; emoji?: string };
  animacao: Animacao;
  contorno: number;
  sombra: 'dura' | 'suave' | 'nenhuma';
  cantos: number;
  maiusculas: boolean;
  emoji?: 'plano' | '3d';
};

export type Legenda = {
  modo: 'karaoke' | 'palavra' | 'frase' | 'desligada';
  palavrasPorVez: number;
  posicao: 'baixo' | 'cima' | 'meio';
  fonte?: string;
  tamanho: number;
  cor?: string;
  corDestaque?: string;
  caixa: boolean;
  maiusculas: boolean;
  contorno?: number; // px do contorno da letra (0 = sem contorno); padrão tamanho/9
  corContorno?: string; // padrão preto
};

export type Palavra = { texto: string; inicio: number; fim: number };

export type Peca = { tipo: string; entraEm?: number; saiEm?: number; [campo: string]: unknown };

type V3 = [number, number, number];

/** Um movimento de objeto 3D: de "de" até "ate" (s), indo para os valores dados. */
export type Movimento3D = { de: number; ate: number; posicao?: V3; rotacao?: V3; escala?: number | V3; opacidade?: number; suave?: string };

export type Objeto3D = {
  modelo: string;
  posicao?: V3;
  rotacao?: V3; // graus
  escala?: number | V3;
  cor?: string;
  cores?: Record<string, string>;
  entraEm?: number;
  entrada?: 'crescer' | 'cair' | 'subir' | 'nenhuma';
  saiEm?: number;
  saida?: 'encolher' | 'sumir';
  movimentos?: Movimento3D[];
  girar?: V3; // graus por segundo
  acao?: string;
  repetir?: { quantidade: number | V3; espaco?: number | V3; variar?: number; atraso?: number };
  sombra?: boolean;
  opacidade?: number;
  brilho?: number;
  brilhoProprio?: string;
  forcaBrilho?: number;
  [campo: string]: unknown;
};

export type Palco3D = {
  luz?: 'dia' | 'tarde' | 'noite' | 'estudio';
  ceu?: string;
  chao?: string | false;
  neblina?: boolean;
  deriva?: number;
  tremor?: { de: number; ate: number; forca?: number };
  camera?: Array<{ em: number; posicao?: V3; olhaPara?: V3; fov?: number; suave?: string }>;
  objetos?: Objeto3D[];
};

export type Cena = {
  palco3d?: Palco3D;
  inicio: number;
  duracao: number;
  entrada: string; // ver TRANSICOES em Video.tsx e ENTRADAS em render.mjs
  estilo: Estilo;
  pecas: Peca[];
  narracao?: { arquivo: string; em: number; duracao: number; palavras: Palavra[] };
  efeitos: { som: string; em: number; volume?: number }[];
};

export type PropsVideo = {
  legenda: Legenda;
  volumes: { narracao: number; efeitos: number };
  cenas: Cena[];
  duracaoTotal: number;
  emoji3d?: Record<string, string>; // emoji → arquivo em public (emojis 3D disponíveis)
};

// O que toda peça recebe
export type PropsPeca<D = Record<string, unknown>> = {
  dados: D & Peca;
  estilo: Estilo;
  duracaoCena: number; // s
  volumeEfeitos: number;
  continua: boolean; // a cena continua a anterior: nada de animação de entrada
};
