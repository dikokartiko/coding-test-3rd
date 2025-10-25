"""
Endpoints for Excel export job orchestration.
"""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report_export import ReportExport
from app.schemas.export import ExportRequest, ExportStatus
from app.tasks.export_tasks import generate_report_export

router = APIRouter()


def _serialize(record: ReportExport) -> ExportStatus:
    return ExportStatus(
        export_id=record.id,
        status=record.status,
        progress=record.progress,
        fund_ids=record.fund_ids or [],
        download_url=f"/api/exports/{record.id}/download" if record.file_path else None,
        error=record.error,
        created_at=record.created_at,
        completed_at=record.completed_at,
    )


@router.post("/", response_model=ExportStatus)
async def request_export(
    payload: ExportRequest,
    db: Session = Depends(get_db),
):
    """Create an export job and enqueue the background worker."""
    record = ReportExport(fund_ids=payload.fund_ids, filters=payload.filters)
    db.add(record)
    db.commit()
    db.refresh(record)

    generate_report_export.delay(record.id, payload.fund_ids)

    return _serialize(record)


@router.get("/{export_id}", response_model=ExportStatus)
async def get_export(export_id: str, db: Session = Depends(get_db)):
    """Retrieve status of an export job."""
    record = db.query(ReportExport).filter(ReportExport.id == export_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Export not found")
    return _serialize(record)


@router.get("/{export_id}/download")
async def download_export(export_id: str, db: Session = Depends(get_db)):
    """Stream the generated Excel file."""
    record = db.query(ReportExport).filter(ReportExport.id == export_id).first()
    if not record or not record.file_path:
        raise HTTPException(status_code=404, detail="Export not available")
    if not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="File missing on server")
    filename = os.path.basename(record.file_path)
    return FileResponse(
        record.file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
