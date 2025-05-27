import os
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

# Import our RAG components
from financial_advisor_ai.rag import (
    EmbeddingService,
    VectorStore,
    DocumentProcessor,
    RAGRetriever,
    RECOMMENDED_MODELS
)

logger = logging.getLogger(__name__)


class RAGSearchTool:
    """
    RAG (Retrieval-Augmented Generation) search tool for financial documents.
    Integrates with Google ADK agents to provide document-based context.
    """
    
    def __init__(
        self,
        documents_path: str = "data/documents",
        vector_store_path: str = "data/vector_store",
        embedding_model: str = "financial",
        max_results: int = 5
    ):
        """
        Initialize the RAG search tool.
        
        Args:
            documents_path: Path to directory containing financial documents
            vector_store_path: Path to store the vector database
            embedding_model: Embedding model configuration key
            max_results: Maximum number of search results to return
        """
        self.documents_path = Path(documents_path)
        self.vector_store_path = Path(vector_store_path)
        self.max_results = max_results
        
        # Initialize components
        self.embedding_service = None
        self.vector_store = None
        self.retriever = None
        self.document_processor = None
        
        # Initialize the RAG system
        self._initialize_rag_system(embedding_model)
    
    def _initialize_rag_system(self, embedding_model: str):
        """Initialize the RAG system components."""
        try:
            # Initialize with sentence-transformers for better quality embeddings
            logger.info("Initializing RAG system with sentence-transformers embedding model")
            self.embedding_service = EmbeddingService(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                provider="sentence-transformers"
            )
            
            # Initialize vector store
            self.vector_store = VectorStore(
                embedding_service=self.embedding_service,
                storage_path=str(self.vector_store_path)
            )
            
            # Initialize retriever
            self.retriever = RAGRetriever(
                vector_store=self.vector_store,
                max_results=self.max_results
            )
            
            # Initialize document processor
            self.document_processor = DocumentProcessor()
            
            # Load existing documents if vector store is empty
            if len(self.vector_store) == 0 and self.documents_path.exists():
                self._load_documents()
            
            logger.info("RAG system initialized successfully with sentence-transformers embeddings")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")
            # Initialize with minimal functionality using fast model
            self.embedding_service = EmbeddingService(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                provider="sentence-transformers"
            )
            self.vector_store = VectorStore(self.embedding_service)
            self.retriever = RAGRetriever(self.vector_store)
            self.document_processor = DocumentProcessor()
    
    def _load_documents(self):
        """Load documents from the documents directory."""
        try:
            if not self.documents_path.exists():
                logger.warning(f"Documents path does not exist: {self.documents_path}")
                return
            
            logger.info(f"Loading documents from {self.documents_path}")
            documents = self.document_processor.process_directory(self.documents_path)
            
            if documents:
                self.vector_store.add_documents(documents)
                self.vector_store.save()
                logger.info(f"Loaded {len(documents)} documents into vector store")
            else:
                logger.warning("No documents found to load")
                
        except Exception as e:
            logger.error(f"Error loading documents: {e}")
    
    def search_documents(
        self,
        query: str,
        document_type: Optional[str] = None,
        max_results: Optional[int] = None
    ) -> str:
        """
        Search for relevant financial documents based on a query.
        
        Args:
            query: The search query
            document_type: Optional filter by document type (e.g., 'research_report', 'sec_filing')
            max_results: Maximum number of results to return
            
        Returns:
            Formatted search results as a string
        """
        try:
            if not query.strip():
                return "Please provide a search query."
            
            # Use provided max_results or default
            k = max_results or self.max_results
            
            # Perform search
            results = self.retriever.retrieve(
                query=query,
                document_type=document_type,
                include_context=True
            )
            
            if not results:
                return f"No relevant documents found for query: '{query}'"
            
            # Format results
            formatted_results = self._format_search_results(results, query)
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error in document search: {e}")
            return f"Error occurred while searching documents: {str(e)}"
    
    def search_by_company(self, company_symbol: str) -> str:
        """
        Search for documents related to a specific company.
        
        Args:
            company_symbol: Stock ticker symbol (e.g., 'AAPL', 'MSFT')
            
        Returns:
            Formatted search results for the company
        """
        try:
            # Search for the company symbol and related terms
            query = f"{company_symbol} company financial performance earnings"
            
            results = self.retriever.retrieve_by_entities(
                query=query,
                entity_types=['ticker']
            )
            
            if not results:
                return f"No documents found for company symbol: {company_symbol}"
            
            formatted_results = self._format_search_results(results, f"Company: {company_symbol}")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching by company: {e}")
            return f"Error occurred while searching for company {company_symbol}: {str(e)}"
    
    def get_document_summary(self, document_id: str) -> str:
        """
        Get a summary of a specific document.
        
        Args:
            document_id: The document ID
            
        Returns:
            Document summary
        """
        try:
            summary = self.retriever.get_document_summary(document_id)
            
            if summary:
                return f"Document Summary:\n{summary}"
            else:
                return f"Document not found: {document_id}"
                
        except Exception as e:
            logger.error(f"Error getting document summary: {e}")
            return f"Error occurred while getting document summary: {str(e)}"
    
    def list_available_documents(self) -> str:
        """
        List all available documents in the vector store.
        
        Returns:
            Formatted list of documents
        """
        try:
            doc_ids = self.vector_store.list_documents()
            
            if not doc_ids:
                return "No documents are currently loaded in the system."
            
            # Get document metadata
            documents_info = []
            for doc_id in doc_ids[:20]:  # Limit to first 20
                doc = self.vector_store.get_document(doc_id)
                if doc:
                    metadata = doc.metadata
                    info = {
                        'id': doc_id,
                        'filename': metadata.get('filename', 'Unknown'),
                        'type': metadata.get('document_type', 'Unknown'),
                        'size': metadata.get('file_size', 0)
                    }
                    documents_info.append(info)
            
            # Format the list
            result = f"Available Documents ({len(doc_ids)} total):\n\n"
            for info in documents_info:
                result += f"• {info['filename']} (Type: {info['type']}, Size: {info['size']} bytes)\n"
            
            if len(doc_ids) > 20:
                result += f"\n... and {len(doc_ids) - 20} more documents"
            
            return result
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return f"Error occurred while listing documents: {str(e)}"
    
    def get_system_stats(self) -> str:
        """
        Get statistics about the RAG system.
        
        Returns:
            Formatted system statistics
        """
        try:
            stats = self.retriever.get_retrieval_stats()
            vector_stats = stats['vector_store_stats']
            
            result = "RAG System Statistics:\n\n"
            result += f"• Total Documents: {vector_stats['total_documents']}\n"
            result += f"• Total Chunks: {vector_stats['total_chunks']}\n"
            result += f"• Index Size: {vector_stats['index_size']}\n"
            result += f"• Embedding Dimension: {vector_stats['dimension']}\n"
            result += f"• Index Type: {vector_stats['index_type']}\n"
            result += f"• Distance Metric: {vector_stats['metric']}\n"
            result += f"• Document Types: {', '.join(vector_stats['document_types'])}\n"
            result += f"• Max Results: {stats['max_results']}\n"
            result += f"• Score Threshold: {stats['min_score_threshold']}\n"
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return f"Error occurred while getting system statistics: {str(e)}"
    
    def add_document_from_text(self, text: str, filename: str, document_type: str = "user_input") -> str:
        """
        Add a document from raw text.
        
        Args:
            text: The document text content
            filename: Name for the document
            document_type: Type of document
            
        Returns:
            Success message
        """
        try:
            from financial_advisor_ai.rag.document_processor import Document
            import hashlib
            from datetime import datetime
            
            # Create document ID
            doc_id = hashlib.md5(f"{filename}_{text[:100]}".encode()).hexdigest()
            
            # Create metadata
            metadata = {
                'filename': filename,
                'document_type': document_type,
                'content_length': len(text),
                'word_count': len(text.split()),
                'created_time': datetime.now().isoformat(),
                'source': 'user_input'
            }
            
            # Create document
            document = Document(
                content=text,
                metadata=metadata,
                doc_id=doc_id,
                source=filename
            )
            
            # Add to vector store
            self.vector_store.add_document(document)
            self.vector_store.save()
            
            return f"Successfully added document '{filename}' with {len(text)} characters."
            
        except Exception as e:
            logger.error(f"Error adding document: {e}")
            return f"Error occurred while adding document: {str(e)}"
    
    def _format_search_results(self, results: List, query: str) -> str:
        """Format search results for display."""
        if not results:
            return f"No results found for: {query}"
        
        formatted = f"Search Results for: '{query}'\n"
        formatted += "=" * 50 + "\n\n"
        
        for i, result in enumerate(results, 1):
            formatted += f"Result {i} (Score: {result.score:.3f}):\n"
            formatted += f"Source: {result.source}\n"
            formatted += f"Type: {result.metadata.get('document_type', 'Unknown')}\n"
            formatted += f"Content:\n{result.content[:300]}...\n"
            
            if result.context and result.context != result.content:
                formatted += f"Context:\n{result.context[:200]}...\n"
            
            formatted += "-" * 30 + "\n\n"
        
        return formatted


