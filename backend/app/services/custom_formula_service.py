"""
Evaluation utilities for custom calculation formulas.
"""
from __future__ import annotations

import ast
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.custom_formula import CustomFormula


class _SafeFormulaEvaluator(ast.NodeVisitor):
    """Restricts Python AST evaluation to basic math."""

    _ALLOWED_NODES = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Num,
        ast.Load,
        ast.Name,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.Pow,
        ast.Mod,
        ast.USub,
        ast.UAdd,
        ast.Call,
        ast.Attribute,
        ast.Constant,
        ast.Compare,
        ast.Eq,
        ast.NotEq,
        ast.Gt,
        ast.GtE,
        ast.Lt,
        ast.LtE,
        ast.BoolOp,
        ast.And,
        ast.Or,
        ast.IfExp,
    )

    _ALLOWED_FUNCS = {
        "abs": abs,
        "min": min,
        "max": max,
        "round": round,
    }

    def __init__(self, variables: Dict[str, Any]):
        self._variables = variables

    def visit(self, node: ast.AST) -> None:  # type: ignore[override]
        if not isinstance(node, self._ALLOWED_NODES):
            raise ValueError(f"Unsupported expression segment: {node.__class__.__name__}")
        return super().visit(node)

    def eval(self, expression: str) -> float:
        tree = ast.parse(expression, mode="eval")
        self.visit(tree)
        compiled = compile(tree, "<formula>", "eval")
        context = {**self._ALLOWED_FUNCS, **self._variables}
        return float(eval(compiled, {"__builtins__": {}}, context))

    def visit_Call(self, node: ast.Call) -> Any:  # pragma: no cover - validation only
        if isinstance(node.func, ast.Name):
            if node.func.id not in self._ALLOWED_FUNCS:
                raise ValueError(f"Function {node.func.id} is not allowed")
        else:
            raise ValueError("Only direct function calls are supported")
        for arg in node.args:
            self.visit(arg)
        return node

    def visit_Name(self, node: ast.Name) -> Any:  # pragma: no cover - validation only
        if node.id not in self._variables and node.id not in self._ALLOWED_FUNCS:
            raise ValueError(f"Unknown variable '{node.id}'")
        return node


class CustomFormulaService:
    """Coordinates CRUD + evaluation for formulas."""

    def __init__(self, db: Session):
        self.db = db

    def list_formulas(self) -> List[CustomFormula]:
        return (
            self.db.query(CustomFormula)
            .order_by(CustomFormula.created_at.desc())
            .all()
        )

    def get_formula(self, formula_id: int) -> Optional[CustomFormula]:
        return self.db.query(CustomFormula).filter(CustomFormula.id == formula_id).first()

    def create_formula(self, payload: Dict[str, Any]) -> CustomFormula:
        formula = CustomFormula(**payload)
        self.db.add(formula)
        self.db.commit()
        self.db.refresh(formula)
        return formula

    def update_formula(self, formula: CustomFormula, payload: Dict[str, Any]) -> CustomFormula:
        for key, value in payload.items():
            setattr(formula, key, value)
        self.db.commit()
        self.db.refresh(formula)
        return formula

    def delete_formula(self, formula: CustomFormula) -> None:
        self.db.delete(formula)
        self.db.commit()

    def evaluate_for_fund(
        self,
        fund_id: int,
        base_metrics: Dict[str, Any],
    ) -> Dict[str, Optional[float]]:
        """Evaluate every global/shared formula for a specific fund."""
        formulas = self.list_formulas()
        variables = {k: (v or 0) for k, v in base_metrics.items()}
        variables["fund_id"] = fund_id

        results: Dict[str, Optional[float]] = {}
        for formula in formulas:
            try:
                evaluator = _SafeFormulaEvaluator(variables)
                results[formula.name] = evaluator.eval(formula.expression)
            except Exception:
                results[formula.name] = None
        return results
