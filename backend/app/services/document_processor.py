"""
Document processing service using pdfplumber and Docling.

Implements the Phase 2 pipeline:
- Extract tables from PDFs and classify them
- Persist structured data into SQL tables
- Extract text and create overlapping chunks for vector storage
- Generate embeddings (via VectorStore) for downstream RAG workflows
"""
from __future__ import annotations

import logging
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence

import pdfplumber

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.transaction import Adjustment, CapitalCall, Distribution
from app.services.docling_parser import DoclingParser
from app.services.table_parser import TableParser
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Process PDF documents and extract structured data."""

    def __init__(self) -> None:
        self.table_parser = TableParser()
        self.docling_parser = DoclingParser()

    async def process_document(
        self,
        file_path: str,
        document_id: int,
        fund_id: int,
    ) -> Dict[str, Any]:
        """
        Process a PDF document and persist structured data.

        Args:
            file_path: Path to the PDF file on disk.
            document_id: Associated document ID in the database.
            fund_id: Fund identifier to associate extracted data with.

        Returns:
            Summary statistics about the processing result.
        """
        db = SessionLocal()
        vector_store = VectorStore(db)

        stats: Dict[str, Any] = {
            "status": "processing",
            "document_id": document_id,
            "fund_id": fund_id,
            "pages_processed": 0,
            "tables_extracted": 0,
            "chunks_created": 0,
            "docling_used": False,
            "fallback_to_pdfplumber": False,
            "records": {
                "capital_calls": 0,
                "distributions": 0,
                "adjustments": 0,
                "unclassified": 0,
            },
        }

        try:
            text_content: List[Dict[str, Any]] = []
            page_count: Optional[int] = None

            if self.docling_parser.available:
                try:
                    docling_result = self.docling_parser.extract_text(file_path)
                    text_content = docling_result.get("text_blocks", [])
                    page_count = docling_result.get("page_count") or page_count
                    stats["docling_used"] = True
                except Exception as exc:
                    logger.warning("Docling parsing failed for %s: %s", file_path, exc)

            if not text_content:
                fallback_result = self._extract_text_with_pdfplumber(file_path)
                text_content = fallback_result["text_blocks"]
                page_count = page_count or fallback_result["page_count"]
                stats["fallback_to_pdfplumber"] = True

            if page_count is None:
                page_count = self._count_pdf_pages(file_path)

            stats["pages_processed"] = page_count

            # Extract tables (classification handled inside TableParser)
            tables = self.table_parser.extract_tables(file_path)
            stats["tables_extracted"] = len(tables)

            capital_call_records: List[Dict[str, Any]] = []
            distribution_records: List[Dict[str, Any]] = []
            adjustment_records: List[Dict[str, Any]] = []

            for table in tables:
                table_type = table.get("type", "unknown")
                parsed_records = self.table_parser.parse_table_data(
                    table.get("data") or [], table_type
                )

                if table_type == "capital_call":
                    capital_call_records.extend(parsed_records)
                elif table_type == "distribution":
                    distribution_records.extend(parsed_records)
                elif table_type == "adjustment":
                    adjustment_records.extend(parsed_records)
                else:
                    stats["records"]["unclassified"] += len(parsed_records)

            stats["records"]["capital_calls"] = self._persist_capital_calls(
                db, capital_call_records, fund_id
            )
            stats["records"]["distributions"] = self._persist_distributions(
                db, distribution_records, fund_id
            )
            stats["records"]["adjustments"] = self._persist_adjustments(
                db, adjustment_records, fund_id
            )
            db.commit()

            # Chunk text and store in vector database
            chunks = self._chunk_text(text_content)
            stats["chunks_created"] = len(chunks)

            for sequence_id, chunk in enumerate(chunks):
                metadata = {
                    "document_id": document_id,
                    "fund_id": fund_id,
                    "page_start": chunk.get("page_start"),
                    "page_end": chunk.get("page_end"),
                    "sequence": sequence_id,
                }
                await vector_store.add_document(chunk["content"], metadata)

            stats["status"] = "completed"
            return stats

        except Exception as exc:  # pragma: no cover - defensive logging
            db.rollback()
            stats["status"] = "failed"
            stats["error"] = str(exc)
            return stats
        finally:
            db.close()

    def _extract_text_with_pdfplumber(self, file_path: str) -> Dict[str, Any]:
        """Fallback text extraction using pdfplumber."""
        text_blocks: List[Dict[str, Any]] = []
        page_count = 0
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for page_index, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text(x_tolerance=2, y_tolerance=1)
                if page_text:
                    text_blocks.append(
                        {
                            "page": page_index,
                            "text": page_text,
                        }
                    )
        return {"text_blocks": text_blocks, "page_count": page_count}

    def _count_pdf_pages(self, file_path: str) -> int:
        """Count pages in a PDF."""
        with pdfplumber.open(file_path) as pdf:
            return len(pdf.pages)

    def _persist_capital_calls(
        self,
        db,
        records: Sequence[Dict[str, Any]],
        fund_id: int,
    ) -> int:
        """Store capital call records in the database."""
        saved = 0

        for record in records:
            call_date = self._parse_date_from_record(record, ["call date", "date"])
            amount = self._parse_amount(self._extract_field(record, ["amount", "capital"]))

            if not call_date or amount is None:
                continue

            call_type = self._string_or_none(
                self._extract_field(record, ["type", "call type", "category"])
            )
            description = self._string_or_none(
                self._extract_field(record, ["description", "details", "notes"])
            )

            if self._capital_call_exists(db, fund_id, call_date, amount, call_type, description):
                continue

            capital_call = CapitalCall(
                fund_id=fund_id,
                call_date=call_date,
                call_type=call_type,
                amount=amount,
                description=description,
            )
            db.add(capital_call)
            saved += 1

        return saved

    def _persist_distributions(
        self,
        db,
        records: Sequence[Dict[str, Any]],
        fund_id: int,
    ) -> int:
        """Store distribution records in the database."""
        saved = 0

        for record in records:
            distribution_date = self._parse_date_from_record(
                record, ["distribution date", "date"]
            )
            amount = self._parse_amount(self._extract_field(record, ["amount", "distribution"]))

            if not distribution_date or amount is None:
                continue

            distribution_type = self._string_or_none(
                self._extract_field(record, ["type", "distribution type", "category"])
            )
            description = self._string_or_none(
                self._extract_field(record, ["description", "details", "notes"])
            )
            is_recallable = self._parse_bool(
                self._extract_field(record, ["recallable", "is recallable", "recall"])
            )

            if self._distribution_exists(
                db,
                fund_id,
                distribution_date,
                amount,
                distribution_type,
                description,
                is_recallable,
            ):
                continue

            distribution = Distribution(
                fund_id=fund_id,
                distribution_date=distribution_date,
                distribution_type=distribution_type,
                is_recallable=is_recallable,
                amount=amount,
                description=description,
            )
            db.add(distribution)
            saved += 1

        return saved

    def _persist_adjustments(
        self,
        db,
        records: Sequence[Dict[str, Any]],
        fund_id: int,
    ) -> int:
        """Store adjustment records in the database."""
        saved = 0

        for record in records:
            adjustment_date = self._parse_date_from_record(record, ["adjustment date", "date"])
            amount = self._parse_amount(self._extract_field(record, ["amount", "adjustment"]))

            if not adjustment_date or amount is None:
                continue

            adjustment_type = self._string_or_none(
                self._extract_field(record, ["type", "adjustment type", "category"])
            )
            category = self._string_or_none(
                self._extract_field(record, ["category", "group", "classification"])
            )
            description = self._string_or_none(
                self._extract_field(record, ["description", "details", "notes"])
            )
            contribution_flag = self._parse_bool(
                self._extract_field(
                    record,
                    ["contribution adjustment", "is contribution adjustment", "contribution"],
                )
            )

            if self._adjustment_exists(
                db,
                fund_id,
                adjustment_date,
                amount,
                adjustment_type,
                description,
            ):
                continue

            adjustment = Adjustment(
                fund_id=fund_id,
                adjustment_date=adjustment_date,
                adjustment_type=adjustment_type,
                category=category,
                amount=amount,
                is_contribution_adjustment=contribution_flag,
                description=description,
            )
            db.add(adjustment)
            saved += 1

        return saved

    def _chunk_text(self, text_content: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Chunk text content for vector storage with overlapping windows.

        Args:
            text_content: List containing page-level text blocks.

        Returns:
            List of chunk dictionaries with page metadata.
        """
        if not text_content:
            return []

        chunk_size = max(settings.CHUNK_SIZE, 200)
        overlap = min(settings.CHUNK_OVERLAP, chunk_size // 2)

        chunks: List[Dict[str, Any]] = []
        current_chunk: List[str] = []
        current_length = 0
        start_page: Optional[int] = None
        end_page: Optional[int] = None

        for entry in text_content:
            page = entry.get("page")
            text = entry.get("text") or ""

            for sentence in self._split_sentences(text):
                sentence = sentence.strip()
                if not sentence:
                    continue

                if start_page is None:
                    start_page = page

                current_chunk.append(sentence)
                current_length += len(sentence) + 1
                end_page = page

                if current_length >= chunk_size:
                    chunk_text = " ".join(current_chunk).strip()
                    chunks.append(
                        {
                            "content": chunk_text,
                            "page_start": start_page,
                            "page_end": end_page,
                        }
                    )

                    if overlap > 0 and current_length > overlap:
                        # Retain trailing overlap characters to preserve context
                        overlap_text = chunk_text[-overlap:]
                        current_chunk = [overlap_text]
                        current_length = len(overlap_text)
                        start_page = end_page
                    else:
                        current_chunk = []
                        current_length = 0
                        start_page = None
                        end_page = None

        if current_chunk:
            chunks.append(
                {
                    "content": " ".join(current_chunk).strip(),
                    "page_start": start_page,
                    "page_end": end_page,
                }
            )

        return chunks

    # -------------------------------------------------------------------------
    # Helper functions
    # -------------------------------------------------------------------------

    def _split_sentences(self, text: str) -> Iterable[str]:
        """Split text into sentences while preserving basic punctuation."""
        # Replace line breaks with spaces to avoid abrupt chunk boundaries
        sanitized = re.sub(r"\s+", " ", text)
        return re.split(r"(?<=[.!?])\s+", sanitized)

    def _extract_field(self, record: Dict[str, Any], candidates: Sequence[str]) -> Any:
        """Extract a field value from a row using fuzzy header matching."""
        if not record:
            return None

        normalized_candidates = [self._normalize_key(candidate) for candidate in candidates]

        for key, value in record.items():
            if key == "table_type":
                continue

            normalized_key = self._normalize_key(key)
            if normalized_key in normalized_candidates:
                return value

        # Fall back to partial match
        for key, value in record.items():
            if key == "table_type":
                continue

            normalized_key = self._normalize_key(key)
            if any(candidate in normalized_key for candidate in normalized_candidates):
                return value

        return None

    def _normalize_key(self, key: str) -> str:
        return re.sub(r"[^a-z0-9]+", " ", str(key).lower()).strip()

    def _parse_date_from_record(
        self, record: Dict[str, Any], candidates: Sequence[str]
    ) -> Optional[date]:
        value = self._extract_field(record, candidates)
        return self._parse_date(value)

    def _parse_date(self, value: Any) -> Optional[date]:
        if value is None:
            return None

        if isinstance(value, date):
            return value

        if isinstance(value, datetime):
            return value.date()

        str_value = str(value).strip()
        if not str_value:
            return None

        known_formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%m-%d-%Y",
            "%d-%m-%Y",
            "%b %d, %Y",
            "%d %b %Y",
            "%B %d, %Y",
            "%d %B %Y",
        ]

        for fmt in known_formats:
            try:
                return datetime.strptime(str_value, fmt).date()
            except ValueError:
                continue

        try:
            return datetime.fromisoformat(str_value).date()
        except ValueError:
            return None

    def _parse_amount(self, value: Any) -> Optional[Decimal]:
        if value is None:
            return None

        if isinstance(value, Decimal):
            return value

        if isinstance(value, (int, float)):
            return Decimal(str(value))

        str_value = str(value).strip()
        if not str_value:
            return None

        cleaned = re.sub(r"[^\d\.\-]", "", str_value)

        try:
            return Decimal(cleaned)
        except (InvalidOperation, ValueError):
            return None

    def _parse_bool(self, value: Any) -> bool:
        if isinstance(value, bool):
            return value

        if value is None:
            return False

        str_value = str(value).strip().lower()
        return str_value in {"true", "yes", "y", "1", "recallable"}

    def _string_or_none(self, value: Any) -> Optional[str]:
        if value is None:
            return None

        str_value = str(value).strip()
        return str_value or None

    def _capital_call_exists(
        self,
        db,
        fund_id: int,
        call_date: date,
        amount: Decimal,
        call_type: Optional[str],
        description: Optional[str],
    ) -> bool:
        query = db.query(CapitalCall).filter(
            CapitalCall.fund_id == fund_id,
            CapitalCall.call_date == call_date,
            CapitalCall.amount == amount,
        )
        if call_type:
            query = query.filter(CapitalCall.call_type == call_type)
        if description:
            query = query.filter(CapitalCall.description == description)

        return query.first() is not None

    def _distribution_exists(
        self,
        db,
        fund_id: int,
        distribution_date: date,
        amount: Decimal,
        distribution_type: Optional[str],
        description: Optional[str],
        is_recallable: bool,
    ) -> bool:
        query = db.query(Distribution).filter(
            Distribution.fund_id == fund_id,
            Distribution.distribution_date == distribution_date,
            Distribution.amount == amount,
            Distribution.is_recallable == is_recallable,
        )
        if distribution_type:
            query = query.filter(Distribution.distribution_type == distribution_type)
        if description:
            query = query.filter(Distribution.description == description)

        return query.first() is not None

    def _adjustment_exists(
        self,
        db,
        fund_id: int,
        adjustment_date: date,
        amount: Decimal,
        adjustment_type: Optional[str],
        description: Optional[str],
    ) -> bool:
        query = db.query(Adjustment).filter(
            Adjustment.fund_id == fund_id,
            Adjustment.adjustment_date == adjustment_date,
            Adjustment.amount == amount,
        )
        if adjustment_type:
            query = query.filter(Adjustment.adjustment_type == adjustment_type)
        if description:
            query = query.filter(Adjustment.description == description)

        return query.first() is not None
