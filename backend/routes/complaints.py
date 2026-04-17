"""Complaints routes — full CRUD, upvotes, comments, admin overrides."""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os, uuid

from config import MONGO_URI, UPLOAD_FOLDER
from constants import CATEGORY_DEPT_MAP, ALL_STATUSES, ALL_CATEGORIES
from hybrid_verify import hybrid_verify, resolve_mismatch
from ml_client import call_nlp, call_image_detect

complaints_bp = Blueprint("complaints", __name__)
db = MongoClient(MONGO_URI).get_default_database()


# ── Helpers ──────────────────────────────────────────────────

def _require_admin(user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    return user and user.get("role") == "admin"


def _serialize(c, current_user_id=None):
    upvotes = c.get("upvotes", [])
    return {
        "id": str(c["_id"]),
        "userId": str(c.get("userId", "")),
        "description": c.get("description", ""),
        "imageUrl": c.get("imageUrl", ""),
        "nlpCategory": c.get("nlpCategory", ""),
        "nlpPriority": c.get("nlpPriority", "Medium"),
        "imageCategory": c.get("imageCategory", ""),
        "finalCategory": c.get("finalCategory"),
        "mismatch": c.get("mismatch", False),
        "department": c.get("department", ""),
        "assignedDepartmentId": str(c.get("assignedDepartmentId", "")),
        "status": c.get("status", "Pending"),
        "location": {
            "lat": c["location"]["coordinates"][1] if c.get("location") else None,
            "lng": c["location"]["coordinates"][0] if c.get("location") else None,
        },
        "areaName": c.get("areaName", ""),
        "upvoteCount": len(upvotes),
        "hasUpvoted": ObjectId(current_user_id) in upvotes if current_user_id else False,
        "comments": [
            {
                "userId": str(cm["userId"]),
                "text": cm["text"],
                "createdAt": cm["createdAt"].isoformat(),
            }
            for cm in c.get("comments", [])
        ],
        "createdAt": c["createdAt"].isoformat() if c.get("createdAt") else None,
        "updatedAt": c["updatedAt"].isoformat() if c.get("updatedAt") else None,
    }


def _save_image(image_file):
    """Save uploaded image locally; returns relative URL path."""
    ext = os.path.splitext(image_file.filename)[1].lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    image_file.save(save_path)
    return f"/uploads/{filename}"


def _is_duplicate(nlp_category, location_doc):
    """Check for same-category complaint within 100 m in the last 7 days."""
    try:
        cursor = db.complaints.find({
            "location": {
                "$near": {
                    "$geometry": location_doc,
                    "$maxDistance": 100,
                }
            },
            "finalCategory": nlp_category,
            "status": {"$ne": "Resolved"},
            "createdAt": {"$gte": datetime.utcnow() - timedelta(days=7)},
        })
        return cursor.count() > 0
    except Exception:
        return False


# ── Submit complaint ─────────────────────────────────────────

@complaints_bp.route("/complaints", methods=["POST"])
@jwt_required()
def submit_complaint():
    user_id = get_jwt_identity()
    description = request.form.get("description", "").strip()
    lat = request.form.get("lat")
    lng = request.form.get("lng")
    area_name = request.form.get("areaName", "")
    image_file = request.files.get("image")

    if not description:
        return jsonify({"error": "Description is required"}), 400
    if not lat or not lng:
        return jsonify({"error": "Location is required"}), 400

    try:
        lat, lng = float(lat), float(lng)
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

    # 1. Save image
    image_url = ""
    image_bytes = b""
    image_filename = "image.jpg"
    image_content_type = "image/jpeg"

    if image_file:
        image_url = _save_image(image_file)
        image_file.seek(0)
        image_bytes = image_file.read()
        image_filename = image_file.filename
        image_content_type = image_file.content_type or "image/jpeg"

    # 2. NLP inference
    nlp_result = call_nlp(description)
    nlp_category = nlp_result.get("category", "Others")
    nlp_priority = nlp_result.get("priority", "Medium")

    # 3. Image inference
    if image_bytes:
        img_result = call_image_detect(image_bytes, image_filename, image_content_type)
    else:
        img_result = {"category": "Unknown", "confidence": 0.0}
    image_category = img_result.get("category", "Unknown")

    # 4. Hybrid verification
    final_category, mismatch, department = hybrid_verify(nlp_category, image_category)

    # 5. Duplicate detection
    location_doc = {"type": "Point", "coordinates": [lng, lat]}
    duplicate = _is_duplicate(nlp_category, location_doc)

    # Auto-assign to correct department based on categorization
    assigned_dept_id = None
    if not mismatch:
        cat_lower = final_category.lower().replace(" ", "")
        all_depts = list(db.departments.find({}))
        dept_map = {d["name"].lower().replace(" ", ""): str(d["_id"]) for d in all_depts}
        
        assigned_dept_id = dept_map.get(cat_lower)
        if not assigned_dept_id:
            assigned_dept_id = dept_map.get("other")

    # 6. Build document
    now = datetime.utcnow()
    complaint_doc = {
        "userId": ObjectId(user_id),
        "description": description,
        "imageUrl": image_url,
        "nlpCategory": nlp_category,
        "nlpPriority": nlp_priority,
        "imageCategory": image_category,
        "finalCategory": final_category,
        "assignedDepartmentId": assigned_dept_id,
        "mismatch": mismatch,
        "department": department,
        "status": "Pending",
        "location": location_doc,
        "areaName": area_name,
        "upvotes": [],
        "comments": [],
        "isDuplicate": duplicate,
        "createdAt": now,
        "updatedAt": now,
    }

    result = db.complaints.insert_one(complaint_doc)

    return jsonify({
        "success": True,
        "complaintId": str(result.inserted_id),
        "mismatch": mismatch,
        "isDuplicate": duplicate,
        "nlpCategory": nlp_category,
        "imageCategory": image_category,
        "finalCategory": final_category,
        "department": department,
    }), 201


# ── Get own complaints (citizen) ─────────────────────────────

@complaints_bp.route("/complaints", methods=["GET"])
@jwt_required()
def get_my_complaints():
    user_id = get_jwt_identity()
    complaints = list(db.complaints.find(
        {"userId": ObjectId(user_id)},
        sort=[("createdAt", -1)]
    ))
    return jsonify([_serialize(c, user_id) for c in complaints]), 200


# ── Get all complaints (admin) ───────────────────────────────

@complaints_bp.route("/complaints/all", methods=["GET"])
@jwt_required()
def get_all_complaints():
    user_id = get_jwt_identity()
    if not _require_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403

    query = {}
    status = request.args.get("status")
    priority = request.args.get("priority")
    department = request.args.get("department")
    mismatch_only = request.args.get("mismatch")
    area = request.args.get("area")

    if status and status in ALL_STATUSES:
        query["status"] = status
    if priority in ["High", "Medium", "Low"]:
        query["nlpPriority"] = priority
    if department:
        query["department"] = department
    if mismatch_only == "true":
        query["mismatch"] = True
    if area:
        query["areaName"] = {"$regex": area, "$options": "i"}

    # Priority sort: High → Medium → Low, then newest first
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    complaints = list(db.complaints.find(query, sort=[("createdAt", -1)]))
    complaints.sort(key=lambda c: (priority_order.get(c.get("nlpPriority", "Medium"), 1),))

    return jsonify([_serialize(c, user_id) for c in complaints]), 200


# ── Get single complaint ─────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>", methods=["GET"])
@jwt_required()
def get_complaint(complaint_id):
    user_id = get_jwt_identity()
    try:
        c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        return jsonify({"error": "Invalid complaint ID"}), 400
    if not c:
        return jsonify({"error": "Complaint not found"}), 404
    return jsonify(_serialize(c, user_id)), 200


# ── Update status (admin or department) ───────────────────────

@complaints_bp.route("/complaints/<complaint_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(complaint_id):
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    is_staff = user.get("role") == "DEPARTMENT_STAFF"
    
    if not is_staff:
        # If the user is an admin or citizen, block them explicitly.
        return jsonify({"error": "Only Department Staff can update the status of issues."}), 403

    c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not c:
        return jsonify({"error": "Complaint not found"}), 404
        
    # Staff can only update complaints assigned to their department
    if str(c.get("assignedDepartmentId")) != str(user.get("departmentId")):
        return jsonify({"error": "Complaint not assigned to your department"}), 403

    new_status = request.get_json().get("status")
    notes = request.get_json().get("notes", "")

    old_status = c.get("status")

    db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
    )

    # Log to Status History
    db.status_history.insert_one({
        "complaintId": str(complaint_id),
        "oldStatus": old_status,
        "newStatus": new_status,
        "updatedBy": user_id,
        "notes": notes,
        "updatedAt": datetime.utcnow()
    })

    # Simulated Email Notification (Phase 1)
    citizen = db.users.find_one({"_id": c.get("userId")})
    if citizen:
        print(f"\n📧 [SIMULATED EMAIL NOTIFICATION]")
        print(f"To: {citizen.get('email')}")
        print(f"Subject: Civic Issue #{complaint_id[:6].upper()} Status Updated")
        print(f"Message: Your complaint has been updated from '{old_status}' to '{new_status}'.")
        if notes:
            print(f"Notes: {notes}")
        print("----------------------------------------\n")

    return jsonify({"success": True, "status": new_status}), 200

# ── Assign Department (admin only) ───────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/assign-department", methods=["POST"])
@jwt_required()
def assign_department(complaint_id):
    user_id = get_jwt_identity()
    if not _require_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403

    dept_id = request.get_json().get("department_id")
    if not dept_id:
        return jsonify({"error": "department_id is required"}), 400

    c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {
            "assignedDepartmentId": dept_id,
            "assignedAt": datetime.utcnow()
        }}
    )

    return jsonify({"success": True}), 200

