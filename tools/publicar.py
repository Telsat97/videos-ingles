"""Publica um episódio pronto. Credenciais só por variáveis de ambiente (segredos do GitHub), nunca em arquivo.

Uso:  python tools/publicar.py youtube  "edicoes/<projeto>/post.json"
      python tools/publicar.py facebook "edicoes/<projeto>/post.json"

YouTube  : YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN  (gere com tools/autorizar_youtube.py)
Facebook : FB_PAGE_ID, FB_PAGE_TOKEN                         (token de página, permissão pages_manage_posts)
TikTok   : a API só publica em modo privado até o app ser auditado; por enquanto o vídeo vai ao Drive.
"""
import json
import os
import sys
import time
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parent.parent
GRAPH = "https://graph.facebook.com/v21.0"


# Rodapé por idioma: transparência sobre a voz sintética (política do YouTube) e crédito da licença Twemoji.
RODAPE = {
    "en": "New English tip every day. 🔔\nMade with AI-assisted tools and a synthetic (AI) voice.\n"
          "Illustrations: Twemoji (CC-BY 4.0)",
    "pt": "Uma dica nova de inglês todo dia! 🔔\nFeito com ferramentas de IA e voz sintética.\n"
          "Ilustrações: Twemoji (CC-BY 4.0)",
}


def idioma(post: dict) -> str:
    return "en" if post.get("formato") == "dica" else post.get("idioma", "pt")


def texto(post: dict, plataforma: str) -> str:
    # 3 a 5 hashtags no fim da descrição; #shorts não ajuda (o YouTube reconhece o Short pelo formato).
    tags = " ".join([t for t in post.get("hashtags", []) if t.lower() != "#shorts"][:5])
    capitulos = "\n".join(post.get("capitulos", []))
    partes = [post["descricao"], capitulos, RODAPE[idioma(post)], tags]
    return "\n\n".join(p for p in partes if p).strip()


def titulo(post: dict) -> str:
    t = " ".join(w for w in post["titulo"].split() if w.lower() != "#shorts")
    return t[:100]


def youtube(post: dict) -> str:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    cred = Credentials(
        None, refresh_token=os.environ["YT_REFRESH_TOKEN"].strip(), token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YT_CLIENT_ID"].strip(), client_secret=os.environ["YT_CLIENT_SECRET"].strip(),
        scopes=["https://www.googleapis.com/auth/youtube.upload"],
    )
    yt = build("youtube", "v3", credentials=cred, cache_discovery=False)
    corpo = {
        "snippet": {
            "title": titulo(post),
            "description": texto(post, "youtube"),
            "tags": [t.lstrip("#") for t in post.get("hashtags", [])],
            "categoryId": "27",  # Educação
            "defaultLanguage": "en" if idioma(post) == "en" else "pt-BR",
            "defaultAudioLanguage": "en" if idioma(post) == "en" else "pt-BR",
        },
        "status": {
            "privacyStatus": os.environ.get("YT_PRIVACIDADE", "public"),
            # Decidido por vídeo no roteiro (post.para_criancas); o padrão é público geral (ver PLANO-DO-TIME.md).
            "selfDeclaredMadeForKids": bool(post.get("para_criancas", False)),
            "containsSyntheticMedia": True,  # voz gerada por IA: declaração exigida pelo YouTube
        },
    }
    midia = MediaFileUpload(str(RAIZ / post["arquivo"]), mimetype="video/mp4", chunksize=-1, resumable=True)
    req = yt.videos().insert(part="snippet,status", body=corpo, media_body=midia)
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    if post.get("formato") == "longo":
        return f"https://www.youtube.com/watch?v={resp['id']}"
    return f"https://youtube.com/shorts/{resp['id']}"


def facebook(post: dict) -> str:
    page, token = os.environ["FB_PAGE_ID"], os.environ["FB_PAGE_TOKEN"]
    arquivo = RAIZ / post["arquivo"]
    ini = requests.post(f"{GRAPH}/{page}/video_reels", data={"upload_phase": "start", "access_token": token}, timeout=60)
    ini.raise_for_status()
    vid = ini.json()["video_id"]
    with open(arquivo, "rb") as f:
        up = requests.post(
            f"https://rupload.facebook.com/video-upload/v21.0/{vid}",
            headers={"Authorization": f"OAuth {token}", "offset": "0", "file_size": str(arquivo.stat().st_size)},
            data=f, timeout=600,
        )
    up.raise_for_status()
    fim = requests.post(
        f"{GRAPH}/{page}/video_reels",
        data={"upload_phase": "finish", "video_id": vid, "video_state": "PUBLISHED",
              "description": f"{titulo(post)}\n\n{texto(post, 'facebook')}", "access_token": token},
        timeout=60,
    )
    fim.raise_for_status()
    for _ in range(30):  # o Facebook processa o vídeo de forma assíncrona
        st = requests.get(f"{GRAPH}/{vid}", params={"fields": "status", "access_token": token}, timeout=30).json()
        fase = st.get("status", {}).get("video_status")
        if fase in ("ready", "error"):
            if fase == "error":
                sys.exit(f"Facebook recusou o vídeo: {st}")
            break
        time.sleep(20)
    return f"https://www.facebook.com/reel/{vid}"


if __name__ == "__main__":
    plataforma, caminho = sys.argv[1], Path(sys.argv[2])
    post = json.loads(caminho.read_text(encoding="utf-8"))
    url = {"youtube": youtube, "facebook": facebook}[plataforma](post)
    print(f"{plataforma}: {url}")
