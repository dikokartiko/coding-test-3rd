# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Lint/Test Commands

### Backend

- Run tests: `cd backend && pytest`
- Run tests with coverage: `cd backend && pytest --cov=app tests/`
- Run specific test: `cd backend && pytest tests/test_metrics.py -v`
- Lint with black: `cd backend && black .`
- Lint with flake8: `cd backend && flake8 .`
- Type check with mypy: `cd backend && mypy .`

### Frontend

- Run tests: `cd frontend && npm test`
- Run tests with coverage: `cd frontend && npm test -- --coverage`
- Lint: `cd frontend && npm run lint`

### Full Stack

- Start all services: `docker-compose up --build`
- Development mode: `docker-compose up -d`

## Code Style Guidelines

### Backend

- Use Black for code formatting (version 23.12.1)
- Use Flake8 for linting (version 7.0.0)
- Use MyPy for type checking (version 1.8.0)
- Follow FastAPI dependency injection patterns with Pydantic schemas
- Use `# noqa` comments only when intentionally bypassing linting rules (e.g., for SQLAlchemy model registration)

### Frontend

- Use Next.js recommended linting via `next/core-web-vitals`
- Use Tailwind CSS for styling with the configured design tokens
- Use TypeScript for type safety
- Use TanStack Query for data fetching and state management
- Use Zustand for global state management

## Project-Specific Conventions

### Architecture

- Backend uses FastAPI with SQLAlchemy ORM and pgvector for vector storage
- Frontend uses Next.js 14 with React Server Components
- Document processing uses pdfplumber for PDF parsing
- RAG implementation uses LangChain with OpenAI embeddings
- Query intent classification: 'calculation', 'definition', 'retrieval', or 'general'

### Database & Vector Store

- PostgreSQL with pgvector extension for vector storage
- Embedding dimension: 1536 for OpenAI, 384 for sentence-transformers
- Vector similarity search uses cosine distance operator (<=>)
- Document chunks stored in `document_embeddings` table with JSONB metadata

### LLM Integration

- Primary LLM: OpenAI GPT-4 Turbo (fallback to local Ollama if API key missing)
- Embedding model: OpenAI text-embedding-3-small (fallback to sentence-transformers/all-MiniLM-L6-v2)
- Query intent classification based on keywords for calculation, definition, retrieval, or general queries

### API Design

- Chat conversations stored in-memory (conversations dict in chat.py)
- Document processing pipeline uses pdfplumber for table extraction
- Fund metrics calculated using numpy-financial for IRR calculations
- Query engine supports optional fund_id filtering for context-specific responses
