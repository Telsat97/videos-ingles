"""Monta ~/.config/rclone/rclone.conf a partir da autorização do YouTube (usado no GitHub Actions).

Usa DRIVE_REFRESH_TOKEN (escopo drive.file, autorizado na conta pessoal: canais que são conta de marca
não têm Drive) ou, se não houver, o próprio YT_REFRESH_TOKEN. O cliente OAuth é o mesmo do YouTube. Nada é impresso: o arquivo
é gravado direto, legível só pelo próprio usuário.

Variáveis: YT_CLIENT_ID, YT_CLIENT_SECRET e DRIVE_REFRESH_TOKEN ou YT_REFRESH_TOKEN.
"""
import json
import os
from pathlib import Path

# access_token não pode ser vazio: o rclone trataria como "sem token" e nem tentaria renovar.
token = {"access_token": "renovar", "token_type": "Bearer", "refresh_token": (os.environ.get("DRIVE_REFRESH_TOKEN") or os.environ["YT_REFRESH_TOKEN"]).strip(),
         "expiry": "2000-01-01T00:00:00Z"}  # vencido de propósito: o rclone renova na primeira chamada
conf = (
    "[gdrive]\n"
    "type = drive\n"
    "scope = drive.file\n"
    f"client_id = {os.environ['YT_CLIENT_ID'].strip()}\n"
    f"client_secret = {os.environ['YT_CLIENT_SECRET'].strip()}\n"
    f"token = {json.dumps(token)}\n"
)
destino = Path.home() / ".config" / "rclone" / "rclone.conf"
destino.parent.mkdir(parents=True, exist_ok=True)
fd = os.open(destino, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w", encoding="utf-8") as f:
    f.write(conf)
