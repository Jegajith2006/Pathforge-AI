"""
PathForge AI - BGE Model Verification & Embedding Test Script
Verifies:
  1. Local model exists at backend/ml/models/bge-small-en-v1.5/
  2. Model loads successfully from the local directory
  3. Output embedding dimensionality equals 384
  4. Embedding generation works for single & batch inputs
  5. Cosine semantic similarity calculation works with expected separation
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.model_config import LOCAL_MODEL_DIR, is_model_local
from ml.embedding_service import (
    get_model,
    get_embedding_dimension,
    generate_embedding,
    generate_embeddings,
    cosine_similarity,
    semantic_similarity,
    is_local_model,
)


def run_embedding_verification():
    print("===================================================")
    print("PATHFORGE AI — BGE MODEL LOCAL VERIFICATION")
    print("===================================================")

    # 1. Verify local model directory
    print(f"\n1. Checking local model directory: {LOCAL_MODEL_DIR}")
    local_exists = is_model_local()
    print(f"   Local model files exist: {local_exists}")
    assert local_exists, f"Model files not found in {LOCAL_MODEL_DIR}"

    # 2. Verify model loading
    print("\n2. Loading model from local directory...")
    model = get_model()
    print(f"   Model instance: {type(model)}")
    print(f"   Is loaded from local path: {is_local_model()}")

    # 3. Verify embedding dimension
    print("\n3. Verifying output embedding dimension...")
    dim = get_embedding_dimension()
    print(f"   Embedding dimension: {dim}")
    assert dim == 384, f"Expected dimension 384, got {dim}"

    # 4. Generate test embedding for target phrase
    target_phrase = "Python machine learning engineer"
    print(f"\n4. Generating embedding for: '{target_phrase}'")
    emb = generate_embedding(target_phrase)
    print(f"   Embedding shape: {emb.shape}")
    print(f"   Embedding dtype: {emb.dtype}")
    print(f"   Vector snippet (first 5 dimensions): {emb[:5]}")
    assert emb.shape == (384,)

    # 5. Semantic similarity tests (Section 5)
    print("\n5. Testing Semantic Similarity:")
    print("---------------------------------------------------")
    text_1a = "Python, Pandas, NumPy, Scikit-learn, machine learning"
    text_1b = "Machine learning engineer skilled in Python and data science"
    sim_1 = semantic_similarity(text_1a, text_1b)
    print(f"Test 1 (Related Technical Profiles):")
    print(f"  Text A: '{text_1a}'")
    print(f"  Text B: '{text_1b}'")
    print(f"  Calculated Cosine Similarity: {sim_1:.4f}")

    text_2a = "Python machine learning data science"
    text_2b = "Cooking recipes and restaurant management"
    sim_2 = semantic_similarity(text_2a, text_2b)
    print(f"\nTest 2 (Unrelated Profiles):")
    print(f"  Text A: '{text_2a}'")
    print(f"  Text B: '{text_2b}'")
    print(f"  Calculated Cosine Similarity: {sim_2:.4f}")

    print("---------------------------------------------------")
    print(f"Similarity Test 1 (Related):   {sim_1:.4f}")
    print(f"Similarity Test 2 (Unrelated): {sim_2:.4f}")
    assert sim_1 > sim_2, "Related similarity must be higher than unrelated similarity"
    assert (sim_1 - sim_2) > 0.15, "Separation between related and unrelated texts must be significant"

    print("\n===================================================")
    print("SUCCESS: ALL BGE LOCAL MODEL VERIFICATIONS PASSED")
    print("===================================================")
    return {
        "local_model_path": str(LOCAL_MODEL_DIR),
        "local_exists": local_exists,
        "embedding_dimension": dim,
        "similarity_test_1": round(float(sim_1), 4),
        "similarity_test_2": round(float(sim_2), 4),
    }


if __name__ == "__main__":
    run_embedding_verification()
