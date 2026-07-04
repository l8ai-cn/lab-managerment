"""Chinese-aware text tokenization for knowledge search."""

from __future__ import annotations

import math
import re
from collections import Counter


def space_cjk(text: str) -> str:
    """Insert spaces between CJK characters so FTS unicode61 can index them individually."""
    parts: list[str] = []
    for ch in text:
        if "\u4e00" <= ch <= "\u9fff":
            parts.append(ch)
            parts.append(" ")
        else:
            parts.append(ch)
    return "".join(parts).strip()


def _tokenize(text: str) -> list[str]:
    tokens: list[str] = []
    for segment in re.findall(r"[\u4e00-\u9fff]+|[a-zA-Z0-9_]+", text.lower()):
        if re.fullmatch(r"[\u4e00-\u9fff]+", segment):
            tokens.extend(list(segment))
        else:
            tokens.append(segment)
    return tokens


def term_vector(text: str) -> dict[str, float]:
    tokens = _tokenize(text)
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = len(tokens)
    return {t: c / total for t, c in counts.items()}


def cosine_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    common = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in common)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def fts_query(q: str) -> str:
    """Build an FTS5 MATCH string from user query (supports partial Chinese)."""
    safe = q.replace('"', '""').strip()
    if not safe:
        return ""
    cjk_chars = [c for c in safe if "\u4e00" <= c <= "\u9fff"]
    if cjk_chars:
        return " ".join(cjk_chars)
    return safe
