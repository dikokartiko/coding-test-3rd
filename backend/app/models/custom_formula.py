"""
Custom calculation formula model.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from app.db.base import Base


class CustomFormula(Base):
    """Stores user-defined financial calculation formulas."""

    __tablename__ = "custom_formulas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    expression = Column(Text, nullable=False)
    description = Column(Text)
    variables = Column(JSON, default=list)  # Metadata describing expected vars
    owner = Column(String(120))
    visibility = Column(String(32), default="private")  # private | org | global
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def serialize(self) -> Dict[str, Any]:
        """Convenience serialization for API responses."""
        return {
            "id": self.id,
            "name": self.name,
            "expression": self.expression,
            "description": self.description,
            "variables": self.variables or [],
            "owner": self.owner,
            "visibility": self.visibility,
            "tags": self.tags or [],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
