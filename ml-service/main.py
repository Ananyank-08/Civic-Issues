"""
ML Microservice — FastAPI
Provides NLP categorization and image classification endpoints.
Currently uses rule-based mock inference. Replace model loading sections
with real DistilBERT / MobileNetV2 models when training data is available.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import re
import io

app = FastAPI(title="Mysore Civic ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

CATEGORIES = [
    "Potholes",
    "Garbage",
    "Water Leakage",
    "Streetlight Issue",
    "Treefall",
    "Traffic Light",
    "Others (Valid Civic Issues)",
    "Invalid (Noise/Spam)"
]

HIGH_PRIORITY_KEYWORDS = [
    "accident", "flooding", "flood", "fire", "broken", "dangerous",
    "urgent", "emergency", "severe", "collapsed", "burst", "hazard",
    "crack", "blocked road", "major",
]

MEDIUM_PRIORITY_KEYWORDS = [
    "leaking", "damaged", "not working", "problem", "issue", "bad",
    "needs repair", "overflowing", "faded", "dim", "flickering",
]

LOW_PRIORITY_KEYWORDS = [
    "minor", "small", "little", "slight", "cosmetic", "request",
    "suggestion", "improvement",
]

import joblib
import os
import json
import numpy as np
from PIL import Image

# ─────────────────────────────────────────────
# Model Loading
# ─────────────────────────────────────────────

# NLP Model
MODEL_PATH = "nlp_model.pkl"
if os.path.exists(MODEL_PATH):
    nlp_pipeline = joblib.load(MODEL_PATH)
    print("✓ Loaded NLP pipeline (nlp_model.pkl)")
else:
    nlp_pipeline = None
    print("⚠ nlp_model.pkl not found — run train.py first")

# Image Model (MobileNetV2)
IMAGE_MODEL_PATH = "image_model.keras"
IMAGE_LABEL_MAP_PATH = "image_label_map.json"
image_model = None
index_to_label = None
_model_has_lambda = False   # tracks whether model has internal preprocessing

if os.path.exists(IMAGE_MODEL_PATH) and os.path.exists(IMAGE_LABEL_MAP_PATH):
    try:
        import tensorflow as tf
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as _mbn_prep
        # Supply preprocess_input as a custom object for backward compat with
        # older saved models that contain a Lambda(preprocess_input) layer.
        image_model = tf.keras.models.load_model(
            IMAGE_MODEL_PATH,
            custom_objects={"preprocess_input": _mbn_prep}
        )
        # Detect whether the loaded model has an internal Lambda/preprocessing
        layer_names = [l.name for l in image_model.layers]
        _model_has_lambda = any("lambda" in n.lower() for n in layer_names)
        with open(IMAGE_LABEL_MAP_PATH, "r") as f:
            raw_map = json.load(f)
            index_to_label = {int(k): v for k, v in raw_map.items()}
        print(f"✓ Loaded image model ({IMAGE_MODEL_PATH}) with {len(index_to_label)} classes")
        print(f"✓ Internal Lambda preprocessing: {_model_has_lambda}")
    except Exception as e:
        print(f"⚠ Failed to load image model: {e}")
        image_model = None
else:
    print("⚠ Image model files not found — run train_image.py first")

# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────

class TextInput(BaseModel):
    text: str

class CategorizeResponse(BaseModel):
    category: str
    priority: str
    confidence: float

class DetectResponse(BaseModel):
    category: str
    confidence: float

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def extract_priority(text: str) -> str:
    text_lower = text.lower()
    for kw in HIGH_PRIORITY_KEYWORDS:
        if kw in text_lower:
            return "High"
    for kw in MEDIUM_PRIORITY_KEYWORDS:
        if kw in text_lower:
            return "Medium"
    for kw in LOW_PRIORITY_KEYWORDS:
        if kw in text_lower:
            return "Low"
    return "Medium"  # default


def nlp_categorize(text: str):
    """Real ML categorization using Scikit-Learn TF-IDF pipeline."""
    if nlp_pipeline is None:
        return "Others (Valid Civic Issues)", 0.50

    try:
        prediction = nlp_pipeline.predict([text])[0]
        probabilities = nlp_pipeline.predict_proba([text])[0]
        confidence = round(float(probabilities.max()), 3)
        return str(prediction), confidence
    except Exception as e:
        print(f"NLP prediction error: {e}")
        return "Others (Valid Civic Issues)", 0.50


def image_classify(image_bytes: bytes):
    """
    Real image classification using trained MobileNetV2.
    Falls back to 'Unknown' if model is not loaded.
    """
    if image_model is None or index_to_label is None:
        # Fallback: return Unknown so hybrid_verify treats text as primary
        return "Unknown", 0.0

    try:
        import tensorflow as tf

        # Decode image bytes → PIL → numpy (raw [0, 255])
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img, dtype=np.float32)

        # Apply MobileNetV2 preprocessing if the model doesn’t do it internally.
        # Older model (with Lambda): let the Lambda handle it, pass raw pixels.
        # New model (v3, no Lambda):  apply preprocess_input here before predict.
        if not _model_has_lambda:
            from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as _prep
            img_array = _prep(img_array)   # [0,255] -> [-1,1]

        img_batch = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)

        # Predict
        predictions = image_model.predict(img_batch, verbose=0)
        class_idx = int(np.argmax(predictions[0]))
        confidence = round(float(predictions[0][class_idx]), 3)

        category = index_to_label.get(class_idx, "Unknown")

        # Low confidence → Unknown
        if confidence < 0.50:
            return "Unknown", confidence

        return category, confidence

    except Exception as e:
        print(f"Image classification error: {e}")
        return "Unknown", 0.0

# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "ML Microservice", "version": "1.0.0"}


@app.post("/categorize", response_model=CategorizeResponse)
def categorize(payload: TextInput):
    """NLP endpoint — categorize complaint text and assign priority."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    category, confidence = nlp_categorize(payload.text.strip())
    priority = extract_priority(payload.text)

    return CategorizeResponse(
        category=category,
        priority=priority,
        confidence=confidence,
    )


@app.post("/detect", response_model=DetectResponse)
async def detect_image(image: UploadFile = File(...)):
    """Image classification endpoint — detect civic issue type from photo."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG)")

    img_bytes = await image.read()

    if len(img_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")

    if len(img_bytes) > 5 * 1024 * 1024:  # 5 MB
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")

    category, confidence = image_classify(img_bytes)

    return DetectResponse(category=category, confidence=confidence)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
