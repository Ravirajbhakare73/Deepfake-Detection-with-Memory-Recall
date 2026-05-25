"""
Inference Pipeline
------------------
Matches the working evaluation script exactly:
  - model_from_json loads the model
  - model.predict() runs inference
  - probs = [1 - pred, pred]  →  argmax decides label
  - LABELS = ["FAKE", "REAL"]  (fake=0, real=1)
"""

import numpy as np
import cv2
import json
import datetime
from pathlib import Path

from model_loader import get_keras_model, LABELS
from gradcam import generate_gradcam, overlay_gradcam, extract_hot_regions
from memory import build_embedding_model, extract_embedding, store_memory, recall_similar
from explainer import build_explanation

IMG_SIZE = 96
_embedding_model = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = build_embedding_model(get_keras_model())
    return _embedding_model


def preprocess_image(image_path):
    """Exact same preprocessing as the working evaluation script."""
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    original_bgr = img.copy()

    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img / 255.0
    img_array = np.expand_dims(img, axis=0).astype(np.float32)

    return img_array, original_bgr


def run_inference(image_path, run_dir, run_id):
    run_dir = Path(run_dir)
    model   = get_keras_model()

    # ── 1. Preprocess ────────────────────────────────────────────────────────
    img_array, original_bgr = preprocess_image(image_path)

    # ── 2. Predict — exact match to working script ───────────────────────────
    pred       = model.predict(img_array, verbose=0)[0][0]
    probs      = [1 - pred, pred]          # [P(fake), P(real)]
    pred_class = int(np.argmax(probs))     # 0=FAKE, 1=REAL
    label      = LABELS[pred_class]        # "FAKE" or "REAL"
    confidence = round(float(probs[pred_class]) * 100, 1)

    # ── 3. GradCAM ───────────────────────────────────────────────────────────
    heatmap_raw = generate_gradcam(model, img_array)
    overlay_bgr, heatmap_resized = overlay_gradcam(original_bgr, heatmap_raw)
    cv2.imwrite(str(run_dir / "gradcam_overlay.jpg"), overlay_bgr)

    # ── 4. Hot regions ───────────────────────────────────────────────────────
    regions = extract_hot_regions(heatmap_resized, original_bgr)

    # ── 5. Memory ────────────────────────────────────────────────────────────
    embedding     = extract_embedding(_get_embedding_model(), img_array)
    similar_cases = recall_similar(embedding, top_k=3)
    store_memory(run_id, embedding, label, confidence)
    np.save(str(run_dir / "embedding.npy"), embedding)

    # ── 6. Explanation ───────────────────────────────────────────────────────
    explanation = build_explanation(label, confidence, regions, similar_cases)

    # ── 7. Save + return ─────────────────────────────────────────────────────
    result = {
        "run_id":      run_id,
        "timestamp":   datetime.datetime.utcnow().isoformat() + "Z",
        "label":       label,
        "confidence":  confidence,
        "regions":     regions,
        "explanation": explanation,
        "paths": {
            "original":        f"results/{run_id}/original.jpg",
            "gradcam_overlay": f"results/{run_id}/gradcam_overlay.jpg",
        }
    }

    with open(run_dir / "result.json", "w") as f:
        json.dump(result, f, indent=2)

    return result
