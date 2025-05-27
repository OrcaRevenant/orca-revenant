import os
import re
import logging
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
import hashlib
from dataclasses import dataclass
from datetime import datetime
import mimetypes

# Document processing libraries
try:
    import PyPDF2
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

logger = logging.getLogger(__name__)


@dataclass
class Document:
    """Represents a processed document with metadata."""
    content: str
    metadata: Dict[str, Any]
    doc_id: str
    source: str
    chunks: Optional[List[str]] = None


@dataclass
class DocumentChunk:
    """Represents a chunk of a document."""
    content: str
    metadata: Dict[str, Any]
    chunk_id: str
    doc_id: str
    chunk_index: int


class DocumentProcessor:
    """
    Advanced document processor for financial documents.
    Supports PDF, DOCX, TXT, CSV, HTML, and other formats.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100,
        max_chunk_size: int = 2000,
        preserve_structure: bool = True
    ):
        """
        Initialize the document processor.
        
        Args:
            chunk_size: Target size for document chunks
            chunk_overlap: Overlap between consecutive chunks
            min_chunk_size: Minimum size for a chunk
            max_chunk_size: Maximum size for a chunk
            preserve_structure: Whether to preserve document structure in chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        self.preserve_structure = preserve_structure
        
        # Financial document patterns
        self.financial_patterns = {
            'ticker_symbol': re.compile(r'\b[A-Z]{1,5}\b'),
            'currency': re.compile(r'\$[\d,]+\.?\d*|\b\d+\.\d{2}\s*(USD|EUR|GBP|JPY|CAD|AUD)\b'),
            'percentage': re.compile(r'\d+\.?\d*%'),
            'date': re.compile(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b'),
            'financial_terms': re.compile(r'\b(revenue|profit|loss|EBITDA|ROI|P/E|dividend|yield|volatility|beta|alpha|sharpe|portfolio|asset|liability|equity|debt|cash flow|balance sheet|income statement)\b', re.IGNORECASE)
        }
    
    def process_file(self, file_path: Union[str, Path]) -> Document:
        """
        Process a single file and return a Document object.
        
        Args:
            file_path: Path to the file to process
            
        Returns:
            Document object with processed content and metadata
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Generate document ID
        doc_id = self._generate_doc_id(file_path)
        
        # Extract basic metadata
        metadata = self._extract_file_metadata(file_path)
        
        # Process content based on file type
        content = self._extract_content(file_path)
        
        # Enhance metadata with content analysis
        metadata.update(self._analyze_content(content))
        
        # Create document
        document = Document(
            content=content,
            metadata=metadata,
            doc_id=doc_id,
            source=str(file_path)
        )
        
        # Generate chunks
        document.chunks = self.chunk_document(document)
        
        return document
    
    def process_directory(self, directory_path: Union[str, Path], recursive: bool = True) -> List[Document]:
        """
        Process all supported files in a directory.
        
        Args:
            directory_path: Path to the directory
            recursive: Whether to process subdirectories
            
        Returns:
            List of Document objects
        """
        directory_path = Path(directory_path)
        documents = []
        
        if not directory_path.exists():
            raise FileNotFoundError(f"Directory not found: {directory_path}")
        
        # Supported file extensions
        supported_extensions = {'.txt', '.pdf', '.docx', '.csv', '.html', '.htm', '.md', '.json'}
        
        # Find files
        if recursive:
            files = directory_path.rglob('*')
        else:
            files = directory_path.glob('*')
        
        for file_path in files:
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                try:
                    document = self.process_file(file_path)
                    documents.append(document)
                    logger.info(f"Processed: {file_path}")
                except Exception as e:
                    logger.error(f"Error processing {file_path}: {e}")
        
        return documents
    
    def chunk_document(self, document: Document) -> List[str]:
        """
        Split document content into chunks.
        
        Args:
            document: Document to chunk
            
        Returns:
            List of text chunks
        """
        content = document.content
        
        if len(content) <= self.chunk_size:
            return [content]
        
        chunks = []
        
        if self.preserve_structure:
            # Try to split on natural boundaries
            chunks = self._smart_chunk(content)
        else:
            # Simple sliding window chunking
            chunks = self._sliding_window_chunk(content)
        
        # Filter chunks by size
        chunks = [chunk for chunk in chunks if len(chunk) >= self.min_chunk_size]
        
        return chunks
    
    def create_document_chunks(self, document: Document) -> List[DocumentChunk]:
        """
        Create DocumentChunk objects from a document.
        
        Args:
            document: Source document
            
        Returns:
            List of DocumentChunk objects
        """
        if not document.chunks:
            document.chunks = self.chunk_document(document)
        
        chunks = []
        for i, chunk_content in enumerate(document.chunks):
            chunk_id = f"{document.doc_id}_chunk_{i}"
            
            # Create chunk metadata
            chunk_metadata = document.metadata.copy()
            chunk_metadata.update({
                'chunk_index': i,
                'total_chunks': len(document.chunks),
                'chunk_size': len(chunk_content)
            })
            
            chunk = DocumentChunk(
                content=chunk_content,
                metadata=chunk_metadata,
                chunk_id=chunk_id,
                doc_id=document.doc_id,
                chunk_index=i
            )
            chunks.append(chunk)
        
        return chunks
    
    def _generate_doc_id(self, file_path: Path) -> str:
        """Generate a unique document ID."""
        # Use file path and modification time for uniqueness
        content = f"{file_path}_{file_path.stat().st_mtime}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _extract_file_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract basic file metadata."""
        stat = file_path.stat()
        
        return {
            'filename': file_path.name,
            'file_extension': file_path.suffix.lower(),
            'file_size': stat.st_size,
            'created_time': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified_time': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'mime_type': mimetypes.guess_type(str(file_path))[0],
            'file_path': str(file_path)
        }
    
    def _extract_content(self, file_path: Path) -> str:
        """Extract text content from various file formats."""
        extension = file_path.suffix.lower()
        
        try:
            if extension == '.pdf':
                return self._extract_pdf_content(file_path)
            elif extension == '.docx':
                return self._extract_docx_content(file_path)
            elif extension in ['.txt', '.md']:
                return self._extract_text_content(file_path)
            elif extension == '.csv':
                return self._extract_csv_content(file_path)
            elif extension in ['.html', '.htm']:
                return self._extract_html_content(file_path)
            elif extension == '.json':
                return self._extract_json_content(file_path)
            else:
                # Fallback to text extraction
                return self._extract_text_content(file_path)
                
        except Exception as e:
            logger.error(f"Error extracting content from {file_path}: {e}")
            return ""
    
    def _extract_pdf_content(self, file_path: Path) -> str:
        """Extract text from PDF files."""
        if not HAS_PDF:
            raise ImportError("PDF processing requires PyPDF2 and pdfplumber. Install with: pip install PyPDF2 pdfplumber")
        
        content = ""
        
        # Try pdfplumber first (better for complex layouts)
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        content += page_text + "\n"
        except Exception:
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        content += page.extract_text() + "\n"
            except Exception as e:
                logger.error(f"Failed to extract PDF content: {e}")
        
        return content.strip()
    
    def _extract_docx_content(self, file_path: Path) -> str:
        """Extract text from DOCX files."""
        if not HAS_DOCX:
            raise ImportError("DOCX processing requires python-docx. Install with: pip install python-docx")
        
        doc = docx.Document(file_path)
        content = []
        
        for paragraph in doc.paragraphs:
            content.append(paragraph.text)
        
        return "\n".join(content)
    
    def _extract_text_content(self, file_path: Path) -> str:
        """Extract content from text files."""
        encodings = ['utf-8', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    return file.read()
            except UnicodeDecodeError:
                continue
        
        # If all encodings fail, read as binary and decode with errors='ignore'
        with open(file_path, 'rb') as file:
            return file.read().decode('utf-8', errors='ignore')
    
    def _extract_csv_content(self, file_path: Path) -> str:
        """Extract content from CSV files."""
        if not HAS_PANDAS:
            # Fallback to basic CSV reading
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        
        try:
            df = pd.read_csv(file_path)
            # Convert to a readable format
            content = f"CSV File: {file_path.name}\n"
            content += f"Columns: {', '.join(df.columns)}\n"
            content += f"Rows: {len(df)}\n\n"
            content += df.to_string(max_rows=100)  # Limit to first 100 rows
            return content
        except Exception:
            # Fallback to text reading
            return self._extract_text_content(file_path)
    
    def _extract_html_content(self, file_path: Path) -> str:
        """Extract text from HTML files."""
        if not HAS_BS4:
            # Fallback to basic text extraction
            return self._extract_text_content(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text
    
    def _extract_json_content(self, file_path: Path) -> str:
        """Extract content from JSON files."""
        import json
        
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Convert JSON to readable text
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    def _analyze_content(self, content: str) -> Dict[str, Any]:
        """Analyze content for financial patterns and metadata."""
        analysis = {
            'content_length': len(content),
            'word_count': len(content.split()),
            'line_count': len(content.splitlines()),
            'financial_indicators': {}
        }
        
        # Find financial patterns
        for pattern_name, pattern in self.financial_patterns.items():
            matches = pattern.findall(content)
            analysis['financial_indicators'][pattern_name] = {
                'count': len(matches),
                'examples': list(set(matches))[:10]  # First 10 unique matches
            }
        
        # Determine document type based on content
        analysis['document_type'] = self._classify_document_type(content)
        
        return analysis
    
    def _classify_document_type(self, content: str) -> str:
        """Classify the type of financial document."""
        content_lower = content.lower()
        
        # Financial statement indicators
        if any(term in content_lower for term in ['balance sheet', 'assets', 'liabilities', 'equity']):
            return 'balance_sheet'
        elif any(term in content_lower for term in ['income statement', 'revenue', 'net income', 'profit']):
            return 'income_statement'
        elif any(term in content_lower for term in ['cash flow', 'operating activities', 'investing activities']):
            return 'cash_flow_statement'
        elif any(term in content_lower for term in ['10-k', '10-q', 'annual report', 'quarterly report']):
            return 'sec_filing'
        elif any(term in content_lower for term in ['research report', 'analyst', 'recommendation', 'price target']):
            return 'research_report'
        elif any(term in content_lower for term in ['portfolio', 'holdings', 'allocation', 'performance']):
            return 'portfolio_report'
        elif any(term in content_lower for term in ['news', 'market', 'stock', 'trading']):
            return 'market_news'
        else:
            return 'general_financial'
    
    def _smart_chunk(self, content: str) -> List[str]:
        """Smart chunking that preserves document structure."""
        chunks = []
        
        # Split on double newlines first (paragraphs)
        paragraphs = content.split('\n\n')
        
        current_chunk = ""
        for paragraph in paragraphs:
            # If adding this paragraph would exceed chunk size
            if len(current_chunk) + len(paragraph) > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Start new chunk with overlap
                    if self.chunk_overlap > 0:
                        overlap_text = current_chunk[-self.chunk_overlap:]
                        current_chunk = overlap_text + "\n\n" + paragraph
                    else:
                        current_chunk = paragraph
                else:
                    # Paragraph itself is too long, split it
                    if len(paragraph) > self.max_chunk_size:
                        sub_chunks = self._sliding_window_chunk(paragraph)
                        chunks.extend(sub_chunks[:-1])  # Add all but last
                        current_chunk = sub_chunks[-1] if sub_chunks else ""
                    else:
                        current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _sliding_window_chunk(self, content: str) -> List[str]:
        """Simple sliding window chunking."""
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + self.chunk_size
            
            # Try to end at a word boundary
            if end < len(content):
                # Find the last space before the end
                while end > start and content[end] not in [' ', '\n', '.', '!', '?']:
                    end -= 1
                
                # If we couldn't find a good break point, use the original end
                if end == start:
                    end = start + self.chunk_size
            
            chunk = content[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            if start <= 0:
                start = end
        
        return chunks 