# Global RAG tool instance (singleton pattern)
_rag_tool_instance = None


def _get_rag_tool() -> RAGSearchTool:
    """Get or create the global RAG tool instance."""
    global _rag_tool_instance
    if _rag_tool_instance is None:
        _rag_tool_instance = RAGSearchTool()
    return _rag_tool_instance


def search_financial_documents(
    query: str,
    document_type: Optional[str] = None,
    max_results: int = 5
) -> Dict[str, Any]:
    """
    Search for relevant financial documents using RAG.
    
    Args:
        query: The search query for financial information
        document_type: Optional filter by document type (research_report, sec_filing, etc.)
        max_results: Maximum number of results to return (default: 5)
    
    Returns:
        Dict with status and result containing formatted search results with relevant financial document excerpts
    """
    try:
        if not query.strip():
            return {
                "status": "error",
                "error_message": "Please provide a search query."
            }
        
        rag_tool = _get_rag_tool()
        result = rag_tool.search_documents(
            query=query,
            document_type=document_type,
            max_results=max_results
        )
        
        return {
            "status": "success",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error in search_financial_documents: {e}")
        return {
            "status": "error",
            "error_message": f"An error occurred while searching documents: {str(e)}"
        }


def search_company_documents(company_symbol: str) -> Dict[str, Any]:
    """
    Search for documents related to a specific company by ticker symbol.
    
    Args:
        company_symbol: Stock ticker symbol (e.g., 'AAPL', 'MSFT', 'GOOGL')
    
    Returns:
        Dict with status and result containing formatted search results for the specified company
    """
    try:
        if not company_symbol.strip():
            return {
                "status": "error",
                "error_message": "Please provide a company symbol."
            }
        
        rag_tool = _get_rag_tool()
        result = rag_tool.search_by_company(company_symbol.upper())
        
        return {
            "status": "success",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error in search_company_documents: {e}")
        return {
            "status": "error",
            "error_message": f"An error occurred while searching for company {company_symbol}: {str(e)}"
        }


def get_rag_system_info() -> Dict[str, Any]:
    """
    Get information about the RAG system status and statistics.
    
    Returns:
        Dict with status and result containing system statistics and available document information
    """
    try:
        rag_tool = _get_rag_tool()
        stats = rag_tool.get_system_stats()
        docs = rag_tool.list_available_documents()
        
        result = f"{stats}\n\n{docs}"
        
        return {
            "status": "success",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error in get_rag_system_info: {e}")
        return {
            "status": "error",
            "error_message": f"An error occurred while getting system information: {str(e)}"
        } 