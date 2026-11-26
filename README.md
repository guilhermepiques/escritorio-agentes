# Escritório

Uma "empresa" de agentes de IA feita com o [Claude Code](https://claude.com/claude-code): uma equipe de agentes produz vídeos curtos verticais (pauta, roteiro, legenda, revisão e vídeo final), e um escritório em pixel art mostra cada um trabalhando ao vivo.

O dono não aparece nos vídeos. Ele escolhe as pautas, aprova o resultado e posta. Tudo roda no próprio PC, com ferramentas grátis ou de código aberto.

## Fase atual: crescimento

Os agentes fazem **3 vídeos virais por dia** em motion (quiz, curiosidade, o formato que estiver em alta) para fazer uma conta nova crescer. A fase seguinte é de afiliados (TikTok Shop e Shopee), e os agentes dela estão guardados como rascunho em `rascunhos/produto/`.

## A equipe

| Agente | Papel | Entrega |
|---|---|---|
| Gerson (`gerente`) | coordena o turno e para nas aprovações | o turno `/turno-crescimento` |
| Carla (`cacadora-virais`) | descobre os formatos que estão viralizando | 5 pautas do dia |
| Roberto (`roteirista-virais`) | escreve a nossa versão da pauta e dirige o vídeo | `roteiro.md` |
| Samanta (`social-virais`) | legenda, hashtags, horário e checklist | `post.md` |
| Renata (`revisora-virais`) | confere fatos, originalidade e regras das plataformas | `revisao.md` |
| Edu (`editor-virais`) | opera o estúdio e gera o vídeo | `video.mp4` 1080x1920 |

Fluxo: Carla → o dono escolhe 3 pautas → Roberto → Samanta → Renata → o dono aprova → Edu → o dono posta.

## Como está organizado

| Pasta | O que tem |
|---|---|
| `.claude/agents/` | um arquivo por agente (subagentes do Claude Code) |
| `.claude/skills/turno-crescimento/` | o turno do gerente |
| `CLAUDE.md` | o manual da empresa, lido por todo agente |
| `DECISOES.md` | as decisões do projeto (vale mais que qualquer outro arquivo) |
| `conhecimento/` | regras dos vídeos e formatos virais |
| `pesquisa/` | regras do TikTok Shop, da Shopee e do Instagram, com fontes |
| `estudio/` | estúdio de vídeo: Remotion (vídeo em React), narração com edge-tts ou Gemini, legenda sincronizada com Whisper, palco 3D. Ver `estudio/README.md` |
| `escritorio/` | escritório visual em pixel art, desenhado em código, com um servidor Node sem dependências. Ver `escritorio/README.md` |
| `ferramentas/escritorio.mjs` | a ferramenta que os agentes usam para avisar o que estão fazendo |

## Como os agentes aparecem no escritório

Cada agente roda `node ferramentas/escritorio.mjs status <id> trabalhando "tarefa"`. Isso grava `estado/agentes/<id>.json` e uma linha em `estado/eventos.jsonl`. O servidor do escritório lê esses arquivos e atualiza a página na hora (Server-Sent Events): o boneco senta na mesa, vai para a copa, espera ou mostra um erro.

## Para rodar

Precisa de Claude Code, Node 20+, Python 3 (`pip install edge-tts faster-whisper`) e FFmpeg.

```
cd estudio && npm install
node escritorio/servidor.mjs        # escritório em http://localhost:4800
```

No Claude Code, dentro da pasta, digite `/turno-crescimento`.

## Privacidade

O conteúdo produzido, o estado ao vivo, as métricas, as preferências e os aprendizados do dono, as chaves e as contas ficam fora do Git (ver `.gitignore`). A chave opcional do Gemini vai em `estudio/.env` (modelo em `estudio/.env.exemplo`).
