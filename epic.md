### What's NOT Implemented (Your Job)

The following **core functionalities are NOT implemented** and need to be built by you:

#### 1. Document Processing Pipeline (Phase 2) - **CRITICAL**

- [✔] PDF parsing with pdfplumber (integrate and test)
- [✔] Table detection and extraction logic
- [✔] Intelligent table classification (capital calls vs distributions vs adjustments)
- [✔] Data validation and cleaning
- [✔] Error handling for malformed PDFs
- [✔] Background task processing (Celery integration)

**Files to implement:**

- `backend/app/services/document_processor.py` (skeleton provided)
- `backend/app/services/table_parser.py` (needs implementation)

#### 2. Vector Store & RAG System (Phase 3) - **CRITICAL**

- [x] Text chunking strategy implementation
- [x] embedding generation
- [x] Semantic search implementation (pgvector)
- [x] Context retrieval for LLM
- [x] Prompt engineering for accurate responses

**Files to implement:**

- `backend/app/services/vector_store.py` (pgvector implementation with TODOs)
- `backend/app/services/rag_engine.py` (needs implementation)

**Note**: This project uses **pgvector** instead of FAISS. pgvector is a PostgreSQL extension that stores vectors directly in your database, eliminating the need for a separate vector database.

#### 3. Query Engine & Intent Classification (Phase 3-4) - **CRITICAL**

- [x] Intent classifier (calculation vs definition vs retrieval)
- [x] Query router logic
- [x] LLM integration
- [x] Response formatting
- [x] Source citation
- [x] Conversation context management

**Files to implement:**

- `backend/app/services/query_engine.py` (needs implementation)

#### 4. Integration & Testing

- [ ] End-to-end document upload flow
- [ ] API integration tests
- [ ] Error handling and logging
- [ ] Performance optimization

**Note**: Metrics calculation is already implemented. You can focus on document processing and RAG!

---

## Required Features (Phase 1-4)

### Phase 1: Core Infrastructure

- [✔] Docker setup with PostgreSQL, Redis
- [✔] FastAPI backend with CRUD endpoints
- [✔] Next.js frontend with basic layout
- [✔] Database schema implementation
- [✔] Environment configuration

### Phase 2: Document Processing

- [✔] File upload API endpoint
- [✔] Docling integration for PDF parsing
- [✔] Table extraction and SQL storage
- [✔] Text chunking and embedding
- [✔] Parsing status tracking

### Phase 3: Vector Store & RAG

- [x] pgvector setup (PostgreSQL extension)
- [x] Embedding generation (OpenAI/local)
- [x] Similarity search using pgvector operators
- [x] LangChain integration
- [x] Basic chat interface

### Phase 4: Fund Metrics Calculation

- [x] DPI calculation function
- [x] IRR calculation function
- [x] Metrics API endpoints
- [x] Query engine integration

---

## Bonus Features (Phase 5-6)

### Phase 5: Dashboard & Polish

- [ ] Fund list page with metrics
- [ ] Fund detail page with charts
- [ ] Transaction tables with pagination
- [ ] Error handling improvements
- [ ] Loading states

### Phase 6: Advanced Features

- [ ] Conversation history
- [ ] Multi-fund comparison
- [ ] Excel export
- [ ] Custom calculation formulas
- [ ] Test coverage (50%+)

---
