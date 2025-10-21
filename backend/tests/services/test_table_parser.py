"""
Unit tests for the TableParser heuristics.

These tests focus on the classification logic that relies on tokenised headers,
ensuring we distinguish between capital calls, distributions (with "Recallable"
columns), and adjustments. Additional coverage exercises the extraction and
cleaning helpers so the module attains full coverage.
"""
from __future__ import annotations

from typing import Any, List

import pytest

from app.services.table_parser import TableParser


@pytest.fixture
def parser() -> TableParser:
    return TableParser()


def test_classify_capital_call_table(parser: TableParser) -> None:
    table = [
        ["Date", "Call Number", "Amount", "Description"],
        ["2024-03-10", "Call 3", "$2,000,000", "Bridge Round Funding"],
    ]

    assert parser.classify_table_type(table) == "capital_call"


def test_classify_distribution_table_with_recallable(parser: TableParser) -> None:
    table = [
        ["Date", "Type", "Amount", "Recallable", "Description"],
        ["2024-06-20", "Income", "$500,000", "No", "Dividend Payment"],
    ]

    assert parser.classify_table_type(table) == "distribution"


def test_classify_adjustment_table(parser: TableParser) -> None:
    table = [
        ["Date", "Type", "Amount", "Description"],
        ["2024-03-20", "Capital Call Adjustment", "$100,000", "Fee adjustment"],
    ]

    assert parser.classify_table_type(table) == "adjustment"


def test_classify_unknown_table(parser: TableParser) -> None:
    table = [
        ["Item", "Value"],
        ["Total Capital", "$10,000,000"],
    ]

    assert parser.classify_table_type(table) == "unknown"


def test_classify_empty_table(parser: TableParser) -> None:
    assert parser.classify_table_type([]) == "unknown"
    assert parser.classify_table_type([[]]) == "unknown"


def test_parse_table_data_includes_table_type(parser: TableParser) -> None:
    table = [
        ["Date", "Call Number", "Amount", "Description"],
        ["2024-03-10", "Call 3", "$2,000,000", "Bridge Round Funding"],
        ["2024-09-15", "Call 4", "$1,500,000", "Additional Capital"],
    ]

    records = parser.parse_table_data(table, "capital_call")

    assert len(records) == 2
    assert all(record["table_type"] == "capital_call" for record in records)
    assert records[0]["Date"] == "2024-03-10"
    assert records[0]["Amount"] == 2000000.0


def test_parse_table_data_without_headers(parser: TableParser) -> None:
    table: List[List[Any]] = [
        [1, 2],
        [3, 4],
    ]

    records = parser.parse_table_data(table, "capital_call")

    assert len(records) == 2
    assert records[0]["column_0"] == 1.0
    assert records[1]["column_1"] == 4.0
    assert records[0]["table_type"] == "capital_call"


def test_parse_table_data_empty_table(parser: TableParser) -> None:
    assert parser.parse_table_data([], "capital_call") == []


def test_clean_value_variants(parser: TableParser) -> None:
    assert parser._clean_value(None) is None  # type: ignore[attr-defined]
    assert parser._clean_value("$1,234") == 1234.0  # type: ignore[attr-defined]
    assert parser._clean_value("50%") == 0.5  # type: ignore[attr-defined]
    assert parser._clean_value("N/A") is None  # type: ignore[attr-defined]
    assert parser._clean_value("text") == "text"  # type: ignore[attr-defined]
    assert parser._clean_value("$abc") == "$abc"  # type: ignore[attr-defined]
    assert parser._clean_value("%") == "%"  # type: ignore[attr-defined]
    assert parser._clean_value("1,23a") == "1,23a"  # type: ignore[attr-defined]


def test_is_numeric(parser: TableParser) -> None:
    assert parser._is_numeric_value("1,234")  # type: ignore[attr-defined]
    assert not parser._is_numeric_value("abc")  # type: ignore[attr-defined]
    assert not parser._is_numeric_value(None)  # type: ignore[attr-defined]


def test_extract_tables(monkeypatch: pytest.MonkeyPatch, parser: TableParser) -> None:
    class DummyPage:
        def __init__(self, tables: List[List[List[Any]]]):
            self._tables = tables

        def extract_tables(self) -> List[List[List[Any]]]:
            return self._tables

    class DummyPDF:
        def __init__(self, pages: List[DummyPage]):
            self.pages = pages

        def __enter__(self) -> "DummyPDF":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            return None

    dummy_tables = [
        [["Date", "Type", "Amount", "Recallable"], ["2024-06-20", "Income", "$500,000", "No"]],
        [[None], [None]],  # Fully empty -> ignored
    ]

    dummy_pdf = DummyPDF([DummyPage(dummy_tables)])
    monkeypatch.setattr("app.services.table_parser.pdfplumber.open", lambda _: dummy_pdf)

    tables = parser.extract_tables("dummy.pdf")

    assert len(tables) == 1
    assert tables[0]["type"] == "distribution"
    assert tables[0]["page"] == 1
