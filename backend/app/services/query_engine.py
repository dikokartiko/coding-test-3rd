"""
Query engine service for RAG-based question answering
"""
from typing import Dict, Any, List, Optional, Sequence
import time
import asyncio
from types import SimpleNamespace
from langchain_openai import ChatOpenAI
from langchain_community.llms import Ollama
from app.core.config import settings
from app.services.vector_store import VectorStore
from app.services.metrics_calculator import MetricsCalculator
from app.services.rag_engine import RAGEngine
from app.models.fund import Fund
from sqlalchemy.orm import Session

try:  # Optional dependency for Google Gemini
    import google.generativeai as genai
except ImportError:  # pragma: no cover - runtime guard
    genai = None  # type: ignore


class _GeminiChat:
    """Lightweight wrapper to mimic LangChain chat interface for Gemini."""

    def __init__(self, model: str, api_key: str, temperature: float = 0.0) -> None:
        if genai is None:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "google-generativeai is not installed. "
                "Please run `pip install google-generativeai`."
            )
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(model)
        self._temperature = temperature

    async def ainvoke(self, messages: Sequence[Any]) -> Any:
        return await asyncio.to_thread(self.invoke, messages)

    def invoke(self, messages: Sequence[Any]) -> Any:
        prompt = self._format_messages(messages)
        response = self._model.generate_content(
            prompt,
            generation_config={"temperature": self._temperature},
        )
        content = getattr(response, "text", None)
        if not content:
            content = self._extract_text_from_candidates(response)
        return SimpleNamespace(content=content or "")

    def _extract_text_from_candidates(self, response: Any) -> str:
        text_parts: List[str] = []
        for candidate in getattr(response, "candidates", []) or []:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) if content else None
            if parts:
                for part in parts:
                    value = getattr(part, "text", None)
                    if value:
                        text_parts.append(value)
        return "\n".join(text_parts)

    def _format_messages(self, messages: Sequence[Any]) -> str:
        formatted: List[str] = []
        for message in messages:
            role = getattr(message, "type", getattr(message, "role", "user"))
            content = getattr(message, "content", str(message))
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted)


