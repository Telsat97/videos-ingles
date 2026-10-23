"""Produz um episódio da série de inglês de ponta a ponta, sem intervenção.

Uso:  python tools/produzir.py serie-ingles/fila/ep002-falsos-amigos.json [--sem-render] [--horizontal]

Passos: cria projetos/<NNN. ingles-slug>/ → copia roteiro e fotos (serie-ingles/fotos/) → efeitos sonoros →
narração (tools/narrar.py) → render 1080x1920 → edicoes/<projeto>/<slug>.mp4 + post.json.
Imprime na última linha o caminho do MP4 (o workflow do GitHub lê essa linha).
"""
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import narrar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FOTOS = RAIZ / "serie-ingles" / "fotos"
SFX = RAIZ / "projetos" / "_sfx"
NPX = "npx.cmd" if sys.platform == "win32" else "npx"
# O Remotion recusa mais processos que núcleos (o runner de repositório privado do GitHub tem 2).
CONCORRENCIA = f"--concurrency={min(4, os.cpu_count() or 1)}"

# Efeitos sintetizados com ffmpeg: sem direitos autorais, iguais em qualquer máquina.
EFEITOS = {
    "ding": ["-f", "lavfi", "-i", "sine=f=1046:d=0.6", "-f", "lavfi", "-i", "sine=f=1568:d=0.6",
             "-filter_complex", "[0][1]amix=2,afade=t=out:st=0.05:d=0.55,volume=0.9"],
    "erro": ["-f", "lavfi", "-i", "sine=f=180:d=0.35", "-f", "lavfi", "-i", "sine=f=190:d=0.35",
             "-filter_complex", "[0][1]amix=2,afade=t=out:st=0.2:d=0.15,volume=0.8"],
    "pop": ["-f", "lavfi", "-i", "sine=f=600:d=0.09", "-af", "afade=t=out:st=0.0:d=0.09,volume=0.7"],
    "tick": ["-f", "lavfi", "-i", "sine=f=880:d=0.12", "-af", "afade=t=out:st=0.02:d=0.1,volume=0.5"],
    "whoosh": ["-f", "lavfi", "-i", "anoisesrc=c=pink:d=0.5:a=0.3",
               "-af", "highpass=f=800,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.25"],
}


def gerar_sfx() -> None:
    SFX.mkdir(parents=True, exist_ok=True)
    for nome, args in EFEITOS.items():
        destino = SFX / f"{nome}.wav"
        if not destino.exists():
            subprocess.run(["ffmpeg", "-v", "error", "-y", *args, str(destino)], check=True)


def pasta_projeto(slug: str) -> Path:
    base = RAIZ / "projetos"
    existente = next((p for p in base.glob(f"* ingles-{slug}") if p.is_dir()), None)
    if existente:
        return existente
    nums = [int(m.group(1)) for p in base.iterdir() if (m := re.match(r"(\d{3})\. ", p.name))]
    return base / f"{max(nums, default=0) + 1:03d}. ingles-{slug}"


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    roteiro_src = Path(args[0]).resolve()
    roteiro = json.loads(roteiro_src.read_text(encoding="utf-8"))
    erros = narrar.validar(roteiro)
    if erros:
        sys.exit("roteiro inválido:\n  - " + "\n  - ".join(erros))

    proj = pasta_projeto(roteiro["slug"])
    for sub in ("prints", "audio", "transcricao"):
        (proj / sub).mkdir(parents=True, exist_ok=True)

    # Fotos do apresentador: serie-ingles/fotos/* viram prints/foto1..N.jpg
    fotos = sorted(p for p in FOTOS.glob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")) if FOTOS.exists() else []
    roteiro["fotos"] = []
    for i, f in enumerate(fotos, 1):
        nome = f"foto{i}{f.suffix.lower()}"
        shutil.copy2(f, proj / "prints" / nome)
        roteiro["fotos"].append(f"prints/{nome}")
    (proj / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")

    formato = roteiro.get("formato", "episodio")
    limite = narrar.FORMATOS[formato]["limite"]
    gerar_sfx()
    # Cabe no YouTube Shorts (< 3:00): se passar, acelera um pouco as vozes e encurta as pausas, até 3 vezes.
    for tentativa in range(4):
        asyncio.run(narrar.main(proj, False))
        dur = json.loads((proj / "transcricao" / "episodio.json").read_text(encoding="utf-8"))["duracao"]
        if limite is None or dur <= limite or tentativa == 3:
            break
        for v in roteiro["vozes"].values():
            v["rate"] = f"{int(v['rate'].rstrip('%')) + 4:+d}%"
        for c in roteiro["cenas"]:
            for f in c["falas"]:
                if "pausa" in f:
                    f["pausa"] = round(max(1.2, f["pausa"] * 0.88), 2)
        print(f"{dur:.1f}s passou de {limite}s: tentando de novo com {roteiro['vozes']}")
        (proj / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
    if limite and dur > limite:
        print(f"AVISO: {dur:.1f}s ainda passa de {limite}s, o limite do formato {formato}.")

    saida = RAIZ / "edicoes" / proj.name
    saida.mkdir(parents=True, exist_ok=True)
    mp4 = saida / f"{roteiro['slug']}.mp4"
    post = {**roteiro["post"], "episodio": roteiro["episodio"], "slug": roteiro["slug"], "arquivo": str(mp4.relative_to(RAIZ))}
    (saida / "post.json").write_text(json.dumps(post, ensure_ascii=False, indent=2), encoding="utf-8")

    if "--sem-render" not in sys.argv:
        subprocess.run(
            # O longo sai só em 16:9 (YouTube tradicional); short e episódio saem em 9:16.
            [NPX, "remotion", "render", "src/index.ts", f"ingles-{roteiro['slug']}{'-h' if formato == 'longo' else ''}", str(mp4),
             "--codec=h264", "--crf=20", "--audio-codec=aac", "--log=error", "--timeout=120000", CONCORRENCIA],
            cwd=RAIZ, check=True,
        )
        dur = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)],
            capture_output=True, text=True, check=True,
        ).stdout)
        print(f"render ok: {dur:.1f}s")
        if "--horizontal" in sys.argv:  # versão 16:9 para o YouTube tradicional
            subprocess.run(
                [NPX, "remotion", "render", "src/index.ts", f"ingles-{roteiro['slug']}-h", str(saida / f"{roteiro['slug']}-16x9.mp4"),
                 "--codec=h264", "--crf=20", "--audio-codec=aac", "--log=error", "--timeout=120000", CONCORRENCIA],
                cwd=RAIZ, check=True,
            )
    print(mp4.relative_to(RAIZ).as_posix())


if __name__ == "__main__":
    main()
