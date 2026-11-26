# Plano do estúdio de vídeo (v1)

> **Status (25/11/2026):** aprovado pelo dono e construído. Testado com imagens paradas e um vídeo interno: 29 s de vídeo em 40 s de renderização. Os vídeos de teste foram aprovados pelo dono, com ressalvas de ritmo e fundo anotadas em `conhecimento/preferencias-do-dono.md`. Depois vieram as melhorias: emoji 3D, transições, sons do Kenney e voz do Gemini. Como usar: `README.md`. Cardápio: `CATALOGO.md`.

Combinado no brainstorm de 25/11/2026:

- **O Roberto decide tudo** sobre o vídeo: visual, voz, peças, efeitos.
- **O Edu executa**, operando o estúdio.
- **O estúdio é só a ferramenta.** Não tem nada fixo nem visual padrão da conta.
- **Opção 2:** o estúdio vem com peças prontas, e o Edu cria peças novas quando o roteiro pedir algo que ainda não existe.

## 1. Como funciona

```
Roberto escreve roteiro.md
   (história, falas e a "Direção do vídeo", usando os nomes do CATALOGO.md)
            ↓  o dono aprova lendo o roteiro.md
Edu traduz a direção para video.json   (as instruções exatas para a máquina)
            ↓
npm run quadros  → 4 a 6 imagens paradas do vídeo, para o Edu conferir antes
npm run render   → video.mp4 na pasta do vídeo
```

O que o estúdio faz sozinho no `npm run render`:

1. Confere o `video.json` e aponta o erro em português, se houver.
2. Gera a narração de cada cena com a voz pedida (`edge-tts`, grátis) e anota o momento de cada palavra.
3. Calcula a duração de cada cena: o tempo da fala, ou o tempo mínimo pedido, como o de um cronômetro.
4. Anima as cenas (Remotion) e põe a legenda sincronizada e os efeitos sonoros.
5. Exporta `video.mp4`: 1080x1920, 30 fps, H.264 + AAC. Avisa se o vídeo ficar fora de 15 a 45 s.

O arquivo final tem **narração + efeitos e nenhuma música**. O som em alta entra pelo app.

## 2. O cardápio do Roberto (`estudio/CATALOGO.md`)

Um arquivo curto com tudo o que ele pode pedir. **Não existe padrão**: em cada vídeo ele escolhe.

| O quê | Opções na v1 |
|---|---|
| **Voz** | Francisca, Antonio ou Thalita. Também velocidade e tom, por vídeo ou por cena (dá para fazer diálogo com 2 vozes). Vou testar vozes multilíngues que falam português para aumentar a lista |
| **Visual** | cores (fundo, texto, destaques), fonte (uns 10 grátis, todos com acento), fundo (chapado, degradê, bolinhas, listras, formas flutuando, grade), jeito de animar (pop, deslizar, zoom, máquina de escrever). Atalhos prontos ("neon", "pop", "editorial", "cartoon") que ele pode alterar à vontade |
| **Legenda** | palavra acesa (karaokê), 1 a 3 palavras por vez ou frase inteira; posição, cor e caixa |
| **Peças de cena** | texto de impacto, pergunta + alternativas, cronômetro (círculo ou barra), revelação da resposta, número gigante (contando), lista que vai aparecendo, grade de emojis (ache o diferente), sequência de emojis (adivinhe), comparação lado a lado (isto ou aquilo), emoji ou ícone grande, chamada final ("comenta…") |
| **Efeitos sonoros** | tique, ding (acerto), erro, whoosh, pop, suspense. Gerados no próprio código, sem direitos autorais |
| **Imagens** | emojis (Noto Emoji, licença livre) e ícones (Lucide, licença livre). Sem banco de fotos na v1 |

**O estúdio não deixa escolher** só uma coisa: a **zona segura**. O texto nunca encosta no topo, no rodapé nem na lateral direita, onde a interface do TikTok e do Reels cobre a tela.

## 3. Peças novas (o Edu cria)

- Se o roteiro pedir algo fora do cardápio, o Edu programa a peça seguindo um guia (`estudio/COMO-CRIAR-PECA.md`).
- Ele confere a peça pelas imagens paradas e a acrescenta ao `CATALOGO.md`. A partir daí, o Roberto pode pedi-la de novo.
- Se não der certo em 2 tentativas, o Edu para e avisa o gerente, em vez de entregar um vídeo quebrado.

## 4. Mudanças nos agentes

- **Roberto** (`roteirista-virais.md`): lê o `CATALOGO.md` e acrescenta ao roteiro a seção **"Direção do vídeo"**, com estilo, voz, legenda e, para cada cena, a peça, os efeitos e o tempo. É escrita em palavras, para você conseguir ler e aprovar.
- **Edu** (`editor-virais.md`): o estado do estúdio passa para PRONTO, e a seção "Como fabricar" ganha o passo a passo real: traduzir para `video.json`, rodar os quadros, conferir, renderizar e marcar `pronto`.

## 5. Pastas

```
estudio/
  README.md               formato do video.json, documentado
  CATALOGO.md             o cardápio do Roberto
  COMO-CRIAR-PECA.md      o guia do Edu
  src/pecas/              uma peça por arquivo
  src/estilos/            fontes, fundos e atalhos de visual
  sons/                   efeitos sonoros gerados
  exemplos/               2 ou 3 video.json de exemplo
```

`node_modules`, os arquivos temporários e qualquer vídeo ficam fora do Git.

## 6. Fora da v1 (dá para acrescentar depois)

Banco de fotos (Pexels/Pixabay, exige chave grátis), música de fundo, Whisper para legenda e voz local (Piper) como reserva caso o `edge-tts` pare de funcionar.

## 7. Riscos

- **`edge-tts`** é grátis mas não oficial e pode quebrar um dia. A reserva é o Piper (sem internet, voz mais robótica).
- **Remotion** é grátis para pessoa física e empresa de até 3 pessoas. Na primeira renderização, baixa sozinho um Chrome interno de cerca de 100 MB.
- **Tempo de renderização no seu PC:** estimo de 1 a 3 minutos por vídeo de 30 s. Medir na construção.
- **Só 3 vozes em português:** alternar entre elas ajuda, mas o leque é pequeno.

## 8. Quando estiver pronto

1. Eu construo e testo com imagens paradas.
2. **Só com o seu ok**, gero 2 ou 3 vídeos de teste a partir de roteiros de exemplo, com visual e voz diferentes.
3. Você aprova ou dá o retorno, e eu ajusto.
4. Por fim, atualizo o Roberto e o Edu e deixo uma nota para as outras sessões.
