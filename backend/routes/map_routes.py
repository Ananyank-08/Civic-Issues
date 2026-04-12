"""Map routes — geo-points and heatmap data."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId

from config import MONGO_URI

map_bp = Blueprint("map", __name__)
db = MongoClient(MONGO_URI).get_default_database()


def _serialize_point(c, current_user_id=None):
    coords = c.get("location", {}).get("coordinates", [0, 0])
    upvotes = c.get("upvotes", [])
    return {
        "id": str(c["_id"]),
        "userId": str(c.get("userId", "")),
        "lat": coords[1],
        "lng": coords[0],
        "category": c.get("finalCategory") or c.get("nlpCategory", "Others"),
        "status": c.get("status", "Pending"),
        "priority": c.get("nlpPriority", "Medium"),
        "description": c.get("description", "")[:100],
        "areaName": c.get("areaName", ""),
        "mismatch": c.get("mismatch", False),
        "upvoteCount": len(upvotes),
        "hasUpvoted": ObjectId(current_user_id) in upvotes if current_user_id else False,
    }


@map_bp.route("/map/points", methods=["GET"])
@jwt_required(optional=True)
def get_map_points():
    """All complaint geo-points for map markers."""
    user_id = get_jwt_identity()
    complaints = db.complaints.find(
        {"location": {"$exists": True}},
        {"location": 1, "userId": 1, "finalCategory": 1, "nlpCategory": 1,
         "status": 1, "nlpPriority": 1, "description": 1, "areaName": 1, "mismatch": 1, "upvotes": 1}
    )
    return jsonify([_serialize_point(c, user_id) for c in complaints]), 200


@map_bp.route("/map/heatmap", methods=["GET"])
def get_heatmap():
    """Aggregated heatmap data with intensity based on upvote count."""
    pipeline = [
        {"$match": {"location": {"$exists": True}}},
        {"$project": {
            "coords": "$location.coordinates",
            "intensity": {"$add": [1, {"$size": {"$ifNull": ["$upvotes", []]}}]}
        }}
    ]
    results = list(db.complaints.aggregate(pipeline))
    points = []
    for r in results:
        coords = r.get("coords", [0, 0])
        points.append({
            "lat": coords[1],
            "lng": coords[0],
            "intensity": r.get("intensity", 1),
        })
    return jsonify(points), 200


@map_bp.route("/map/nearby", methods=["GET"])
def get_nearby():
    """Complaints within a given radius of a point (default 2 km)."""
    try:
        lat = float(request.args.get("lat", 12.2958))
        lng = float(request.args.get("lng", 76.6394))
        radius = int(request.args.get("radius", 2000))
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

    complaints = db.complaints.find({
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": radius,
            }
        }
    })
    return jsonify([_serialize_point(c) for c in complaints]), 200
