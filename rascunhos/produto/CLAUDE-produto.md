# Escritório — manual da empresa

Agência de afiliados do TikTok Shop (Brasil) tocada por agentes de IA. O dono aprova e posta, os agentes fazem o resto. As decisões estão em `DECISOES.md`.

## Regras de ouro

1. **Custo zero.** Só ferramentas grátis ou de código aberto. Se algo exigir pagamento, pare e avise o dono.
2. **Economize cota.** O plano do Claude é o Pro. Leia só o necessário, não repita pesquisa já feita e trabalhe com **3 produtos por turno**, a não ser que o dono peça outro número.
3. **Ninguém posta.** Os agentes nunca postam, nunca fazem login nem criam contas. Entregam tudo pronto em `producao/6-prontos/` e o dono posta.
4. **Nada de enganar.** Produto mostrado igual ao real, sem depoimento falso, sem promessa de saúde ou resultado garantido, sem falsa escassez. Vídeo com pessoa de IA realista sai marcado para o rótulo de IA. Detalhes em `conhecimento/regras-tiktok.md`.
5. **Aprenda com o que deu certo.** Antes de trabalhar, leia `conhecimento/aprendizados.md`.
6. **Escreva em português do Brasil**, com tom de TikTok: direto, curto, sem enrolação.

## Pastas

| Pasta | Para quê |
|---|---|
| `.claude/agents/` | os funcionários (um arquivo por agente) |
| `.claude/skills/` | rotinas do gerente (`/turno`, `/estudo-nicho`) |
| `conhecimento/` | nicho, regras do TikTok, ganchos que funcionam, aprendizados |
| `producao/<etapa>/<id>/` | um produto por pasta, andando pelas etapas |
| `estado/` | o que cada agente está fazendo agora (lido pelo escritório visual) |
| `escritorio/` | o escritório visual e a lista da equipe (`equipe.json`) |
| `ferramentas/` | scripts usados pelos agentes |
| `relatorios/` | relatório diário do gerente |
| `metricas/` | números dos vídeos postados, que o dono exporta |

## Etapas da produção

`1-candidatos → 2-aprovados → 3-roteirizados → 4-dirigidos → 5-editados → 6-prontos → 7-postados` (ou `descartados`)

O `<id>` do produto é um slug curto, em minúsculas e sem acento: `mini-liquidificador-portatil`.

Arquivos dentro da pasta do produto:

| Arquivo | Quem escreve |
|---|---|
| `ficha.json` | Bia cria; Léo preenche a avaliação |
| `roteiro.md` | Nina |
| `direcao.md` | Caio |
| `assets/` | Caio (imagens do produto, prompts gerados) e Edu |
| `video.mp4` | Edu |
| `revisao.md` | Vera |
| `post.md` | Davi |

### ficha.json

```json
{
  "id": "mini-liquidificador-portatil",
  "nome": "Mini liquidificador portátil USB 380 ml",
  "categoria": "casa-cozinha",
  "preco": 59.9,
  "comissao_pct": null,
  "sinais_demanda": "o que mostra que está vendendo (vendas, vídeos virais, ranking)",
  "fontes": ["https://..."],
  "imagens": ["https://..."],
  "por_que": "por que pode viralizar, em uma frase",
  "avaliacao": null,
  "formato": null,
  "historico": []
}
```

- `avaliacao` (Léo): `{ "demanda": 0-10, "comissao": 0-10, "demonstravel": 0-10, "saturacao": 0-10, "risco": 0-10, "total": 0-10, "comentario": "..." }`. Em `saturacao` e `risco`, 10 é bom (pouco saturado, pouco risco).
- `formato` (Caio): `"motion"` ou `"ia-modelo"`.
- `historico` é preenchido pela ferramenta `mover`. Não edite à mão.

## Protocolo do escritório (obrigatório para todo agente)

O escritório visual mostra a equipe ao vivo. Para isso, cada agente avisa o que está fazendo usando a ferramenta:

```bash
node ferramentas/escritorio.mjs status <agente> trabalhando "o que está fazendo, curto"
node ferramentas/escritorio.mjs evento <agente> "algo que aconteceu" [id-do-produto]
node ferramentas/escritorio.mjs mover <id-do-produto> <etapa> <agente>
node ferramentas/escritorio.mjs status <agente> livre
```

- Mande `status ... trabalhando` ao começar e a cada mudança de tarefa. Mande `status ... livre` ao terminar.
- Se travar, mande `status <agente> erro "motivo"`.
- Estados: `livre`, `trabalhando`, `esperando`, `erro`.
- Use `mover` em vez de mover pastas à mão: ele atualiza o histórico e avisa o escritório.
- Ids dos agentes: `gerente`, `cacador`, `analista`, `roteirista`, `diretor`, `editor`, `compliance`, `social`, `metricas`.
