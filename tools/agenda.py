"""Decide o que a rodada agendada deve produzir agora (o workflow roda a cada 2 h; ver episodio-diario.yml).

O GitHub atrasa ou pula agendamentos (medido: 1-6 h). Em vez de dois horários fixos, o robô acorda com frequência
e publica quando estiver "na hora", com base no histórico do git:
- Short global: no máximo 2 por 24 h, com 9 h entre um e outro, dentro da janela 11-02 UTC (manhã nas Américas
  até a noite na Índia/Europa);
- o episódio em português virou o desenho 3D infantil, com robô próprio (.github/workflows/kids.yml);
  a rodada "pt" antiga (apresentador adulto) só roda por disparo manual.
Imprime `rodada=nenhuma|global|pt|ambos` (para $GITHUB_OUTPUT).
"""
import subprocess
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def publicacoes(pasta: str) -> list[float]:
    """Horas (epoch) dos commits que trouxeram roteiros para a pasta de publicados (mais recente primeiro)."""
    saida = subprocess.run(["git", "log", "--format=%ct", "--diff-filter=AR", "--", pasta], cwd=RAIZ, text=True,
                           capture_output=True).stdout.split()
    return [float(t) for t in saida]


def main() -> None:
    agora = time.time()
    hora_utc = time.gmtime(agora).tm_hour
    globais = publicacoes("serie-ingles/publicados-global")
    na_janela = hora_utc >= 11 or hora_utc < 2
    ultimas_24h = sum(1 for t in globais if agora - t < 24 * 3600)
    global_ok = na_janela and ultimas_24h < 2 and (not globais or agora - globais[0] >= 9 * 3600)
    pt_ok = False  # substituído pelo kids.yml
    rodada = "ambos" if global_ok and pt_ok else "global" if global_ok else "pt" if pt_ok else "nenhuma"
    print(f"rodada={rodada}")


if __name__ == "__main__":
    main()
