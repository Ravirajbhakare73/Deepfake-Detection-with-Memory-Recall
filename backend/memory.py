import numpy as np
import json
import tensorflow as tf
from pathlib import Path

MEMORY_DIR = Path(__file__).parent.parent / "memory_store"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)

META_PATH   = MEMORY_DIR / "metadata.json"
EMBED_PATH  = MEMORY_DIR / "embeddings.npy"


def build_embedding_model(keras_model):
    for layer in reversed(keras_model.layers):
        if isinstance(layer, tf.keras.layers.Dense) and layer.units == 128:
            return tf.keras.Model(inputs=keras_model.inputs, outputs=layer.output)
    raise ValueError("Dense(128) layer not found.")


def extract_embedding(emb_model, img_array):
    vec  = emb_model(img_array, training=False).numpy()[0]
    norm = np.linalg.norm(vec)
    return (vec / norm).astype(np.float32) if norm > 0 else vec.astype(np.float32)


def _load_meta():
    return json.loads(META_PATH.read_text()) if META_PATH.exists() else []


def _load_embeds():
    return np.load(str(EMBED_PATH)) if EMBED_PATH.exists() else np.empty((0, 128), dtype=np.float32)


def store_memory(run_id, embedding, label, confidence):
    meta   = _load_meta()
    embeds = _load_embeds()
    meta.append({"run_id": run_id, "label": label, "confidence": confidence, "index": len(meta)})
    embeds = np.vstack([embeds, embedding[np.newaxis, :]]) if embeds.shape[0] > 0 else embedding[np.newaxis, :]
    META_PATH.write_text(json.dumps(meta, indent=2))
    np.save(str(EMBED_PATH), embeds)


def recall_similar(embedding, top_k=3):
    meta   = _load_meta()
    embeds = _load_embeds()
    if embeds.shape[0] == 0:
        return []
    sims    = embeds @ embedding
    indices = np.argsort(sims)[::-1][:top_k]
    out = []
    for i in indices:
        if i < len(meta):
            entry = meta[i].copy()
            entry["similarity"] = round(float(sims[i]), 4)
            out.append(entry)
    return out
