# Cardápio do estúdio

Tudo o que o Roberto pode pedir na "Direção do vídeo". **Nada aqui é padrão da conta:** em cada vídeo, escolha o que combina com o tema e com o formato do dia, e varie entre os vídeos.

Se precisar de algo que não está aqui (uma roleta, um mapa, um placar diferente), **descreva na direção**: o Edu cria a peça nova, e ela entra neste cardápio.

Os nomes estão `entre crases` assim como vão no `video.json`. O formato completo está no `README.md`.

## Voz

| Nome | Voz |
|---|---|
| Nome | Voz | O dono achou |
|---|---|---|
| `francisca` | feminina, brasileira, simpática | **boa** (a +8%) |
| `antonio` | masculina, brasileira, clara | ainda não avaliou |
| `thalita` | feminina, brasileira, mais jovem | "muita cara de IA": evite |
| `andrew`, `brian`, `remy`, `giuseppe` | masculinas multilíngues (falam português, podem ter sotaque leve) | médias |
| `ava` | feminina multilíngue | média |

- **Velocidade:** em %, por exemplo `8` (mais rápida) ou `-5`. Para TikTok, de 5 a 15 costuma soar natural.
- **Tom:** em Hz, por exemplo `-3` (mais grave) ou `4` (mais aguda).
- Dá para **trocar a voz numa cena** (pergunta e resposta com duas vozes, por exemplo).
- Emma, William e Vivienne foram reprovadas pelo dono e saíram do estúdio. As amostras saem com `npm.cmd run vozes`.

**Vozes do Gemini** (mais naturais; precisam da chave configurada, ver README):

```json
"voz": { "motor": "gemini", "nome": "Kore", "estilo": "animada, ritmo rápido, como apresentadora de quiz" }
```

- O `estilo` é uma instrução livre de tom, por exemplo:
  - "misteriosa e baixinho, como quem conta um segredo";
  - "empolgada, como narrador de futebol";
  - "calma e simpática".
- Velocidade e tom em número não valem para o Gemini: descreva no `estilo`.
- Use **uma voz do Gemini por vídeo**. Cada voz diferente gasta 1 pedido do limite do dia (10 por dia).

O dono ouviu as amostras em 25/11/2026:

| Avaliação | Vozes | Uso |
|---|---|---|
| **Boas** | `Kore` (firme), `Charon` (informativa), `Sadachbia` (viva) | use à vontade, alternando entre elas |
| Médias | `Zephyr` (brilhante), `Leda` (jovem), `Fenrir` (empolgada), `Achird` (simpática), `Aoede` (leve) | de vez em quando, se combinar muito com o tom |
| **Vetada** | `Puck` | não use: o estúdio recusa |

Ainda não testadas: Laomedeia, Sulafat, Zubenelgenubi, Callirrhoe, Iapetus, Algieba, Gacrux, Schedar, Achernar e outras. Só use depois que o dono ouvir a amostra (`npm.cmd run vozes -- --gemini Nome1,Nome2`).

## Visual (`estilo`)

**Atalhos**: pontos de partida. Mude o que quiser por cima.

| Atalho | Cara | Fonte do título / de apoio |
|---|---|---|
| `pop` | fundo amarelo com bolinhas, cartões brancos com sombra dura, divertido | Baloo 2 / Baloo 2 |
| `neon` | escuro com grade, lima e rosa, cara de game show | Anton / Archivo Black |
| `editorial` | creme e preto, uma cor de destaque, cara de revista | DM Serif Display / Space Grotesk |
| `cartoon` | azul com raios girando, contorno grosso, maiúsculas | Luckiest Guy / Fredoka |
| `giz` | quadro-negro verde, letra de giz, efeito máquina de escrever | Permanent Marker / Caveat |
| `pixel` | videogame antigo, fonte pixelada | Press Start 2P / Press Start 2P |
| `doce` | rosa e azul pastel, formas flutuando, cantos bem redondos | Fredoka / Fredoka |
| `impacto` | preto, branco e vermelho, letras altas, sério e direto | Bebas Neue / Oswald |

**O que dá para mudar:**

