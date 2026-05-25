import json
import tensorflow as tf
from tensorflow.keras.models import model_from_json
from pathlib import Path

_model = None

MODEL_DIR = Path(__file__).parent / "model"

# fake=0, real=1  (alphabetical, matches training)
LABELS = ["FAKE", "REAL"]


def get_keras_model():
    global _model
    if _model is None:
        _model = _load()
    return _model


def _load():
    config_path  = MODEL_DIR / "config.json"
    weights_path = MODEL_DIR / "model.weights.h5"

    with open(config_path, "r") as f:
        model_config = json.load(f)

    # config.json may be a dict or a JSON string — handle both
    if isinstance(model_config, str):
        model = model_from_json(model_config)
    else:
        model = model_from_json(json.dumps(model_config))

    model.load_weights(str(weights_path))
    print("✅ Model loaded")
    return model
