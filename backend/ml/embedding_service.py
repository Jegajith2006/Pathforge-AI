"""
PathForge AI - Embedding Service Module
Loads and configures the Hugging Face BAAI/bge-small-en-v1.5 model
from local directory (backend/ml/models/bge-small-en-v1.5/) using sentence-transformers
for semantic text representation, matching, and semantic search.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

from ml.model_config import LOCAL_MODEL_DIR, HF_MODEL_NAME, is_model_local


def _load_model() -> SentenceTransformer:
    """
    Load the BGE model from local disk storage:
      backend/ml/models/bge-small-en-v1.5/
    Falls back to HF hub identifier only if local directory is missing.
    """
    if is_model_local():
        return SentenceTransformer(str(LOCAL_MODEL_DIR))
    return SentenceTransformer(HF_MODEL_NAME)


# Singleton model instance loaded once
model = _load_model()

# In-memory LRU-style cache for repeated text embeddings
_EMBEDDING_CACHE: Dict[str, np.ndarray] = {}
_MAX_CACHE_SIZE: int = 2048


def get_model() -> SentenceTransformer:
    """Return the active SentenceTransformer model instance."""
    return model


def is_local_model() -> bool:
    """Return True if model was loaded from local filesystem storage."""
    return is_model_local()


def get_embedding_dimension() -> int:
    """Return the output vector dimensionality of the embedding model (384 for bge-small-en-v1.5)."""
    if hasattr(model, "get_embedding_dimension"):
        return model.get_embedding_dimension()
    return model.get_sentence_embedding_dimension()


def generate_embedding(text: str) -> np.ndarray:
    """
    Generate a normalized dense embedding vector for a single text string.
    Caches vectors in memory to avoid redundant model inference.
    Returns 1D numpy array of shape (384,).
    """
    if not text or not text.strip():
        dim = get_embedding_dimension()
        return np.zeros(dim, dtype=np.float32)

    cached = _EMBEDDING_CACHE.get(text)
    if cached is not None:
        return cached

    embedding = model.encode(text, normalize_embeddings=True)
    vector = np.asarray(embedding, dtype=np.float32)

    # Manage cache capacity
    if len(_EMBEDDING_CACHE) >= _MAX_CACHE_SIZE:
        first_key = next(iter(_EMBEDDING_CACHE))
        _EMBEDDING_CACHE.pop(first_key, None)

    _EMBEDDING_CACHE[text] = vector
    return vector


def generate_embeddings(texts: List[str], batch_size: int = 32) -> np.ndarray:
    """
    Generate normalized embeddings for a batch of text strings.
    Checks memory cache before encoding uncached items in batch.
    Returns 2D numpy array of shape (len(texts), 384).
    """
    if not texts:
        dim = get_embedding_dimension()
        return np.empty((0, dim), dtype=np.float32)

    dim = get_embedding_dimension()
    results = [None] * len(texts)
    uncached_indices = []
    uncached_texts = []

    for i, t in enumerate(texts):
        if not t or not t.strip():
            results[i] = np.zeros(dim, dtype=np.float32)
        elif t in _EMBEDDING_CACHE:
            results[i] = _EMBEDDING_CACHE[t]
        else:
            uncached_indices.append(i)
            uncached_texts.append(t)

    if uncached_texts:
        encoded = model.encode(
            uncached_texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        for idx, enc, txt in zip(uncached_indices, encoded, uncached_texts):
            vec = np.asarray(enc, dtype=np.float32)
            if len(_EMBEDDING_CACHE) < _MAX_CACHE_SIZE:
                _EMBEDDING_CACHE[txt] = vec
            results[idx] = vec

    return np.asarray(results, dtype=np.float32)


def cosine_similarity(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
    """
    Compute cosine similarity between two normalized embedding vectors.
    Since embeddings are normalized, this is the inner dot product clipped to [-1.0, 1.0].
    """
    norm_a = np.linalg.norm(embedding_a)
    norm_b = np.linalg.norm(embedding_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    dot_product = float(np.dot(embedding_a, embedding_b) / (norm_a * norm_b))
    return float(np.clip(dot_product, -1.0, 1.0))


# Alias for backward compatibility
compute_similarity = cosine_similarity


def semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Compute cosine semantic similarity between two raw text strings directly.
    Returns a float in range [-1.0, 1.0], typically [0.0, 1.0] for related texts.
    """
    if not text_a or not text_b:
        return 0.0
    emb_a = generate_embedding(text_a)
    emb_b = generate_embedding(text_b)
    return cosine_similarity(emb_a, emb_b)


# Alias for backward compatibility
compute_semantic_similarity = semantic_similarity


def semantic_search(
    query: str,
    corpus: List[Dict[str, Any]],
    text_key: str = "text",
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Reusable semantic search across a collection of candidate dictionaries.
    Uses BGE embeddings and cosine similarity ranking.
    """
    if not query or not corpus:
        return []

    query_emb = generate_embedding(query)
    texts = [item.get(text_key, "") for item in corpus]
    corpus_embs = generate_embeddings(texts)

    scored_items = []
    for item, emb in zip(corpus, corpus_embs):
        sim = cosine_similarity(query_emb, emb)
        scored_items.append({
            **item,
            "similarity_score": round(float(sim), 4),
        })

    scored_items.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_items[:top_k]
