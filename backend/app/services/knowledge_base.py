import json
import logging
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

_chunks_path = os.path.join(os.path.dirname(__file__), "..", "data", "kb_chunks.json")

with open(_chunks_path) as f:
    KB_CHUNKS = json.load(f)

_chunk_texts = [c["text"] for c in KB_CHUNKS]
_vectorizer = TfidfVectorizer(stop_words="english", max_features=5000, ngram_range=(1, 2))
_tfidf_matrix = _vectorizer.fit_transform(_chunk_texts)

logger.info(f"KB: loaded {len(KB_CHUNKS)} chunks, TF-IDF dims {_tfidf_matrix.shape}")

LANGUAGE_MAP = {
    "am": "Amharic",
    "en": "English",
}


def retrieve_semantic(query: str, top_k: int = 3, category: str | None = None) -> list[dict]:
    if not query.strip():
        if category:
            return [c for c in KB_CHUNKS if c["category"] == category][:top_k]
        return KB_CHUNKS[:top_k]
    candidates = KB_CHUNKS
    if category:
        candidates = [c for c in candidates if c["category"] == category]
        if not candidates:
            return []
    query_vec = _vectorizer.transform([query])
    candidate_indices = [i for i, c in enumerate(KB_CHUNKS) if c in candidates]
    candidate_vecs = _tfidf_matrix[candidate_indices]
    scores = cosine_similarity(query_vec, candidate_vecs).flatten()
    ranked = sorted(zip(scores, candidate_indices), key=lambda x: x[0], reverse=True)
    return [KB_CHUNKS[i] for _, i in ranked[:top_k]]
