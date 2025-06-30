# Financial Advisor AI with RAG

A sophisticated AI financial advisor built with Google ADK and enhanced with Retrieval-Augmented Generation (RAG) capabilities using FAISS and state-of-the-art embedding models.

## 🚀 Features

### Core AI Capabilities
- **Portfolio Analysis**: Analyze portfolio composition and performance
- **Investment Recommendations**: Personalized advice based on risk tolerance
- **Financial Concepts**: Explain complex financial concepts clearly
- **Market Insights**: Provide market trends and analysis

### RAG-Enhanced Features
- **Document Search**: Search through financial documents, reports, and filings
- **Company Analysis**: Retrieve company-specific information by ticker symbol
- **Multi-format Support**: Process PDF, DOCX, TXT, CSV, HTML, and JSON files
- **Smart Chunking**: Intelligent document segmentation preserving context
- **Advanced Embeddings**: Support for Sentence Transformers, OpenAI, and Cohere models

## 🛠️ Installation

### Prerequisites
- Python 3.9 or higher
- Poetry (for dependency management)

### Install Poetry
If you don't have Poetry installed:

```bash
# On macOS/Linux
curl -sSL https://install.python-poetry.org | python3 -

# On Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

### Setup Project

1. **Clone and navigate to the project**:
   ```bash
   cd apps/financial-advisor-ai
   ```

2. **Quick setup (recommended)**:
   ```bash
   # Use the Makefile for convenience
   make setup
   ```

3. **Manual setup**:
   ```bash
   # Basic installation
   poetry install
   
   # With OpenAI support
   poetry install --extras openai
   
   # With Cohere support  
   poetry install --extras cohere
   
   # With GPU support (FAISS-GPU)
   poetry install --extras gpu
   
   # With all optional dependencies
   poetry install --extras all
   ```

4. **Activate the virtual environment**:
   ```bash
   poetry shell
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Optional: For advanced embedding models
OPENAI_API_KEY=your-openai-api-key
COHERE_API_KEY=your-cohere-api-key

# Google ADK configuration (if needed)
GOOGLE_ADK_API_KEY=your-google-adk-key
```

### Document Setup

1. **Create documents directory**:
   ```bash
   mkdir -p data/documents
   ```

2. **Add your financial documents**:
   - Place PDF, DOCX, TXT, CSV, HTML, or JSON files in `data/documents/`
   - The system will automatically process and index them

## 🚀 Quick Start

### 1. Start the Web Interface

```bash
# Using the Makefile (recommended)
make web

# Or using Poetry directly
poetry run adk web

# Or using the launcher script
./run_web.sh
```

The web interface will be available at: **http://localhost:8000**

### 2. Use the Agent Programmatically

```python
from financial_advisor_ai.agent import root_agent

# The agent now has RAG capabilities built-in
response = root_agent.run("What was Apple's revenue in Q4 2023?")
print(response)
```

### 3. Direct RAG Usage

```python
from financial_advisor_ai.rag import (
    EmbeddingService,
    VectorStore,
    DocumentProcessor,
    RAGRetriever
)

# Initialize RAG system
embedding_service = EmbeddingService()
vector_store = VectorStore(embedding_service, storage_path="data/vector_store")
retriever = RAGRetriever(vector_store)

# Search documents
results = retriever.retrieve("Microsoft cloud revenue growth")
for result in results:
    print(f"Source: {result.source}")
    print(f"Content: {result.content[:200]}...")
```

## 🎯 Available Tools

The agent includes these RAG-powered tools:

### `search_financial_documents`
Search for relevant financial documents based on queries.

```python
search_financial_documents(
    query="Apple Q4 2023 earnings",
    document_type="sec_filing",  # Optional filter
    max_results=5
)
```

### `search_company_documents`
Find documents related to specific companies by ticker symbol.

```python
search_company_documents("AAPL")
```

### `get_rag_system_info`
Get information about the RAG system status and available documents.

```python
get_rag_system_info()
```

## 📊 Embedding Models

### Available Configurations

| Configuration | Model | Provider | Use Case |
|---------------|-------|----------|----------|
| `financial` | `all-mpnet-base-v2` | Sentence Transformers | Best for financial documents |
| `fast` | `all-MiniLM-L6-v2` | Sentence Transformers | Quick processing |
| `openai_best` | `text-embedding-3-large` | OpenAI | Highest accuracy (requires API key) |
| `openai_fast` | `text-embedding-3-small` | OpenAI | Good quality, faster (requires API key) |
| `cohere` | `embed-english-v3.0` | Cohere | Cohere's model (requires API key) |

### Switching Models

```python
from financial_advisor_ai.rag import EmbeddingService, RECOMMENDED_MODELS

# Use OpenAI's best model
embedding_service = EmbeddingService(
    model_name="text-embedding-3-large",
    provider="openai"
)

