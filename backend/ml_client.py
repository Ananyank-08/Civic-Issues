"""ML Microservice client — calls FastAPI ML endpoints."""

import requests
import os

NLP_SERVICE_URL = os.getenv("NLP_SERVICE_URL", "http://localhost:8001")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

TIMEOUT = 10  # seconds


def call_nlp(text: str) -> dict:
    """Call /categorize endpoint. Returns {category, priority, confidence}."""
    try:
        resp = requests.post(
            f"{NLP_SERVICE_URL}/categorize",
            json={"text": text},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        # Fallback if ML service is unreachable
        return {"category": "Others", "priority": "Medium", "confidence": 0.0}


def call_image_detect(image_bytes: bytes, filename: str, content_type: str) -> dict:
    """Call /detect endpoint. Returns {category, confidence}."""
    try:
        resp = requests.post(
            f"{ML_SERVICE_URL}/detect",
            files={"image": (filename, image_bytes, content_type)},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        # Fallback if ML service is unreachable
        return {"category": "Unknown", "confidence": 0.0}
