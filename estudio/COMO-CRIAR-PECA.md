# Como criar uma peça nova (guia do Edu)

Use este guia quando o roteiro pedir algo que **não está no `CATALOGO.md`**: uma roleta girando, um mapa com alfinete, uma balança, um placar diferente...

Antes, veja se dá para resolver **combinando peças que já existem**, como `texto` + `emoji` + `cronometro`. Se der, não crie nada.

## Passo a passo

1. **Copie a peça mais parecida** em `src/pecas/` para `src/pecas/<nome-novo>.tsx`. O nome vai em minúsculas e com hífen, por exemplo `roleta`.

2. **Escreva o componente.** Ele recebe:

   ```tsx
   import type { PropsPeca } from '../tipos';
   type Dados = { itens: string[]; giraEm?: number };   // os campos que o Roberto vai usar

   export const Roleta: React.FC<PropsPeca<Dados>> = ({ dados, estilo, duracaoCena, volumeEfeitos, continua }) => { ... }
   ```

   - **`dados`:** os campos da peça no `video.json`. Os tempos já chegam em segundos, contados do começo da cena.
   - **`estilo`:** use `estilo.cores.*`, `fonte(estilo.fonte)` e `estiloCartao(estilo)` / `estiloTitulo(estilo)` de `../util`. **Nunca fixe cor nem fonte**: a peça tem que funcionar em qualquer visual.
   - **`continua`:** `true` quando a cena continua a anterior. Nesse caso, mostre tudo já no lugar, sem animar a entrada.
   - **Para animar:** `useCurrentFrame()` e `useVideoConfig()` do `remotion`, com `spring`/`interpolate`. Veja `pergunta.tsx` e `cronometro.tsx`.
   - **Som:** `<Sequence from={...} layout="none"><Audio src={staticFile('sons/pop.wav')} volume={volumeEfeitos} /></Sequence>`.
   - **Emojis:** use `<EmojiArte emoji="🐙" tamanho={200} estilo={estilo} />` (de `../EmojiArte`). Ele mostra o emoji 3D quando o estilo pede `"emoji": "3d"`.
   - **Ícones:** `lucide-react`.
   - **Sem nada pago** e sem imagem ou fonte baixada de site sem licença livre.

3. **Registre a peça** em `src/pecas/index.ts`:
   - o `import`;
   - uma linha no `REGISTRO` **neste formato exato**, porque o `render.mjs` lê essa lista:

   ```ts
     'roleta': Roleta,
   ```

4. **Se a peça usa um tempo novo** (por exemplo `giraEm`), o `render.mjs` precisa saber, para converter `"palavra:..."` em segundos. Acrescente o nome em `CAMPOS_TEMPO`, no topo de `scripts/render.mjs`.
   - Se a peça precisa de tempo mínimo na cena, acrescente a regra em `montar()`, onde fica `precisa = Math.max(...)`.

5. **Teste com um `.json` pequeno**, só com essa peça, em 2 visuais diferentes (por exemplo `pop` e `neon`):

   ```bash
   npx tsc -p .                       # confere os tipos
   npm run quadros -- caminho/teste.json
   ```

   Abra o `quadros.png` e confira:
   - não há texto cortado;
   - nada passa da zona segura;
   - a peça fica legível nos dois visuais.

6. **Documente** no `CATALOGO.md`, na tabela de peças, com: nome, para quê e campos.

## Modelo 3D novo

Quando o roteiro pede no palco 3D um objeto que não está no cardápio, como um micro-ondas, uma asa ou uma betoneira:

1. **Monte com formas simples** em `src/palco3d/modelos.tsx`. Use `mesh` + `boxGeometry`, `cylinderGeometry`, `icosahedronGeometry` ou `coneGeometry`, sempre com `<Mat c={cor('parte', '#padrao')} />`. O visual low-poly vem daí: faces chapadas e pouco detalhe. Copie `Caminhao` ou `Casa`.
2. **A base fica no chão:** a origem (0, 0, 0) é o centro da base do objeto.
3. **Medidas reais aproximadas** em metros: pessoa com 1,9 m, casa com 2 m.
4. **Animação** (porta abrindo, rodas girando) só pode usar `t`, os segundos da cena, e `acao`. Nunca use `useFrame`.
5. **Registre** no `MODELOS`, no fim do arquivo, no formato `'nome': Componente,`. Se `cor` deve pintar uma parte que não se chama `principal`, acrescente em `PARTE_PRINCIPAL`.
6. **Teste** com um `.json` pequeno (`npm run quadros`) e veja de 2 ângulos de câmera.
7. **Documente** na tabela do palco 3D no `CATALOGO.md`.

Consulta técnica de three.js: `.claude/skills/threejs-*/SKILL.md` (MIT, de github.com/cloudai-x/threejs-skills). Leia só a seção que precisar.

## Se não der certo

Duas tentativas sem resultado bom: **pare**. Mande `status editor-virais erro "peça <nome>: <motivo>"` e avise o gerente. Não entregue vídeo com peça quebrada.

## Mudanças maiores

Visual novo (atalho), fonte nova e som novo também dá para acrescentar:

- **atalho:** `src/estilos/atalhos.json`;
- **fonte:** `src/estilos/fontes.ts`;
- **som:** `scripts/gerar-sons.mjs` e depois `npm run sons`; acrescente o nome também na lista `SONS` do `render.mjs`.

Sempre anote no `CATALOGO.md`.