# Use financial-optimized model
config = RECOMMENDED_MODELS["financial"]
embedding_service = EmbeddingService(
    model_name=config["model"],
    provider=config["provider"]
)
```

## 🔍 Example Queries

### Financial Analysis
- "What was Apple's revenue growth in Q4 2023?"
- "Microsoft cloud services performance analysis"
- "Technology sector investment recommendations"
- "NVIDIA AI chip market position"

### Company Research
- "AAPL financial performance and outlook"
- "TSLA production numbers and delivery targets"
- "MSFT Azure growth metrics"

### Market Analysis
- "Interest rate impact on tech stocks"
- "AI companies investment opportunities"
- "Semiconductor industry recovery trends"

## 🧪 Development

### Running Tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=financial_advisor_ai

# Run specific test file
poetry run pytest tests/test_rag.py

# Or use the Makefile
make test
make test-verbose
```

### Code Quality

```bash
# Format code
poetry run black financial_advisor_ai/

# Sort imports
poetry run isort financial_advisor_ai/

# Lint code
poetry run flake8 financial_advisor_ai/

# Type checking
poetry run mypy financial_advisor_ai/

# Or use the Makefile for convenience
make format    # Format code
make lint      # Run linting
make dev-check # Run all checks
```

### Adding Dependencies

```bash
# Add a new dependency
poetry add package-name

# Add a development dependency
poetry add --group dev package-name

# Add an optional dependency
poetry add --optional package-name
```

### Convenient Commands

This project includes a Makefile with convenient commands:

```bash
# See all available commands
make help

# Quick setup and test
make quick-start

# Development workflow
make dev-setup    # Setup development environment
make dev-check    # Run all quality checks

# Common tasks
make install      # Install dependencies
make test         # Run tests
make format       # Format code
make lint         # Run linting
make clean        # Clean cache files

# Data management
make create-dirs  # Create necessary directories
make clear-vector # Clear vector store data
```

## 📁 Project Structure

```
financial_advisor_ai/
├── financial_advisor_ai/
│   ├── agent.py                 # Main Google ADK agent
│   ├── rag/                     # RAG system components
│   │   ├── embedding_service.py # Multi-provider embeddings
│   │   ├── document_processor.py# Document parsing & chunking
│   │   ├── vector_store.py      # FAISS vector database
│   │   └── retriever.py         # RAG retrieval logic
│   ├── tools/                   # Agent tools
│   │   ├── rag_search.py        # RAG integration tools
│   │   └── ...                  # Other financial tools
│   ├── utils/                   # Utility functions
│   └── clients/                 # API clients
├── examples/
│   └── rag_example.py          # Complete demo script
├── tests/                      # Test suite
├── data/                       # Data directory
│   ├── documents/              # Financial documents
│   └── vector_store/           # Vector database storage
├── pyproject.toml              # Poetry configuration
├── README.md                   # This file
└── RAG_README.md              # Detailed RAG documentation
```

## 🚨 Troubleshooting

### Common Issues

1. **Poetry Installation Issues**
   ```bash
   # Update Poetry
   poetry self update
   
   # Clear cache
   poetry cache clear pypi --all
   ```

2. **FAISS Installation Issues**
   ```bash
   # For CPU-only systems
   poetry add faiss-cpu
   
   # For systems with CUDA
   poetry remove faiss-cpu
   poetry add faiss-gpu
   ```

3. **Memory Issues with Large Documents**
   - Reduce chunk size in DocumentProcessor
   - Use "pq" index type for memory efficiency
   - Process documents in smaller batches

4. **Import Errors**
   ```bash
   # Ensure you're in the Poetry environment
   poetry shell
   
   # Reinstall dependencies
   poetry install --sync
   ```

### Performance Optimization

- **For development**: Use `fast` embedding model
- **For production**: Use `financial` or `openai_best` models
- **For large datasets**: Use HNSW or IVF index types
- **For memory constraints**: Use PQ index type

## 📚 Documentation

- **[RAG System Documentation](RAG_README.md)**: Comprehensive guide to the RAG system
- **[API Documentation](docs/api.md)**: Detailed API reference (coming soon)
- **[Examples](examples/)**: Usage examples and tutorials

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install development dependencies**: `poetry install --with dev`
4. **Make your changes**
5. **Run tests**: `poetry run pytest`
6. **Format code**: `poetry run black . && poetry run isort .`
7. **Commit changes**: `git commit -m 'Add amazing feature'`
8. **Push to branch**: `git push origin feature/amazing-feature`
9. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google ADK** for the agent framework
- **FAISS** for efficient vector search
- **Sentence Transformers** for embedding models
- **OpenAI** and **Cohere** for advanced embedding APIs

---

**Ready to revolutionize financial analysis with AI and RAG!** 🚀

For detailed RAG system documentation, see [RAG_README.md](RAG_README.md). 