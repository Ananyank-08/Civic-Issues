"""Configuration — loads environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mysore_civic")
JWT_SECRET = os.getenv("JWT_SECRET", "mysore_civic_dev_secret_change_in_prod")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

NLP_SERVICE_URL = os.getenv("NLP_SERVICE_URL", "http://localhost:8001")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Create upload folder if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
