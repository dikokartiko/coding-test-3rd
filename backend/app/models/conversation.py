"""
Conversation persistence models.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Float,
)
from sqlalchemy.orm import relationship, Mapped

from app.db.base import Base


class Conversation(Base):
    """Top-level chat conversation metadata."""

    __tablename__ = "conversations"

    id: Mapped[str] = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    fund_id: Mapped[Optional[int]] = Column(
        Integer, ForeignKey("funds.id"), nullable=True, index=True
    )
    title: Mapped[Optional[str]] = Column(String(255))
    extra_metadata: Mapped[Dict[str, Any]] = Column(JSON, default=dict)
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    messages: Mapped[List["ConversationMessage"]] = relationship(
        "ConversationMessage",
        order_by="ConversationMessage.created_at",
        cascade="all, delete-orphan",
        back_populates="conversation",
    )


class ConversationMessage(Base):
    """Individual chat message belonging to a conversation."""

    __tablename__ = "conversation_messages"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[str] = Column(
        String(36), ForeignKey("conversations.id"), nullable=False, index=True
    )
    role: Mapped[str] = Column(String(20), nullable=False)
    content: Mapped[str] = Column(Text, nullable=False)
    intent: Mapped[Optional[str]] = Column(String(50))
    confidence: Mapped[Optional[float]] = Column(Float)
    metrics: Mapped[Optional[Dict[str, Any]]] = Column(JSON)
    extra_metadata: Mapped[Dict[str, Any]] = Column(JSON, default=dict)
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, index=True)

    conversation = relationship("Conversation", back_populates="messages")