# ── Status History ───────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/history", methods=["GET"])
@jwt_required()
def get_complaint_history(complaint_id):
    history = list(db.status_history.find({"complaintId": str(complaint_id)}, sort=[("updatedAt", -1)]))
    for h in history:
        h["id"] = str(h.pop("_id"))
        h["updatedAt"] = h["updatedAt"].isoformat() if h.get("updatedAt") else None
    return jsonify(history), 200



# ── Update Area (admin) ──────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/area", methods=["PATCH"])
@jwt_required()
def update_area(complaint_id):
    user_id = get_jwt_identity()
    if not _require_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403

    new_area = request.get_json().get("area", "").strip()
    
    c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"areaName": new_area, "updatedAt": datetime.utcnow()}}
    )

    db.admin_logs.insert_one({
        "adminId": ObjectId(user_id),
        "complaintId": ObjectId(complaint_id),
        "action": "area_update",
        "oldValue": c.get("areaName", ""),
        "newValue": new_area,
        "timestamp": datetime.utcnow(),
    })

    return jsonify({"success": True}), 200


# ── Override category (admin — resolve mismatch) ─────────────

@complaints_bp.route("/complaints/<complaint_id>/category", methods=["PATCH"])
@jwt_required()
def override_category(complaint_id):
    user_id = get_jwt_identity()
    if not _require_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403

    confirmed_category = request.get_json().get("category")
    if confirmed_category not in ALL_CATEGORIES and confirmed_category != "Invalid":
        return jsonify({"error": "Invalid category"}), 400

    c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    if confirmed_category == "Invalid":
        final_cat = "Invalid"
        department = "Invalid"
    else:
        final_cat, department = resolve_mismatch(confirmed_category)

    db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {
            "finalCategory": final_cat,
            "department": department,
            "mismatch": False,
            "updatedAt": datetime.utcnow(),
        }}
    )

    db.admin_logs.insert_one({
        "adminId": ObjectId(user_id),
        "complaintId": ObjectId(complaint_id),
        "action": "category_override",
        "oldValue": str(c.get("finalCategory")),
        "newValue": final_cat,
        "timestamp": datetime.utcnow(),
    })

    return jsonify({"success": True, "finalCategory": final_cat, "department": department}), 200


