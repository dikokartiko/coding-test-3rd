"""
Celery tasks related to document processing.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.document import Document
from app.services.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.process_document", max_retries=3)
def process_document_task(
    self,
    document_id: int,
    file_path: str,
    fund_id: int,
) -> Dict[str, Any]:
    """
    Celery task wrapper around :class:`DocumentProcessor`.

    Args:
        document_id: Target document primary key.
        file_path: Path to the stored PDF file.
        fund_id: Fund to associate parsed data with.

    Returns:
        Processing statistics dictionary emitted by the processor.
    """
    db = SessionLocal()
    document = None

    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error("Document %s not found; skipping processing.", document_id)
            return {"status": "failed", "error": "Document not found", "document_id": document_id}

        document.parsing_status = "processing"
        document.error_message = None
        db.commit()

        processor = DocumentProcessor()
        result = asyncio.run(processor.process_document(file_path, document_id, fund_id))

        document.parsing_status = result.get("status", "completed")
        document.error_message = result.get("error")
        db.commit()

        return result

    except Exception as exc:  # pragma: no cover - Celery worker-side logging
        db.rollback()
        if document:
            document.parsing_status = "failed"
            document.error_message = str(exc)
            db.commit()
        logger.exception("Document processing failed for %s", document_id)
        raise self.retry(exc=exc, countdown=60)

    finally:
        db.close()
