# RAG System for Financial Advisor AI

This document describes the Retrieval-Augmented Generation (RAG) system implemented for the Financial Advisor AI using Google ADK. The RAG system enables the AI to search and retrieve information from financial documents to provide more accurate and contextual responses.

## 🚀 Features

### Core Capabilities
- **Multi-format Document Processing**: Supports PDF, DOCX, TXT, CSV, HTML, and JSON files
- **Advanced Vector Search**: FAISS-based similarity search with multiple index types
- **State-of-the-art Embeddings**: Support for Sentence Transformers, OpenAI, and Cohere models
- **Smart Chunking**: Intelligent document segmentation preserving context
- **Financial Entity Recognition**: Automatic detection of tickers, currencies, dates, and financial terms
- **Query Expansion**: Automatic enhancement of queries with financial synonyms
- **Result Reranking**: Advanced scoring based on relevance and document importance

### Integration Features
- **Google ADK Integration**: Seamless integration with your existing agent
- **Tool Functions**: Ready-to-use tools for document search and company analysis
- **Persistent Storage**: Automatic saving and loading of vector indices
- **Metadata Filtering**: Search by document type, date range, and custom filters

## 📁 Architecture

```
financial_advisor_ai/
├── rag/
│   ├── __init__.py              # Module exports
│   ├── embedding_service.py     # Multi-provider embedding service
│   ├── document_processor.py    # Document parsing and chunking
│   ├── vector_store.py          # FAISS-based vector storage
│   └── retriever.py             # RAG retrieval logic
├── tools/
│   └── rag_search.py           # Google ADK tool integration
└── examples/
    └── rag_example.py          # Complete usage example
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
# Basic installation with Poetry
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

### 2. Activate Poetry Environment

```bash
# Activate the Poetry virtual environment
poetry shell
```

### 3. Set Up API Keys (Optional)

For advanced embedding models, set environment variables:

```bash
# For OpenAI embeddings
export OPENAI_API_KEY="your-openai-api-key"

# For Cohere embeddings  
export COHERE_API_KEY="your-cohere-api-key"
```

## 📖 Usage

### Basic Setup

```python
from financial_advisor_ai.rag import (
    EmbeddingService,
    VectorStore, 
    DocumentProcessor,
    RAGRetriever
)

# Initialize components
embedding_service = EmbeddingService(
    model_name="sentence-transformers/all-mpnet-base-v2",
    provider="sentence-transformers"
)

vector_store = VectorStore(
    embedding_service=embedding_service,
    storage_path="data/vector_store"
)

retriever = RAGRetriever(vector_store)
```

### Loading Documents

```python
# Process documents from a directory
processor = DocumentProcessor()
documents = processor.process_directory("data/documents")

# Add to vector store
vector_store.add_documents(documents)
vector_store.save()
```

### Searching Documents

```python
# Basic search
results = retriever.retrieve("Apple Q4 2023 revenue", max_results=5)

# Search by document type
results = retriever.retrieve(
    "financial performance", 
    document_type="research_report"
)

# Company-specific search
results = retriever.retrieve_by_entities(
    "AAPL stock analysis",
    entity_types=['ticker']
)
```

### Google ADK Integration

The RAG system is already integrated with your Google ADK agent through these tools:

```python
# Available in your agent
search_financial_documents(
    query="What was Microsoft's cloud revenue growth?",
    document_type="sec_filing",
    max_results=3
)

search_company_documents("AAPL")

get_rag_system_info()
```

## 🎯 Embedding Models

### Recommended Configurations

| Use Case | Model | Provider | Description |
|----------|-------|----------|-------------|
| **Financial** | `all-mpnet-base-v2` | Sentence Transformers | Best for financial documents |
| **Fast** | `all-MiniLM-L6-v2` | Sentence Transformers | Quick processing |
| **Best Quality** | `text-embedding-3-large` | OpenAI | Highest accuracy (requires API key) |
| **Balanced** | `text-embedding-3-small` | OpenAI | Good quality, faster (requires API key) |

### Switching Models

```python
# Use OpenAI's best model
embedding_service = EmbeddingService(
    model_name="text-embedding-3-large",
    provider="openai",
    api_key="your-api-key"
)

