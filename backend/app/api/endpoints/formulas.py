"""
Custom formula CRUD endpoints.
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.formula import (
    CustomFormula as CustomFormulaSchema,
    CustomFormulaCreate,
    CustomFormulaUpdate,
)
from app.services.custom_formula_service import CustomFormulaService

router = APIRouter()


@router.get("/", response_model=List[CustomFormulaSchema])
async def list_formulas(db: Session = Depends(get_db)):
    service = CustomFormulaService(db)
    formulas = service.list_formulas()
    return [CustomFormulaSchema.model_validate(f) for f in formulas]


@router.post("/", response_model=CustomFormulaSchema)
async def create_formula(
    payload: CustomFormulaCreate,
    db: Session = Depends(get_db),
):
    service = CustomFormulaService(db)
    formula = service.create_formula(payload.model_dump())
    return CustomFormulaSchema.model_validate(formula)


@router.put("/{formula_id}", response_model=CustomFormulaSchema)
async def update_formula(
    formula_id: int,
    payload: CustomFormulaUpdate,
    db: Session = Depends(get_db),
):
    service = CustomFormulaService(db)
    formula = service.get_formula(formula_id)
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    formula = service.update_formula(formula, payload.model_dump(exclude_unset=True))
    return CustomFormulaSchema.model_validate(formula)


@router.delete("/{formula_id}")
async def delete_formula(formula_id: int, db: Session = Depends(get_db)):
    service = CustomFormulaService(db)
    formula = service.get_formula(formula_id)
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    service.delete_formula(formula)
    return {"message": "Formula deleted successfully"}
