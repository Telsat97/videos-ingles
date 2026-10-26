"""Uma rodada do robô diário (GitHub Actions). Ver serie-ingles/PLANO-DO-TIME.md.

Uso:  python tools/rodada.py global   → próximo micro-Short global (serie-ingles/fila-global/): YouTube + Drive
      python tools/rodada.py pt       → próximo episódio em português (serie-ingles/fila/): só Drive
                                        (o dono reposta no TikTok e no Facebook; o YouTube agora é global)

Variáveis: TEM_YT, TEM_DRIVE ("true"/"false"), YT_PRIVACIDADE e as credenciais de tools/publicar.py.
O roteiro só sai da fila (git mv + registro em ensinado.json) se chegou ao destino principal da rodada.
O commit e o push ficam com o workflow.
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import narrar  # noqa: E402

# Intervalo mínimo entre duas publicações do mesmo tipo. O GitHub atrasa (e às vezes junta) agendamentos: sem esta
# trava, um agendamento atrasado somado a um disparo manual publicaria 3 Shorts no mesmo dia (risco de política).
INTERVALO_H = {"global": 6, "pt": 18}

FILAS = {
    "global": (RAIZ / "serie-ingles" / "fila-global", RAIZ / "serie-ingles" / "publicados-global"),
    "pt": (RAIZ / "serie-ingles" / "fila", RAIZ / "serie-ingles" / "publicados"),
}


def rodar(cmd: list[str]) -> subprocess.CompletedProcess:
    print("$", " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=RAIZ, text=True, capture_output=True)


def main() -> None:
    tipo = sys.argv[1]
    fila, publicados = FILAS[tipo]
    roteiros = sorted(fila.glob("*.json"))
    if not roteiros:
        print(f"::warning::Fila {fila.relative_to(RAIZ)} vazia: nada a produzir nesta rodada.")
        return
    ultimo = subprocess.run(["git", "log", "-1", "--format=%ct", "--", str(publicados)], cwd=RAIZ, text=True,
                            capture_output=True).stdout.strip()
    if ultimo and os.environ.get("FORCAR") != "true":
        horas = (time.time() - int(ultimo)) / 3600
        if horas < INTERVALO_H[tipo]:
            print(f"::notice::A última publicação {tipo} foi há {horas:.1f} h (mínimo {INTERVALO_H[tipo]} h): rodada pulada.")
            return
    roteiro = roteiros[0]
    print(f"Roteiro desta rodada: {roteiro.relative_to(RAIZ)}")

    prod = rodar([sys.executable, "tools/produzir.py", str(roteiro)])
    print(prod.stdout[-3000:], prod.stderr[-3000:], sep="\n")
    if prod.returncode != 0:
        sys.exit("::error::A produção falhou.")
    mp4 = RAIZ / prod.stdout.strip().splitlines()[-1]
    pasta = mp4.parent

    no_drive = False
    if os.environ.get("TEM_DRIVE") == "true":
        d = rodar(["rclone", "copy", str(pasta), f"gdrive:Ingles Facil/{pasta.name}"])
        no_drive = d.returncode == 0
        print("Drive:", "ok" if no_drive else f"falhou\n{d.stderr[-1500:]}")

    no_youtube = False
    if tipo == "global" and os.environ.get("TEM_YT") == "true":
        y = rodar([sys.executable, "tools/publicar.py", "youtube", str(pasta / "post.json")])
        print(y.stdout, y.stderr[-3000:], sep="\n")
        no_youtube = y.returncode == 0

    entregue = no_youtube if tipo == "global" else no_drive
    if not entregue:
        sys.exit("::error::Não chegou ao destino principal; o roteiro fica na fila para a próxima rodada.")
    narrar.registrar(json.loads(roteiro.read_text(encoding="utf-8")))
    publicados.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "mv", str(roteiro), str(publicados / roteiro.name)], cwd=RAIZ, check=True)
    print(f"Publicado e registrado: {roteiro.name}")


if __name__ == "__main__":
    main()
