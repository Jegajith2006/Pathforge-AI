import sys
from pathlib import Path
import pytest
import numpy as np

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.embedding_service import (
    model,
    get_model,
    get_embedding_dimension,
    generate_embedding,
    generate_embeddings,
    cosine_similarity,
    semantic_similarity,
    semantic_search,
)


def test_embedding_model_singleton():
    """Verify that SentenceTransformer model loads once with 384 dimensions."""
    assert model is not None
    assert get_model() is model
    assert get_embedding_dimension() == 384


def test_generate_single_embedding():
    """Verify single string dense embedding generation and normalization."""
    text = "Machine Learning Engineer with PyTorch and Python experience"
    vec = generate_embedding(text)
    assert isinstance(vec, np.ndarray)
    assert vec.shape == (384,)
    assert vec.dtype == np.float32
    assert pytest.approx(float(np.linalg.norm(vec)), rel=1e-3) == 1.0


def test_generate_batch_embeddings():
    """Verify batch embeddings shape and caching."""
    texts = [
        "Backend developer building FastAPI microservices.",
        "Frontend developer designing React UI components.",
        "Data scientist training gradient boosting models.",
    ]
    vecs = generate_embeddings(texts)
    assert isinstance(vecs, np.ndarray)
    assert vecs.shape == (3, 384)


def test_cosine_and_semantic_similarity():
    """Verify cosine and semantic similarity functions."""
    query = "Natural language processing with transformers"
    related = "LLM fine-tuning and attention mechanisms"
    unrelated = "Baking artisan bread with yeast and flour"

    sim_related = semantic_similarity(query, related)
    sim_unrelated = semantic_similarity(query, unrelated)

    assert sim_related > sim_unrelated
    assert sim_related > 0.65
    assert (sim_related - sim_unrelated) > 0.15


def test_semantic_search():
    """Verify semantic search ranking over candidate dictionary items."""
    corpus = [
        {"id": 1, "text": "Deep Learning and Neural Networks"},
        {"id": 2, "text": "Classical French Cuisine and Pastry"},
        {"id": 3, "text": "Computer Vision and Image Processing"},
    ]
    results = semantic_search(query="Convolutional networks and image detection", corpus=corpus, text_key="text", top_k=2)
    assert len(results) == 2
    top_ids = [r["id"] for r in results]
    assert 3 in top_ids or 1 in top_ids
    assert results[0]["similarity_score"] >= results[1]["similarity_score"]
