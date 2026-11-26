# Estúdio de vídeo

Transforma um `video.json` em um vídeo vertical pronto para o TikTok e os Reels: **1080x1920, 30 fps, H.264 + AAC**, com narração de voz de IA grátis, legenda sincronizada palavra por palavra e efeitos sonoros. Não coloca música: o som em alta é escolhido no app, na hora de postar.

No escritório, o estúdio é a sala do **Edu**. Quem decide como o vídeo fica é o **Roberto**, na "Direção do vídeo" do roteiro. O Edu traduz essa direção para o `video.json` e roda o estúdio. Ver `DECISOES.md`, seção 8.

| Arquivo | Para quem |
|---|---|
| `CATALOGO.md` | **Roberto** (e Edu): tudo o que dá para pedir (estilos, fontes, vozes, legendas, peças, sons) |
| `README.md` (este) | **Edu**: formato do `video.json` e comandos |
| `COMO-CRIAR-PECA.md` | **Edu**: como criar uma peça nova quando o roteiro pede algo fora do cardápio |
| `exemplos/` | `video.json` de exemplo (quiz, curiosidades, ache o diferente, isto ou aquilo) |

## Comandos

Rode dentro de `estudio/` (o caminho do vídeo pode ser relativo à pasta de onde você chamou).

```bash
npm run quadros -- ../crescimento/videos/<id>   # só as imagens paradas (rápido): confira antes
npm run render  -- ../crescimento/videos/<id>   # gera o video.mp4
```

- **Entrada:** a pasta do vídeo (o estúdio lê `video.json` dela) ou o caminho de um `.json` qualquer.
- **Saída:**
  - Com `<pasta>/video.json`, sai `<pasta>/video.mp4` e `<pasta>/quadros/`.
  - Com outro `.json`, sai em `estudio/saida/<nome>.mp4`.
- **Quadros:**
  - `quadros/quadros.png` é uma folha única com 1 quadro do gancho (0,6 s) e 1 quadro perto do fim de cada cena. Abra essa imagem para conferir.
  - `quadros/q01.png`, `q02.png`... são os quadros em tamanho real.
- **Opções:**
  - `--saida <arquivo.mp4>` escolhe onde salvar;
  - `--sem-cache` gera as vozes de novo (por padrão, a mesma fala com a mesma voz é reaproveitada).
- **`npm run vozes`** gera uma amostra de cada voz em `saida/vozes/`.
- **`npm run sons`** gera de novo os efeitos sonoros em `public/sons/`.

**Tempo no PC do dono:** cerca de 40 s para renderizar um vídeo de 30 s, mais uns 10 s de preparo. Os quadros levam cerca de 20 s.

### O que o comando faz

1. Confere o `video.json` e, se houver erro, explica em português qual cena e qual campo estão errados.
2. Gera a narração de cada cena com o `edge-tts` e anota o tempo de cada palavra.
3. Calcula a duração de cada cena: o maior entre a fala + `pausaDepois`, o `duracao` pedido e o que as peças precisam (cronômetro, revelação, contagem...).
4. Anima com o Remotion, mixa a narração e os efeitos e ajusta o volume ao padrão das redes (-14 LUFS).
5. Mostra o resumo: resolução, codecs, duração e tempo de renderização. Avisa se o vídeo ficou fora de **15 a 45 s**.

## Formato do `video.json`

```jsonc
{
  "titulo": "Quiz: capitais que todo mundo erra",      // só para referência
  "voz":     { "nome": "thalita", "velocidade": 8, "tom": 0 },
  "estilo":  { "atalho": "pop", "cores": { "fundo": "#7CF2C2" } },
  "legenda": { "modo": "karaoke", "palavrasPorVez": 3, "posicao": "baixo", "tamanho": 74 },
  "volumes": { "narracao": 1, "efeitos": 0.5 },        // opcional
  "cenas": [
    {
      "narracao": "Qual é a capital da Austrália?",
      "entrada": "deslizar",
      "pecas": [
        { "tipo": "etiqueta", "texto": "Pergunta 1 de 3" },
        { "tipo": "pergunta", "pergunta": "Capital da Austrália?", "alternativas": ["Sydney", "Camberra", "Melbourne"], "correta": 1 },
        { "tipo": "cronometro", "segundos": 3, "comecaEm": "fim-da-narracao" }
      ],
      "efeitos": [{ "som": "whoosh", "em": 0 }]
    }
  ]
}
```

### Nível do vídeo

