"""
Vector store service using pgvector (PostgreSQL extension)

TODO: Implement vector storage using pgvector
- Create embeddings table in PostgreSQL
- Store document chunks with vector embeddings
- Implement similarity search using pgvector operators
- Handle metadata filtering
"""
import json
from typing import List, Dict, Any, Optional, Sequence
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
import httpx
import certifi
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import settings
from app.db.session import SessionLocal


class NvidiaEmbeddings:
    """Lightweight client for NVIDIA embedding endpoint"""

    def __init__(self, model: str, api_key: str, base_url: str):
        self.model = model
        self.dimension = 1024  # nv-embedqa-e5-v5 outputs 1024-d vectors
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            transport=httpx.HTTPTransport(
                retries=3,
                verify=certifi.where(),
            ),
        )

    def embed_query(self, text: str) -> List[float]:
        response = self._client.post(
            "/embeddings",
            json={
                "model": self.model,
                "input": text,
                "input_type": "query",
            },
        )
        response.raise_for_status()
        return response.json()["data"][0]["embedding"]

    def embed_documents(self, texts: Sequence[str]) -> List[List[float]]:
        response = self._client.post(
            "/embeddings",
            json={
                "model": self.model,
                "input": list(texts),
                "input_type": "document",
            },
        )
        response.raise_for_status()
        data = response.json()["data"]
        return [item["embedding"] for item in data]


class VectorStore:
    """pgvector-based vector store for document embeddings"""
    
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
        self.embeddings, self.embedding_dimension = self._initialize_embeddings()
        self._ensure_extension()
    
    def _initialize_embeddings(self):
        """Initialize embedding model"""
        if settings.NVIDIA_API_KEY:
            embeddings = NvidiaEmbeddings(
                model=settings.NVIDIA_EMBEDDING_MODEL,
                api_key=settings.NVIDIA_API_KEY,
                base_url=settings.NVIDIA_BASE_URL,
            )
            return embeddings, embeddings.dimension
        if settings.OPENAI_API_KEY:
            embeddings = OpenAIEmbeddings(
                model=settings.OPENAI_EMBEDDING_MODEL,
                openai_api_key=settings.OPENAI_API_KEY
            )
            return embeddings, 1536
        # Fallback to local embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        return embeddings, 384
    
    def _ensure_extension(self):
        """
        Ensure pgvector extension is enabled
        
        TODO: Implement this method
        - Execute: CREATE EXTENSION IF NOT EXISTS vector;
        - Create embeddings table if not exists
        """
        try:
            # Enable pgvector extension
            self.db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            
            # Create embeddings table
            # Dimension determined by active embedding provider
            dimension = self.embedding_dimension
            
            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS document_embeddings (
                id SERIAL PRIMARY KEY,
                document_id INTEGER,
                fund_id INTEGER,
                content TEXT NOT NULL,
                embedding vector({dimension}),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
            ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
            """
            
            self.db.execute(text(create_table_sql))
            self.db.commit()
        except Exception as e:
            print(f"Error ensuring pgvector extension: {e}")
            self.db.rollback()
    
    async def add_document(self, content: str, metadata: Dict[str, Any]):
        """
        Add a document to the vector store
        
        TODO: Implement this method
        - Generate embedding for content
        - Insert into document_embeddings table
        - Store metadata as JSONB
        """
        try:
            # Generate embedding
            embedding = await self._get_embedding(content)
            if hasattr(embedding, "tolist"):
                embedding_list = embedding.tolist()
            else:
                embedding_list = [float(x) for x in embedding]
            metadata = metadata or {}
            
            # Insert into database
            insert_sql = text("""
                INSERT INTO document_embeddings (document_id, fund_id, content, embedding, metadata)
                VALUES (:document_id, :fund_id, :content, CAST(:embedding AS vector), CAST(:metadata AS jsonb))
            """)
            
            self.db.execute(insert_sql, {
                "document_id": metadata.get("document_id"),
                "fund_id": metadata.get("fund_id"),
                "content": content,
                "embedding": json.dumps(embedding_list),
                "metadata": json.dumps(metadata)
            })
        except Exception as e:
            print(f"Error adding document: {e}")
            self.db.rollback()
            raise
    
    async def similarity_search(
        self, 
        query: str, 
        k: int = 5, 
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using cosine similarity
        
        TODO: Implement this method
        - Generate query embedding
        - Use pgvector's <=> operator for cosine distance
        - Apply metadata filters if provided
        - Return top k results
        
        Args:
            query: Search query
            k: Number of results to return
            filter_metadata: Optional metadata filters (e.g., {"fund_id": 1})
            
        Returns:
            List of similar documents with scores
        """
        try:
            # Generate query embedding
            query_embedding = await self._get_embedding(query)
            embedding_list = query_embedding.tolist()
            
            # Build query with optional filters
            where_clause = ""
            if filter_metadata:
                conditions = []
                for key, value in filter_metadata.items():
                    if key in ["document_id", "fund_id"]:
                        conditions.append(f"{key} = {value}")
                if conditions:
                    where_clause = "WHERE " + " AND ".join(conditions)
            
            # Search using cosine distance (<=> operator)
            search_sql = text(f"""
                SELECT 
                    id,
                    document_id,
                    fund_id,
                    content,
                    metadata,
                    1 - (embedding <=> CAST(:query_embedding AS vector)) as similarity_score
                FROM document_embeddings
                {where_clause}
                ORDER BY embedding <=> CAST(:query_embedding AS vector)
                LIMIT :k
            """)
            
            result = self.db.execute(search_sql, {
                "query_embedding": str(embedding_list),
                "k": k
            })
            
            # Format results
            results = []
            for row in result:
                metadata = row[4]
                if isinstance(metadata, str):
                    try:
                        metadata = json.loads(metadata)
                    except json.JSONDecodeError:
                        pass
                results.append({
                    "id": row[0],
                    "document_id": row[1],
                    "fund_id": row[2],
                    "content": row[3],
                    "metadata": metadata,
                    "score": float(row[5])
                })
            
            return results
        except Exception as e:
            print(f"Error in similarity search: {e}")
            return []
    
    async def _get_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for text"""
        if hasattr(self.embeddings, 'embed_query'):
            embedding = self.embeddings.embed_query(text)
        else:
            embedding = self.embeddings.encode(text)
        
        return np.array(embedding, dtype=np.float32)
    
    def clear(self, fund_id: Optional[int] = None):
        """
        Clear the vector store
        
        TODO: Implement this method
        - Delete all embeddings (or filter by fund_id)
        """
        try:
            if fund_id:
                delete_sql = text("DELETE FROM document_embeddings WHERE fund_id = :fund_id")
                self.db.execute(delete_sql, {"fund_id": fund_id})
            else:
                delete_sql = text("DELETE FROM document_embeddings")
                self.db.execute(delete_sql)
            
            self.db.commit()
        except Exception as e:
            print(f"Error clearing vector store: {e}")
            self.db.rollback()
