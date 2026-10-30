"""
PathForge AI - Backend Service for Embedding and Semantic Analysis
Wraps the ML embedding model with high-level service methods.
"""

from typing import List, Dict, Any, Optional
import numpy as np

from ml.embedding_service import (
    model,
    get_model,
    generate_embedding,
    generate_embeddings,
    cosine_similarity,
    semantic_similarity,
    compute_similarity,
    compute_semantic_similarity,
    semantic_search,
    get_embedding_dimension,
)

__all__ = [
    "model",
    "get_model",
    "generate_embedding",
    "generate_embeddings",
    "cosine_similarity",
    "semantic_similarity",
    "compute_similarity",
    "compute_semantic_similarity",
    "semantic_search",
    "get_embedding_dimension",
]
