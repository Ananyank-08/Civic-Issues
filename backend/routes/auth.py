"""Auth routes — register and login."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from pymongo import MongoClient
import bcrypt
from datetime import datetime

from config import MONGO_URI

auth_bp = Blueprint("auth", __name__)
db = MongoClient(MONGO_URI).get_default_database()


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

    # First user ever becomes admin
    is_first_user = db.users.count_documents({}) == 0
    role = "admin" if is_first_user else "citizen"

    result = db.users.insert_one({
        "name": name,
        "email": email,
        "passwordHash": password_hash,
        "role": role,
        "createdAt": datetime.utcnow(),
    })

    return jsonify({
        "message": "Registered successfully",
        "userId": str(result.inserted_id),
        "role": role,
    }), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.checkpw(password.encode(), user["passwordHash"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user["_id"]))

    return jsonify({
        "token": token,
        "role": user["role"],
        "name": user["name"],
        "userId": str(user["_id"]),
    }), 200