| Campo | Obrigatório | O que é |
|---|---|---|
| `voz` | sim (se houver narração) | `nome` (ver CATALOGO), `velocidade` em % (`8` = 8% mais rápido) e `tom` em Hz (`-3` = mais grave) |
| `estilo` | sim | `atalho` (ponto de partida) + qualquer campo para mudar (`cores`, `fonte`, `fonteApoio`, `fundo`, `animacao`, `contorno`, `sombra`, `cantos`, `maiusculas`) |
| `legenda` | não | `modo`, `palavrasPorVez`, `posicao`, `tamanho`, `fonte`, `cor`, `corDestaque`, `caixa`, `maiusculas` |
| `volumes` | não | `narracao` (padrão 1) e `efeitos` (padrão 0,5) |
| `cenas` | sim | a lista de cenas, na ordem |

### Nível da cena

| Campo | O que é |
|---|---|
| `narracao` | o que a voz fala nesta cena. A legenda sai daqui. Escreva como se fala: números por extenso, sem emoji nem símbolo |
| `voz` | troca a voz só nesta cena (dá para fazer diálogo). Mesmo formato do nível do vídeo |
| `narracaoEm` | quando a fala começa dentro da cena (padrão 0,1 s) |
| `pausaDepois` | respiro depois da fala antes da próxima cena (padrão 0,35 s) |
| `duracao` | duração **mínima** em segundos. Obrigatória em cena sem narração |
| `entrada` | como a cena entra: `corte`, `deslizar`, `subir`, `zoom`, `piscar` ou `continua` (sem transição e sem animar as peças de novo, para "continuar" a cena anterior, como na revelação do quiz) |
| `estilo` | muda o visual só nesta cena. Para trocar só as cores: `{ "atalho": "pop", "cores": {...} }` |
| `pecas` | lista de peças, empilhadas de cima para baixo e centralizadas na área segura |
| `efeitos` | lista de `{ "som": "ding", "em": <tempo>, "volume": 0.8 }` |
| `palco3d` | cena inteira em 3D por trás das peças e da legenda (troca o fundo). Ver "Palco 3D" abaixo |

Toda peça aceita, além dos campos próprios (ver CATALOGO):

- `entraEm`: quando aparece;
- `saiEm`: quando some;
- `animacao`: troca o jeito de entrar só nesta peça.

### Tempos

Todo campo de tempo (`entraEm`, `saiEm`, `comecaEm`, `revelarEm`, `em`, `tempos`, `narracaoEm`) conta a partir do **começo da cena** e aceita:

| Valor | Quando |
|---|---|
| `2.5` | 2,5 s depois que a cena começa |
| `"inicio"` | no começo da cena |
| `"fim-da-narracao"` | quando a voz termina de falar |
| `"fim-do-cronometro"` | quando o cronômetro da cena chega a zero |
| `"palavra:Camberra"` | no momento em que a voz **começa** a dizer "Camberra" (ignora acento e maiúsculas) |
| `"palavra:a#2"` | na 2ª vez que a palavra aparece |
| `"fim-da-palavra:Camberra"` | quando a voz **termina** de dizer a palavra |
| `"fim-da-narracao+0.5"` | qualquer um dos anteriores com ajuste em segundos (`+0.5`, `-0.2`) |

Use `palavra:` para sincronizar com a fala: o item da lista aparece quando a voz o cita, o efeito toca na resposta, e assim por diante.

## Palco 3D

Uma cena com `palco3d` desenha um mundo 3D low-poly no lugar do fundo. As peças e a legenda continuam por cima. Exemplo completo: `exemplos/teste-3d.json`.

```jsonc
"palco3d": {
  "luz": "dia",                 // dia | tarde | noite | estudio
  "ceu": "#e3f3ff",             // opcional (cada luz tem o seu)
  "chao": "#c49a6c",            // cor do chão; false = sem chão
  "neblina": true,              // some ao longe (padrão: ligada)
  "deriva": 0.15,               // balanço leve da câmera (0 = parada)
  "tremor": { "de": "palavra:bum", "ate": "palavra:bum+0.4", "forca": 0.15 },
  "camera": [                   // pontos-chave; entre eles a câmera desliza
    { "em": 0, "posicao": [8, 6, 13], "olhaPara": [0, 1, 0], "fov": 50 },
    { "em": "palavra:asfalto", "posicao": [3, 2, 6], "suave": "suave" }
  ],
  "objetos": [
    { "modelo": "rua", "comprimento": 60, "cores": { "asfalto": "#8a6a4a" } },
    { "modelo": "boneco", "posicao": [-4, 0.2, 2], "rotacao": [0, 60, 0], "acao": "acenar" },
    { "modelo": "caminhao", "posicao": [1.4, 0, -14], "acao": "rodar",
      "movimentos": [{ "de": 0.3, "ate": "palavra:asfalto", "posicao": [1.4, 0, -1] }] },
    { "modelo": "pedra", "entraEm": "palavra:pedra", "entrada": "cair",
      "repetir": { "quantidade": [5, 1, 5], "espaco": 1.05, "variar": 0.6, "atraso": 0.04 } }
  ]
}
```

