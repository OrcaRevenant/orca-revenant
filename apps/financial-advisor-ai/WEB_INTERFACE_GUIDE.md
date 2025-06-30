# Financial Advisor AI - Web Interface Guide

## 🌐 Starting the Web Interface

Your Financial Advisor AI is now ready to run with the web interface! Here are the different ways to start it:

### Option 1: Using Make (Recommended)
```bash
make web
```

### Option 2: Using Poetry
```bash
poetry run adk web
```

### Option 3: Using the Launcher Script
```bash
./run_web.sh
```

## 🔧 Why Use Poetry?

The web interface **must** be run through Poetry to ensure all dependencies are available. Running `adk web` directly may cause import errors like:
- `No module named 'sentence_transformers'`
- `No module named 'aiohttp'`

Poetry ensures the correct virtual environment with all dependencies is used.

## 🚀 Accessing the Interface

Once started, the web interface will be available at:
**http://localhost:8000**

## 🎯 Features Available in Web Interface

### RAG-Powered Search
- **Document Search**: Ask questions about your financial documents
- **Company Analysis**: Search for company-specific information
- **Market Insights**: Get analysis based on your document collection

### Example Queries to Try
- "What was Apple's revenue in Q4 2023?"
- "Tell me about Microsoft's cloud services growth"
- "What are the investment recommendations for tech stocks?"
- "Search for information about NVIDIA's AI business"

## 📁 Adding Your Documents

1. **Create the documents directory** (if not exists):
   ```bash
   mkdir -p data/documents
   ```

2. **Add your financial documents**:
   - Place PDF, DOCX, TXT, CSV, HTML, or JSON files in `data/documents/`
   - Supported document types:
     - SEC filings
     - Earnings reports
     - Research reports
     - Financial statements
     - Market analysis documents

3. **The system will automatically**:
   - Process and index your documents
   - Extract financial entities (tickers, dates, amounts)
   - Create searchable embeddings
   - Make them available for RAG queries

## 🔍 RAG System Features

### Smart Document Processing
- **Multi-format support**: PDF, DOCX, TXT, CSV, HTML, JSON
- **Financial entity recognition**: Automatically identifies tickers, currencies, dates
- **Intelligent chunking**: Preserves context while creating searchable segments
- **Document type classification**: Automatically categorizes documents

### Advanced Search
- **Semantic search**: Finds relevant content even with different wording
- **Company-specific search**: Filter by ticker symbols
- **Context-aware results**: Provides surrounding context for better understanding
- **Relevance scoring**: Results ranked by relevance to your query

### Embedding Models
The system uses a fallback approach for maximum compatibility:

1. **Sentence Transformers** (default): High-quality embeddings with good performance
2. **OpenAI Embeddings**: Highest quality, requires API key
3. **Cohere Embeddings**: Alternative high-quality option, requires API key

## 🛠️ Troubleshooting

### Common Issues

**Issue**: `No module named 'sentence_transformers'`
**Solution**: Always run through Poetry: `poetry run adk web` or `make web`

**Issue**: Web interface won't start
**Solution**: 
1. Check if Poetry environment is activated: `poetry shell`
2. Ensure dependencies are installed: `poetry install`
3. Run the readiness test: `poetry run python test_web_ready.py`

**Issue**: No search results
**Solution**:
1. Add documents to `data/documents/`
2. Restart the web interface to reindex documents
3. Try broader search terms

### Testing Your Setup

Run the web readiness test:
```bash
poetry run python test_web_ready.py
```

This will verify:
- All imports work correctly
- Embedding service is functional
- RAG tools are operational
- System is ready for web interface

## 📊 System Status

You can check the RAG system status through the web interface or programmatically:

```python
from financial_advisor_ai.tools.rag_search import get_rag_system_info

result = get_rag_system_info()
print(result['result'])
```

This shows:
- Number of documents loaded
- Total chunks indexed
- Available document types
- System configuration

## 🎉 You're Ready!

Your Financial Advisor AI with RAG capabilities is now ready to use through the web interface. The system will:

1. **Work immediately** with high-quality sentence transformer embeddings
2. **Process your documents** automatically when you add them
3. **Provide intelligent responses** based on your document collection
4. **Scale up** when you add API-based embedding models

Start the web interface and begin asking questions about your financial documents! 