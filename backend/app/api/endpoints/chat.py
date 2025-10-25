"""
Chat API endpoints backed by the database.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.conversation import Conversation as ConversationModel
from app.models.conversation import ConversationMessage
from app.schemas.chat import (
    ChatMessage,
    ChatQueryRequest,
    ChatQueryResponse,
    Conversation,
    ConversationCreate,
    ConversationSummary,
)
from app.services.query_engine import QueryEngine

router = APIRouter()


def _serialize_conversation(conv: ConversationModel) -> Conversation:
    return Conversation(
        conversation_id=conv.id,
        fund_id=conv.fund_id,
        title=conv.title,
        messages=[
            ChatMessage(
                role=msg.role,
                content=msg.content,
                timestamp=msg.created_at,
                intent=msg.intent,
                confidence=msg.confidence,
                metrics=msg.metrics,
                metadata=msg.extra_metadata or {},
            )
            for msg in conv.messages
        ],
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.post("/query", response_model=ChatQueryResponse)
async def process_chat_query(
    request: ChatQueryRequest,
    db: Session = Depends(get_db),
):
    """Process a chat query with persistent conversation history."""
    conversation = None
    if request.conversation_id:
        conversation = (
            db.query(ConversationModel)
            .filter(ConversationModel.id == request.conversation_id)
            .first()
        )

    if not conversation:
        conversation = ConversationModel(
            id=request.conversation_id or str(uuid.uuid4()),
            fund_id=request.fund_id,
            title=request.query[:60],
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in conversation.messages[-10:]
    ]

    query_engine = QueryEngine(db)
    response = await query_engine.process_query(
        query=request.query,
        fund_id=request.fund_id or conversation.fund_id,
        fund_ids=request.fund_ids,
        conversation_history=conversation_history,
    )

    now = datetime.utcnow()
    db.add_all(
        [
            ConversationMessage(
                conversation_id=conversation.id,
                role="user",
                content=request.query,
                extra_metadata={"fund_id": request.fund_id},
                created_at=now,
            ),
            ConversationMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=response["answer"],
                intent=response.get("intent"),
                metrics=response.get("metrics"),
                extra_metadata={"sources": response.get("sources", [])},
                created_at=now,
            ),
        ]
    )
    conversation.updated_at = now
    if not conversation.title:
        conversation.title = request.query[:60]
    if request.fund_id and not conversation.fund_id:
        conversation.fund_id = request.fund_id
    db.commit()

    return ChatQueryResponse(
        **response,
        conversation_id=conversation.id,
    )


@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    request: ConversationCreate,
    db: Session = Depends(get_db),
):
    """Create a new, empty conversation shell."""
    conversation = ConversationModel(
        id=str(uuid.uuid4()),
        fund_id=request.fund_id,
        title=request.title,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return _serialize_conversation(conversation)


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(db: Session = Depends(get_db)):
    """Return recent conversations for sidebar display."""
    conversations = (
        db.query(ConversationModel)
        .order_by(ConversationModel.updated_at.desc())
        .limit(50)
        .all()
    )
    summaries: List[ConversationSummary] = []
    for conv in conversations:
        last_message = conv.messages[-1].content if conv.messages else None
        summaries.append(
            ConversationSummary(
                conversation_id=conv.id,
                fund_id=conv.fund_id,
                title=conv.title,
                last_message=last_message,
                updated_at=conv.updated_at,
            )
        )
    return summaries


@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get conversation history by identifier."""
    conversation = (
        db.query(ConversationModel).filter(ConversationModel.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _serialize_conversation(conversation)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation and its messages."""
    conversation = (
        db.query(ConversationModel).filter(ConversationModel.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}
