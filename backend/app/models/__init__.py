"""
Aggregate imports for SQLAlchemy model registration.

Importing this module ensures that all declarative models are loaded and
relationships defined via string references (e.g. "Fund") resolve correctly in
worker processes.
"""

from app.models.fund import Fund  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.transaction import CapitalCall, Distribution, Adjustment  # noqa: F401
from app.models.conversation import Conversation, ConversationMessage  # noqa: F401
from app.models.custom_formula import CustomFormula  # noqa: F401
from app.models.report_export import ReportExport  # noqa: F401
