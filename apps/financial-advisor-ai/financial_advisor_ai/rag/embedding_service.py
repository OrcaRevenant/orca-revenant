import os
import numpy as np
from typing import List, Optional, Union
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

# Optional import for async operations
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    aiohttp = None

# Optional imports with fallbacks
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    SentenceTransformer = None

try:
    import openai
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    OpenAI = None

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Advanced embedding service supporting multiple state-of-the-art embedding models.
    Supports OpenAI, Sentence Transformers, and other popular embedding providers.
    """
    
    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        provider: str = "sentence-transformers",
        api_key: Optional[str] = None,
        batch_size: int = 32,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """
        Initialize the embedding service.
        
        Args:
            model_name: Name of the embedding model
            provider: Provider type ('sentence-transformers', 'openai', 'cohere')
            api_key: API key for external providers
            batch_size: Batch size for processing embeddings
            max_retries: Maximum number of retries for API calls
            retry_delay: Delay between retries in seconds
        """
        self.model_name = model_name
        self.provider = provider.lower()
        self.api_key = api_key or os.getenv(f"{provider.upper()}_API_KEY")
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.model = None
        self.client = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the embedding model based on provider."""
        try:
            if self.provider == "sentence-transformers":
                self._initialize_sentence_transformer()
            elif self.provider == "openai":
                self._initialize_openai()
            elif self.provider == "cohere":
                self._initialize_cohere()
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
                
            logger.info(f"Initialized {self.provider} embedding model: {self.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {e}")
            # Fallback to sentence-transformers with a lightweight model
            try:
                self._initialize_sentence_transformer(fallback_model="all-MiniLM-L6-v2")
            except Exception as fallback_error:
                logger.error(f"Fallback to sentence-transformers also failed: {fallback_error}")
                raise RuntimeError(f"Could not initialize any embedding model: {e}")
    
    def _initialize_sentence_transformer(self, fallback_model: Optional[str] = None):
        """Initialize Sentence Transformer model."""
        if not HAS_SENTENCE_TRANSFORMERS:
            raise ImportError(
                "sentence-transformers is not installed. "
                "Install with: poetry add sentence-transformers"
            )
        
        model_to_load = fallback_model or self.model_name
        if not model_to_load.startswith("sentence-transformers/"):
            model_to_load = f"sentence-transformers/{model_to_load}"
        
        self.model = SentenceTransformer(model_to_load)
        self.provider = "sentence-transformers"
        if fallback_model:
            self.model_name = fallback_model
    
    def _initialize_openai(self):
        """Initialize OpenAI client."""
        if not HAS_OPENAI:
            raise ImportError(
                "openai is not installed. "
                "Install with: poetry add openai"
            )
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
        
        # Set default model if not specified
        if self.model_name == "sentence-transformers/all-MiniLM-L6-v2":
            self.model_name = "text-embedding-3-large"
    
    def _initialize_cohere(self):
        """Initialize Cohere client."""
        try:
            import cohere
            if not self.api_key:
                raise ValueError("Cohere API key is required")
            
            self.client = cohere.Client(self.api_key)
            
            # Set default model if not specified
            if self.model_name == "sentence-transformers/all-MiniLM-L6-v2":
                self.model_name = "embed-english-v3.0"
                
        except ImportError:
            raise ImportError("Cohere package not installed. Install with: pip install cohere")
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by the model."""
        if self.provider == "sentence-transformers":
            return self.model.get_sentence_embedding_dimension()
        elif self.provider == "openai":
            # Common dimensions for OpenAI models
            model_dims = {
                "text-embedding-3-large": 3072,
                "text-embedding-3-small": 1536,
                "text-embedding-ada-002": 1536
            }
            return model_dims.get(self.model_name, 1536)
        elif self.provider == "cohere":
            # Cohere embed-english-v3.0 has 1024 dimensions
            return 1024
        else:
            return 384  # Default fallback for all-MiniLM-L6-v2
    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text to embed
            
        Returns:
            Numpy array containing the embedding
        """
        return self.embed_texts([text])[0]
    
    def embed_texts(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts to embed
            
        Returns:
            List of numpy arrays containing embeddings
        """
        if not texts:
            return []
        
        # Clean and validate texts
        texts = [str(text).strip() for text in texts if text and str(text).strip()]
        if not texts:
            return []
        
        try:
            if self.provider == "sentence-transformers":
                return self._embed_with_sentence_transformer(texts)
            elif self.provider == "openai":
                return self._embed_with_openai(texts)
            elif self.provider == "cohere":
                return self._embed_with_cohere(texts)
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
                
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Return zero embeddings as fallback
            dim = self.get_embedding_dimension()
            return [np.zeros(dim) for _ in texts]
    
    def _embed_with_sentence_transformer(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings using Sentence Transformers."""
        embeddings = self.model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=len(texts) > 100,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return [emb.astype(np.float32) for emb in embeddings]
    
    def _embed_with_openai(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings using OpenAI API."""
        embeddings = []
        
        # Process in batches to respect rate limits
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_embeddings = self._openai_embed_batch(batch)
            embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def _openai_embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings for a batch using OpenAI API with retries."""
        for attempt in range(self.max_retries):
            try:
                response = self.client.embeddings.create(
                    model=self.model_name,
                    input=texts,
                    encoding_format="float"
                )
                
                embeddings = []
                for data in response.data:
                    embedding = np.array(data.embedding, dtype=np.float32)
                    # Normalize the embedding
                    embedding = embedding / np.linalg.norm(embedding)
                    embeddings.append(embedding)
                
                return embeddings
                
            except Exception as e:
                logger.warning(f"OpenAI API attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))
                else:
                    raise e
    
    def _embed_with_cohere(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings using Cohere API."""
        embeddings = []
        
        # Process in batches
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_embeddings = self._cohere_embed_batch(batch)
            embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def _cohere_embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings for a batch using Cohere API with retries."""
        for attempt in range(self.max_retries):
            try:
                response = self.client.embed(
                    texts=texts,
                    model=self.model_name,
                    input_type="search_document"
                )
                
                embeddings = []
                for embedding in response.embeddings:
                    emb = np.array(embedding, dtype=np.float32)
                    # Normalize the embedding
                    emb = emb / np.linalg.norm(emb)
                    embeddings.append(emb)
                
                return embeddings
                
            except Exception as e:
                logger.warning(f"Cohere API attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))
                else:
                    raise e
    
    async def embed_texts_async(self, texts: List[str]) -> List[np.ndarray]:
        """
        Asynchronously generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts to embed
            
        Returns:
            List of numpy arrays containing embeddings
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self.embed_texts, texts)
    
    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)


# Recommended model configurations for different use cases
RECOMMENDED_MODELS = {
    "financial": {
        "provider": "sentence-transformers",
        "model": "sentence-transformers/all-mpnet-base-v2",
        "description": "High-quality general-purpose model, good for financial documents"
    },
    "fast": {
        "provider": "sentence-transformers", 
        "model": "sentence-transformers/all-MiniLM-L6-v2",
        "description": "Fast and lightweight model for quick processing"
    },
    "openai_best": {
        "provider": "openai",
        "model": "text-embedding-3-large",
        "description": "OpenAI's best embedding model (requires API key)"
    },
    "openai_fast": {
        "provider": "openai",
        "model": "text-embedding-3-small", 
        "description": "OpenAI's fast embedding model (requires API key)"
    },
    "cohere": {
        "provider": "cohere",
        "model": "embed-english-v3.0",
        "description": "Cohere's English embedding model (requires API key)"
    }
} 