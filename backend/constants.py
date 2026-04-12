# Category → Department mapping
CATEGORY_DEPT_MAP = {
    "Potholes": "Road & Infrastructure",
    "Garbage": "Sanitation",
    "Water Leakage": "Water Supply & Drainage",
    "Streetlight Issue": "Electricity / Streetlights",
    "Treefall": "Public Property & Parks",
    "Traffic Light": "Traffic & Safety",
    "Others (Valid Civic Issues)": "Others",
    "Invalid (Noise/Spam)": "Rejected",
}

DEPT_CONTACTS = {
    "Road & Infrastructure": "road_dept@mysore.gov.in",
    "Sanitation": "sanitation@mysore.gov.in",
    "Water Supply & Drainage": "water@mysore.gov.in",
    "Electricity / Streetlights": "electricity@mysore.gov.in",
    "Public Property & Parks": "parks@mysore.gov.in",
    "Traffic & Safety": "traffic@mysore.gov.in",
    "Others": "admin@mysore.gov.in",
}

ALL_CATEGORIES = list(CATEGORY_DEPT_MAP.keys())

ALL_STATUSES = ["Pending", "In Progress", "Resolved"]

MYSORE_AREAS = [
    "Kuvempunagar", "Vijayanagar", "Hebbal", "Saraswathipuram",
    "Gokulam", "Nazarbad", "Jayalakshmipuram", "Udayagiri",
    "Bannimantap", "Rajivnagar", "Lakshmipuram", "Mandi Mohalla",
    "Chamundipuram", "Yadavagiri", "Bogadi", "Dattagalli",
    "T. Narasipur Road", "Hunsur Road", "Mysore City Centre",
]

MYSORE_CENTER = {"lat": 12.2958, "lng": 76.6394}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
