"""
Comprehensive tests for DocumentProcessor to drive coverage of Phase 2 logic.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

import pytest

from app.services import document_processor as dp_module
from app.services.document_processor import DocumentProcessor


class DummyQuery:
    def __init__(self, first_result: Any = None):
        self.first_result = first_result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.first_result


class DummySession:
    def __init__(self, query_results: Optional[List[Any]] = None):
        self._query_results = list(query_results or [])
        self.added: List[Any] = []
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def query(self, model):
        result = self._query_results.pop(0) if self._query_results else None
        return DummyQuery(result)

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


class DummyVectorStore:
    def __init__(self, db):
        self.db = db
        self.added: List[Dict[str, Any]] = []

    async def add_document(self, content: str, metadata: Dict[str, Any]):
        self.added.append({"content": content, "metadata": metadata})


class DummyPdfPage:
    def __init__(self, text: Optional[str]):
        self._text = text

    def extract_text(self, **kwargs):
        return self._text


class DummyPdf:
    def __init__(self, texts: List[Optional[str]]):
        self.pages = [DummyPdfPage(text) for text in texts]

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


@pytest.fixture
def processor(monkeypatch: pytest.MonkeyPatch) -> DocumentProcessor:
    monkeypatch.setattr(dp_module, "SessionLocal", lambda: DummySession())
    monkeypatch.setattr(dp_module, "VectorStore", DummyVectorStore)
    return DocumentProcessor()


class DummyDocling:
    def __init__(self, available: bool, result: Optional[Dict[str, Any]] = None, error: Optional[Exception] = None):
        self.available = available
        self._result = result
        self._error = error

    def extract_text(self, _file_path: str) -> Dict[str, Any]:
        if self._error:
            raise self._error
        return self._result or {"text_blocks": [], "page_count": 0}


class DummyTableParser:
    def __init__(self):
        self.tables = [
            {"data": [["header"]], "type": "capital_call"},
            {"data": [["header"]], "type": "distribution"},
            {"data": [["header"]], "type": "adjustment"},
            {"data": [["header"]], "type": "unknown"},
        ]

    def extract_tables(self, _file_path: str):
        return self.tables

    def parse_table_data(self, _table, table_type: str):
        if table_type == "capital_call":
            return [
                {
                    "Call Date": "2024-01-10",
                    "Amount": "$1,000",
                    "Type": "Capital Call",
                    "Description": "Initial call",
                    "table_type": table_type,
                }
            ]
        if table_type == "distribution":
            return [
                {
                    "Distribution Date": "2024-02-15",
                    "Amount": "$500",
                    "Recallable": "Yes",
                    "Description": "First distribution",
                    "table_type": table_type,
                }
            ]
        if table_type == "adjustment":
            return [
                {
                    "Adjustment Date": "2024-03-01",
                    "Amount": "$50",
                    "Type": "True-up",
                    "Category": "Fee",
                    "Contribution Adjustment": "true",
                    "Description": "Fee adjustment",
                    "table_type": table_type,
                }
            ]
        return [{"Other": "data", "table_type": table_type}]


@pytest.mark.asyncio
async def test_process_document_docling_success(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    dummy_db = DummySession()
    monkeypatch.setattr(dp_module, "SessionLocal", lambda: dummy_db)
    monkeypatch.setattr(dp_module, "VectorStore", DummyVectorStore)

    processor.docling_parser = DummyDocling(
        available=True,
        result={
            "text_blocks": [
                {"page": 1, "text": "Kalimat pertama. Kalimat kedua."},
                {"page": 2, "text": "Kalimat ketiga."},
            ],
            "page_count": 2,
        },
    )
    processor.table_parser = DummyTableParser()

    stats = await processor.process_document("dummy.pdf", document_id=1, fund_id=2)

    assert stats["status"] == "completed"
    assert stats["docling_used"] is True
    assert stats["fallback_to_pdfplumber"] is False
    assert stats["pages_processed"] == 2
    assert stats["records"]["capital_calls"] == 1
    assert stats["records"]["distributions"] == 1
    assert stats["records"]["adjustments"] == 1
    assert stats["records"]["unclassified"] == 1
    assert stats["chunks_created"] >= 1
    assert dummy_db.committed is True
    assert dummy_db.closed is True


@pytest.mark.asyncio
async def test_process_document_falls_back_to_pdfplumber(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    dummy_db = DummySession()
    monkeypatch.setattr(dp_module, "SessionLocal", lambda: dummy_db)
    monkeypatch.setattr(dp_module, "VectorStore", DummyVectorStore)

    processor.docling_parser = DummyDocling(available=False)
    processor.table_parser = DummyTableParser()

    dummy_pdf = DummyPdf(["Halaman satu.", None])
    monkeypatch.setattr(dp_module.pdfplumber, "open", lambda _path: dummy_pdf)

    stats = await processor.process_document("dummy.pdf", document_id=99, fund_id=42)

    assert stats["docling_used"] is False
    assert stats["fallback_to_pdfplumber"] is True
    assert stats["pages_processed"] == 2
    assert any(chunk["page_start"] == 1 for chunk in processor._chunk_text([{"page": 1, "text": "Test."}]))  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_process_document_docling_error(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    dummy_db = DummySession()
    monkeypatch.setattr(dp_module, "SessionLocal", lambda: dummy_db)
    monkeypatch.setattr(dp_module, "VectorStore", DummyVectorStore)

    processor.docling_parser = DummyDocling(available=True, error=RuntimeError("docling failed"))
    processor.table_parser = DummyTableParser()

    dummy_pdf = DummyPdf(["Fallback text."])
    monkeypatch.setattr(dp_module.pdfplumber, "open", lambda _path: dummy_pdf)

    stats = await processor.process_document("dummy.pdf", document_id=11, fund_id=22)

    assert stats["docling_used"] is False
    assert stats["fallback_to_pdfplumber"] is True


@pytest.mark.asyncio
async def test_process_document_counts_pages_when_missing(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    dummy_db = DummySession()
    monkeypatch.setattr(dp_module, "SessionLocal", lambda: dummy_db)
    monkeypatch.setattr(dp_module, "VectorStore", DummyVectorStore)

    processor.docling_parser = DummyDocling(
        available=True,
        result={
            "text_blocks": [{"page": None, "text": "Konten tanpa metadata halaman."}],
            "page_count": None,
        },
    )
    processor.table_parser = DummyTableParser()

    dummy_pdf = DummyPdf(["Halaman fallback."])
    count_called = {"called": False}

    def fake_count(self, path: str) -> int:
        count_called["called"] = True
        return 1

    monkeypatch.setattr(dp_module.pdfplumber, "open", lambda _path: dummy_pdf)
    monkeypatch.setattr(dp_module.DocumentProcessor, "_count_pdf_pages", fake_count)

    stats = await processor.process_document("dummy.pdf", document_id=3, fund_id=4)

    assert stats["pages_processed"] == 1
    assert count_called["called"] is True

def test_persist_capital_calls(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    session = DummySession(query_results=[None, object()])

    records = [
        {"Call Date": "2024-01-01", "Amount": "$1,000", "Description": "New call", "table_type": "capital_call"},
        {"Call Date": None, "Amount": "$500", "table_type": "capital_call"},
        {"Call Date": "2024-02-01", "Amount": "$750", "Description": "Existing", "Type": "Capital", "table_type": "capital_call"},
    ]

    saved = processor._persist_capital_calls(session, records, fund_id=1)  # type: ignore[attr-defined]

    assert saved == 1
    assert len(session.added) == 1


def test_persist_distributions(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    session = DummySession(query_results=[None, object()])

    records = [
        {
            "Distribution Date": "2024-03-01",
            "Amount": "$400",
            "Distribution Type": "Return",
            "Recallable": "y",
            "table_type": "distribution",
        },
        {
            "Date": "2024-03-10",
            "Distribution": "$200",
            "Recallable": "no",
            "Description": "Existing",
            "table_type": "distribution",
        },
        {
            "Distribution Date": "2024-03-15",
            "Amount": None,
            "table_type": "distribution",
        },
    ]

    saved = processor._persist_distributions(session, records, fund_id=5)  # type: ignore[attr-defined]

    assert saved == 1
    assert len(session.added) == 1


def test_persist_adjustments(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    session = DummySession(query_results=[None, object()])

    records = [
        {
            "Adjustment Date": "2024-04-01",
            "Amount": "$100",
            "Adjustment Type": "True-up",
            "Category": "Fees",
            "Contribution Adjustment": "1",
            "Description": "New adjustment",
            "table_type": "adjustment",
        },
        {
            "Adjustment": "$300",
            "Date": "2024-04-10",
            "Description": "Existing",
            "table_type": "adjustment",
        },
        {
            "Adjustment Date": "2024-04-12",
            "Amount": None,
            "table_type": "adjustment",
        },
    ]

    saved = processor._persist_adjustments(session, records, fund_id=8)  # type: ignore[attr-defined]

    assert saved == 1
    assert len(session.added) == 1


def test_extract_text_with_pdfplumber(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    dummy_pdf = DummyPdf(["Halaman satu.", "Halaman dua."])
    monkeypatch.setattr(dp_module.pdfplumber, "open", lambda _path: dummy_pdf)

    result = processor._extract_text_with_pdfplumber("dummy.pdf")  # type: ignore[attr-defined]

    assert result["page_count"] == 2
    assert result["text_blocks"][0]["page"] == 1


def test_count_pdf_pages(monkeypatch: pytest.MonkeyPatch, processor: DocumentProcessor) -> None:
    dummy_pdf = DummyPdf(["Halaman satu.", "Halaman dua.", ""])
    monkeypatch.setattr(dp_module.pdfplumber, "open", lambda _path: dummy_pdf)

    total = processor._count_pdf_pages("dummy.pdf")  # type: ignore[attr-defined]

    assert total == 3


def test_helper_extract_field_and_normalize(processor: DocumentProcessor) -> None:
    record = {
        "Date ": "2024-05-01",
        "Amount (USD)": 100,
        "table_type": "capital_call",
        "Notes": "Test",
    }
    assert processor._extract_field(record, ["date"]) == "2024-05-01"  # type: ignore[attr-defined]
    assert processor._extract_field(record, ["amount usd"]) == 100  # type: ignore[attr-defined]
    assert processor._extract_field(record, ["note"]) == "Test"  # type: ignore[attr-defined]
    assert processor._extract_field(record, ["missing"]) is None  # type: ignore[attr-defined]


def test_parse_date_variants(processor: DocumentProcessor) -> None:
    assert processor._parse_date(date(2024, 6, 1)) == date(2024, 6, 1)  # type: ignore[attr-defined]
    assert processor._parse_date(datetime(2024, 6, 2, 12, 0)) == date(2024, 6, 2)  # type: ignore[attr-defined]
    assert processor._parse_date("06/03/2024") == date(2024, 6, 3)  # type: ignore[attr-defined]
    assert processor._parse_date("2024-06-04") == date(2024, 6, 4)  # type: ignore[attr-defined]
    assert processor._parse_date("2024-06-05T10:00:00") == date(2024, 6, 5)  # type: ignore[attr-defined]
    assert processor._parse_date("invalid") is None  # type: ignore[attr-defined]


def test_parse_bool_and_string(processor: DocumentProcessor) -> None:
    assert processor._parse_bool("True") is True  # type: ignore[attr-defined]
    assert processor._parse_bool("recallable") is True  # type: ignore[attr-defined]
    assert processor._parse_bool(None) is False  # type: ignore[attr-defined]
    assert processor._string_or_none("  text  ") == "text"  # type: ignore[attr-defined]
    assert processor._string_or_none("   ") is None  # type: ignore[attr-defined]


def test_capital_distribution_adjustment_exists_helpers(processor: DocumentProcessor) -> None:
    session = DummySession(query_results=[object(), None, object()])

    assert processor._capital_call_exists(session, 1, date(2024, 1, 1), Decimal("1"), "Type", "Desc") is True  # type: ignore[attr-defined]
    assert processor._distribution_exists(session, 1, date(2024, 1, 2), Decimal("2"), None, None, False) is False  # type: ignore[attr-defined]
    assert processor._adjustment_exists(session, 1, date(2024, 1, 3), Decimal("3"), None, None) is True  # type: ignore[attr-defined]
