"""Department routes for dashboard and admin queries."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

from config import MONGO_URI
from routes.complaints import _serialize  # reuse the frontend complaint serializer

departments_bp = Blueprint("departments", __name__)
db = MongoClient(MONGO_URI).get_default_database()

@departments_bp.route("/departments", methods=["GET"])
@jwt_required(optional=True)  # Allowed for admins and potentially others
def get_departments():
    """List all departments."""
    depts = list(db.departments.find({}))
    result = []
    for d in depts:
        result.append({
            "id": str(d["_id"]),
            "name": d.get("name"),
            "description": d.get("description"),
            "email": d.get("email"),
            "phone": d.get("phone"),
            "createdAt": d.get("createdAt").isoformat() if d.get("createdAt") else None
        })
    return jsonify(result), 200

@departments_bp.route("/departments/<dept_id>/complaints", methods=["GET"])
@jwt_required()
def get_dept_complaints(dept_id):
    """Get all complaints assigned to a specific department."""
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    
    # Must be either an admin or a department_staff that belongs to this specific department
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    is_admin = user.get("role") == "admin"
    is_staff = user.get("role") == "DEPARTMENT_STAFF"
    
    if is_staff:
        if dept_id == "mine":
            dept_id = str(user.get("departmentId"))
        elif str(user.get("departmentId")) != str(dept_id):
            return jsonify({"error": "You are not authorized for this department"}), 403
    elif not is_admin:
        return jsonify({"error": "Admin or Department Staff access required"}), 403

    status_filter = request.args.get("status")
    
    query = {"assignedDepartmentId": dept_id}
    
    # "in_progress" mapped to "Assigned" or similar existing valid status in the app
    # For now we use exact matches since statuses might be "Pending", "Resolved"
    if status_filter and status_filter.lower() != "all":
        # Handle the React dropdown mapping (eg mapping 'in_progress' to DB status if needed)
        # Assuming frontend passes proper cases like "Pending", "Resolved", "In Progress"
        query["status"] = status_filter

    complaints = list(db.complaints.find(query, sort=[("createdAt", -1)]))
    
    return jsonify([_serialize(c, user_id) for c in complaints]), 200

