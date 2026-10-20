# Série "Inglês Fácil": bíblia de produção

Um vídeo por dia, vertical 9:16, ensinando inglês para brasileiros de todas as idades.
Este arquivo é o manual que todo agente (roteirista, revisor, produtor) segue.

## Formato fixo

- **Duração:** versão Short de 2:30 a 2:59 (YouTube Shorts aceita até 3:00; o TikTok paga por vídeos com mais de 1 min).
  Versão estendida (4 a 6 min) só para TikTok e Facebook, quando o tema render (mais exemplos e um quiz extra).
- **Vozes (gratuitas, edge-tts):** apresentador `pt-BR-AntonioNeural` (+10%), voz nativa `en-US-AvaNeural` (-12%).
  O inglês é sempre falado pela voz nativa; o apresentador nunca pronuncia a forma errada.
- **Rosto:** fotos do apresentador em `prints/` de cada projeto (uma foto por episódio, alternando).
- **Estrutura:** abertura com gancho (≤ 5 s) → 4 ou 5 blocos de ensino → desafio (quiz com contagem) → chamada para seguir.
- **Cada bloco de ensino:** errado ✗ → dica 💡 → certo ✓ → exemplo EN/PT → "sua vez" (pausa de 1,5 s para o aluno repetir).
- **Tom:** amigável, aconchegante, frases curtas, zero jargão. Explicar como para um amigo de 12 ou de 70 anos.

## Regras

1. **Nunca repetir conteúdo.** Antes de escrever, leia `ensinado.json`. O `tools/narrar.py` recusa roteiros que repetem
   uma forma certa ou um exemplo já ensinado. Depois de publicar, registre o episódio.
2. **Inglês correto acima de tudo.** Todo roteiro passa por revisão (gramática, naturalidade, tradução) antes de narrar.
3. **Uma ideia por bloco.** Nada de listas de 10 coisas num bloco só.
4. **Gancho nos primeiros 3 segundos:** uma frase que o brasileiro reconhece ("Se você fala *I am agree*...").
5. **Sem música com direitos autorais.** Só os efeitos sintetizados de `projetos/_sfx/`.
6. **Conteúdo original e variado** (as plataformas desmonetizam conteúdo repetitivo ou produzido em massa):
   alterne os formatos da pauta e mantenha a voz do apresentador.

## Fluxo de um episódio

```text
pauta.md → roteiro.json → python tools/narrar.py "projetos/<NNN. slug>" → stills de revisão
        → npx remotion render ... → edicoes/<NNN. slug>/<slug>.mp4 + post.md → publicar → registrar
```

## Publicação e monetização

| Plataforma | Onde | Monetização (requisito resumido) |
|---|---|---|
| YouTube | Shorts (≤ 3:00) | Programa de Parcerias: 1.000 inscritos + 10 mi de views em Shorts em 90 dias |
| TikTok | vídeo > 1 min | Creator Rewards: 10 mil seguidores + 100 mil views em 30 dias, vídeos com mais de 1 min |
| Facebook | Reels | Monetização de conteúdo do Facebook (por convite/elegibilidade da página) |

Horário sugerido: 12h ou 19h (Brasília), sempre o mesmo, para criar hábito.
Ao subir no YouTube, marque "conteúdo alterado ou sintético" (voz de IA sobre a foto real): é transparente e evita penalidade.
