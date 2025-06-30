import logging
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path
import json
from datetime import datetime
import threading
from dataclasses import asdict

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

from .document_processor import Document, DocumentChunk, DocumentProcessor
from .embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class VectorStore:
    """
    FAISS-based vector store for efficient similarity search and retrieval.
    Supports multiple index types and persistence.
    """
    
    def __init__(
        self,
        embedding_service: EmbeddingService,
        index_type: str = "flat",
        metric: str = "cosine",
        storage_path: Optional[str] = None,
        max_elements: int = 1000000,
        ef_construction: int = 200,
        ef_search: int = 50,
        m_links: int = 16
    ):
        """
        Initialize the vector store.
        
        Args:
            embedding_service: Service for generating embeddings
            index_type: Type of FAISS index ('flat', 'ivf', 'hnsw', 'pq')
            metric: Distance metric ('cosine', 'l2', 'ip')
            storage_path: Path to store the index and metadata
            max_elements: Maximum number of elements for HNSW index
            ef_construction: Construction parameter for HNSW
            ef_search: Search parameter for HNSW
            m_links: Number of links for HNSW
        """
        if not HAS_FAISS:
            raise ImportError("FAISS is required. Install with: pip install faiss-cpu or pip install faiss-gpu")
        
        self.embedding_service = embedding_service
        self.index_type = index_type.lower()
        self.metric = metric.lower()
        self.storage_path = Path(storage_path) if storage_path else None
        self.max_elements = max_elements
        self.ef_construction = ef_construction
        self.ef_search = ef_search
        self.m_links = m_links
        
        # Initialize components
        self.dimension = self.embedding_service.get_embedding_dimension()
        self.index = None
        self.documents = {}  # doc_id -> Document
        self.chunks = {}     # chunk_id -> DocumentChunk
        self.chunk_ids = []  # Ordered list of chunk IDs (matches index order)
        self.metadata = {}   # Additional metadata
        self._lock = threading.RLock()
        
        # Create index
        self._create_index()
        
        # Load existing data if storage path exists
        if self.storage_path and self.storage_path.exists():
            self.load()
    
    def _create_index(self):
        """Create the appropriate FAISS index based on configuration."""
        if self.index_type == "flat":
            if self.metric == "cosine":
                # For cosine similarity, we'll normalize vectors and use inner product
                self.index = faiss.IndexFlatIP(self.dimension)
            elif self.metric == "l2":
                self.index = faiss.IndexFlatL2(self.dimension)
            else:  # inner product
                self.index = faiss.IndexFlatIP(self.dimension)
                
        elif self.index_type == "ivf":
            # IVF (Inverted File) index for faster search on large datasets
            nlist = min(100, max(1, int(np.sqrt(self.max_elements))))
            quantizer = faiss.IndexFlatL2(self.dimension)
            
            if self.metric == "cosine":
                self.index = faiss.IndexIVFFlat(quantizer, self.dimension, nlist, faiss.METRIC_INNER_PRODUCT)
            else:
                metric = faiss.METRIC_L2 if self.metric == "l2" else faiss.METRIC_INNER_PRODUCT
                self.index = faiss.IndexIVFFlat(quantizer, self.dimension, nlist, metric)
                
        elif self.index_type == "hnsw":
            # HNSW (Hierarchical Navigable Small World) for fast approximate search
            self.index = faiss.IndexHNSWFlat(self.dimension, self.m_links)
            self.index.hnsw.efConstruction = self.ef_construction
            self.index.hnsw.efSearch = self.ef_search
            
        elif self.index_type == "pq":
            # Product Quantization for memory-efficient storage
            m = min(self.dimension // 4, 64)  # Number of subquantizers
            nbits = 8  # Number of bits per subquantizer
            self.index = faiss.IndexPQ(self.dimension, m, nbits)
            
        else:
            raise ValueError(f"Unsupported index type: {self.index_type}")
        
        logger.info(f"Created FAISS index: {self.index_type} with metric {self.metric}")
    
    def add_document(self, document: Document) -> None:
        """
        Add a document to the vector store.
        
        Args:
            document: Document to add
        """
        with self._lock:
            # Store document
            self.documents[document.doc_id] = document
            
            # Process chunks
            if not document.chunks:
                processor = DocumentProcessor()
                document.chunks = processor.chunk_document(document)
            
            # Create document chunks
            processor = DocumentProcessor()
            doc_chunks = processor.create_document_chunks(document)
            
            # Generate embeddings for chunks
            chunk_texts = [chunk.content for chunk in doc_chunks]
            embeddings = self.embedding_service.embed_texts(chunk_texts)
            
            # Add to index
            for chunk, embedding in zip(doc_chunks, embeddings):
                self._add_chunk_to_index(chunk, embedding)
            
            logger.info(f"Added document {document.doc_id} with {len(doc_chunks)} chunks")
    
    def add_documents(self, documents: List[Document]) -> None:
        """
        Add multiple documents to the vector store.
        
        Args:
            documents: List of documents to add
        """
        for document in documents:
            self.add_document(document)
    
    def _add_chunk_to_index(self, chunk: DocumentChunk, embedding: np.ndarray) -> None:
        """Add a single chunk and its embedding to the index."""
        # Store chunk
        self.chunks[chunk.chunk_id] = chunk
        self.chunk_ids.append(chunk.chunk_id)
        
        # Normalize embedding for cosine similarity
        if self.metric == "cosine":
            embedding = embedding / np.linalg.norm(embedding)
        
        # Add to FAISS index
        embedding = embedding.reshape(1, -1).astype(np.float32)
        
        if self.index_type == "ivf" and self.index.ntotal == 0:
            # Train IVF index if not trained yet
            # We need some data to train, so we'll train when we have enough
            if len(self.chunk_ids) >= 100:  # Train with at least 100 vectors
                all_embeddings = []
                for cid in self.chunk_ids[:-1]:  # Exclude the current one
                    chunk_emb = self.embedding_service.embed_text(self.chunks[cid].content)
                    if self.metric == "cosine":
                        chunk_emb = chunk_emb / np.linalg.norm(chunk_emb)
                    all_embeddings.append(chunk_emb)
                
                if all_embeddings:
                    training_data = np.array(all_embeddings).astype(np.float32)
                    self.index.train(training_data)
                    # Add all previous embeddings
                    self.index.add(training_data)
        
        self.index.add(embedding)
    
    def search(
        self,
        query: str,
        k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
        include_scores: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks based on a query.
        
        Args:
            query: Search query
            k: Number of results to return
            filter_metadata: Optional metadata filters
            include_scores: Whether to include similarity scores
            
        Returns:
            List of search results with chunks and metadata
        """
        with self._lock:
            if self.index.ntotal == 0:
                return []
            
            # Generate query embedding
            query_embedding = self.embedding_service.embed_text(query)
            
            # Normalize for cosine similarity
            if self.metric == "cosine":
                query_embedding = query_embedding / np.linalg.norm(query_embedding)
            
            query_embedding = query_embedding.reshape(1, -1).astype(np.float32)
            
            # Search
            scores, indices = self.index.search(query_embedding, min(k * 2, self.index.ntotal))
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:  # Invalid index
                    continue
                
                chunk_id = self.chunk_ids[idx]
                chunk = self.chunks[chunk_id]
                document = self.documents[chunk.doc_id]
                
                # Apply metadata filters
                if filter_metadata and not self._matches_filter(chunk.metadata, filter_metadata):
                    continue
                
                result = {
                    'chunk': chunk,
                    'document': document,
                    'chunk_id': chunk_id,
                    'doc_id': chunk.doc_id,
                    'content': chunk.content,
                    'metadata': chunk.metadata
                }
                
                if include_scores:
                    # Convert distance to similarity score
                    if self.metric == "cosine":
                        result['score'] = float(score)  # Already similarity for IP
                    else:
                        result['score'] = 1.0 / (1.0 + float(score))  # Convert distance to similarity
                
                results.append(result)
                
                if len(results) >= k:
                    break
            
            return results
    
    def search_by_document_type(
        self,
        query: str,
        document_type: str,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search within documents of a specific type.
        
        Args:
            query: Search query
            document_type: Type of document to search in
            k: Number of results to return
            
        Returns:
            List of search results
        """
        filter_metadata = {'document_type': document_type}
        return self.search(query, k, filter_metadata)
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        """Get a document by ID."""
        return self.documents.get(doc_id)
    
    def get_chunk(self, chunk_id: str) -> Optional[DocumentChunk]:
        """Get a chunk by ID."""
        return self.chunks.get(chunk_id)
    
    def list_documents(self) -> List[str]:
        """List all document IDs."""
        return list(self.documents.keys())
    
    def list_document_types(self) -> List[str]:
        """List all unique document types."""
        types = set()
        for doc in self.documents.values():
            doc_type = doc.metadata.get('document_type', 'unknown')
            types.add(doc_type)
        return list(types)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store."""
        return {
            'total_documents': len(self.documents),
            'total_chunks': len(self.chunks),
            'index_size': self.index.ntotal if self.index else 0,
            'dimension': self.dimension,
            'index_type': self.index_type,
            'metric': self.metric,
            'document_types': self.list_document_types()
        }
    
    def remove_document(self, doc_id: str) -> bool:
        """
        Remove a document and its chunks from the vector store.
        Note: FAISS doesn't support efficient removal, so this rebuilds the index.
        
        Args:
            doc_id: Document ID to remove
            
        Returns:
            True if document was removed, False if not found
        """
        with self._lock:
            if doc_id not in self.documents:
                return False
            
            # Find chunks to remove
            chunks_to_remove = [cid for cid, chunk in self.chunks.items() if chunk.doc_id == doc_id]
            
            # Remove from data structures
            del self.documents[doc_id]
            for chunk_id in chunks_to_remove:
                del self.chunks[chunk_id]
            
            # Rebuild index (FAISS doesn't support efficient removal)
            self._rebuild_index()
            
            logger.info(f"Removed document {doc_id} and {len(chunks_to_remove)} chunks")
            return True
    
    def _rebuild_index(self):
        """Rebuild the FAISS index from scratch."""
        # Create new index
        self._create_index()
        self.chunk_ids = []
        
        # Re-add all chunks
        if self.chunks:
            chunk_texts = [chunk.content for chunk in self.chunks.values()]
            embeddings = self.embedding_service.embed_texts(chunk_texts)
            
            for chunk, embedding in zip(self.chunks.values(), embeddings):
                self._add_chunk_to_index(chunk, embedding)
    
    def _matches_filter(self, metadata: Dict[str, Any], filter_metadata: Dict[str, Any]) -> bool:
        """Check if metadata matches the filter criteria."""
        for key, value in filter_metadata.items():
            if key not in metadata or metadata[key] != value:
                return False
        return True
    
    def save(self, path: Optional[str] = None) -> None:
        """
        Save the vector store to disk.
        
        Args:
            path: Optional path to save to (uses storage_path if not provided)
        """
        save_path = Path(path) if path else self.storage_path
        if not save_path:
            raise ValueError("No storage path specified")
        
        save_path.mkdir(parents=True, exist_ok=True)
        
        with self._lock:
            # Save FAISS index
            index_path = save_path / "index.faiss"
            faiss.write_index(self.index, str(index_path))
            
            # Save metadata
            metadata = {
                'documents': {doc_id: asdict(doc) for doc_id, doc in self.documents.items()},
                'chunks': {chunk_id: asdict(chunk) for chunk_id, chunk in self.chunks.items()},
                'chunk_ids': self.chunk_ids,
                'dimension': self.dimension,
                'index_type': self.index_type,
                'metric': self.metric,
                'created_at': datetime.now().isoformat(),
                'stats': self.get_stats()
            }
            
            metadata_path = save_path / "metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            # Save embedding service config
            embedding_config = {
                'model_name': self.embedding_service.model_name,
                'provider': self.embedding_service.provider,
                'dimension': self.dimension
            }
            
            config_path = save_path / "embedding_config.json"
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(embedding_config, f, indent=2)
            
            logger.info(f"Saved vector store to {save_path}")
    
    def load(self, path: Optional[str] = None) -> None:
        """
        Load the vector store from disk.
        
        Args:
            path: Optional path to load from (uses storage_path if not provided)
        """
        load_path = Path(path) if path else self.storage_path
        if not load_path or not load_path.exists():
            raise FileNotFoundError(f"Vector store not found at {load_path}")
        
        with self._lock:
            # Load FAISS index
            index_path = load_path / "index.faiss"
            if index_path.exists():
                self.index = faiss.read_index(str(index_path))
            
            # Load metadata
            metadata_path = load_path / "metadata.json"
            if metadata_path.exists():
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                # Reconstruct documents
                self.documents = {}
                for doc_id, doc_data in metadata.get('documents', {}).items():
                    doc = Document(**doc_data)
                    self.documents[doc_id] = doc
                
                # Reconstruct chunks
                self.chunks = {}
                for chunk_id, chunk_data in metadata.get('chunks', {}).items():
                    chunk = DocumentChunk(**chunk_data)
                    self.chunks[chunk_id] = chunk
                
                self.chunk_ids = metadata.get('chunk_ids', [])
                
                logger.info(f"Loaded vector store from {load_path}")
                logger.info(f"Stats: {self.get_stats()}")
    
    def clear(self) -> None:
        """Clear all data from the vector store."""
        with self._lock:
            self.documents.clear()
            self.chunks.clear()
            self.chunk_ids.clear()
            self._create_index()
            logger.info("Cleared vector store")
    
    def __len__(self) -> int:
        """Return the number of chunks in the store."""
        return len(self.chunks)
    
    def __contains__(self, doc_id: str) -> bool:
        """Check if a document ID exists in the store."""
        return doc_id in self.documents 