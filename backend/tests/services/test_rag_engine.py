"""
Unit tests for the RAGEngine helper introduced in Phase 3 implementation.
"""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.services.rag_engine import RAGEngine


class _FakeVectorStore:
    def __init__(self, results):
        self.results = results
        self.calls = []

    async def similarity_search(self, **kwargs):
        self.calls.append(kwargs)
        return self.results


class _FakeLLM:
    def __init__(self):
        self.messages = None

    async def ainvoke(self, messages):
        self.messages = messages

        class _Response:
            content = "jawaban"

        return _Response()


class _ErrorLLM:
    async def ainvoke(self, messages):
        raise ConnectionError("mock connection refused")


@pytest.mark.asyncio
async def test_retrieve_documents_respects_similarity_threshold(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "SIMILARITY_THRESHOLD", 0.75)
    store = _FakeVectorStore(
        [
            {"content": "relevant", "score": 0.9},
            {"content": "almost", "score": 0.74},
            {"content": "no score"},
        ]
    )
    engine = RAGEngine(vector_store=store, llm=_FakeLLM())

    docs = await engine.retrieve_documents("tanya", k=5, metadata_filter={"fund_id": 3})

    assert len(docs) == 2
    assert docs[0]["content"] == "relevant"
    assert docs[1]["content"] == "no score"
    assert store.calls[0]["filter_metadata"] == {"fund_id": 3}


@pytest.mark.asyncio
async def test_generate_answer_compiles_context(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "SIMILARITY_THRESHOLD", 0.0)
    store = _FakeVectorStore([])
    fake_llm = _FakeLLM()
    engine = RAGEngine(vector_store=store, llm=fake_llm)

    docs = [
        {
            "content": "Baris pertama.",
            "metadata": {"page_start": 1, "page_end": 2},
            "score": 0.8,
        }
    ]
    metrics = {"dpi": 0.4, "irr": None}
    history = [{"role": "user", "content": "Halo?"}]

    answer = await engine.generate_answer(
        query="Apa kabar?",
        documents=docs,
        metrics=metrics,
        conversation_history=history,
    )

    assert answer == "jawaban"
    assert fake_llm.messages is not None
    system_msg, user_msg = fake_llm.messages
    assert "financial analyst assistant" in system_msg.content.lower()
    assert "[Source 1" in user_msg.content
    assert "- DPI: 0.4" in user_msg.content
    assert "Previous Conversation" in user_msg.content


@pytest.mark.asyncio
async def test_fallback_answer_used_when_llm_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "SIMILARITY_THRESHOLD", 0.0)
    store = _FakeVectorStore([])
    engine = RAGEngine(vector_store=store, llm=_ErrorLLM())
    docs = [{"content": "Snippet", "metadata": {"page_start": 2}, "score": 0.8}]
    metrics = {"dpi": 0.5, "irr": None}

    answer = await engine.generate_answer(
        query="What is the current DPI?",
        documents=docs,
        metrics=metrics,
        conversation_history=[],
    )

    assert "**DPI**" in answer
    assert "Snippet" in answer
    assert "Error details" in answer