# ── Delete own complaint (citizen, only if Pending) ──────────

@complaints_bp.route("/complaints/<complaint_id>", methods=["DELETE"])
@jwt_required()
def delete_complaint(complaint_id):
    user_id = get_jwt_identity()
    try:
        c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    if not c:
        return jsonify({"error": "Not found"}), 404
    if str(c["userId"]) != user_id:
        return jsonify({"error": "Not authorized"}), 403
    if c["status"] != "Pending":
        return jsonify({"error": "Can only delete Pending complaints"}), 400

    db.complaints.delete_one({"_id": ObjectId(complaint_id)})
    return jsonify({"success": True}), 200


# ── Upvote (toggle) ──────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/upvote", methods=["POST"])
@jwt_required()
def upvote(complaint_id):
    user_id = get_jwt_identity()
    try:
        c = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    if not c:
        return jsonify({"error": "Not found"}), 404

    if str(c.get("userId")) == user_id:
        return jsonify({"error": "Cannot upvote your own complaint"}), 400

    user_oid = ObjectId(user_id)
    if user_oid in c.get("upvotes", []):
        db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$pull": {"upvotes": user_oid}}
        )
        action = "removed"
    else:
        db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$addToSet": {"upvotes": user_oid}}
        )
        action = "added"

    updated = db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return jsonify({
        "success": True,
        "action": action,
        "upvoteCount": len(updated.get("upvotes", [])),
        "hasUpvoted": action == "added",
    }), 200


# ── Add comment ──────────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/comment", methods=["POST"])
@jwt_required()
def add_comment(complaint_id):
    user_id = get_jwt_identity()
    text = request.get_json().get("text", "").strip()
    if not text:
        return jsonify({"error": "Comment text required"}), 400
    if len(text) > 500:
        return jsonify({"error": "Comment too long (max 500 chars)"}), 400

    comment = {
        "userId": ObjectId(user_id),
        "text": text,
        "createdAt": datetime.utcnow(),
    }

    db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$push": {"comments": comment}, "$set": {"updatedAt": datetime.utcnow()}}
    )

    return jsonify({"success": True}), 201
