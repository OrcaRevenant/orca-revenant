import logging
from typing import List, Dict, Any, Optional, Tuple
import re
from datetime import datetime
from dataclasses import dataclass

from .vector_store import VectorStore
from .document_processor import DocumentChunk

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """Represents a retrieval result with context and metadata."""
    content: str
    source: str
    score: float
    metadata: Dict[str, Any]
    chunk_id: str
    doc_id: str
    context: Optional[str] = None


class RAGRetriever:
    """
    Advanced RAG retriever that provides intelligent document retrieval
    with context enhancement and query processing.
    """
    
    def __init__(
        self,
        vector_store: VectorStore,
        max_results: int = 5,
        min_score_threshold: float = 0.1,
        context_window: int = 2,
        enable_reranking: bool = True,
        enable_query_expansion: bool = True
    ):
        """
        Initialize the RAG retriever.
        
        Args:
            vector_store: Vector store for similarity search
            max_results: Maximum number of results to return
            min_score_threshold: Minimum similarity score threshold
            context_window: Number of adjacent chunks to include for context
            enable_reranking: Whether to enable result reranking
            enable_query_expansion: Whether to expand queries with financial terms
        """
        self.vector_store = vector_store
        self.max_results = max_results
        self.min_score_threshold = min_score_threshold
        self.context_window = context_window
        self.enable_reranking = enable_reranking
        self.enable_query_expansion = enable_query_expansion
        
        # Financial query expansion terms
        self.financial_synonyms = {
            'stock': ['equity', 'share', 'security'],
            'profit': ['earnings', 'income', 'revenue'],
            'loss': ['deficit', 'negative earnings'],
            'portfolio': ['holdings', 'investments', 'assets'],
            'risk': ['volatility', 'uncertainty', 'exposure'],
            'return': ['yield', 'performance', 'gain'],
            'market': ['exchange', 'trading', 'financial market'],
            'price': ['value', 'cost', 'valuation'],
            'analysis': ['evaluation', 'assessment', 'review'],
            'forecast': ['prediction', 'projection', 'outlook']
        }
        
        # Financial entity patterns
        self.entity_patterns = {
            'ticker': re.compile(r'\b[A-Z]{1,5}\b'),
            'currency': re.compile(r'\$[\d,]+\.?\d*|\b\d+\.\d{2}\s*(USD|EUR|GBP|JPY|CAD|AUD)\b'),
            'percentage': re.compile(r'\d+\.?\d*%'),
            'date': re.compile(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b')
        }
    
    def retrieve(
        self,
        query: str,
        document_type: Optional[str] = None,
        date_range: Optional[Tuple[str, str]] = None,
        include_context: bool = True,
        custom_filters: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: Search query
            document_type: Optional document type filter
            date_range: Optional date range filter (start, end)
            include_context: Whether to include surrounding context
            custom_filters: Additional metadata filters
            
        Returns:
            List of retrieval results
        """
        # Process and expand query
        processed_query = self._process_query(query)
        
        # Build metadata filters
        filters = {}
        if document_type:
            filters['document_type'] = document_type
        if custom_filters:
            filters.update(custom_filters)
        
        # Perform search
        search_results = self.vector_store.search(
            processed_query,
            k=self.max_results * 2,  # Get more results for filtering/reranking
            filter_metadata=filters if filters else None,
            include_scores=True
        )
        
        # Filter by score threshold
        filtered_results = [
            result for result in search_results
            if result.get('score', 0) >= self.min_score_threshold
        ]
        
        # Apply date filtering if specified
        if date_range:
            filtered_results = self._filter_by_date(filtered_results, date_range)
        
        # Rerank results if enabled
        if self.enable_reranking:
            filtered_results = self._rerank_results(query, filtered_results)
        
        # Convert to RetrievalResult objects
        retrieval_results = []
        for result in filtered_results[:self.max_results]:
            # Get context if requested
            context = None
            if include_context:
                context = self._get_context(result['chunk'], result['document'])
            
            retrieval_result = RetrievalResult(
                content=result['content'],
                source=result['document'].source,
                score=result.get('score', 0.0),
                metadata=result['metadata'],
                chunk_id=result['chunk_id'],
                doc_id=result['doc_id'],
                context=context
            )
            retrieval_results.append(retrieval_result)
        
        logger.info(f"Retrieved {len(retrieval_results)} results for query: {query[:50]}...")
        return retrieval_results
    
    def retrieve_by_entities(
        self,
        query: str,
        entity_types: List[str] = None
    ) -> List[RetrievalResult]:
        """
        Retrieve documents based on financial entities in the query.
        
        Args:
            query: Search query
            entity_types: Types of entities to extract ('ticker', 'currency', etc.)
            
        Returns:
            List of retrieval results
        """
        if entity_types is None:
            entity_types = ['ticker', 'currency', 'percentage']
        
        # Extract entities from query
        entities = self._extract_entities(query, entity_types)
        
        # Enhance query with entity-specific searches
        enhanced_queries = [query]
        for entity_type, entity_values in entities.items():
            for value in entity_values:
                enhanced_queries.append(f"{entity_type} {value}")
        
        # Perform searches for all enhanced queries
        all_results = []
        for enhanced_query in enhanced_queries:
            results = self.retrieve(enhanced_query, include_context=False)
            all_results.extend(results)
        
        # Deduplicate and rerank
        unique_results = self._deduplicate_results(all_results)
        return unique_results[:self.max_results]
    
    def retrieve_similar_documents(
        self,
        doc_id: str,
        k: int = 5
    ) -> List[RetrievalResult]:
        """
        Find documents similar to a given document.
        
        Args:
            doc_id: ID of the reference document
            k: Number of similar documents to return
            
        Returns:
            List of similar documents
        """
        document = self.vector_store.get_document(doc_id)
        if not document:
            return []
        
        # Use document content as query
        query = document.content[:1000]  # Use first 1000 chars as query
        
        results = self.retrieve(query, include_context=False)
        
        # Filter out the original document
        similar_results = [
            result for result in results
            if result.doc_id != doc_id
        ]
        
        return similar_results[:k]
    
    def get_document_summary(self, doc_id: str) -> Optional[str]:
        """
        Get a summary of a document based on its most important chunks.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document summary or None if not found
        """
        document = self.vector_store.get_document(doc_id)
        if not document:
            return None
        
        # Get all chunks for this document
        doc_chunks = [
            chunk for chunk in self.vector_store.chunks.values()
            if chunk.doc_id == doc_id
        ]
        
        if not doc_chunks:
            return document.content[:500] + "..." if len(document.content) > 500 else document.content
        
        # Sort chunks by their position in the document
        doc_chunks.sort(key=lambda x: x.chunk_index)
        
        # Take first few chunks as summary
        summary_chunks = doc_chunks[:3]
        summary = "\n\n".join([chunk.content for chunk in summary_chunks])
        
        return summary
    
    def _process_query(self, query: str) -> str:
        """Process and potentially expand the query."""
        if not self.enable_query_expansion:
            return query
        
        # Convert to lowercase for processing
        query_lower = query.lower()
        expanded_terms = []
        
        # Add synonyms for financial terms
        for term, synonyms in self.financial_synonyms.items():
            if term in query_lower:
                expanded_terms.extend(synonyms)
        
        # Combine original query with expanded terms
        if expanded_terms:
            expanded_query = query + " " + " ".join(expanded_terms[:3])  # Limit expansion
            return expanded_query
        
        return query
    
    def _extract_entities(self, text: str, entity_types: List[str]) -> Dict[str, List[str]]:
        """Extract financial entities from text."""
        entities = {}
        
        for entity_type in entity_types:
            if entity_type in self.entity_patterns:
                pattern = self.entity_patterns[entity_type]
                matches = pattern.findall(text)
                if matches:
                    entities[entity_type] = list(set(matches))  # Remove duplicates
        
        return entities
    
    def _filter_by_date(
        self,
        results: List[Dict[str, Any]],
        date_range: Tuple[str, str]
    ) -> List[Dict[str, Any]]:
        """Filter results by date range."""
        start_date, end_date = date_range
        
        filtered = []
        for result in results:
            doc_date = result['metadata'].get('modified_time')
            if doc_date:
                try:
                    doc_datetime = datetime.fromisoformat(doc_date.replace('Z', '+00:00'))
                    start_datetime = datetime.fromisoformat(start_date)
                    end_datetime = datetime.fromisoformat(end_date)
                    
                    if start_datetime <= doc_datetime <= end_datetime:
                        filtered.append(result)
                except ValueError:
                    # If date parsing fails, include the result
                    filtered.append(result)
            else:
                # If no date metadata, include the result
                filtered.append(result)
        
        return filtered
    
    def _rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Rerank results based on additional criteria."""
        # Simple reranking based on query term frequency and document type
        query_terms = set(query.lower().split())
        
        def rerank_score(result):
            content = result['content'].lower()
            metadata = result['metadata']
            
            # Base score from similarity
            score = result.get('score', 0.0)
            
            # Boost for query term frequency
            term_frequency = sum(1 for term in query_terms if term in content)
            score += term_frequency * 0.1
            
            # Boost for certain document types
            doc_type = metadata.get('document_type', '')
            if doc_type in ['research_report', 'sec_filing']:
                score += 0.2
            elif doc_type in ['balance_sheet', 'income_statement']:
                score += 0.15
            
            # Boost for recent documents
            modified_time = metadata.get('modified_time')
            if modified_time:
                try:
                    doc_date = datetime.fromisoformat(modified_time.replace('Z', '+00:00'))
                    days_old = (datetime.now() - doc_date).days
                    if days_old < 30:  # Recent documents
                        score += 0.1
                except ValueError:
                    pass
            
            return score
        
        # Sort by reranked score
        results.sort(key=rerank_score, reverse=True)
        return results
    
    def _get_context(self, chunk: DocumentChunk, document) -> str:
        """Get surrounding context for a chunk."""
        if self.context_window <= 0:
            return chunk.content
        
        # Get all chunks for this document
        doc_chunks = [
            c for c in self.vector_store.chunks.values()
            if c.doc_id == chunk.doc_id
        ]
        
        if len(doc_chunks) <= 1:
            return chunk.content
        
        # Sort by chunk index
        doc_chunks.sort(key=lambda x: x.chunk_index)
        
        # Find current chunk position
        current_idx = None
        for i, c in enumerate(doc_chunks):
            if c.chunk_id == chunk.chunk_id:
                current_idx = i
                break
        
        if current_idx is None:
            return chunk.content
        
        # Get context window
        start_idx = max(0, current_idx - self.context_window)
        end_idx = min(len(doc_chunks), current_idx + self.context_window + 1)
        
        context_chunks = doc_chunks[start_idx:end_idx]
        context_content = "\n\n".join([c.content for c in context_chunks])
        
        return context_content
    
    def _deduplicate_results(self, results: List[RetrievalResult]) -> List[RetrievalResult]:
        """Remove duplicate results based on chunk ID."""
        seen_chunks = set()
        unique_results = []
        
        for result in results:
            if result.chunk_id not in seen_chunks:
                seen_chunks.add(result.chunk_id)
                unique_results.append(result)
        
        # Sort by score
        unique_results.sort(key=lambda x: x.score, reverse=True)
        return unique_results
    
    def get_retrieval_stats(self) -> Dict[str, Any]:
        """Get statistics about the retrieval system."""
        return {
            'vector_store_stats': self.vector_store.get_stats(),
            'max_results': self.max_results,
            'min_score_threshold': self.min_score_threshold,
            'context_window': self.context_window,
            'reranking_enabled': self.enable_reranking,
            'query_expansion_enabled': self.enable_query_expansion
        }