"""Monta ~/.config/rclone/rclone.conf a partir da autorização do YouTube (usado no GitHub Actions).

Com um único refresh token (escopos youtube.upload + drive.file, obtido no OAuth Playground),
o mesmo acesso publica no YouTube e guarda o vídeo no Google Drive. Nada é impresso: o arquivo
é gravado direto, legível só pelo próprio usuário.

Variáveis: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN.
"""
import json
import os
from pathlib import Path

token = {"access_token": "", "token_type": "Bearer", "refresh_token": os.environ["YT_REFRESH_TOKEN"],
         "expiry": "2000-01-01T00:00:00Z"}  # vencido de propósito: o rclone renova na primeira chamada
conf = (
    "[gdrive]\n"
    "type = drive\n"
    "scope = drive.file\n"
    f"client_id = {os.environ['YT_CLIENT_ID']}\n"
    f"client_secret = {os.environ['YT_CLIENT_SECRET']}\n"
    f"token = {json.dumps(token)}\n"
)
destino = Path.home() / ".config" / "rclone" / "rclone.conf"
destino.parent.mkdir(parents=True, exist_ok=True)
fd = os.open(destino, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w", encoding="utf-8") as f:
    f.write(conf)
