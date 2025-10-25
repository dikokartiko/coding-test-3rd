"""
Chat Pydantic schemas
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Chat message schema"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None
    metrics: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatQueryRequest(BaseModel):
    """Chat query request schema"""
    query: str
    fund_id: Optional[int] = None
    conversation_id: Optional[str] = None
    fund_ids: Optional[List[int]] = None  # For multi-fund intents


class SourceDocument(BaseModel):
    """Source document schema"""
    content: str
    metadata: Dict[str, Any]
    score: Optional[float] = None


class ChatQueryResponse(BaseModel):
    """Chat query response schema"""
    answer: str
    sources: List[SourceDocument] = []
    metrics: Optional[Dict[str, Any]] = None
    processing_time: Optional[float] = None
    conversation_id: Optional[str] = None
    intent: Optional[str] = None


class ConversationCreate(BaseModel):
    """Conversation creation schema"""
    fund_id: Optional[int] = None
    title: Optional[str] = None


class Conversation(BaseModel):
    """Conversation schema"""
    conversation_id: str
    fund_id: Optional[int] = None
    title: Optional[str] = None
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ConversationSummary(BaseModel):
    """Summary row for sidebar listings."""
    conversation_id: str
    fund_id: Optional[int] = None
    title: Optional[str] = None
    last_message: Optional[str] = None
    updated_at: datetime
