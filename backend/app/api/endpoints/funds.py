"""
Fund API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.fund import Fund
from app.models.transaction import CapitalCall, Distribution, Adjustment
from app.schemas.fund import (
    Fund as FundSchema,
    FundCreate,
    FundUpdate,
    FundMetrics,
    FundComparisonResult,
)
from app.schemas.transaction import (
    CapitalCall as CapitalCallSchema,
    Distribution as DistributionSchema,
    Adjustment as AdjustmentSchema,
    TransactionList
)
from app.services.metrics_calculator import MetricsCalculator

router = APIRouter()


@router.get("/", response_model=List[FundSchema])
async def list_funds(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all funds"""
    funds = db.query(Fund).offset(skip).limit(limit).all()
    
    # Add metrics to each fund
    calculator = MetricsCalculator(db)
    result = []
    
    for fund in funds:
        fund_dict = FundSchema.model_validate(fund).model_dump()
        metrics = calculator.calculate_all_metrics(fund.id)
        fund_dict["metrics"] = FundMetrics(**metrics)
        result.append(FundSchema(**fund_dict))
    
    return result


@router.post("/", response_model=FundSchema)
async def create_fund(fund: FundCreate, db: Session = Depends(get_db)):
    """Create a new fund"""
    db_fund = Fund(**fund.model_dump())
    db.add(db_fund)
    db.commit()
    db.refresh(db_fund)
    return db_fund


@router.get("/comparison", response_model=List[FundComparisonResult])
async def compare_funds(
    ids: str = Query(..., description="Comma-separated list of fund IDs"),
    db: Session = Depends(get_db),
):
    """Return metrics + cashflow snapshots for multiple funds."""
    try:
        fund_ids = [int(value) for value in ids.split(",") if value.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ids must be integers")

    if not fund_ids:
        raise HTTPException(status_code=400, detail="Provide at least one fund id")
    if len(fund_ids) > 6:
        raise HTTPException(status_code=400, detail="Compare up to 6 funds at once")

    funds = (
        db.query(Fund)
        .filter(Fund.id.in_(fund_ids))
        .order_by(Fund.name.asc())
        .all()
    )
    if not funds:
        raise HTTPException(status_code=404, detail="No funds found")

    calculator = MetricsCalculator(db)
    aggregates = {item["fund_id"]: item for item in calculator.aggregate_funds(fund_ids)}

    results: List[FundComparisonResult] = []
    for fund in funds:
        data = aggregates.get(fund.id)
        if not data:
            continue
        cashflow_points = [
            {
                "date": cf["date"].isoformat() if hasattr(cf["date"], "isoformat") else str(cf["date"]),
                "amount": float(cf["amount"]),
                "type": cf["type"],
            }
            for cf in data["cash_flows"]
        ]
        results.append(
            FundComparisonResult(
                fund_id=fund.id,
                fund_name=fund.name,
                fund_type=fund.fund_type,
                metrics=FundMetrics(**data["metrics"]),
                cash_flows=cashflow_points,
            )
        )
    return results


@router.get("/{fund_id}", response_model=FundSchema)
async def get_fund(fund_id: int, db: Session = Depends(get_db)):
    """Get fund details"""
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    # Add metrics
    calculator = MetricsCalculator(db)
    metrics = calculator.calculate_all_metrics(fund_id)
    
    fund_dict = FundSchema.model_validate(fund).model_dump()
    fund_dict["metrics"] = FundMetrics(**metrics)
    
    return FundSchema(**fund_dict)


@router.put("/{fund_id}", response_model=FundSchema)
async def update_fund(
    fund_id: int,
    fund_update: FundUpdate,
    db: Session = Depends(get_db)
):
    """Update fund details"""
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    update_data = fund_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(fund, key, value)
    
    db.commit()
    db.refresh(fund)
    return fund


@router.delete("/{fund_id}")
async def delete_fund(fund_id: int, db: Session = Depends(get_db)):
    """Delete a fund"""
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    db.delete(fund)
    db.commit()
    
    return {"message": "Fund deleted successfully"}


@router.get("/{fund_id}/transactions", response_model=TransactionList)
async def get_fund_transactions(
    fund_id: int,
    transaction_type: str = Query(..., regex="^(capital_calls|distributions|adjustments)$"),
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get fund transactions"""
    # Verify fund exists
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    # Query based on transaction type
    if transaction_type == "capital_calls":
        query = db.query(CapitalCall).filter(CapitalCall.fund_id == fund_id)
        model = CapitalCallSchema
    elif transaction_type == "distributions":
        query = db.query(Distribution).filter(Distribution.fund_id == fund_id)
        model = DistributionSchema
    else:  # adjustments
        query = db.query(Adjustment).filter(Adjustment.fund_id == fund_id)
        model = AdjustmentSchema
    
    # Get total count
    total = query.count()
    
    # Paginate
    skip = (page - 1) * limit
    items = query.offset(skip).limit(limit).all()
    
    # Calculate total pages
    pages = (total + limit - 1) // limit
    
    return TransactionList(
        items=[model.model_validate(item) for item in items],
        total=total,
        page=page,
        pages=pages
    )


@router.get("/{fund_id}/metrics", response_model=FundMetrics)
async def get_fund_metrics(fund_id: int, db: Session = Depends(get_db)):
    """Get fund metrics"""
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    calculator = MetricsCalculator(db)
    metrics = calculator.calculate_all_metrics(fund_id)
    
    return FundMetrics(**metrics)
