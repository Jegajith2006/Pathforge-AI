import sys
from pathlib import Path
import pytest
import numpy as np

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.embedding_service import (
    model,
    get_model,
    get_embedding_dimension,
    generate_embedding,
    generate_embeddings,
    compute_similarity,
    compute_semantic_similarity,
)


def test_embedding_model_loaded():
    """Verify that SentenceTransformer model is loaded and valid."""
    assert model is not None
    active_model = get_model()
    assert active_model is model
    dimension = get_embedding_dimension()
    assert dimension == 384


def test_generate_single_embedding():
    """Verify single string embedding output shape, norm, and type."""
    text = "Full Stack Web Developer with React and Python experience"
    emb = generate_embedding(text)

    assert isinstance(emb, np.ndarray)
    assert emb.shape == (384,)
    assert emb.dtype == np.float32

    # Verify vector is L2 normalized (~1.0 norm)
    norm = np.linalg.norm(emb)
    assert pytest.approx(norm, rel=1e-3) == 1.0


def test_generate_batch_embeddings():
    """Verify batch embeddings output shape and contents."""
    texts = [
        "Machine learning engineer building transformer architectures.",
        "Frontend developer designing responsive CSS components.",
        "Database administrator managing PostgreSQL clusters.",
    ]
    embs = generate_embeddings(texts)

    assert isinstance(embs, np.ndarray)
    assert embs.shape == (3, 384)
    assert embs.dtype == np.float32


def test_semantic_similarity_expected_order():
    """Verify that semantically related texts have higher similarity than unrelated texts."""
    query = "AI engineer specialized in neural networks and PyTorch"
    related = "Deep learning specialist training transformer models"
    unrelated = "Pastry chef baking sourdough bread in a french bakery"

    sim_related = compute_semantic_similarity(query, related)
    sim_unrelated = compute_semantic_similarity(query, unrelated)

    assert sim_related > sim_unrelated
    assert sim_related > 0.70
    assert (sim_related - sim_unrelated) > 0.15


def test_empty_string_handling():
    """Verify graceful handling of empty or blank text."""
    emb = generate_embedding("")
    assert emb.shape == (384,)
    assert np.all(emb == 0.0)

    sim = compute_semantic_similarity("", "Sample text")
    assert sim == 0.0
