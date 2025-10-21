"""
Celery task package.

Importing individual task modules here ensures the worker registers them
when ``app.tasks`` is included in ``CELERY_IMPORTS`` or auto-discovered.
"""
from app.tasks import document_tasks  # noqa: F401
