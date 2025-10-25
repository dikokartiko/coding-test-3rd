"""
Excel export builder for fund reports.
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import List, Sequence

import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.fund import Fund
from app.models.transaction import Adjustment, CapitalCall, Distribution
from app.services.metrics_calculator import MetricsCalculator


class ReportExporter:
    """Generate Excel workbooks summarizing fund performance."""

    def __init__(self, db: Session):
        self.db = db
        self.calculator = MetricsCalculator(db)

    def build(self, fund_ids: Sequence[int], export_id: str) -> str:
        """Create an XLSX file covering all requested funds."""
        os.makedirs(settings.EXPORT_DIR, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        filename = f"fund-export-{export_id}-{timestamp}.xlsx"
        output_path = os.path.join(settings.EXPORT_DIR, filename)

        funds = (
            self.db.query(Fund)
            .filter(Fund.id.in_(list(fund_ids)))
            .order_by(Fund.name.asc())
            .all()
        )
        if not funds:
            raise ValueError("No funds found for export")

        summary_rows = []
        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            for fund in funds:
                metrics = self.calculator.calculate_all_metrics(fund.id)
                summary_rows.append(
                    {
                        "Fund": fund.name,
                        "Type": fund.fund_type,
                        "Vintage": fund.vintage_year,
                        "PIC": metrics.get("pic"),
                        "Distributions": metrics.get("total_distributions"),
                        "DPI": metrics.get("dpi"),
                        "IRR": metrics.get("irr"),
                    }
                )

                self._write_transactions_sheet(writer, fund, "Capital Calls", CapitalCall)
                self._write_transactions_sheet(writer, fund, "Distributions", Distribution)
                self._write_transactions_sheet(writer, fund, "Adjustments", Adjustment)

            summary_df = pd.DataFrame(summary_rows)
            summary_df.to_excel(writer, sheet_name="Summary", index=False)

        return output_path

    def _write_transactions_sheet(self, writer, fund: Fund, label: str, model) -> None:
        """Dump transactions of a model into a sheet."""
        query = (
            self.db.query(model)
            .filter(model.fund_id == fund.id)
            .order_by(model.created_at.asc())
        )
        rows = []
        for record in query.all():
            row = {
                "Fund": fund.name,
                "Amount": float(getattr(record, "amount")),
                "Created": getattr(record, "created_at"),
                "Description": getattr(record, "description", ""),
            }
            if hasattr(record, "call_date"):
                row["Date"] = record.call_date
                row["Type"] = getattr(record, "call_type", "")
            elif hasattr(record, "distribution_date"):
                row["Date"] = record.distribution_date
                row["Type"] = getattr(record, "distribution_type", "")
                row["Recallable"] = getattr(record, "is_recallable", False)
            elif hasattr(record, "adjustment_date"):
                row["Date"] = record.adjustment_date
                row["Type"] = getattr(record, "adjustment_type", "")
                row["Category"] = getattr(record, "category", "")
            rows.append(row)

        df = pd.DataFrame(rows or [{"Fund": fund.name, "Note": "No records"}])
        sheet_name = f"{fund.name[:20]} {label[:10]}".strip()
        df.to_excel(writer, sheet_name=sheet_name, index=False)
