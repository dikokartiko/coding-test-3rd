"""
Unit tests for DocumentProcessor helper methods touching Phase 2 changes.
"""
from __future__ import annotations

from decimal import Decimal

import pytest

from app.core.config import settings
from app.services.document_processor import DocumentProcessor


@pytest.fixture
def processor() -> DocumentProcessor:
    return DocumentProcessor()


def test_parse_amount_parentheses(processor: DocumentProcessor) -> None:
    assert processor._parse_amount("($250,000)") == pytest.approx(-250_000)  # type: ignore[attr-defined]


def test_parse_amount_unicode_minus(processor: DocumentProcessor) -> None:
    assert processor._parse_amount("−7500") == pytest.approx(-7500)  # type: ignore[attr-defined]


def test_parse_amount_trailing_minus(processor: DocumentProcessor) -> None:
    assert processor._parse_amount("12,345-") == pytest.approx(-12345)  # type: ignore[attr-defined]


def test_parse_amount_numeric_variants(processor: DocumentProcessor) -> None:
    assert processor._parse_amount(Decimal("10")) == Decimal("10")  # type: ignore[attr-defined]
    assert processor._parse_amount(5) == Decimal("5")  # type: ignore[attr-defined]
    assert processor._parse_amount("–40") == pytest.approx(-40)  # type: ignore[attr-defined]
    assert processor._parse_amount("—60") == pytest.approx(-60)  # type: ignore[attr-defined]
    assert processor._parse_amount("abc") is None  # type: ignore[attr-defined]
    assert processor._parse_amount("") is None  # type: ignore[attr-defined]
    assert processor._parse_amount(None) is None  # type: ignore[attr-defined]
    assert processor._parse_amount("1.2.3") is None  # type: ignore[attr-defined]


def test_chunk_text_preserves_sentences(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    monkeypatch.setattr(settings, "CHUNK_SIZE", 200)
    monkeypatch.setattr(settings, "CHUNK_OVERLAP", 100)

    sentences = [
        f"Kalimat nomor {i} dengan panjang cukup untuk pengujian ini."
        for i in range(1, 11)
    ]
    text_content = [
        {"page": 1, "text": " ".join(sentences[:5])},
        {"page": 2, "text": " ".join(sentences[5:])},
        {"page": 3, "text": ""},
    ]

    chunks = processor._chunk_text(text_content)  # type: ignore[attr-defined]

    assert len(chunks) >= 2
    assert chunks[0]["page_start"] == 1
    assert chunks[-1]["page_end"] == 2
    assert any(sentence in chunks[0]["content"] and sentence in chunks[1]["content"] for sentence in sentences)


def test_split_sentences_handles_whitespace(processor: DocumentProcessor) -> None:
    text = "Kalimat satu!\nKalimat dua?  Kalimat tiga."
    sentences = list(processor._split_sentences(text))  # type: ignore[attr-defined]
    assert sentences[0].endswith("satu!")
    assert sentences[1].startswith("Kalimat dua")


def test_chunk_text_empty(processor: DocumentProcessor) -> None:
    assert processor._chunk_text([]) == []  # type: ignore[attr-defined]


def test_chunk_text_zero_overlap(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    monkeypatch.setattr(settings, "CHUNK_SIZE", 200)
    monkeypatch.setattr(settings, "CHUNK_OVERLAP", 0)

    long_paragraph = " ".join(["Kalimat contoh dengan panjang yang memadai."] * 10)
    text_content = [
        {"page": 1, "text": long_paragraph},
        {"page": 2, "text": long_paragraph},
    ]

    chunks = processor._chunk_text(text_content)  # type: ignore[attr-defined]

    assert len(chunks) >= 2
    assert chunks[-1]["page_end"] == 2


def test_extract_field_and_parse_helpers_edge_cases(processor: DocumentProcessor) -> None:
    assert processor._extract_field({}, ["any"]) is None  # type: ignore[attr-defined]
    assert processor._parse_date("   ") is None  # type: ignore[attr-defined]
    assert processor._parse_bool(True) is True  # type: ignore[attr-defined]