# Use Cohere
embedding_service = EmbeddingService(
    model_name="embed-english-v3.0", 
    provider="cohere",
    api_key="your-api-key"
)
```

## 📊 Document Types

The system automatically classifies documents into types:

- `balance_sheet` - Balance sheet documents
- `income_statement` - Income statements  
- `cash_flow_statement` - Cash flow statements
- `sec_filing` - SEC filings (10-K, 10-Q, etc.)
- `research_report` - Analyst research reports
- `portfolio_report` - Portfolio analysis documents
- `market_news` - Market news and updates
- `general_financial` - Other financial documents

## 🔧 Configuration Options

### Vector Store Configuration

```python
vector_store = VectorStore(
    embedding_service=embedding_service,
    index_type="hnsw",        # "flat", "ivf", "hnsw", "pq"
    metric="cosine",          # "cosine", "l2", "ip"
    storage_path="data/vector_store",
    max_elements=1000000
)
```

### Document Processing Configuration

```python
processor = DocumentProcessor(
    chunk_size=1000,          # Target chunk size
    chunk_overlap=200,        # Overlap between chunks
    min_chunk_size=100,       # Minimum chunk size
    max_chunk_size=2000,      # Maximum chunk size
    preserve_structure=True   # Preserve document structure
)
```

### Retrieval Configuration

```python
retriever = RAGRetriever(
    vector_store=vector_store,
    max_results=5,            # Default max results
    min_score_threshold=0.1,  # Minimum similarity score
    context_window=2,         # Adjacent chunks for context
    enable_reranking=True,    # Enable result reranking
    enable_query_expansion=True  # Enable query expansion
)
```

## 📈 Performance Tips

### 1. Choose the Right Index Type
- **Flat**: Best accuracy, slower for large datasets
- **IVF**: Good balance of speed and accuracy
- **HNSW**: Fastest search, good for real-time applications
- **PQ**: Most memory-efficient, slight accuracy trade-off

### 2. Optimize Chunk Size
- **Small chunks (500-800)**: Better precision, more results
- **Large chunks (1000-1500)**: Better context, fewer results
- **Financial documents**: 1000-1200 works well

### 3. Use Appropriate Embedding Models
- **Local models**: Faster, no API costs, good for development
- **API models**: Better quality, requires internet and API keys
- **Financial-specific**: Use models trained on financial data when available

## 🔍 Example Queries

### Financial Analysis Queries
```python
# Revenue and performance
"What was Apple's revenue growth in Q4 2023?"
"Microsoft cloud services performance"
"Tesla profitability metrics"

# Investment recommendations  
"Technology sector investment outlook"
"AI companies price targets"
"Dividend yield analysis"

# Risk assessment
"Market volatility factors"
"Interest rate impact on tech stocks"
"Regulatory risks for financial sector"
```

### Company-Specific Queries
```python
# Use ticker symbols for precise results
search_company_documents("AAPL")
search_company_documents("MSFT") 
search_company_documents("GOOGL")

# Or include in natural language
"AAPL financial performance and outlook"
"TSLA production numbers and delivery targets"
```

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure you're in the Poetry environment
   poetry shell
   
   # Reinstall dependencies
   poetry install --sync
   ```

2. **FAISS Installation Issues**
   ```bash
   # For CPU-only systems (default)
   poetry install
   
   # For systems with CUDA
   poetry install --extras gpu
   ```

3. **Memory Issues with Large Documents**
   - Reduce `chunk_size` in DocumentProcessor
   - Use "pq" index type for memory efficiency
   - Process documents in smaller batches

4. **Slow Search Performance**
   - Use "hnsw" or "ivf" index types
   - Reduce `max_results` parameter
   - Consider using smaller embedding models

### Performance Monitoring

```python
# Check system statistics
stats = retriever.get_retrieval_stats()
print(f"Total documents: {stats['vector_store_stats']['total_documents']}")
print(f"Total chunks: {stats['vector_store_stats']['total_chunks']}")
print(f"Index size: {stats['vector_store_stats']['index_size']}")
```

## 🔄 Data Management

### Adding New Documents

```python
# Add single document
document = processor.process_file("new_report.pdf")
vector_store.add_document(document)
vector_store.save()

# Add from directory
new_docs = processor.process_directory("new_documents/")
vector_store.add_documents(new_docs)
vector_store.save()
```

### Updating Documents

```python
# Remove old document
vector_store.remove_document(doc_id)

# Add updated version
updated_doc = processor.process_file("updated_report.pdf")
vector_store.add_document(updated_doc)
vector_store.save()
```

### Backup and Restore

```python
# Save current state
vector_store.save("backup/vector_store_backup")

# Load from backup
vector_store.load("backup/vector_store_backup")
```

## 🎯 Best Practices

### 1. Document Organization
- Organize documents by type in separate folders
- Use descriptive filenames
- Keep documents updated and relevant

### 2. Query Optimization
- Use specific financial terms
- Include company ticker symbols
- Be specific about time periods

### 3. System Maintenance
- Regularly update the vector store with new documents
- Monitor system performance and adjust parameters
- Keep embedding models updated

### 4. Security
- Store API keys securely in environment variables
- Implement access controls for sensitive documents
- Regular backup of vector store data

## 📚 Advanced Features

### Custom Document Types

```python
# Add custom document type classification
processor.financial_patterns['custom_term'] = re.compile(r'your_pattern')
```

### Custom Metadata Filters

```python
# Search with custom filters
results = retriever.retrieve(
    "investment analysis",
    custom_filters={
        'analyst': 'Goldman Sachs',
        'rating': 'Buy'
    }
)
```

### Batch Processing

```python
# Process large document collections efficiently
for batch in document_batches:
    documents = processor.process_directory(batch)
    vector_store.add_documents(documents)
    vector_store.save()  # Save after each batch
```

## 🤝 Contributing

To extend the RAG system:

1. **Add new document processors** in `document_processor.py`
2. **Implement new embedding providers** in `embedding_service.py`
3. **Add custom retrieval strategies** in `retriever.py`
4. **Create new agent tools** in `tools/rag_search.py`

## 📄 License

This RAG system is part of the Financial Advisor AI project and follows the same licensing terms.

---

**Ready to enhance your Financial Advisor AI with powerful document retrieval capabilities!** 🚀

For questions or support, please refer to the example script in `examples/rag_example.py` or check the inline documentation in the source code. 