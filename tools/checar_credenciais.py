"""Confere as credenciais do Google em segundos, sem gerar vídeo. Nunca imprime os valores.

Uso (no GitHub Actions, com os segredos como variáveis):  python tools/checar_credenciais.py

Para cada token: confere o formato (um refresh token começa com "1//"), tenta renová-lo no Google
e mostra a resposta (erro ou permissões concedidas). Sai com erro se algum falhar.
"""
import os
import sys

import requests

CAMPOS = ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN", "DRIVE_REFRESH_TOKEN"]


def formato(nome: str, valor: str) -> list[str]:
    avisos = []
    if valor != valor.strip():
        avisos.append("tem espaço ou quebra de linha no começo/fim")
    v = valor.strip()
    if nome == "YT_CLIENT_ID" and not v.endswith(".apps.googleusercontent.com"):
        avisos.append("não termina em .apps.googleusercontent.com (é o ID do cliente?)")
    if nome == "YT_CLIENT_SECRET" and not v.startswith("GOCSPX-"):
        avisos.append("não começa com GOCSPX- (é a chave secreta do cliente?)")
    if nome.endswith("REFRESH_TOKEN"):
        if v.startswith("ya29."):
            avisos.append("parece um ACCESS token (ya29.), não o refresh token")
        elif v.startswith("4/"):
            avisos.append("parece o CÓDIGO de autorização (4/), não o refresh token")
        elif not v.startswith("1//"):
            avisos.append("não começa com 1// (refresh token do Google começa assim)")
    return avisos


def renovar(refresh: str) -> tuple[bool, str]:
    r = requests.post("https://oauth2.googleapis.com/token", timeout=30, data={
        "grant_type": "refresh_token", "refresh_token": refresh.strip(),
        "client_id": os.environ["YT_CLIENT_ID"].strip(), "client_secret": os.environ["YT_CLIENT_SECRET"].strip(),
    })
    dados = r.json()
    if r.ok:
        return True, f"ok, permissões: {dados.get('scope', '?')}"
    return False, f"{dados.get('error')}: {dados.get('error_description', '')}"


def main() -> None:
    falhou = False
    for nome in CAMPOS:
        valor = os.environ.get(nome, "")
        if not valor:
            print(f"{nome}: AUSENTE")
            falhou = falhou or nome != "DRIVE_REFRESH_TOKEN"
            continue
        avisos = formato(nome, valor)
        print(f"{nome}: presente ({len(valor.strip())} caracteres)" + "".join(f"\n  ! {a}" for a in avisos))
    for nome in ("YT_REFRESH_TOKEN", "DRIVE_REFRESH_TOKEN"):
        if os.environ.get(nome) and os.environ.get("YT_CLIENT_ID") and os.environ.get("YT_CLIENT_SECRET"):
            ok, msg = renovar(os.environ[nome])
            print(f"renovar {nome}: {msg}")
            falhou = falhou or not ok
    sys.exit(1 if falhou else 0)


if __name__ == "__main__":
    main()
