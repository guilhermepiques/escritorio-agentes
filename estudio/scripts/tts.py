"""Gera a narração de um trecho com o edge-tts (grátis) e anota o tempo de cada palavra.

Uso:
  python scripts/tts.py --voz pt-BR-FranciscaNeural --velocidade +8% --tom +0Hz \
      --texto arquivo.txt --mp3 saida.mp3 --json saida.json

O json sai assim: {"palavras": [{"texto": "Olá", "inicio": 0.1, "fim": 0.42}, ...]}
(tempos em segundos, contados do começo do mp3)
"""

import argparse
import asyncio
import json
import sys

import edge_tts


async def gerar(texto: str, voz: str, velocidade: str, tom: str, mp3: str) -> list:
    comunicar = edge_tts.Communicate(
        texto, voz, rate=velocidade, pitch=tom, boundary="WordBoundary"
    )
    palavras = []
    with open(mp3, "wb") as arquivo:
        async for pedaco in comunicar.stream():
            if pedaco["type"] == "audio":
                arquivo.write(pedaco["data"])
            elif pedaco["type"] == "WordBoundary":
                inicio = pedaco["offset"] / 10_000_000
                fim = (pedaco["offset"] + pedaco["duration"]) / 10_000_000
                palavras.append(
                    {"texto": pedaco["text"], "inicio": round(inicio, 3), "fim": round(fim, 3)}
                )
    return palavras


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--voz", required=True)
    p.add_argument("--velocidade", default="+0%")
    p.add_argument("--tom", default="+0Hz")
    p.add_argument("--texto", required=True, help="arquivo .txt com o texto (UTF-8)")
    p.add_argument("--mp3", required=True)
    p.add_argument("--json", required=True)
    a = p.parse_args()

    with open(a.texto, encoding="utf-8") as f:
        texto = f.read().strip()

    ultimo_erro = None
    for _ in range(3):
        try:
            palavras = asyncio.run(gerar(texto, a.voz, a.velocidade, a.tom, a.mp3))
            if not palavras:
                raise RuntimeError("o serviço de voz não devolveu os tempos das palavras")
            with open(a.json, "w", encoding="utf-8") as f:
                json.dump({"palavras": palavras}, f, ensure_ascii=False)
            return
        except Exception as erro:  # noqa: BLE001 - tenta de novo qualquer falha de rede
            ultimo_erro = erro
    print(f"Falha ao gerar a voz ({a.voz}): {ultimo_erro}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
