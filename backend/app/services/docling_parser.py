"""
Docling PDF parsing utilities.

Provides a thin wrapper around the Docling document converter that extracts
page-level text content without relying on OCR or remote model downloads.
The parser is optional – if Docling is unavailable or fails during
initialisation, the DocumentProcessor will gracefully fall back to
pdfplumber-based extraction.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
except ImportError:  # pragma: no cover - optional dependency
    DocumentConverter = None  # type: ignore[assignment]
    PdfFormatOption = None  # type: ignore[assignment]
    InputFormat = None  # type: ignore[assignment]
    PdfPipelineOptions = None  # type: ignore[assignment]


class DoclingParser:
    """Wrapper around Docling's converter with safe defaults."""

    def __init__(self) -> None:
        self.available: bool = False
        self._converter: Optional[DocumentConverter] = None  # type: ignore[type-arg]
        self._init_error: Optional[str] = None

        if DocumentConverter is None or PdfFormatOption is None or PdfPipelineOptions is None:
            self._init_error = "Docling is not installed"
            logger.debug("Docling import failed; falling back to pdfplumber")
            return

        try:
            pdf_options = PdfPipelineOptions(
                do_ocr=False,  # Avoid downloading OCR models in restricted environments
                do_table_structure=False,
                force_backend_text=True,
                generate_page_images=False,
                generate_picture_images=False,
            )
            format_options = {
                InputFormat.PDF: PdfFormatOption(pipeline_options=pdf_options)  # type: ignore[call-arg]
            }
            self._converter = DocumentConverter(format_options=format_options)
            self.available = True
        except Exception as exc:  # pragma: no cover - defensive initialisation
            self._init_error = str(exc)
            logger.warning("Failed to initialise Docling parser: %s", exc)

    def extract_text(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text blocks from a PDF using Docling.

        Returns:
            Mapping containing ``text_blocks`` and ``page_count`` keys.
        """
        if not self.available or not self._converter:
            raise RuntimeError(self._init_error or "Docling parser unavailable")

        result = self._converter.convert(file_path)
        document = result.document

        text_blocks: List[Dict[str, Any]] = []
        seen: set[tuple[Optional[int], str]] = set()

        for text_item in getattr(document, "texts", []) or []:
            content = getattr(text_item, "text", None)
            if not content:
                continue

            normalized = content.strip()
            if not normalized:
                continue

            page_number: Optional[int] = None
            provenance = getattr(text_item, "prov", None)
            if provenance:
                first_prov = provenance[0]
                page_number = getattr(first_prov, "page_no", None)

            key = (page_number, normalized)
            if key in seen:
                continue
            seen.add(key)

            text_blocks.append(
                {
                    "page": page_number,
                    "text": normalized,
                }
            )

        page_count = len(getattr(document, "pages", []) or [])

        return {
            "text_blocks": text_blocks,
            "page_count": page_count,
        }