| Campo | Opções |
|---|---|
| `cores` | `fundo`, `fundo2` (o desenho do fundo), `texto`, `destaque` (palavra em destaque, resposta certa), `destaque2` (detalhes, letras A/B/C), `contorno` (contornos e sombras), `cartao` (fundo dos cartões), `cartaoTexto`. Use cores em hex: `#FF4F3D` |
| `fonte` (títulos) e `fonteApoio` (cartões, listas) | Anton, Archivo Black, Baloo 2, Bangers, Bebas Neue, Bungee, Caveat, DM Serif Display, Fredoka, Inter, Lilita One, Luckiest Guy, Montserrat, Oswald, Permanent Marker, Playfair Display, Poppins, Press Start 2P, Righteous, Rubik, Space Grotesk |
| `fundo.tipo` | `chapado`, `degrade`, `bolinhas`, `listras`, `grade`, `raios` (girando), `formas` (flutuando), `emojis` (um emoji flutuando ao fundo, escolhido em `fundo.emoji`), `manchas` (manchas de cor macias que se mexem devagar) |
| `fundo.movimento` | `true` (o fundo se mexe devagar) ou `false` |
| `animacao` (como as peças entram) | `pop`, `deslizar`, `subir`, `zoom`, `girar`, `maquina` (máquina de escrever nos textos) |
| `contorno` | espessura do contorno das letras do título, em px (`0` = sem contorno) |
| `sombra` | `dura` (sombra chapada, estilo adesivo), `suave` ou `nenhuma` |
| `cantos` | arredondamento dos cartões, em px (`0` = quadrado) |
| `maiusculas` | `true` deixa os títulos em CAIXA ALTA |
| `emoji` | `plano` (emoji comum, padrão) ou `3d` (emoji 3D da Microsoft, com volume e brilho; vale para os emojis das peças e do fundo, não para emoji no meio do texto) |

- **Cada cena pode ter o próprio visual.** Por exemplo, trocar a cor do fundo a cada pergunta ou mudar o atalho inteiro numa cena.
- **Transição de cena** (`entrada`):
  - **A cena entra sozinha:** `corte`, `deslizar`, `subir`, `zoom`, `piscar` (flash branco) ou `continua` (sem transição, para a revelação ficar no mesmo lugar).
  - **Transições de cinema, em que a cena nova entra por cima da anterior** (0,4 s): `cortina`, `cortina-diagonal`, `empurrar`, `empurrar-cima`, `virar`, `cubo` (gira como um cubo), `relogio` (ponteiro de relógio), `iris` (círculo abrindo), `dissolver` e `soco` (empurrão com flash).

## Legenda

A legenda sai da narração, sincronizada palavra por palavra.

| Campo | Opções |
|---|---|
| `modo` | `karaoke` (grupo de palavras com a palavra falada acesa), `palavra` (uma palavra por vez, grande), `frase` (a frase inteira, acendendo conforme é falada), `desligada` |
| `palavrasPorVez` | no karaokê, de 1 a 5 (padrão 3) |
| `posicao` | `baixo`, `cima` ou `meio` (por cima das peças) |
| `tamanho` | em px (60 a 100 costuma ficar bom) |
| `caixa` | `true` põe a legenda dentro de um cartão. `false` usa letra branca com contorno preto |
| `contorno`, `corContorno` | contorno da letra em px (`0` = sem contorno, bom para letra escura em fundo claro) |
| `fonte`, `cor`, `corDestaque`, `maiusculas` | como no visual |

## Peças

Cada cena empilha peças de cima para baixo. Toda peça aceita:

- `entraEm`: quando aparece;
- `saiEm`: quando some;
- `animacao`: muda o jeito de entrar.

Numa cena `continua`, as peças já ficam no lugar, menos as que têm `entraEm` (entram nesse momento).

Os tempos podem ser segundos ou momentos da fala: `"fim-da-narracao"`, `"palavra:Camberra"`, `"fim-do-cronometro"`, com ajuste opcional (`"palavra:três+0.2"`).

