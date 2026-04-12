"""Flask application entry point."""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from datetime import timedelta
import os

from config import MONGO_URI, JWT_SECRET, JWT_EXPIRY_HOURS, FRONTEND_URL

# ── App init ────────────────────────────────────────────────
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=JWT_EXPIRY_HOURS)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB

CORS(app, resources={r"/api/*": {"origins": FRONTEND_URL}}, supports_credentials=True)
jwt = JWTManager(app)

# ── Database ─────────────────────────────────────────────────
client = MongoClient(MONGO_URI)
db = client.get_default_database()

# 2dsphere index for geo-queries
db.complaints.create_index([("location", "2dsphere")])

# ── Register blueprints ───────────────────────────────────────
from routes.auth import auth_bp
from routes.complaints import complaints_bp
from routes.map_routes import map_bp
from routes.stats import stats_bp

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(complaints_bp, url_prefix="/api")
app.register_blueprint(map_bp, url_prefix="/api")
app.register_blueprint(stats_bp, url_prefix="/api")


@app.route("/api/health")
def health():
    return {"status": "ok", "service": "Mysore Civic Backend", "version": "1.0.0"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
