"""
Pydantic schemas for custom formulas.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CustomFormulaBase(BaseModel):
    name: str
    expression: str
    description: Optional[str] = None
    variables: List[Dict[str, Any]] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    visibility: str = "private"


class CustomFormulaCreate(CustomFormulaBase):
    owner: Optional[str] = None


class CustomFormulaUpdate(BaseModel):
    expression: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    visibility: Optional[str] = None


class CustomFormula(CustomFormulaBase):
    id: int
    owner: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
