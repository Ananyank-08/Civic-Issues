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

MODEL_PATH = "nlp_model.pkl"
if os.path.exists(MODEL_PATH):
    nlp_pipeline = joblib.load(MODEL_PATH)
    print("Loaded ML NLP pipeline successfully.")
else:
    nlp_pipeline = None
    print("Warning: nlp_model.pkl not found! Please run train.py first.")

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
    """
    Real ML categorization using Scikit-Learn TF-IDF pipeline.
    """
    if nlp_pipeline is None:
        return "Others (Valid Civic Issues)", 0.50

    try:
        # predict returns an array of shape (1,)
        prediction = nlp_pipeline.predict([text])[0]
        # predict_proba returns probabilities for each class
        probabilities = nlp_pipeline.predict_proba([text])[0]
        confidence = round(float(probabilities.max()), 3)
        return str(prediction), confidence
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return "Others (Valid Civic Issues)", 0.50


def image_categorize_mock(image_bytes: bytes):
    """
    Mock image classification (returns plausible result).
    Replace with MobileNetV2 inference:

        img = tf.image.decode_image(image_bytes)
        img = tf.image.resize(img, [224, 224]) / 255.0
        img = tf.expand_dims(img, 0)
        preds = cnn_model.predict(img)
        conf = float(preds.max())
        label = CATEGORIES[preds.argmax()] if conf >= 0.65 else 'Unknown'
    """
    # Deterministic mock based on image size (ensures reproducibility per image)
    seed = len(image_bytes) % 100
    random.seed(seed)

    cat_idx = random.randint(0, len(CATEGORIES) - 2)  # exclude "Others"
    category = CATEGORIES[cat_idx]

    # Simulate confidence — realistic distribution
    confidence = round(random.uniform(0.62, 0.97), 3)

    # Below threshold → Unknown
    if confidence < 0.65:
        return "Unknown", confidence

    return category, confidence

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

    category, confidence = image_categorize_mock(img_bytes)

    return DetectResponse(category=category, confidence=confidence)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
