"""Gera a narração de um episódio da série de inglês a partir do roteiro.json.

Uso:  python tools/narrar.py "projetos/<NNN. slug>"   [--registrar]
      python tools/narrar.py --so-conferir <roteiro.json> [...]   (valida estrutura e repetição, sem gerar áudio)

Saídas:
  <projeto>/audio/narracao.wav            uma trilha única com todas as falas
  <projeto>/transcricao/episodio.json      cenas, falas e tempo de cada palavra (vem do próprio TTS)
  src/videos/ingles/episodios/<slug>.json  cópia lida pelo Remotion
  src/videos/ingles/episodios.gen.ts       índice de episódios (regenerado)

--registrar  grava as expressões ensinadas em serie-ingles/ensinado.json (use só depois de publicar).
Sem a flag, o script só confere se o roteiro repete algo já ensinado e para se repetir.
"""
import asyncio
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import edge_tts
import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
SR = 48000
GAP_FALA = 0.22
GAP_CENA = 0.45
FINAL = 1.2
REGISTRO = RAIZ / "serie-ingles" / "ensinado.json"
# Tamanhos da série (ver serie-ingles/ESTRATEGIA.md): palavras (mín, máx, alvo) e duração máxima em segundos.
FORMATOS = {
    "short": {"palavras": (45, 130, "70-110 para dar 30-55 s"), "limite": 58.0},  # YouTube Shorts: 1 ideia
    "episodio": {"palavras": (250, 400, "320-380 para dar 2:30-2:59"), "limite": 178.5},  # TikTok e Facebook
    "longo": {"palavras": (900, 12000, "1.400+ para passar de 10 min"), "limite": None},  # YouTube, horizontal
    # Versão global (narrada em inglês simples): uma ideia por tela, cortes secos (ver serie-ingles/PLANO-DO-TIME.md)
    "dica": {"palavras": (40, 120, "60-100 para dar 25-45 s"), "limite": 58.0},
}


TWEMOJI = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/{}.svg"
EMOJIS_FIXOS = ["🎤", "🎉", "🔔", "📚", "✏️", "💬", "⭐", "❌", "✅", "💡", "🎁", "🤔"]  # usados pelo modelo visual (src/videos/ingles)


def codigo_twemoji(e: str) -> str:
    """Mesmo nome de arquivo que twemoji() em src/videos/ingles/comuns.tsx."""
    cps = [f"{ord(c):x}" for c in e]
    return "-".join(cps if "‍" in e else [c for c in cps if c != "fe0f"])


def baixar_ilustracoes(roteiro: dict) -> None:
    """Baixa os desenhos antes do render: o render não depende de rede (falhas de conexão derrubavam o vídeo)."""
    import time
    import urllib.request

    pasta = RAIZ / "projetos" / "_twemoji"
    pasta.mkdir(parents=True, exist_ok=True)
    emojis = set(EMOJIS_FIXOS) | set(roteiro.get("cenario", []))
    emojis |= {c["imagem"] for c in roteiro["cenas"] if c.get("imagem")}
    for e in sorted(emojis):
        destino = pasta / f"{codigo_twemoji(e)}.svg"
        if destino.exists():
            continue
        for tentativa in range(5):
            try:
                with urllib.request.urlopen(TWEMOJI.format(codigo_twemoji(e)), timeout=20) as r:
                    destino.write_bytes(r.read())
                break
            except Exception as erro:  # noqa: BLE001
                if getattr(erro, "code", None) == 404:
                    print(f"aviso: Twemoji não tem {e!r}; o vídeo usa o emoji do sistema")
                    break
                time.sleep(2 * (tentativa + 1))
        else:
            sys.exit(f"ERRO: não consegui baixar a ilustração {e!r} depois de 5 tentativas")


def normalizar(t: str) -> str:
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9' ]+", " ", t).strip()


def chaves_ensinadas(roteiro: dict) -> list[str]:
    """O que o episódio ensina: as formas certas e os exemplos em inglês."""
    out = []
    for c in roteiro["cenas"]:
        if c["tipo"] == "erro":
            out += [c["certo"], c["exemplo"]["en"]]
        if c["tipo"] == "tela" and c.get("visual") == "certo":
            out.append(c["grande"])
    return [normalizar(x) for x in out]


def conferir_repeticao(roteiro: dict) -> None:
    if not REGISTRO.exists():
        return
    reg = json.loads(REGISTRO.read_text(encoding="utf-8"))
    ja = {normalizar(x) for ep in reg["episodios"] if ep["slug"] != roteiro["slug"] for x in ep["ensina"]}
    rep = [k for k in chaves_ensinadas(roteiro) if k in ja]
    if rep:
        sys.exit(f"ERRO: o roteiro repete conteúdo já ensinado: {rep}")


