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

## 3. YouTube + Google Drive (25 min, tudo pelo navegador)

Duas autorizações rápidas: publicar no canal e guardar os vídeos no Drive
(em `Meu Drive/Ingles Facil/`). Faça logado na conta Google **dona do canal**.

**A. Google Cloud** (console.cloud.google.com)
1. No topo, **Selecionar projeto → Novo projeto** → nome `ingles-facil` → Criar. Confira que ele ficou selecionado.
2. Menu **APIs e serviços → Biblioteca**: ative **YouTube Data API v3** e **Google Drive API**.
3. Menu **Google Auth Platform** (ou "Tela de consentimento OAuth") → Começar: nome do app `Ingles Facil`,
   seu e-mail de suporte, público **Externo**, seu e-mail de contato → Criar.
4. Em **Público-alvo**, clique em **Publicar app** → Confirmar. Importante: em modo "teste" a autorização vence em 7 dias.
5. Em **Clientes → Criar cliente**: tipo **Aplicativo da Web**, nome `playground`. Em **URIs de redirecionamento
   autorizados**, adicione `https://developers.google.com/oauthplayground` → Criar.
   Aparecem o **ID do cliente** e a **Chave secreta do cliente**: deixe essa janela aberta.

**B. OAuth Playground** (developers.google.com/oauthplayground): duas autorizações
6. Clique na **engrenagem** (canto superior direito) → marque **Use your own OAuth credentials** → cole o ID e a chave.
7. **YouTube:** em **Input your own scopes**, cole `https://www.googleapis.com/auth/youtube.upload` → **Authorize APIs**
   → escolha o **canal** → "O Google não verificou este app": **Avançado → Acessar Ingles Facil** → Continuar.
   Em **Step 2**, **Exchange authorization code for tokens** → copie o **Refresh token** (é o do YouTube).
8. **Drive:** volte ao **Step 1**, troque o escopo por `https://www.googleapis.com/auth/drive.file` → **Authorize APIs**
   → escolha a sua **conta pessoal** (canal de marca não tem Drive) → Exchange → copie o **Refresh token** (é o do Drive).
   O passo 3 do Playground não é necessário.

**C. Segredos no GitHub** (github.com/Telsat97/videos-ingles → Settings → Secrets and variables → Actions)
9. **New repository secret**, quatro vezes: `YT_CLIENT_ID` (o ID), `YT_CLIENT_SECRET` (a chave),
   `YT_REFRESH_TOKEN` (token do YouTube) e `DRIVE_REFRESH_TOKEN` (token do Drive). Nunca cole esses valores em conversas.

**D. Liberação para vídeos públicos (gratuita, opcional no começo).** Um app novo só publica vídeos **privados**.
Peça a liberação no formulário "YouTube API Services – Audit and Quota Extension"
(support.google.com/youtube/contact/yt_api_form). Até a aprovação, troque para "Público" no YouTube Studio (1 clique).

> Alternativa sem navegador: `tools/autorizar_youtube.py` (pede Python no PC) e rclone com o segredo `RCLONE_CONF`.

## 4. Facebook (15 min)

Precisa de uma **Página** do Facebook (não perfil pessoal).

1. Em developers.facebook.com → **Meus apps → Criar app** → tipo "Empresa".
2. Abra o **Explorador da API do Graph** → selecione o app → "Obter token de usuário" com as permissões
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
3. Em **Depurador de token de acesso**, cole o token → **Estender token de acesso** → copie o token longo.
4. No Explorador, com o token longo, consulte `me/accounts`: copie o `id` e o `access_token` da sua Página.
   Esse token de Página não expira.
5. Secrets no GitHub: `FB_PAGE_ID` e `FB_PAGE_TOKEN`.

## 5. TikTok

A API do TikTok só publica vídeos **privados** até o app passar por auditoria. Enquanto isso:
- os vídeos ficam no Drive. No app do TikTok, agende os 7 da semana de uma vez (cerca de 10 min por semana);
- se quiser automatizar depois, crie um app em developers.tiktok.com, peça o "Content Posting API"
  e avise o Claude para ligar a publicação automática.

## 6. Roteirista na nuvem

Com o repositório criado (passo 2, já feito), o Claude configura um agente agendado que todo domingo:
lê a pauta e o registro do que já foi ensinado, escreve os 7 roteiros da semana, valida e envia para a fila.
Se a fila esvaziar, o GitHub manda um e-mail avisando.

---

## Rotina depois de pronto

- **Nada obrigatório.** Para acompanhar: abra a aba Actions do GitHub ou a pasta do Drive.
- Para mudar um tema: edite `serie-ingles/pauta.md` (ou peça ao Claude).
- Para pausar: GitHub → Actions → Episódio diário → "Disable workflow".