- **Medidas:** em metros, mais ou menos. Uma pessoa tem 1,9 m e uma casa tem 2 m de largura. O `y` é a altura, e todo modelo tem a base no chão: `y = 0` deixa ele em pé no chão.
- **Rotação:** em graus, `[x, y, z]`. O `y` gira o objeto em volta de si mesmo, como quem vira de lado.
- **Câmera:** `posicao` é onde ela está e `olhaPara` é o ponto que ela mira. O `fov` é o zoom: menor aproxima, maior abre. O padrão é 50. Na tela em pé, abra mais do que você abriria na horizontal.
- **Objeto:**
  - `modelo` (ver CATALOGO) e, opcionais, `posicao`, `rotacao`, `escala` (número ou `[x, y, z]`), `cor` (parte principal) e `cores` (`{ parte: cor }`);
  - `entraEm` + `entrada` (`crescer` é o padrão, `cair`, `subir` ou `nenhuma`); `saiEm` + `saida` (`encolher` é o padrão, ou `sumir`);
  - `movimentos`: lista de `{ de, ate, posicao?, rotacao?, escala?, opacidade?, suave? }`, aplicados em sequência;
  - `girar`: `[x, y, z]` em graus por segundo;
  - `acao`: depende do modelo (`acenar`, `andar`, `pular`, `rodar`);
  - `repetir`: `{ quantidade: [nx, ny, nz], espaco, variar: 0–1, atraso: s entre cópias }`;
  - `opacidade`, `brilho` (0–1, metálico), `brilhoProprio` (cor que acende) + `forcaBrilho`, `sombra: false`.
- **Tempos:** `em`, `de`, `ate`, `entraEm`, `saiEm` e os do `tremor` aceitam tudo da seção "Tempos" (`"palavra:X"`...). A cena dura pelo menos até o último deles.
- **Vários ângulos:** cada corte de câmera é uma cena nova com o mesmo cenário. Copie os `objetos` e mude a `camera`. Com `entrada: "corte"` a troca é seca, como na referência.
- **Desempenho:** 9 s de 3D renderizam em cerca de 15 s no PC do dono.

## Voz do Gemini (mais natural)

Além das vozes do `edge-tts`, o estúdio fala com as vozes do **Gemini**, do Google. São bem mais naturais e aceitam instrução de tom ("animada, como apresentadora de quiz").

**Configurar (uma vez, feito pelo dono):**

1. Entre em https://aistudio.google.com com a conta Google da marca e clique em **Get API key** → **Create API key**. É grátis e não pede cartão.
2. Em `estudio/`, copie `.env.exemplo` para `.env` e cole a chave em `GEMINI_API_KEY=`. O `.env` fica **fora do Git**. Nunca cole a chave em outro arquivo.
3. Teste com `npm.cmd run vozes -- --gemini Kore,Charon`: gera as amostras em `saida/vozes/gemini-*.mp3`, gastando 1 pedido do limite do dia por voz. Sem nomes, gera as vozes que o dono ainda não ouviu. No PowerShell use `npm.cmd` no lugar de `npm`, porque a trava de scripts do Windows bloqueia o `npm`.

**Status (25/11/2026):** a chave está configurada e funcionando. Vozes aprovadas pelo dono: Kore, Charon e Sadachbia (ver CATALOGO).

**Como funciona:**

- No `video.json`: `"voz": { "motor": "gemini", "nome": "Kore", "estilo": "animada, ritmo rápido, como apresentadora de quiz" }`. As vozes estão no CATALOGO.
- O estúdio manda **a narração de todas as cenas num pedido só** (1 pedido por vídeo e por voz). Assim a entonação fica contínua e o limite grátis rende.
- O **Whisper local** (grátis, roda no processador) acha o tempo de cada palavra e corta a fala em uma faixa por cena. A legenda usa o texto do roteiro, não o que o Whisper entendeu.
- A mesma narração com a mesma voz é reaproveitada (cache): rodar `quadros` e depois `render` gasta 1 pedido só.