def registrar(roteiro: dict) -> None:
    REGISTRO.parent.mkdir(exist_ok=True)
    reg = json.loads(REGISTRO.read_text(encoding="utf-8")) if REGISTRO.exists() else {"episodios": []}
    reg["episodios"] = [e for e in reg["episodios"] if e["slug"] != roteiro["slug"]]
    ensina = []
    for c in roteiro["cenas"]:
        if c["tipo"] == "erro":
            ensina += [c["certo"], c["exemplo"]["en"]]
        if c["tipo"] == "tela" and c.get("visual") == "certo":
            ensina.append(c["grande"])
    reg["episodios"].append({
        "slug": roteiro["slug"], "episodio": roteiro["episodio"], "titulo": roteiro["titulo"],
        "temas": [f'{c.get("errado") or c.get("dica", "")} -> {c["certo"]}' for c in roteiro["cenas"] if c["tipo"] == "erro"],
        "ensina": ensina,
    })
    reg["episodios"].sort(key=lambda e: e["episodio"])
    REGISTRO.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"registrado em {REGISTRO.relative_to(RAIZ)}")


def validar(roteiro: dict) -> list[str]:
    """Erros de estrutura que quebrariam o vídeo."""
    erros = []
    for k in ("slug", "episodio", "titulo", "vozes", "post", "cenas"):
        if k not in roteiro:
            erros.append(f"falta '{k}'")
    tipos = [c.get("tipo") for c in roteiro.get("cenas", [])]
    if roteiro.get("formato") == "dica":
        if any(t != "tela" for t in tipos):
            erros.append("no formato dica todas as cenas são 'tela'")
    elif tipos[:1] != ["abertura"] or tipos[-1:] != ["final"]:
        erros.append("a primeira cena deve ser 'abertura' e a última 'final'")
    for i, c in enumerate(roteiro.get("cenas", [])):
        if c.get("tipo") not in ("abertura", "erro", "quiz", "final", "tela"):
            erros.append(f"cena {i}: tipo inválido {c.get('tipo')}")
        chaves = {f.get("mostra") for f in c.get("falas", [])}
        exige = {"abertura": {"titulo"}, "erro": {"certo", "exemplo", "suavez"}, "quiz": {"pergunta", "opcoes", "contagem", "resposta"},
                 "final": {"chamada"}}.get(c.get("tipo"), set())
        if c.get("tipo") == "erro":
            for campo in ("certo", "exemplo"):
                if campo not in c:
                    erros.append(f"cena {i}: falta '{campo}'")
            if "numero" not in c and "manchete" not in c:
                erros.append(f"cena {i}: falta 'numero' (ou 'manchete', nos shorts)")
            if c.get("errado"):
                exige |= {"errado"}
            if c.get("dica"):
                exige |= {"dica"}
        if c.get("tipo") == "quiz" and not (0 <= c.get("correta", -1) < len(c.get("opcoes", []))):
            erros.append(f"cena {i}: 'correta' fora das opções")
        if exige - chaves:
            erros.append(f"cena {i} ({c.get('tipo')}): falta fala com mostra={sorted(exige - chaves)}")
        for f in c.get("falas", []):
            if "pausa" not in f and (f.get("voz") not in roteiro.get("vozes", {}) or not f.get("texto")):
                erros.append(f"cena {i}: fala sem voz/texto: {f}")
    formato = roteiro.get("formato", "episodio")
    if formato not in FORMATOS:
        erros.append(f"formato inválido {formato!r}: use {sorted(FORMATOS)}")
        return erros
    palavras = sum(len(f.get("texto", "").split()) for c in roteiro.get("cenas", []) for f in c.get("falas", []))
    minimo, maximo, alvo = FORMATOS[formato]["palavras"]
    if not minimo <= palavras <= maximo:  # a duração real é conferida depois da narração
        erros.append(f"{palavras} palavras faladas: num {formato} mire em {alvo}")
    return erros


async def sintetizar(texto: str, voz: str, rate: str, destino: Path) -> list[dict]:
    # O serviço de voz às vezes não devolve áudio (falha intermitente): tenta de novo antes de desistir.
    for tentativa in range(4):
        try:
            return await _sintetizar(texto, voz, rate, destino)
        except edge_tts.exceptions.NoAudioReceived:
            if tentativa == 3:
                raise
            await asyncio.sleep(2 * (tentativa + 1))
    raise AssertionError("inalcançável")


