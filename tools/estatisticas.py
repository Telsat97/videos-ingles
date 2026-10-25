"""Raio-X do canal para o analista (ver serie-ingles/PLANO-DO-TIME.md, fase 4). Só leitura.

Uso:  python tools/estatisticas.py   →  serie-ingles/analise/estatisticas.md (+ .json com os números)

Credenciais por variável de ambiente (segredos do GitHub), nunca em arquivo:
YT_CLIENT_ID, YT_CLIENT_SECRET e YT_ANALYTICS_REFRESH_TOKEN (escopo yt-analytics.readonly).
O YouTube Analytics fecha os números com ~2 dias de atraso.
"""
import datetime as dt
import json
import os
import sys
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "serie-ingles" / "analise"
INICIO = "2026-10-01"
METRICAS = "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares"


def token() -> str:
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": os.environ["YT_CLIENT_ID"].strip(), "client_secret": os.environ["YT_CLIENT_SECRET"].strip(),
        "refresh_token": os.environ["YT_ANALYTICS_REFRESH_TOKEN"].strip(), "grant_type": "refresh_token",
    }, timeout=30)
    if r.status_code != 200:
        sys.exit(f"::error::A autorização de estatísticas falhou ({r.json().get('error')}). Gere o token de novo.")
    return r.json()["access_token"]


def relatorio(tk: str, **params) -> list[dict]:
    r = requests.get("https://youtubeanalytics.googleapis.com/v2/reports", headers={"Authorization": f"Bearer {tk}"},
                     params={"ids": "channel==MINE", "startDate": INICIO, "endDate": dt.date.today().isoformat(), **params},
                     timeout=60)
    if r.status_code != 200:
        sys.exit(f"::error::YouTube Analytics recusou o pedido: {r.status_code} {r.text[:300]}")
    j = r.json()
    nomes = [c["name"] for c in j["columnHeaders"]]
    return [dict(zip(nomes, linha)) for linha in j.get("rows", [])]


def titulo_publico(video: str) -> str:
    r = requests.get("https://www.youtube.com/oembed", params={"url": f"https://youtu.be/{video}", "format": "json"}, timeout=20)
    return r.json().get("title", video) if r.ok else video


def roteiros_por_titulo() -> dict[str, str]:
    """Título publicado → roteiro (para o analista saber o tema e o formato de cada vídeo)."""
    out = {}
    for pasta in ("publicados-global", "publicados"):
        for f in (RAIZ / "serie-ingles" / pasta).glob("*.json"):
            r = json.loads(f.read_text(encoding="utf-8"))
            out[" ".join(w for w in r["post"]["titulo"].split() if w.lower() != "#shorts")[:100]] = f.stem
    return out


def main() -> None:
    tk = token()
    videos = relatorio(tk, metrics=METRICAS, dimensions="video", sort="-views", maxResults=50)
    dias = relatorio(tk, metrics="views,subscribersGained,estimatedMinutesWatched", dimensions="day", sort="day")
    mapa = roteiros_por_titulo()
    for v in videos:
        v["titulo"] = titulo_publico(v["video"])
        v["roteiro"] = mapa.get(v["titulo"], "")

    SAIDA.mkdir(parents=True, exist_ok=True)
    hoje = dt.date.today().isoformat()
    (SAIDA / "estatisticas.json").write_text(json.dumps({"gerado": hoje, "videos": videos, "dias": dias}, ensure_ascii=False, indent=1),
                                             encoding="utf-8")
    total = {k: sum(d[k] for d in dias) for k in ("views", "subscribersGained", "estimatedMinutesWatched")}
    linhas = [
        f"# Raio-X do canal ({hoje})",
        "",
        f"Desde {INICIO}: **{total['views']:,} views**, **{total['subscribersGained']:,} inscritos**, "
        f"**{total['estimatedMinutesWatched'] / 60:,.0f} h assistidas**. Números do YouTube Analytics (~2 dias de atraso).",
        "",
        "| Vídeo | Roteiro | Views | % assistido | Duração média | Inscritos | Likes | Coment. | Compart. |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for v in videos:
        linhas.append(
            f"| [{v['titulo']}](https://youtu.be/{v['video']}) | {v['roteiro']} | {v['views']:,} | {v['averageViewPercentage']:.0f}% | "
            f"{v['averageViewDuration']} s | {v['subscribersGained']} | {v['likes']} | {v['comments']} | {v['shares']} |"
        )
    linhas += ["", "## Por dia", "", "| Dia | Views | Inscritos |", "|---|---:|---:|"]
    linhas += [f"| {d['day']} | {d['views']:,} | {d['subscribersGained']} |" for d in dias[-14:]]
    (SAIDA / "estatisticas.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"ok: {len(videos)} vídeos, {total['views']} views desde {INICIO}")


if __name__ == "__main__":
    main()