| Peça | Para quê | Campos |
|---|---|---|
| `texto` | frase de impacto, título | `texto`, `destaque` (palavras coloridas; `"barulho#2"` marca só a 2ª vez), `destaque2` (palavras na cor destaque2), `corDestaque`, `tamanho` (`p`, `m`, `g`, `gg` ou px), `cor`, `apoio` (usa a fonte de apoio), `caixa` (dentro de um cartão), `maquina` (efeito de digitação) |
| `etiqueta` | selo pequeno: "Pergunta 1 de 3", "Fato 2" | `texto`, `cor`, `corTexto` |
| `pergunta` | quiz com alternativas | `pergunta`, `destaque`, `alternativas` (lista), `correta` (posição começando em 0), `revelarEm` (a certa fica colorida com ✓ e as outras apagam com ✗), `letras` (A/B/C, padrão sim), `intervalo` |
| `cronometro` | contagem regressiva com tique a cada segundo | `segundos`, `comecaEm` (ex.: `"fim-da-narracao"`), `forma` (`circulo`, `barra`, `numero`), `som` (`tique`, `toque`, `nenhum`), `tamanho` |
| `numero` | número gigante contando até o valor | `ate`, `de`, `prefixo`, `sufixo` (ex.: `%`), `legenda` (texto embaixo), `comecaEm`, `duracaoContagem`, `casas` (decimais), `tamanho`, `cor` |
| `lista` | itens aparecendo um a um (top 3, passo a passo) | `itens` (texto ou `{ "emoji", "texto" }`), `tempos` (quando cada um aparece; use `"palavra:..."`), `intervalo`, `numerada`, `destacarAtual`, `som` |
| `grade-emojis` | "ache o diferente" | `emoji`, `diferente`, `linhas`, `colunas`, `posicao` (onde fica o diferente, começando em 0), `revelarEm` (circula o diferente) |
| `emojis` | sequência de emojis ("adivinhe o filme") | `emojis` (lista), `tamanho`, `tempos`, `intervalo`, `separador` (ex.: `+`, `ou`, `VS`), `som` |
| `comparacao` | isto ou aquilo, A contra B | `a` e `b` (`{ "emoji", "texto" }`), `meio` (padrão "ou"), `porcentagens` (ex.: `[58, 42]`), `revelarEm` (as barras enchem) |
| `emoji` | um emoji grande | `emoji`, `tamanho`, `movimento` (`flutuar`, `pulsar`, `girar`, `tremer`, `nenhum`) |
| `icone` | ícone desenhado (coração, raio, relógio...) | `nome` (lista em lucide.dev/icons, ex.: `heart`, `alarm-clock`), `tamanho`, `cor`, `movimento`, `espessura` |
| `chamada` | fechamento: "comenta quantas acertou" | `texto`, `emoji` (padrão 👇; `""` para nenhum), `subtexto`, `destaque` |
| `selo` | estrela estourada com texto, girando ("Você sabia?", "1%", "TOP 3") | `texto` (curto), `escalaTexto` (tamanho fixo, com quebra de linha; use em textos de 2 palavras), `subtexto`, `pontas`, `tamanho`, `cor`, `corTexto`, `girar` |
| `asa` | asa de avião em corte com linhas de ar ("Como funciona": sustentação) | `fases` e `tempos` (a fase `i` começa em `tempos[i]`, aceita `"palavra:..."`), `escala`. Fases: `fluxo` (linhas de ar), `curva` (as de trás curvam para baixo), `menos` ("−" em cima), `pressao` ("−" e "+", em cima o ar corre mais rápido), `baixo` (setas azuis para baixo atrás da asa), `forca` (e seta laranja para cima), `vacuo` (sem ar, asa parada). Usa `destaque` (ar) e `destaque2` (força) |
| `prato` | prato visto de cima com mapa de calor (micro-ondas) | `fases`, `tempos`, `escala`, `duracaoConducao`. Fases: `frio-quente` (borda `destaque` com vapor, centro `destaque2`), `ondas` (ondas entram e param perto da borda), `conducao` (o calor avança ao centro), `girando` (prato gira sob pontos quentes fixos) |
| `molecula` | molécula de água (O vermelho, 2 H brancos) | `tamanho` (fator), `chacoalhaEm`, `calorEm` (aparecem linhas de calor) |
| `forno` | caixa do forno de frente, com ondas batendo e pontos quentes e frios | `escala`, `ondasEm`, `quentesEm` (`destaque`), `friosEm` (`destaque2`) |
| `ondas` | ondas que se anulam (cancelamento de ruído) | `fases`, `tempos`, `escala`. Fases: `onda`, `invertida` (aparece a espelhada), `sobe` e `desce` (marcador com seta), `soma` (se aproximam), `reta` (viram linha reta cinza e o movimento para), `dupla` (grave larga e lenta + aguda curtinha e rápida, com 🚗 e 🔔; `emojiGrave`, `emojiAgudo`), `dupla-reta` (a grave vira reta, a aguda só diminui) |
| `espaco` | respiro entre peças | `altura` (px) |

## Efeitos sonoros

Sem direitos autorais: os da primeira tabela foram gerados no próprio código, e os da segunda são do Kenney, de domínio público (CC0). Na cena: `"efeitos": [{ "som": "ding", "em": "palavra:Camberra" }]`.

| Som | Bom para |
|---|---|
| `whoosh` | troca de cena, algo entrando rápido |
| `pop` | item aparecendo (a `lista` e os `emojis` já tocam sozinhos) |
| `tique` / `toque` | relógio (o `cronometro` já toca sozinho) |
| `ding` | resposta revelada |
| `acerto` | resposta certa (duas notas subindo) |
| `erro` | resposta errada, pegadinha |
| `tambor` | rufar antes de revelar |
| `suspense` | gancho misterioso (pulso grave, 2 s) |
| `brilho` | número grande, conquista |

