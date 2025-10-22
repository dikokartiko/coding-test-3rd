"""
Retrieval Augmented Generation (RAG) engine utilities.

Responsible for orchestrating vector store retrieval, context assembly, and
composing prompts for downstream LLM generation.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional, Sequence

from langchain.prompts import ChatPromptTemplate

from app.core.config import settings
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)


class RAGEngine:
    """Lightweight coordinator for vector retrieval and LLM prompting."""

    def __init__(
        self,
        vector_store: VectorStore,
        llm: Any,
        max_context_docs: int = 3,
    ) -> None:
        self.vector_store = vector_store
        self.llm = llm
        self.max_context_docs = max(1, max_context_docs)
        self.prompt_template = self._build_prompt_template()

    async def retrieve_documents(
        self,
        query: str,
        k: int,
        metadata_filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks from the vector store applying thresholds."""
        results = await self.vector_store.similarity_search(
            query=query,
            k=k,
            filter_metadata=metadata_filter,
        )

        threshold = settings.SIMILARITY_THRESHOLD
        filtered: List[Dict[str, Any]] = []
        for doc in results:
            score = doc.get("score")
            if score is None or score >= threshold:
                filtered.append(doc)
        return filtered

    async def generate_answer(
        self,
        query: str,
        documents: Sequence[Dict[str, Any]],
        metrics: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[Sequence[Dict[str, str]]] = None,
    ) -> str:
        """Generate an answer using the configured LLM."""
        context_str = self._compose_context(documents[: self.max_context_docs])
        metrics_str = self._format_metrics(metrics)
        history_str = self._format_history(conversation_history or [])

        messages = self.prompt_template.format_messages(
            context=context_str,
            metrics=metrics_str,
            history=history_str,
            query=query,
        )

        try:
            if hasattr(self.llm, "ainvoke"):
                response = await self.llm.ainvoke(messages)  # type: ignore[attr-defined]
            else:
                # Fall back to running synchronous invocation in a thread
                response = await asyncio.to_thread(self.llm.invoke, messages)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("LLM invocation failed: %s", exc)
            return self._fallback_answer(query, documents, metrics, exc)

        if hasattr(response, "content"):
            return response.content  # type: ignore[return-value]
        return str(response)

    def _build_prompt_template(self) -> ChatPromptTemplate:
        """Create the reusable prompt template for the LLM."""
        return ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a financial analyst assistant specializing in private equity fund performance.
Use only the provided context, metrics, and history to answer. Cite sources explicitly when you rely on them.
If information is missing, state that clearly instead of guessing.""",
                ),
                (
                    "user",
                    """Context from documents:
{context}
{metrics}
{history}

Question: {query}

Provide a helpful answer that references the supplied context where relevant.""",
                ),
            ]
        )

    def _compose_context(self, documents: Sequence[Dict[str, Any]]) -> str:
        """Build a human-readable context block from retrieved chunks."""
        context_lines: List[str] = []
        for idx, doc in enumerate(documents, start=1):
            meta = doc.get("metadata") or {}
            page_start = meta.get("page_start")
            page_end = meta.get("page_end")
            page_display = ""
            if page_start is not None and page_end is not None:
                if page_start == page_end:
                    page_display = f"(page {page_start})"
                else:
                    page_display = f"(pages {page_start}-{page_end})"
            elif page_start is not None:
                page_display = f"(page {page_start})"

            similarity = doc.get("score")
            score_display = (
                f" score={similarity:.2f}" if isinstance(similarity, (float, int)) else ""
            )
            context_lines.append(
                f"[Source {idx}{score_display}] {page_display}\n{doc.get('content', '').strip()}".strip()
            )
        return "\n\n".join(context_lines) if context_lines else "No supporting context was retrieved."

    def _format_metrics(self, metrics: Optional[Dict[str, Any]]) -> str:
        """Format metrics block for the prompt."""
        if not metrics:
            return ""

        lines = ["\nAvailable Metrics:"]
        for key, value in metrics.items():
            if value is None:
                continue
            pretty_key = key.replace("_", " ").upper()
            lines.append(f"- {pretty_key}: {value}")
        return "\n".join(lines)

    def _format_history(
        self,
        conversation_history: Sequence[Dict[str, str]],
    ) -> str:
        """Format limited conversation history for prompt grounding."""
        if not conversation_history:
            return ""

        lines = ["\nPrevious Conversation:"]
        for entry in conversation_history[-3:]:
            role = entry.get("role", "unknown")
            content = entry.get("content", "")
            lines.append(f"{role}: {content}")
        return "\n".join(lines)

    def _fallback_answer(
        self,
        query: str,
        documents: Sequence[Dict[str, Any]],
        metrics: Optional[Dict[str, Any]],
        error: Exception,
    ) -> str:
        """
        Provide a deterministic answer when the primary LLM is unavailable.
        
        The fallback favours structured data already computed (metrics and retrieved
        snippets) so we can still deliver a useful response to the end user.
        """
        summary_lines: List[str] = [
            "I'm unable to reach the language model at the moment, so here's a direct summary from the available data."
        ]

        normalized_query = query.lower()

        if metrics:
            metric_entries: List[str] = []
            for key, value in metrics.items():
                if value is None:
                    continue
                name = key.upper()
                highlight = any(token in normalized_query for token in [key, name.lower()])
                bullet = f"- {name}: {value}"
                if highlight:
                    bullet = f"- **{name}**: {value}"
                metric_entries.append(bullet)

            if metric_entries:
                summary_lines.append("Key metrics:")
                summary_lines.extend(metric_entries)

        if documents:
            top_doc = documents[0]
            snippet = (top_doc.get("content") or "").strip()
            if snippet:
                snippet = snippet[:500] + ("…" if len(snippet) > 500 else "")
                meta = top_doc.get("metadata") or {}
                page = meta.get("page_start")
                page_info = f" (page {page})" if page is not None else ""
                summary_lines.append(f"Top supporting snippet{page_info}: {snippet}")

        summary_lines.append(
            "If you need more detail, please retry once the AI service is reachable."
        )
        summary_lines.append(f"(Error details: {error})")

        return "\n".join(summary_lines)
