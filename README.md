# AI-Based Civic Issue Reporting System — Mysore

> Full-stack web application for reporting civic issues in Mysore city with AI-powered categorization, image validation, and real-time maps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Redux Toolkit, React Query, Leaflet.js |
| Backend API | Flask (Python) + Flask-JWT-Extended |
| ML Microservice | FastAPI (Python) |
| Database | MongoDB |
| Maps | Leaflet.js + OpenStreetMap |

---

## Project Structure

```
mysore-civic/
├── frontend/          # React + Vite app (port 5173)
├── backend/           # Flask REST API (port 5000)
│   ├── app.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── complaints.py
│   │   ├── map_routes.py
│   │   └── stats.py
│   ├── hybrid_verify.py
│   ├── ml_client.py
│   └── constants.py
└── ml-service/        # FastAPI ML microservice (port 8001)
    └── main.py
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally on port 27017

### 1. ML Microservice
```bash
cd ml-service
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8001
```

### 2. Backend API
```bash
cd backend
pip install -r requirements.txt
# Copy env file
copy .env.example .env
python app.py
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables (backend/.env)

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/mysore_civic` | MongoDB connection string |
| `JWT_SECRET` | *(set a strong secret)* | JWT signing secret |
| `NLP_SERVICE_URL` | `http://localhost:8001` | ML service base URL |
| `ML_SERVICE_URL` | `http://localhost:8001` | ML service base URL |
| `UPLOAD_FOLDER` | `uploads` | Local image storage directory |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register citizen account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/complaints` | Citizen | Submit complaint |
| GET | `/api/complaints` | Citizen | Own complaints |
| GET | `/api/complaints/all` | Admin | All complaints (filterable) |
| PATCH | `/api/complaints/:id/status` | Admin | Update status |
| PATCH | `/api/complaints/:id/category` | Admin | Override category (mismatch) |
| POST | `/api/complaints/:id/upvote` | Citizen | Toggle upvote |
| POST | `/api/complaints/:id/comment` | Citizen | Add comment |
| DELETE | `/api/complaints/:id` | Citizen | Delete own pending complaint |
| GET | `/api/map/points` | — | All geo-points for map |
| GET | `/api/map/heatmap` | — | Heatmap aggregated data |
| GET | `/api/map/nearby` | — | Complaints near a point |
| GET | `/api/stats` | Admin | Dashboard statistics |

---

## ML Microservice Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/categorize` | NLP: text → category + priority |
| POST | `/detect` | CNN: image → category + confidence |
| GET | `/health` | Health check |

> **Note:** The ML service currently uses rule-based mock inference. To activate real models, replace the `nlp_categorize()` and `image_categorize_mock()` functions in `ml-service/main.py` with DistilBERT and MobileNetV2 inference code.

---

## Hybrid Verification Logic

```
NLP result == Image result  →  Auto-assign to department
Image result == "Unknown"   →  Trust NLP result
NLP result == "Others"      →  Trust Image result
Otherwise                   →  Flag mismatch (admin review)
```

---

## User Roles

| Role | Capabilities |
|---|---|
| **Citizen** | Register, submit complaints, track own complaints, upvote, comment |
| **Admin** | All citizen actions + view all complaints, update status, resolve mismatches, view charts |

> **First registered user automatically becomes Admin.**

---

## Department Routing

| Issue Category | Department |
|---|---|
| Pothole, Road Damage | Road & Infrastructure |
| Garbage, Open Drain | Sanitation |
| Water Leakage, Drainage Block | Water Supply & Drainage |
| Streetlight Issue, Power Outage | Electricity / Streetlights |
| Park Damage, Tree Fall | Public Property & Parks |
| Traffic Signal | Traffic & Safety |

---

## Features

- ✅ AI text categorization (NLP)
- ✅ AI image validation (CNN)
- ✅ Hybrid cross-verification engine
- ✅ Duplicate detection (100m radius, 7-day window)
- ✅ Live Leaflet map with colour-coded markers
- ✅ Heatmap density overlay
- ✅ Location picker with Nominatim reverse geocoding
- ✅ Admin dashboard with Recharts bar + line charts
- ✅ Mismatch review panel (side-by-side AI comparison)
- ✅ Community upvotes + comments
- ✅ Role-based access control (JWT)
- ✅ Admin audit log for all overrides
- ✅ Priority sorting (High → Medium → Low)
- ✅ Complaint lifecycle tracking (Pending → In Progress → Resolved)
