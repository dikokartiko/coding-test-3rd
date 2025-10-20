# Project Backend Agents Guide

## Build/Lint/Test Commands

### Development

- Run development server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Run with Docker: `docker-compose up --build`

### Testing

- Run all tests: `pytest`
- Run with coverage: `pytest --cov=app tests/`
- Run specific test file: `pytest tests/test_metrics.py -v`

### Linting

- Format code: `black .`
- Lint code: `flake8 .`
- Type check: `mypy .`

## Code Style Guidelines

### Python

- Use Black for code formatting (version 23.12.1)
- Use Flake8 for linting (version 7.0.0)
- Use MyPy for type checking (version 1.8.0)
- Follow FastAPI dependency injection patterns with Pydantic schemas

### Database

- Use SQLAlchemy ORM with Pydantic schemas for validation
- Use PostgreSQL with pgvector extension for vector storage
- Use Alembic for database migrations

### API Development

- Use FastAPI with automatic OpenAPI documentation
- Follow RESTful API design principles
- Use Pydantic for request/response validation

## Project-Specific Conventions

### Architecture

- Follow Clean Architecture principles with separation of concerns
- Services contain business logic (app/services/)
- API endpoints in app/api/endpoints/
- Database models in app/models/
- Schemas for validation in app/schemas/

### Database & Vector Store

- PostgreSQL with pgvector extension for vector storage
- Document embeddings table uses different dimensions: 1536 for OpenAI, 384 for sentence-transformers
- Vector similarity search uses cosine distance operator (<=>)
- Database sessions managed through FastAPI dependencies

### LLM Integration

- Use LangChain for LLM orchestration
- Support OpenAI GPT-4 Turbo with fallback to local Ollama
- Use OpenAI embeddings with sentence-transformers fallback
- Query intent classification: 'calculation', 'definition', 'retrieval', or 'general'

### Document Processing

- Use pdfplumber for PDF table extraction
- Document processing pipeline handles various file formats
- Chunking strategy for vector storage with configurable size/overlap

### Fund Metrics

- Calculate fund performance metrics using numpy-financial
- Support for DPI, IRR, TVPI, RVPI calculations
- Handle various transaction types: capital calls, distributions, adjustments

### Task Management

- Use Celery with Redis for background task processing
- Asynchronous processing for document ingestion
- Task monitoring and error handling patterns
