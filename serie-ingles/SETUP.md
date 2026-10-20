# Configuração única da operação online

Faça uma vez. Depois disso, a série roda sozinha na nuvem, sem o seu PC ligado.
Tempo total: cerca de 1 hora. Custo: R$ 0.

```text
Domingo (nuvem do Claude): escreve os 7 roteiros da semana → fila no GitHub
Todo dia 11h (GitHub Actions): pega 1 roteiro → voz → vídeo → Google Drive → YouTube + Facebook
```

> **Segurança:** nunca cole senhas, tokens ou chaves na conversa com o Claude. Eles vão só nos
> "Secrets" do GitHub, que ficam criptografados.

---

## 1. Suas fotos (5 min)

Salve as 5 fotos do apresentador em `serie-ingles/fotos/` (`foto1.jpg` … `foto5.jpg`).
Cada episódio usa uma, em rodízio.

## 2. Repositório no GitHub (10 min)

1. Entre em github.com com a sua conta e crie um repositório **privado** (ele vai guardar as suas fotos),
   por exemplo `ingles-facil`. Não marque "Add a README".
2. Avise o Claude o nome do repositório. Ele aponta esta pasta para lá e envia o código
   (o Windows vai pedir para você entrar no GitHub uma vez).
3. Para conferir: no GitHub, abra **Actions → Episódio diário → Run workflow** e escolha a privacidade `private`.
   Em uns 15 minutos o vídeo aparece em **Artifacts**.

## 3. Google Drive (10 min), com rclone (open source)

1. Instale: `winget install Rclone.Rclone` (feche e reabra o terminal).
2. Rode `rclone config` → `n` (novo) → nome `gdrive` → tipo `drive` → deixe client_id/secret vazios →
   scope `1` (acesso total) → aceite o resto no padrão → o navegador abre: entre com a sua conta Google.
3. Rode `rclone config file`, abra o arquivo mostrado e copie **todo** o conteúdo.
4. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
   Nome `RCLONE_CONF`, valor = o conteúdo copiado.

Os vídeos passam a cair em `Meu Drive/Ingles Facil/`.

## 4. YouTube (20 min)

1. Em console.cloud.google.com crie um projeto (ex.: `ingles-facil`).
2. **APIs e serviços → Biblioteca** → ative **YouTube Data API v3**.
3. **Tela de consentimento OAuth** → Externo → preencha nome e e-mail → depois clique em **Publicar app**.
   Isso é importante: em modo "teste", a autorização expira em 7 dias.
4. **Credenciais → Criar credenciais → ID do cliente OAuth → App para computador** → baixe o JSON.
5. No seu terminal, nesta pasta:
   ```bash
   python -m pip install google-auth-oauthlib
   python tools/autorizar_youtube.py "C:\caminho\do\client_secret.json"
   ```
   Entre com a conta do **canal**. Se aparecer "app não verificado", clique em Avançado → Continuar (o app é seu).
6. Crie 3 secrets no GitHub com os valores mostrados: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`.
7. **Auditoria (gratuita):** um app novo só consegue publicar vídeos como **privados**. Peça a liberação no
   formulário "YouTube API Services – Audit and Quota Extension" (support.google.com/youtube/contact/yt_api_form).
   Até a aprovação, os vídeos sobem privados e você só troca para "Público" no YouTube Studio (1 clique por vídeo).

## 5. Facebook (15 min)

Precisa de uma **Página** do Facebook (não perfil pessoal).

1. Em developers.facebook.com → **Meus apps → Criar app** → tipo "Empresa".
2. Abra o **Explorador da API do Graph** → selecione o app → "Obter token de usuário" com as permissões
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
3. Em **Depurador de token de acesso**, cole o token → **Estender token de acesso** → copie o token longo.
4. No Explorador, com o token longo, consulte `me/accounts`: copie o `id` e o `access_token` da sua Página.
   Esse token de Página não expira.
5. Secrets no GitHub: `FB_PAGE_ID` e `FB_PAGE_TOKEN`.

## 6. TikTok

A API do TikTok só publica vídeos **privados** até o app passar por auditoria. Enquanto isso:
- os vídeos ficam no Drive. No app do TikTok, agende os 7 da semana de uma vez (cerca de 10 min por semana);
- se quiser automatizar depois, crie um app em developers.tiktok.com, peça o "Content Posting API"
  e avise o Claude para ligar a publicação automática.

## 7. Roteirista na nuvem

Com o repositório criado (passo 2), o Claude configura um agente agendado que todo domingo:
lê a pauta e o registro do que já foi ensinado, escreve os 7 roteiros da semana, valida e envia para a fila.
Se a fila esvaziar, o GitHub manda um e-mail avisando.

---

## Rotina depois de pronto

- **Nada obrigatório.** Para acompanhar: abra a aba Actions do GitHub ou a pasta do Drive.
- Para mudar um tema: edite `serie-ingles/pauta.md` (ou peça ao Claude).
- Para pausar: GitHub → Actions → Episódio diário → "Disable workflow".
