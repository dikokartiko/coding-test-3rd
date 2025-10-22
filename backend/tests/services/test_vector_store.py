"""
Unit tests for VectorStore helper behaviour introduced in Phase 2 changes.
"""
from __future__ import annotations

import json

import numpy as np
import pytest

from app.services.vector_store import VectorStore


@pytest.fixture
def dummy_session():
    class DummySession:
        def __init__(self):
            self.statements = []
            self.commit_called = False
            self.rollback_called = False
            self.next_result = []

        def execute(self, statement, params=None):
            self.statements.append((statement, params))
            result = list(self.next_result)
            self.next_result = []
            return result

        def commit(self):
            self.commit_called = True

        def rollback(self):
            self.rollback_called = True

    return DummySession()


@pytest.fixture
def vector_store(monkeypatch: pytest.MonkeyPatch, dummy_session):
    class DummyEmbeddings:
        dimension = 3

        def embed_query(self, text: str):
            raise AssertionError("embed_query should not be called in this test")

    monkeypatch.setattr(VectorStore, "_initialize_embeddings", lambda self: (DummyEmbeddings(), 3))
    monkeypatch.setattr(VectorStore, "_ensure_extension", lambda self: None)

    store = VectorStore(db=dummy_session)

    async def fake_get_embedding(self, text: str):
        return np.array([0.1, 0.2, 0.3], dtype=np.float32)

    monkeypatch.setattr(store, "_get_embedding", fake_get_embedding.__get__(store, VectorStore))

    return store


@pytest.mark.asyncio
async def test_add_document_does_not_commit(vector_store: VectorStore, dummy_session) -> None:
    metadata = {"document_id": 7, "fund_id": 9, "page_start": 1}

    await vector_store.add_document("Contoh konten", metadata)

    assert dummy_session.commit_called is False
    assert len(dummy_session.statements) == 1
    _, params = dummy_session.statements[0]
    assert json.loads(params["metadata"]) == metadata
    assert params["embedding"].startswith("[0.10000000, 0.20000000")


@pytest.mark.asyncio
async def test_similarity_search_builds_filters(vector_store: VectorStore, dummy_session) -> None:
    dummy_session.next_result = [
        (1, 7, 9, "content", json.dumps({"section": "overview"}), 0.91)
    ]

    results = await vector_store.similarity_search(
        query="tes",
        k=2,
        filter_metadata={
            "fund_id": 9,
            "document_id": 7,
            "section": "overview",
        },
    )

    assert len(dummy_session.statements) == 1
    statement, params = dummy_session.statements[0]
    statement_sql = str(statement)
    assert "fund_id = :fund_id" in statement_sql
    assert "document_id = :document_id" in statement_sql
    assert "metadata @> :metadata_filter" in statement_sql

    assert params["fund_id"] == 9
    assert params["document_id"] == 7
    assert json.loads(params["metadata_filter"]) == {"section": "overview"}

    assert len(results) == 1
    assert results[0]["score"] == pytest.approx(0.91)
