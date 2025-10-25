"""
Excel export job tracking model.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from app.db.base import Base


class ReportExport(Base):
    """Tracks asynchronous Excel export jobs for funds."""

    __tablename__ = "report_exports"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    fund_ids = Column(JSON, nullable=False)  # List of fund IDs included
    filters = Column(JSON, default=dict)
    status = Column(String(32), default="pending")  # pending|processing|ready|failed
    progress = Column(Integer, default=0)  # 0-100
    file_path = Column(String(512))
    error = Column(Text)
    requested_by = Column(String(120))
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    def serialize(self) -> Dict[str, Any]:
        """Return a JSON-compatible representation."""
        return {
            "export_id": self.id,
            "fund_ids": self.fund_ids or [],
            "status": self.status,
            "progress": self.progress,
            "file_path": self.file_path,
            "error": self.error,
            "requested_by": self.requested_by,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
        }
