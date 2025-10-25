"""
Fund Pydantic schemas
"""
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class FundBase(BaseModel):
    """Base fund schema"""
    name: str
    gp_name: Optional[str] = None
    fund_type: Optional[str] = None
    vintage_year: Optional[int] = None


class FundCreate(FundBase):
    """Fund creation schema"""
    pass


class FundUpdate(BaseModel):
    """Fund update schema"""
    name: Optional[str] = None
    gp_name: Optional[str] = None
    fund_type: Optional[str] = None
    vintage_year: Optional[int] = None


class FundMetrics(BaseModel):
    """Fund metrics schema"""
    dpi: Optional[float] = None
    irr: Optional[float] = None
    tvpi: Optional[float] = None
    rvpi: Optional[float] = None
    pic: Optional[float] = None
    total_distributions: Optional[float] = None
    nav: Optional[float] = None
    custom_metrics: Optional[Dict[str, float]] = None


class Fund(FundBase):
    """Fund response schema"""
    id: int
    created_at: datetime
    metrics: Optional[FundMetrics] = None
    
    class Config:
        from_attributes = True


class CashFlowPoint(BaseModel):
    date: str
    amount: float
    type: str


class FundComparisonResult(BaseModel):
    fund_id: int
    fund_name: str
    fund_type: Optional[str] = None
    metrics: FundMetrics
    cash_flows: List[CashFlowPoint]