async def _sintetizar(texto: str, voz: str, rate: str, destino: Path) -> list[dict]:
    com = edge_tts.Communicate(texto, voz, rate=rate, boundary="WordBoundary")
    palavras = []
    with open(destino, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                palavras.append({"w": ch["text"], "s": s, "e": s + ch["duration"] / 1e7})
    return palavras


def decodificar(mp3: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32)


async def main(proj: Path, gravar_registro: bool) -> None:
    roteiro = json.loads((proj / "roteiro.json").read_text(encoding="utf-8"))
    conferir_repeticao(roteiro)
    baixar_ilustracoes(roteiro)
    tmp = proj / "audio" / "_falas"
    tmp.mkdir(parents=True, exist_ok=True)

    dica = roteiro.get("formato") == "dica"
    t = 0.1 if dica else 0.35  # na dica a fala começa colada no primeiro quadro
    pedacos: list[tuple[float, np.ndarray]] = []
    n = 0
    for ci, cena in enumerate(roteiro["cenas"]):
        cena["inicio"] = round(t, 3)
        for fala in cena["falas"]:
            fala["inicio"] = round(t, 3)
            if "pausa" in fala:
                t += fala["pausa"]
            else:
                cfg = roteiro["vozes"][fala["voz"]]
                mp3 = tmp / f"{n:03d}-{fala['voz']}.mp3"
                pal = await sintetizar(fala["texto"], cfg["voz"], cfg["rate"], mp3)
                audio = decodificar(mp3)
                dur = len(audio) / SR
                fala["palavras"] = [{**p, "s": round(t + p["s"], 3), "e": round(t + p["e"], 3)} for p in pal]
                pedacos.append((t, audio))
                t += dur + GAP_FALA
            fala["fim"] = round(t, 3)
            n += 1
        t += (0.15 if dica else GAP_CENA) if ci < len(roteiro["cenas"]) - 1 else (0.3 if dica else FINAL)
        cena["fim"] = round(t, 3)

    total = np.zeros(int(t * SR) + SR, dtype=np.float32)
    for ini, a in pedacos:
        i = int(ini * SR)
        total[i:i + len(a)] += a
    total = total[: int(t * SR)]
    pico = np.abs(total).max() or 1
    total = (total / pico * 0.89 * 32767).astype(np.int16)  # ~ -1 dBFS

    wav = proj / "audio" / "narracao.wav"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(wav)],
        input=total.tobytes(), check=True,
    )
    for f in tmp.iterdir():
        f.unlink()
    tmp.rmdir()

    nome = proj.name
    ep = {
        **{k: roteiro[k] for k in ("slug", "episodio", "titulo")},
        "formato": roteiro.get("formato", "episodio"),
        "cenario": roteiro.get("cenario", []),
        "duracao": round(t, 3),
        "audio": f"{nome}/audio/narracao.wav",
        "fotos": [f"{nome}/{f}" for f in roteiro.get("fotos", []) if (proj / f).exists()],
        "cenas": roteiro["cenas"],
    }
    js = json.dumps(ep, ensure_ascii=False, indent=1)
    (proj / "transcricao" / "episodio.json").write_text(js, encoding="utf-8")
    pasta = RAIZ / "src" / "videos" / "ingles" / "episodios"
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / f"{roteiro['slug']}.json").write_text(js, encoding="utf-8")

    eps = sorted(p.stem for p in pasta.glob("*.json"))
    ident = lambda s: "ep_" + re.sub(r"\W", "_", s)
    linhas = ["// Gerado por tools/narrar.py. Não edite à mão.", "import type {Episodio} from './tipos';"]
    linhas += [f"import {ident(s)} from './episodios/{s}.json';" for s in eps]
    linhas.append(f"export const episodios = [{', '.join(ident(s) for s in eps)}] as unknown as Episodio[];")
    (RAIZ / "src" / "videos" / "ingles" / "episodios.gen.ts").write_text("\n".join(linhas) + "\n", encoding="utf-8")

    print(f"ok: {wav.relative_to(RAIZ)}  duração {t:.1f}s  ({int(t // 60)}:{int(t % 60):02d})")
    limite = FORMATOS[roteiro.get("formato", "episodio")]["limite"]
    if limite and t > limite:
        print(f"ATENÇÃO: passou de {limite:.0f}s, o limite deste formato. Encurte o roteiro.")
    if gravar_registro:
        registrar(roteiro)


if __name__ == "__main__":
    if "--so-conferir" in sys.argv:
        falhou = False
        for arq in [a for a in sys.argv[1:] if not a.startswith("--")]:
            r = json.loads(Path(arq).read_text(encoding="utf-8"))
            erros = validar(r)
            try:
                conferir_repeticao(r)
            except SystemExit as e:
                erros.append(str(e))
            print(f"{arq}: {'ok' if not erros else 'ERROS'}")
            for e in erros:
                print("  -", e)
            falhou |= bool(erros)
        sys.exit(1 if falhou else 0)
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    asyncio.run(main(Path(args[0]).resolve(), "--registrar" in sys.argv))
