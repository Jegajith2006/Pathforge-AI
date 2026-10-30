"""
PathForge AI - BGE Model Downloader
Downloads BAAI/bge-small-en-v1.5 using SentenceTransformers and saves it to:
  backend/ml/models/bge-small-en-v1.5/
for fully offline, reliable local runtime loading.

Usage:
  python -m ml.download_model
  or
  python backend/ml/download_model.py
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path if not present
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sentence_transformers import SentenceTransformer
from ml.model_config import LOCAL_MODEL_DIR, HF_MODEL_NAME


def download_and_save_bge_model() -> Path:
    """
    Downloads BAAI/bge-small-en-v1.5 and saves it directly to the project-relative
    models directory: backend/ml/models/bge-small-en-v1.5/
    """
    target_dir = LOCAL_MODEL_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"[PathForge AI] Preparing local BGE model destination: {target_dir}")

    # Check if model files already exist locally
    config_file = target_dir / "config.json"
    modules_file = target_dir / "modules.json"

    if config_file.exists() and modules_file.exists():
        print(f"[PathForge AI] Model already exists at: {target_dir}")
    else:
        print(f"[PathForge AI] Downloading '{HF_MODEL_NAME}' via sentence-transformers...")
        # Download using SentenceTransformer
        downloaded_model = SentenceTransformer(HF_MODEL_NAME)
        print(f"[PathForge AI] Saving model to local directory: {target_dir}...")
        downloaded_model.save(str(target_dir))
        print("[PathForge AI] Model successfully saved to local directory.")

    # Verify local loading
    print(f"[PathForge AI] Verifying local loading from: {target_dir}...")
    local_model = SentenceTransformer(str(target_dir))

    # Test sample embedding
    test_text = "Python machine learning engineer"
    vec = local_model.encode(test_text)
    dim = len(vec)
    print(f"[PathForge AI] Test sentence: '{test_text}'")
    print(f"[PathForge AI] Embedding dimension: {dim}")

    if dim == 384:
        print("[PathForge AI] SUCCESS: BAAI/bge-small-en-v1.5 is downloaded, saved, and verified locally.")
    else:
        raise ValueError(f"Unexpected embedding dimension: {dim} (expected 384)")

    return target_dir


if __name__ == "__main__":
    download_and_save_bge_model()
