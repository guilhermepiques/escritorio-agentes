"""Narração com o Gemini (Google AI Studio, chave grátis) para um vídeo inteiro.

O Gemini fala o texto de TODAS as cenas num pedido só (gasta 1 pedido do limite
grátis por vídeo e a entonação fica contínua). Depois o Whisper local (grátis)
acha o tempo de cada palavra, e o áudio é cortado em um arquivo por cena.

Uso (chamado pelo render.mjs):
  python scripts/voz_gemini.py --entrada pedido.json --saida pasta/

pedido.json: {"voz": "Kore", "estilo": "animada, ritmo rápido", "modelo": "...", "textos": ["cena 1", "cena 2", ...]}
saída: pasta/cena-01.mp3 ... e pasta/resultado.json:
  {"cenas": [{"mp3": "...", "duracao": 2.31, "palavras": [{"texto", "inicio", "fim"}]}]}

A chave vem de GEMINI_API_KEY (variável de ambiente ou estudio/.env, que fica fora do Git).
Para testar sem chave: ESTUDIO_TESTE_SEM_GEMINI=1 usa o edge-tts no lugar do Gemini.
"""

import argparse
import base64
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.request
import wave
from pathlib import Path

ESTUDIO = Path(__file__).resolve().parent.parent
MODELO_PADRAO = "gemini-2.5-flash-preview-tts"


def ler_env():
    arq = ESTUDIO / ".env"
    if arq.exists():
        for linha in arq.read_text(encoding="utf-8-sig").splitlines():
            if "=" in linha and not linha.strip().startswith("#"):
                k, v = linha.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def normal(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]", "", s)


def gemini_wav(texto: str, voz: str, estilo: str, modelo: str, wav: Path) -> None:
    chave = os.environ.get("GEMINI_API_KEY")
    if not chave:
        sys.exit("Falta a chave do Gemini: crie GEMINI_API_KEY em estudio/.env (ver README, seção Voz do Gemini).")
    instrucao = f"Leia em voz alta, em português do Brasil, {estilo}. Leia exatamente o texto, sem acrescentar nada:\n\n{texto}"
    corpo = {
        "contents": [{"parts": [{"text": instrucao}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voz}}},
        },
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent",
        data=json.dumps(corpo).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": chave},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode("utf-8", "replace")[:500]
        if e.code == 429:
            sys.exit(f"Gemini: limite grátis do dia atingido (429). Use a voz edge (francisca, antonio, thalita) ou espere virar o dia. {detalhe}")
        sys.exit(f"Gemini respondeu erro {e.code}: {detalhe}")
    try:
        dados = base64.b64decode(resp["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
    except (KeyError, IndexError):
        sys.exit(f"Gemini não devolveu áudio: {json.dumps(resp)[:500]}")
    with wave.open(str(wav), "wb") as w:  # PCM 16 bits, mono, 24 kHz
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(dados)


def teste_edge_wav(texto: str, wav: Path) -> None:
    """Só para testar o corte por cenas sem chave do Gemini."""
    mp3 = wav.with_suffix(".teste.mp3")
    subprocess.run([sys.executable, "-m", "edge_tts", "--voice", "pt-BR-FranciscaNeural", "--text", texto, "--write-media", str(mp3)], check=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-ar", "24000", "-ac", "1", str(wav)], check=True)


def palavras_whisper(wav: Path) -> list:
    from faster_whisper import WhisperModel

    import numpy as np

    # decodifica com o ffmpeg (evita depender da versão do PyAV)
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-ar", "16000", "-ac", "1", "-f", "s16le", "-"], check=True, capture_output=True).stdout
    audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
    modelo = WhisperModel(os.environ.get("ESTUDIO_WHISPER", "base"), device="cpu", compute_type="int8")
    segs, _ = modelo.transcribe(audio, language="pt", word_timestamps=True, vad_filter=False)
    return [{"texto": w.word.strip(), "inicio": w.start, "fim": w.end} for s in segs for w in s.words if w.word.strip()]


def alinhar(textos: list, ouvidas: list) -> list:
    """Põe tempos nas palavras do ROTEIRO (a legenda mostra o texto certo, não o que o Whisper entendeu)."""
    roteiro = [(i, p) for i, t in enumerate(textos) for p in t.split()]
    a = [normal(p) for _, p in roteiro]
    b = [normal(w["texto"]) for w in ouvidas]
    tempos = [None] * len(roteiro)
    for bloco in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(bloco.size):
            w = ouvidas[bloco.b + k]
            tempos[bloco.a + k] = (w["inicio"], w["fim"])
    # palavras sem par (número falado diferente, etc.): distribui entre os vizinhos
    n = len(tempos)
    for i in range(n):
        if tempos[i] is None:
            ant = next((tempos[j][1] for j in range(i - 1, -1, -1) if tempos[j]), 0.0)
            j2 = next((j for j in range(i + 1, n) if tempos[j]), None)
            prox = tempos[j2][0] if j2 is not None else ant + 0.4
            faltam = (j2 if j2 is not None else n) - i
            passo = max(0.05, (prox - ant) / (faltam + 1))
            tempos[i] = (ant + passo * 0.5, ant + passo)
    cenas = [[] for _ in textos]
    for (cena, palavra), (ini, fim) in zip(roteiro, tempos):
        cenas[cena].append({"texto": re.sub(r"[.,!?;:…]+$", "", palavra), "inicio": ini, "fim": fim})
    return cenas


def main() -> None:
    ler_env()
    p = argparse.ArgumentParser()
    p.add_argument("--entrada", required=True)
    p.add_argument("--saida", required=True)
    a = p.parse_args()
    pedido = json.loads(Path(a.entrada).read_text(encoding="utf-8"))
    saida = Path(a.saida)
    saida.mkdir(parents=True, exist_ok=True)
    textos = [t.strip() for t in pedido["textos"]]

    wav = saida / "inteiro.wav"
    if os.environ.get("ESTUDIO_TESTE_SEM_GEMINI"):
        teste_edge_wav("\n\n".join(textos), wav)
    else:
        gemini_wav("\n\n".join(textos), pedido.get("voz", "Kore"), pedido.get("estilo", "com naturalidade"), pedido.get("modelo") or os.environ.get("GEMINI_TTS_MODELO") or MODELO_PADRAO, wav)

    with wave.open(str(wav)) as w:
        total = w.getnframes() / w.getframerate()
    cenas = alinhar(textos, palavras_whisper(wav))

    # corta entre o fim da última palavra de uma cena e o começo da próxima
    resultado = []
    for i, palavras in enumerate(cenas):
        ini = 0.0 if i == 0 else (cenas[i - 1][-1]["fim"] + palavras[0]["inicio"]) / 2
        fim = total if i == len(cenas) - 1 else (palavras[-1]["fim"] + cenas[i + 1][0]["inicio"]) / 2
        mp3 = saida / f"cena-{i + 1:02d}.mp3"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-ss", f"{ini:.3f}", "-to", f"{fim:.3f}", "-ar", "44100", "-b:a", "160k", str(mp3)], check=True)
        resultado.append(
            {
                "mp3": str(mp3),
                "duracao": round(fim - ini, 3),
                "fimFala": round(palavras[-1]["fim"] - ini, 3),
                "palavras": [{"texto": w["texto"], "inicio": round(w["inicio"] - ini, 3), "fim": round(w["fim"] - ini, 3)} for w in palavras],
            }
        )
    (saida / "resultado.json").write_text(json.dumps({"cenas": resultado}, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
