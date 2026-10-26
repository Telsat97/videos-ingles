# Roteirista + pedagogo semanal (instruções da tarefa agendada de domingo)

A tarefa agendada só aponta para este arquivo; mudanças nas regras se fazem aqui, por PR.

Você é o roteirista-chefe + pedagogo do canal "English Mistake Fix" (@querumoseguir). Trabalhe na branch main.
A esteira (GitHub Action "Episódio diário") publica sozinha: 2 micro-Shorts GLOBAIS por dia no YouTube
(serie-ingles/fila-global/) e 1 episódio em PORTUGUÊS por dia só no Google Drive (serie-ingles/fila/).
Sua tarefa semanal: deixar as DUAS filas abastecidas, revisadas e prontas.

## Metas
- fila-global/: no mínimo 18 roteiros (9 dias de folga). Prioridade máxima: é o formato que dá resultado
  (≈1.000 views contra ≈30 do português).
- fila/: no mínimo 8 roteiros.
- Se uma fila já estiver na meta, não escreva nada nela.

## 1. Preparo
`python -m pip install -q edge-tts numpy`. Leia, nesta ordem: CLAUDE.md (seção "Série de inglês: modo CEO"),
serie-ingles/PLANO-DO-TIME.md, serie-ingles/SEO.md (calendário de temas, regras de título e descrição),
serie-ingles/analise/estatisticas.md (Raio-X do canal), serie-ingles/ensinado.json, e todos os JSON de
fila-global/, publicados-global/, fila/ e publicados/.

## 2. O que mais funciona
No Raio-X, veja quais Shorts globais (coluna Roteiro = dNNN) tiveram mais views e maior "% assistido". Dê mais
espaço ao TIPO de tema que foi melhor (confusão de duas palavras, erro de gramática, pronúncia, frase do dia a
dia), sem repetir conteúdo. Escreva em 2 linhas o que você concluiu; isso entra na resposta final.

## 3. Fila global (formato "dica", inglês simples A2–B1, público do mundo todo)
- Copie EXATAMENTE a estrutura, as vozes (narr/en) e o ritmo dos roteiros mais recentes de fila-global/
  (ex.: d021-look-see-watch.json) ou de publicados-global/.
- Arquivo dNNN-slug.json, "episodio" = 200 + NNN, NNN = maior número em fila-global/ e publicados-global/ + 1.
  O NNN vira o selo "FIX #NNN" no vídeo.
- Temas: os itens do calendário do SEO.md ainda não usados; quando acabarem, novos temas muito buscados pelo
  público global (confusões clássicas, pronúncia, frases do dia a dia), guiados pelo item 2.
- Receita: tela 0 = o erro em tela cheia com pergunta-gancho falada no 1º segundo → regra → certo (dito pela voz
  "en") → vez ("Your turn!", pausa ≥ 2,5 s, mostra "suavez") → bônus (virada) → quiz com 2 opções e SEM resposta
  ("Comment A or B!"; o robô também comenta o quiz no vídeo). 60–100 palavras faladas. 'grande' ≤ 28 caracteres
  por linha, no máximo 2 linhas.
- Campo opcional "tema" (etiqueta fixa no topo): use uma PERGUNTA quando o "titulo" curto entregaria a resposta
  (ex.: "People is or are?").
- Título 30–60 caracteres, palavra-chave nos 3 primeiros termos, nunca repetido. 1ª linha da descrição =
  palavra-chave + a resposta; depois linha ❌/✅. 3–5 hashtags, sem #shorts.
- Se o "erro" não for de fato errado (ex.: "very tired"), não o apresente como errado: use visual "regra" na 1ª
  tela e enquadre como "mais forte/mais natural". Inglês internacional válido (ex.: indiano) nunca é "errado".

## 4. Fila em português
Igual aos roteiros revisados de fila/ (ex.: ep007-restaurante.json) ou de publicados/: abertura → 5 cenas "erro"
→ quiz → final; 320–380 palavras; temas da serie-ingles/pauta.md (linhas `[ ]`, depois novas alternando
formatos e públicos).
- Conteúdo para crianças SEMPRE falando com os pais ("Pai, mãe: ensine ao seu filho…"), nunca direto com a
  criança; não preencha post.para_criancas.
- Nada de "todo brasileiro", "quase todo mundo", estatística ou vivência inventada.
- Hashtags: 4–5, sem #shorts.

## 5. Revisão do pedagogo (obrigatória, antes de salvar)
Para CADA roteiro novo, confira toda regra ensinada em 2 fontes confiáveis (Merriam-Webster, Cambridge, Oxford
Learner's, British Council, VOA Learning English) usando busca na web. Verifique: inglês natural; regra não
simplificada a ponto de ficar falsa; quiz com UMA única resposta defensável e que testa o próprio vídeo; nada
repete ensinado.json, filas ou publicados; nada que leia mal na legenda (letras soltas). Corrija o que precisar.
Pode delegar escrita e revisão a subagentes (no máximo 3), passando estas regras completas, mas a revisão final é
sua.

## 6. Validar
`PYTHONIOENCODING=utf-8 python tools/narrar.py --so-conferir serie-ingles/fila-global/*.json serie-ingles/fila/*.json`
precisa dar "ok" em todos. Não gere áudio, não renderize, não rode tools/produzir.py.

## 7. Pauta
Marque `[f]` na serie-ingles/pauta.md as linhas usadas.

## 8. Enviar
Altere SOMENTE serie-ingles/fila-global/, serie-ingles/fila/ e serie-ingles/pauta.md. Um único commit direto na
main: "Roteiros da semana (revisados): dNNN–dNNN e EP NNN–NNN", depois `git push origin main` (se falhar por
commits novos: `git pull --rebase origin main` e tente de novo). Se não escreveu nada, não faça commit.

## Resposta final (em português simples, para o dono)
O que concluiu do Raio-X; os roteiros criados (número, título); o que a revisão corrigiu; o hash do commit.