class QueryEngine:
    """RAG-based query engine for fund analysis"""
    
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = VectorStore(db)
        self.metrics_calculator = MetricsCalculator(db)
        self.llm = self._initialize_llm()
        self.rag_engine = RAGEngine(self.vector_store, self.llm)
    
    def _initialize_llm(self):
        """Initialize LLM based on configured provider priority."""
        provider = (settings.LLM_PROVIDER or "auto").strip().lower()
        
        if provider == "auto":
            # Groq (xAI) takes precedence when available
            if settings.GROK_API_KEY:
                return self._build_groq_llm()
            if settings.OPENAI_API_KEY:
                return self._build_openai_llm()
            if settings.GOOGLE_API_KEY:
                return self._build_gemini_llm()
            return self._build_local_llm()
        
        if provider == "groq":
            if not settings.GROK_API_KEY:
                raise RuntimeError("LLM_PROVIDER=groq requires GROK_API_KEY to be set")
            return self._build_groq_llm()
        
        if provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise RuntimeError("LLM_PROVIDER=openai requires OPENAI_API_KEY to be set")
            return self._build_openai_llm()
        
        if provider == "gemini":
            if not settings.GOOGLE_API_KEY:
                raise RuntimeError("LLM_PROVIDER=gemini requires GOOGLE_API_KEY to be set")
            return self._build_gemini_llm()
        
        if provider == "ollama":
            return self._build_local_llm()
        
        raise RuntimeError(f"Unsupported LLM_PROVIDER value: {settings.LLM_PROVIDER}")
    
    def _build_groq_llm(self):
        grok_base_url = settings.GROK_BASE_URL.rstrip("/")
        return ChatOpenAI(
            model=settings.GROK_MODEL,
            temperature=0,
            api_key=settings.GROK_API_KEY,
            base_url=grok_base_url,
        )
    
    def _build_openai_llm(self):
        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            temperature=0,
            openai_api_key=settings.OPENAI_API_KEY,
        )
    
    def _build_gemini_llm(self):
        return _GeminiChat(
            model=settings.GEMINI_MODEL,
            api_key=settings.GOOGLE_API_KEY,
            temperature=0.0,
        )
    
    def _build_local_llm(self):
        # Fallback to local LLM via Ollama
        return Ollama(model="llama2")
    
    async def process_query(
        self,
        query: str,
        fund_id: Optional[int] = None,
        fund_ids: Optional[List[int]] = None,
        conversation_history: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Process a user query using RAG
        
        Args:
            query: User question
            fund_id: Optional fund ID for context
            conversation_history: Previous conversation messages
            
        Returns:
            Response with answer, sources, and metrics
        """
        start_time = time.time()
        
        # Step 1: Classify query intent
        intent = await self._classify_intent(query)
        
        # Step 2: Retrieve relevant context from vector store
        filter_metadata = {"fund_id": fund_id} if fund_id else None
        relevant_docs = await self.rag_engine.retrieve_documents(
            query=query,
            k=settings.TOP_K_RESULTS,
            metadata_filter=filter_metadata
        )
        
        # Step 3: Calculate metrics if needed
        metrics = None
        if intent == "calculation":
            if fund_ids and len(fund_ids) > 1:
                aggregates = self.metrics_calculator.aggregate_funds(fund_ids)
                fund_names = {
                    fund.id: fund.name
                    for fund in self.db.query(Fund.id, Fund.name).filter(Fund.id.in_(fund_ids)).all()
                }
                metrics = {
                    "comparison": [
                        {
                            **aggregate,
                            "fund_name": fund_names.get(aggregate["fund_id"]),
                            "cash_flows": [
                                {
                                    **flow,
                                    "date": flow["date"].isoformat()
                                    if hasattr(flow["date"], "isoformat")
                                    else str(flow["date"]),
                                }
                                for flow in aggregate["cash_flows"]
                            ],
                        }
                        for aggregate in aggregates
                    ]
                }
            elif fund_id:
                metrics = self.metrics_calculator.calculate_all_metrics(fund_id)
        
        # Step 4: Generate response using LLM
        answer = await self._generate_response(
            query=query,
            context=relevant_docs,
            metrics=metrics,
            conversation_history=conversation_history or []
        )
        
        processing_time = time.time() - start_time
        
        return {
            "answer": answer,
            "sources": [
                {
                    "content": doc["content"],
                    "metadata": {
                        k: v for k, v in doc.items() 
                        if k not in ["content", "score"]
                    },
                    "score": doc.get("score")
                }
                for doc in relevant_docs
            ],
            "metrics": metrics,
            "processing_time": round(processing_time, 2),
            "intent": intent,
        }
    
    async def _classify_intent(self, query: str) -> str:
        """
        Classify query intent
        
        Returns:
            'calculation', 'definition', 'retrieval', or 'general'
        """
        query_lower = query.lower()
        
        # Calculation keywords
        calc_keywords = [
            "calculate", "what is the", "current", "dpi", "irr", "tvpi", 
            "rvpi", "pic", "paid-in capital", "return", "performance"
        ]
        if any(keyword in query_lower for keyword in calc_keywords):
            return "calculation"
        
        # Definition keywords
        def_keywords = [
            "what does", "mean", "define", "explain", "definition", 
            "what is a", "what are"
        ]
        if any(keyword in query_lower for keyword in def_keywords):
            return "definition"
        
        # Retrieval keywords
        ret_keywords = [
            "show me", "list", "all", "find", "search", "when", 
            "how many", "which"
        ]
        if any(keyword in query_lower for keyword in ret_keywords):
            return "retrieval"
        
        return "general"
    
    async def _generate_response(
        self,
        query: str,
        context: List[Dict[str, Any]],
        metrics: Optional[Dict[str, Any]],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """Delegate to the shared RAG engine for answer construction."""
        return await self.rag_engine.generate_answer(
            query=query,
            documents=context,
            metrics=metrics,
            conversation_history=conversation_history,
        )
