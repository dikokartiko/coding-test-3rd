"""
Celery application configuration.

Provides a shared Celery instance configured with Redis so workers and the
FastAPI application can enqueue document processing jobs.
"""
from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "fund_analytics",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_default_queue="documents",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=60,
)

celery_app.autodiscover_tasks(["app.tasks"])


@celery_app.task(name="app.healthcheck")
def healthcheck() -> str:
    """Simple task to verify the worker is alive."""
    return "ok"
