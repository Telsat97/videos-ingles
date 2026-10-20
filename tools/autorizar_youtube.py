"""Autoriza o canal do YouTube UMA vez e mostra o refresh token para guardar como segredo no GitHub.

Rode no SEU terminal (não cole o resultado em nenhuma conversa):
    python -m pip install google-auth-oauthlib
    python tools/autorizar_youtube.py caminho/do/client_secret.json

O navegador abre, você entra com a conta do canal e autoriza. O token aparece só aqui no terminal.
"""
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

fluxo = InstalledAppFlow.from_client_secrets_file(sys.argv[1], scopes=["https://www.googleapis.com/auth/youtube.upload"])
cred = fluxo.run_local_server(port=0, prompt="consent", access_type="offline")
print("\nCopie os 3 valores abaixo para os segredos do GitHub (Settings → Secrets and variables → Actions):\n")
print("YT_CLIENT_ID     =", cred.client_id)
print("YT_CLIENT_SECRET =", cred.client_secret)
print("YT_REFRESH_TOKEN =", cred.refresh_token)
