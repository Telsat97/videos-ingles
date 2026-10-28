# English Mistake Fix Podcast: formato do roteiro (formato "podcast")

Estudo que embasa: `serie-ingles/analise/PODCASTS.md`. Vídeo longo 16:9, 1 por semana (domingo), alternando com a aula
"20 erros". Personagens fixos: **Mia** (curiosa, engraçada, comete erros clássicos; a história acontece com ela) e
**Leo** (professor calmo, humor seco, corrige com gentileza). A vida deles continua entre episódios.

## JSON (`serie-ingles/podcast/fila/pNNN-slug.json`)
```json
{
  "slug": "p001-everyday-conversations", "episodio": 301, "formato": "podcast",
  "nivel": "A2", "serie": "Easy", "ep": 1,
  "titulo": "Everyday English Conversations",
  "vozes": {
    "mia": {"voz": "en-US-EmmaNeural", "rate": "-12%"},
    "leo": {"voz": "en-US-BrianNeural", "rate": "-12%"},
    "mia_normal": {"voz": "en-US-EmmaNeural", "rate": "+0%"},
    "leo_normal": {"voz": "en-US-BrianNeural", "rate": "+0%"}
  },
  "post": {"titulo": "...", "descricao": "...", "hashtags": ["#learnenglish", "..."]},
  "cenas": [
    {"tipo": "bloco", "titulo": "Mia's mistake", "cenario": "cafe", "falas": [
      {"voz": "mia", "texto": "..."},
      {"voz": "leo", "texto": "...", "card": {"tipo": "quiz", "pergunta": "What did Mia say wrong?"}},
      {"voz": "leo", "texto": "Say it with me.", "card": {"tipo": "frase", "en": "Can I get a coffee, please?"}},
      {"voz": "mia", "texto": "Can I get a coffee, please?"},
      {"pausa": 3.0, "mostra": "repita"}
    ]}
  ]
}
```
- `cenas`: só `"tipo": "bloco"`; cada bloco vira um **capítulo** (título curto em inglês, ≤ 32 caracteres).
- `cenario`: `estudio` (padrão) · `cafe` · `mercado` · `rua` · `casa` · `trabalho` · `viagem`.
- `card` (opcional, aparece no painel da direita a partir dessa fala até o próximo card ou o fim do bloco):
  `palavra` {termo, significado, exemplo} · `erro` {errado, certo} · `frase` {en} · `quiz` {pergunta}
  · `resposta` {texto} · `lista` {titulo, itens[]} (máx. 8 itens curtos).
- Pausa para repetir: `{"pausa": segundos, "mostra": "repita"}` (anel de contagem na tela). Regra: ~0,5 s por palavra + 1,5 s.
- "Ouvir de novo em velocidade natural": usar as vozes `mia_normal` / `leo_normal`.
- Todo texto falado é inglês (sem português). Nível A2: frases curtas, vocabulário do dia a dia, presente/passado simples.

## Estrutura (A2, 22–28 min, 2.300–3.200 palavras faladas)
1. **Gancho** (≤ 30 s): Mia diz uma frase com erro; Leo lança a pergunta do quiz (card quiz), respondida só no fim.
2. **Intro**: tema, nível, 3 coisas que a pessoa vai aprender (card lista). A declaração de voz de IA vai na tela e na descrição (não precisa ser falada).
3. **História parte 1** (4–5 min): diálogo natural e lento.
4. **Word focus**: 5 expressões (card palavra cada), glosa simples + 2 exemplos + repetição.
5. **História parte 2** (4–5 min): reaproveita as expressões.
6. **Mistake fix**: 3 erros típicos tirados da história (card erro), com a regra simples.
7. **Shadowing**: 10 frases (card frase + pausa "repita").
8. **Listen again**: trecho-chave em velocidade natural (vozes *_normal).
9. **Fim**: resposta do quiz (card resposta), recap (card lista), tarefa para os comentários, gancho do próximo episódio.

## Regras (portões de qualidade)
Inglês revisado em 2 fontes (pedagogo) · personagens ficcionais, nunca apresentados como pessoas reais · sem conselho de
saúde/finanças · sem estatística ou vivência real inventada · cada episódio com história, cenário e gancho próprios ·
título no padrão `Everyday English Conversation Practice | A2 English Podcast | Ep. 1 — Mia's Busy Day`.
