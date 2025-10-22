"""
Unit tests for QueryEngine LLM provider selection.
"""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.services import query_engine as qe_module


class _DummyVectorStore:
    def __init__(self, db=None):
        self.db = db


class _DummyRAGEngine:
    def __init__(self, vector_store, llm):
        self.vector_store = vector_store
        self.llm = llm


class _DummyMetricsCalculator:
    def __init__(self, db):
        self.db = db

    def calculate_all_metrics(self, fund_id):  # pragma: no cover - not used here
        return {}


@pytest.fixture(autouse=True)
def _patch_dependencies(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(qe_module, "VectorStore", _DummyVectorStore)
    monkeypatch.setattr(qe_module, "RAGEngine", _DummyRAGEngine)
    monkeypatch.setattr(qe_module, "MetricsCalculator", _DummyMetricsCalculator)


def test_explicit_gemini_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    class _FakeGemini:
        def __init__(self, model, api_key, temperature):
            self.model = model
            self.api_key = api_key
            self.temperature = temperature

    monkeypatch.setattr(qe_module, "_GeminiChat", _FakeGemini)
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "models/gemini-flash-lite-latest")
    monkeypatch.setattr(settings, "GROK_API_KEY", "")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    engine = qe_module.QueryEngine(db=None)

    assert isinstance(engine.llm, _FakeGemini)
    assert engine.llm.model == "models/gemini-flash-lite-latest"
    assert engine.llm.api_key == "test-key"
    assert engine.llm.temperature == 0.0


def test_auto_provider_falls_back_to_gemini(monkeypatch: pytest.MonkeyPatch) -> None:
    class _FakeGemini:
        def __init__(self, model, api_key, temperature):
            self.model = model
            self.api_key = api_key
            self.temperature = temperature

    monkeypatch.setattr(qe_module, "_GeminiChat", _FakeGemini)
    monkeypatch.setattr(settings, "LLM_PROVIDER", "auto")
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "auto-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "models/gemini-flash-lite-latest")
    monkeypatch.setattr(settings, "GROK_API_KEY", "")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    engine = qe_module.QueryEngine(db=None)

    assert isinstance(engine.llm, _FakeGemini)
    assert engine.llm.api_key == "auto-key"


def test_gemini_provider_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "")
    monkeypatch.setattr(settings, "GROK_API_KEY", "")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    with pytest.raises(RuntimeError, match="requires GOOGLE_API_KEY"):
        qe_module.QueryEngine(db=None)