**Sons do Kenney:** gravados, mais "de verdade" que os sintetizados.

| Som | Bom para |
|---|---|
| `confirma`, `confirma2` | resposta certa, item confirmado |
| `errado`, `errado2` | resposta errada |
| `pergunta` | abrir uma pergunta |
| `vidro` | revelação delicada, brilho |
| `gota` | item caindo no lugar |
| `abre` / `fecha` | algo aparecendo / sumindo |
| `bong` | batida curta, destaque |
| `dedilhado` | toque leve, item de lista |
| `selecao` | escolha, marcação |
| `rolar` | lista rolando, roleta |
| `interruptor` | virada, troca |
| `clique`, `tic-tac`, `tic-tac2` | cliques e tique de relógio curtinhos (no cronômetro: `"som": "tic-tac"`) |
| `arranhao` | corte brusco, "pera aí" |

## Palco 3D (cena inteira em 3D)

Para o formato **"Como funciona"** e qualquer cena que precise de "mundo": cidade, rua, máquina, corte em camadas. O visual é **3D low-poly**, feito de formas simples, com sombra, luz e câmera que se move. As peças 2D, como `etiqueta` e `texto`, continuam por cima, e a legenda também. Formato completo no `README.md`, seção "Palco 3D". Exemplo: `exemplos/teste-3d.json`.

**Como pedir na direção:** descreva o que aparece, de onde a câmera olha e como ela se move. Por exemplo: "rua de terra vista do alto; o caminhão-tanque entra pela esquerda; a câmera desce até o asfalto". Diga também em que palavra da fala cada coisa acontece. O Edu traduz isso para posições.

| Modelo | O que é | Partes que dá para pintar (`cores`) |
|---|---|---|
| `caixa`, `cilindro`, `esfera`, `cone`, `plano` | formas básicas de tamanho 1. Mude o tamanho com `escala` (por exemplo `[4, 0.3, 2]` para uma camada) | `principal` |
| `pedra` | pedra facetada | `principal` |
| `seta` | seta 3D, aponta para cima (gire com `rotacao`) | `principal` |
| `casa` | casa com telhado, porta e janelas | `parede`, `telhado`, `porta`, `janela` |
| `predio` | prédio (`andares`) | `parede`, `janela` |
| `arvore` | árvore low-poly | `tronco`, `copa` |
| `rua` | rua com faixas e calçadas (`comprimento`, `largura`, `faixas: false`, `calcadas: false`) | `asfalto`, `faixa`, `borda`, `calcada` |
| `poste` | poste com luminária | `principal`, `lampada` |
| `nuvem` | nuvem | `principal` |
| `boneco` | pessoa simples. `acao`: `acenar`, `andar`, `pular` | `camisa`, `calca`, `pele`, `cabelo` |
| `carro` | carro. `acao: "rodar"` gira as rodas | `principal`, `vidro` |
| `caminhao` | caminhão de caçamba (`carga: true` põe pedras) | `cabine`, `cacamba`, `vidro`, `carga` |
| `aviao` | avião de passageiros, ~9 m, nariz para +z (gire com `rotacao`), com 2 motores sob as asas. **Defeito conhecido:** as asas aparecem soltas da fuselagem; corrigir antes de usar de novo | `principal`, `detalhe` |
| `asa-corte` | perfil de asa extrudado (corda 4 m, grosso na frente = -x, fino atrás), inclinada (`inclinacao` em graus, padrão 8) | `principal` |

O que dá para fazer com qualquer objeto:
- **aparecer** num momento (`entraEm`), crescendo, caindo do alto ou subindo do chão;
- **sair** (`saiEm`);
- **mover, girar e mudar de tamanho** em etapas (`movimentos`), com curva `suave`, `linear`, `rapido`, `acelera` ou `mola`;
- **girar sem parar** (`girar`);
- **ficar transparente** (`opacidade`) ou **brilhar** (`brilhoProprio`: uma cor), para mostrar algo quente ou ligado;
- **repetir** num bloco (`repetir`): pedras, tijolos, uma fileira de casas. Pode variar posição e tamanho e aparecer em cascata.

Luz: `dia`, `tarde`, `noite` ou `estudio` (fundo liso, bom para close de objeto). A câmera nunca fica parada: tem uma deriva leve, que dá para desligar.

Faltou um modelo, como um micro-ondas, uma asa ou uma usina? **Descreva na direção.** O Edu monta o modelo com formas simples e ele entra nesta tabela (`COMO-CRIAR-PECA.md`, seção "Modelo 3D novo").

## Fora do cardápio, por enquanto

Fotos de banco de imagens, música de fundo, vídeo gravado e pessoa realista. Se um roteiro precisar disso, fale com o gerente.
