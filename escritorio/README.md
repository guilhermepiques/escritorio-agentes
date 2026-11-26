# Escritório visual

Página em pixel art que mostra, ao vivo, os agentes de IA da empresa trabalhando. Tudo é desenhado em código (sem imagens de terceiros), roda só no seu PC e não tem dependências.

## Como abrir

- **No PC:** dê dois cliques no atalho **Escritório** da área de trabalho, ou em `escritorio/abrir-escritorio.vbs`. Ele liga o servidor escondido (se ainda não estiver ligado) e abre o navegador em `http://localhost:4800`.
- **No celular:** conecte o celular no mesmo Wi-Fi do PC e abra o endereço "No celular" que aparece em `escritorio/servidor.log` (algo como `http://192.168.0.10:4800`). Em pé, as salas ficam uma embaixo da outra.
- **Desligar:** `escritorio/desligar-escritorio.vbs`. O servidor também desliga sozinho quando o PC é desligado.
- **Pelo terminal:** `node escritorio/servidor.mjs` (opções: `--porta 4800` e `--raiz <pasta>`).

### Firewall (celular não abre?)

Na primeira vez, o Windows pode perguntar se o **Node.js** pode receber conexões. Marque **Redes privadas** e permita. Se a janela não apareceu e o celular não abre:

1. Abra **Segurança do Windows → Firewall e proteção de rede → Permitir um aplicativo pelo firewall**.
2. Em **Node.js JavaScript Runtime**, marque **Privada**.
3. Confira se o Wi-Fi de casa está como **rede privada** (Configurações → Rede e Internet → Wi-Fi → propriedades da rede).

## Como funciona

1. Os agentes trabalham quando o dono roda `/turno-crescimento`. A cada mudança, cada um roda `node ferramentas/escritorio.mjs status ...`, que grava um arquivo em `estado/`.
2. O servidor (`servidor.mjs`) lê esses arquivos e avisa a página na hora (Server-Sent Events). Ele só **lê**: com a página fechada, os agentes trabalham do mesmo jeito.
3. A página (`publico/`) monta a planta a partir de `salas.json` e anima cada pessoa conforme o estado.

| Estado | O que aparece |
|---|---|
| `livre` | vai para a copa: café, geladeira, bebedouro, mesinha, sofá ou videogame |
| `trabalhando` | senta na mesa e digita; a tela mostra o trabalho do cargo; balão com a tarefa e o tempo; uma caneca de café a cada 5 min (máx. 5) e gota de suor depois de 30 min. No estúdio, a placa NO AR acende, a claquete bate, as luzes ligam e o microfone solta ondas |
| `esperando` | fica em pé no lugar com uma ampulheta; depois de 3 min fica impaciente (bate o pé, olha o relógio); depois de 15 min senta no chão e cochila |
| `erro` | "!" vermelho, tela vermelha soltando fumaça, a sala pisca em vermelho com uma sirene, e o Gerson vai até a mesa de quem travou |

O dia e a noite seguem o relógio do PC: janelas, céu da cidade e luzes acesas à noite.

### Botões (v2)

| Botão | O que mostra |
|---|---|
| **Falta você** | o que está esperando você: quem travou, quem espera sua resposta, pautas do dia para escolher, roteiros para aprovar e vídeos para postar. O número aparece no botão e no título da aba |
| **Vídeos** | os vídeos por dia, com a etapa de cada um (`rascunho → revisado/ajustar → aprovado → pronto → postado`). Abrir um vídeo mostra o `video.mp4` para assistir ou baixar, a legenda e as hashtags com botão **copiar**, o checklist, o roteiro e a revisão |
| **Mural** | os últimos eventos dos agentes. O número azul indica quantos são novos |
| **Sino** | liga ou desliga o som do aviso. Começa desligado, porque o navegador só toca som depois de um clique |

- Clique num boneco (ou no balão dele) para ver a **ficha**: cargo, sala, estado, tarefa, há quanto tempo e os últimos eventos.
- Quando aparece algo novo em "Falta você", toca o som (se o sino estiver ligado) e a aba pisca até você voltar para ela.
- No celular em pé, os botões ficam embaixo.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `equipe.json` | quem está na equipe ativa: `{ "id", "nome", "cargo", "cor", "sala" }` |
| `salas.json` | as salas, na ordem: `{ "id", "nome", "tipo", "fileira", "largura" }` |
| `../estado/agentes/<id>.json` | o que cada agente está fazendo: `{ "id", "estado", "tarefa", "desde" }` (escrito por `ferramentas/escritorio.mjs`) |
| `../estado/eventos.jsonl` | um evento por linha: `{ "ts", "agente", "texto", "ref"? }` (vai para o mural; `ref` é o id do vídeo) |
| `../crescimento/videos/<id>/` | só lidos: título e `status:` do `roteiro.md`, `post.md`, `revisao.md` e `video.mp4` |
| `../crescimento/pautas/AAAA-MM-DD.md` | só lido: diz se as pautas do dia já existem |
| `servidor.mjs` | o servidor local (só lê, nunca grava em `estado/` nem em `crescimento/`) |
| `publico/js/dados.js` | de onde vêm os dados (trocar este arquivo basta para ler de outro lugar, como um banco na internet) |
| `publico/js/paineis.js` | os painéis: Falta você, Vídeos (com o pacote para postar), Mural e a ficha |
| `publico/js/aviso.js` | o som, a aba piscando e o ponto vermelho no ícone da aba |
| `publico/js/planta.js` | gera a planta e os móveis de cada tipo de sala |
| `publico/js/agentes.js` | para onde cada boneco vai e como é desenhado |
| `publico/js/arte.js` | toda a arte, desenhada em código |
| `esbocos/plantas.html` | o esboço das 3 plantas que o dono comparou |

### Sala nova

Uma linha a mais em `salas.json`:

- `tipo`: `equipe` (mesas, uma por pessoa), `gerente`, `estudio` ou `copa`. Uma sala `equipe` sem ninguém aparece como "em breve".
- `fileira`: `cima` ou `baixo` (as duas fileiras ficam dos lados do corredor).
- `largura`: em blocos (opcional).

Depois, ponha `"sala": "<id da sala>"` em quem vai trabalhar nela, em `equipe.json`.

## Testar sem mexer no estado real

```
node escritorio/servidor.mjs --porta 4801 --raiz <pasta-de-teste>
```

A pasta de teste precisa ter `escritorio/equipe.json`, `escritorio/salas.json` e `estado/agentes/`. Para testar os painéis, ponha também `crescimento/videos/<id>/` e `crescimento/pautas/`. Na URL dá para forçar a hora e o modo: `http://localhost:4801/?hora=22&modo=alto`.
