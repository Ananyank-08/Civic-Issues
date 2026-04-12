"""Admin stats route."""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId

from config import MONGO_URI

stats_bp = Blueprint("stats", __name__)
db = MongoClient(MONGO_URI).get_default_database()


def _require_admin(user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        return False
    return True


@stats_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    if not _require_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403

    # Status breakdown
    status_pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_counts = {d["_id"]: d["count"] for d in db.complaints.aggregate(status_pipeline)}

    # Department breakdown
    dept_pipeline = [{"$group": {"_id": "$department", "count": {"$sum": 1}}}]
    dept_counts = {d["_id"]: d["count"] for d in db.complaints.aggregate(dept_pipeline)}

    # Category breakdown
    cat_pipeline = [{"$group": {"_id": "$finalCategory", "count": {"$sum": 1}}}]
    cat_counts = {d["_id"] or "Unresolved Mismatch": d["count"]
                  for d in db.complaints.aggregate(cat_pipeline)}

    # Complaints over last 7 days
    from datetime import datetime, timedelta
    timeline_pipeline = [
        {"$match": {"createdAt": {"$gte": datetime.utcnow() - timedelta(days=7)}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
    ]
    timeline = [{"date": d["_id"], "count": d["count"]}
                for d in db.complaints.aggregate(timeline_pipeline)]

    return jsonify({
        "total": db.complaints.count_documents({}),
        "byStatus": status_counts,
        "byDept": dept_counts,
        "byCategory": cat_counts,
        "timeline": timeline,
        "mismatches": db.complaints.count_documents({"mismatch": True, "status": "Pending"}),
        "highPriority": db.complaints.count_documents({"nlpPriority": "High", "status": "Pending"}),
    }), 200
