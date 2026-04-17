"""
Initializes the MongoDB database with essential departments and department staff users.
Run this script once to seed the database.
"""

from pymongo import MongoClient
import bcrypt
from datetime import datetime
import os
import sys

# Load environment configuration (we're running isolated from app.py)
# Hardcode fallback uri depending on standard config
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mysore_civic")

def seed_db():
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()

    print("Clearing old departments and staff users...")
    db.departments.delete_many({})
    db.users.delete_many({"role": "DEPARTMENT_STAFF"})

    print("Seeding Departments...")
    departments_data = [
        {"name": "Garbage", "description": "Manages garbage and waste", "email": "garbage@mysore.gov", "phone": "0821-2410001"},
        {"name": "Pothole", "description": "Handles potholes and road damage", "email": "pothole@mysore.gov", "phone": "0821-2410002"},
        {"name": "Streetlight", "description": "Manages streetlights", "email": "streetlight@mysore.gov", "phone": "0821-2410003"},
        {"name": "Traffic Signal", "description": "Handles traffic signal issues", "email": "trafficsignal@mysore.gov", "phone": "0821-2410004"},
        {"name": "Treefall", "description": "Handles tree falls", "email": "treefall@mysore.gov", "phone": "0821-2410005"},
        {"name": "Waterleakage", "description": "Handles water leakage", "email": "waterleakage@mysore.gov", "phone": "0821-2410006"},
        {"name": "Other", "description": "Other civic issues", "email": "other@mysore.gov", "phone": "0821-2410007"}
    ]

    for dept in departments_data:
        dept["createdAt"] = datetime.utcnow()
        db.departments.insert_one(dept)

    print("Seeding Department Administrators...")
    default_users = [
        {"email": "garbage@mysore.gov", "password": "DeptGarbage@123", "name": "Garbage Dept Admin", "dept_name": "Garbage"},
        {"email": "pothole@mysore.gov", "password": "DeptPothole@123", "name": "Pothole Dept Admin", "dept_name": "Pothole"},
        {"email": "streetlight@mysore.gov", "password": "DeptStreetlight@123", "name": "Streetlight Dept Admin", "dept_name": "Streetlight"},
        {"email": "trafficsignal@mysore.gov", "password": "DeptTrafficSignal@123", "name": "Traffic Signal Dept Admin", "dept_name": "Traffic Signal"},
        {"email": "treefall@mysore.gov", "password": "DeptTreefall@123", "name": "Treefall Dept Admin", "dept_name": "Treefall"},
        {"email": "waterleakage@mysore.gov", "password": "DeptWaterleakage@123", "name": "Waterleakage Dept Admin", "dept_name": "Waterleakage"},
        {"email": "other@mysore.gov", "password": "DeptOther@123", "name": "Other Dept Admin", "dept_name": "Other"},
    ]

    for user_data in default_users:
        if not db.users.find_one({"email": user_data["email"]}):
            dept = db.departments.find_one({"name": user_data["dept_name"]})
            if dept:
                password_hash = bcrypt.hashpw(user_data["password"].encode(), bcrypt.gensalt(12)).decode()
                db.users.insert_one({
                    "name": user_data["name"],
                    "email": user_data["email"],
                    "passwordHash": password_hash,
                    "role": "DEPARTMENT_STAFF",
                    "departmentId": str(dept["_id"]),
                    "createdAt": datetime.utcnow()
                })

    print("Successfully seeded department data and admin users.")

if __name__ == "__main__":
    seed_db()
