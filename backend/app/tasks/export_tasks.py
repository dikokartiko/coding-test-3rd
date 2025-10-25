"""
Celery tasks for Excel report exports.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Sequence

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.report_export import ReportExport
from app.services.report_exporter import ReportExporter

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.generate_report_export", max_retries=3)
def generate_report_export(self, export_id: str, fund_ids: Sequence[int]) -> str:
    """Background worker that builds the XLSX export."""
    db = SessionLocal()
    try:
        record = (
            db.query(ReportExport).filter(ReportExport.id == export_id).with_for_update().first()
        )
        if not record:
            raise ValueError(f"Export job {export_id} not found")

        record.status = "processing"
        record.progress = 10
        db.commit()

        exporter = ReportExporter(db)
        file_path = exporter.build(fund_ids, export_id)

        record.file_path = file_path
        record.status = "ready"
        record.progress = 100
        record.completed_at = datetime.utcnow()
        db.commit()
        return file_path
    except Exception as exc:  # pragma: no cover - worker logging
        db.rollback()
        record = (
            db.query(ReportExport).filter(ReportExport.id == export_id).first()
            if "record" not in locals()
            else record
        )
        if record:
            record.status = "failed"
            record.error = str(exc)
            record.progress = 100
            db.commit()
        logger.exception("Report export failed for %s", export_id)
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()