**Limites e cuidados:**

- O limite grátis é baixo, 10 pedidos por dia (confirmado em 25/11/2026 pela mensagem de limite do Google; o modelo é o gemini-2.5-flash-tts). Isso dá para os 3 vídeos do dia e alguns refazeres.
- Se o limite acabar, aparece `Falha na voz do Gemini ... 429`. O Edu avisa o gerente, que decide entre esperar o dia virar e usar uma voz do `edge-tts`.
- Os termos de uso comercial do nível grátis do Gemini ainda **não foram confirmados**. Leia em https://ai.google.dev/gemini-api/terms antes de monetizar.
- Voz realista → rótulo de IA ao postar, como sempre.
- **Teste sem chave** (para desenvolvimento): `ESTUDIO_TESTE_SEM_GEMINI=1 npm run quadros -- ...` usa o `edge-tts` no lugar do Gemini, passando pelo mesmo corte com Whisper.

## Regras que o estúdio impõe

- **Zona segura:** as peças e a legenda ficam longe do topo (230 px), do rodapé (440 px) e da lateral direita (150 px), onde a interface do TikTok e dos Reels cobre a tela.
- **Sem marca d'água** e **sem música** no arquivo.
- **Duração:** avisa (não bloqueia) fora de 15 a 45 s.

## Técnico

- **Ferramentas:**
  - Remotion 4 (React): grátis para pessoa física e empresa de até 3 pessoas. Na primeira execução, baixa sozinho o Chrome Headless Shell (cerca de 130 MB).
  - `edge-tts` (Python): `pip install edge-tts`. É grátis, mas não oficial e pode parar de funcionar.
  - `faster-whisper` (Python): `pip install faster-whisper`. Só é usado com a voz do Gemini. Baixa o modelo `base` (cerca de 150 MB) na primeira vez.
  - `ffmpeg` e `ffprobe` no PATH.
- **Fontes:** Google Fonts, baixadas na hora de renderizar (precisa de internet, assim como a voz).
- **Emojis, ícones e sons:** Noto Color Emoji (Apache 2.0), Fluent Emoji 3D da Microsoft (MIT, via `@lobehub/fluent-emoji-3d`), Lucide (ISC) e os sons do Kenney (CC0). Os avisos de licença estão em `LICENCAS.md`.
- **Transições, formas e ruído:** pacotes oficiais `@remotion/transitions`, `@remotion/shapes` e `@remotion/noise`.
- **3D:** `@remotion/three` (oficial), `three` (MIT) e `@react-three/fiber` (MIT). O Chrome roda com `gl: "angle"` para ter WebGL sem tela. Regra do Remotion: toda animação 3D sai de `useCurrentFrame()`; `useFrame()` é proibido, porque faz o vídeo piscar.
- **Texto que não cabe:** as peças de título medem o texto e diminuem a fonte sozinhas, para nenhuma palavra sair da tela.
- **Pastas:**
  - `.trabalho/` guarda as vozes em cache e os arquivos temporários de cada vídeo, com o `props.json` final (útil para investigar erros);
  - `saida/` guarda os vídeos dos exemplos.

  As duas ficam fora do Git.
- **Código:**
  - `src/pecas/`: uma peça por arquivo, registrada em `src/pecas/index.ts`;
  - `src/estilos/`: `atalhos.json` (estilos prontos) e `fontes.ts`;
  - `src/Cena.tsx`, `src/Legenda.tsx` e `src/Fundo.tsx`: a montagem de cada cena;
  - `src/palco3d/`: o palco 3D (`Palco3D.tsx`), os modelos (`modelos.tsx`) e as contas de movimento (`anim.ts`);
  - `scripts/render.mjs`: o comando principal;
  - `scripts/tts.py`: a voz;
  - `scripts/gerar-sons.mjs`: os efeitos.

### Problemas comuns

| Mensagem | O que fazer |
|---|---|
| `ERRO NO video.json: ...` | corrigir o campo indicado, a mensagem já lista as opções válidas |
| `Falha na voz` | sem internet ou o serviço da Microsoft mudou. Tente de novo; se continuar, avise o dono |
| `delayRender ... Fetching ... font` | internet lenta para baixar a fonte. Rode de novo |
| Quadro com `PEÇA DESCONHECIDA` ou `ÍCONE NÃO EXISTE` | o nome está errado: confira no CATALOGO (ícones em lucide.dev/icons) |
