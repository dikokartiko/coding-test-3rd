"""
Report export schemas.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    fund_ids: List[int] = Field(..., min_length=1, max_length=6)
    filters: dict = Field(default_factory=dict)


class ExportStatus(BaseModel):
    export_id: str
    status: str
    progress: int
    fund_ids: List[int]
    download_url: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
