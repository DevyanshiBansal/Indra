# INDRA: Initiative for National Drainage and Rainwater Acquisition

> **Team Uncertainty**  
> **Authors:** Devyanshi Bansal, Soumya Sourav Das, Aryan Baglane, Himanshu Mourya  
> **College:** Delhi Technological University

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web framework |
| **Python 3.11** | Runtime |
| **Qdrant** | Vector database for RAG |
| **OpenRouter** | LLM API provider |
| **Firebase Admin** | Authentication & Firestore |
| **LangChain** | RAG orchestration |
| **Sentence Transformers** | Local embeddings (all-MiniLM-L6-v2) |
| **Pandas/NumPy** | GIS data processing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Vite** | Build tool |
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling |
| **Firebase** | Auth, Firestore, Storage |
| **Supabase** | Additional backend services |
| **Three.js / React Three Fiber** | 3D visualizations |
| **Framer Motion** | Animations |
| **Recharts** | Data visualization |

---

## Project Structure

```
Indra/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                  # Centralized configuration
│   ├── ai_service.py              # Unified RAG + LLM service
│   ├── assessment.py              # RWH assessment module
│   ├── user_auth.py               # User authentication
│   ├── community.py               # Social/community features
│   ├── vendor.py                  # Vendor search & DIY guides
│   ├── water_management.py        # Water distribution AI
│   ├── crop_suggestion.py         # Crop recommendation AI
│   ├── chatbot_standard.py        # Urban chatbot
│   ├── chatbot_rural.py           # Rural/Gramin chatbot
│   ├── gis_utils.py               # GIS data utilities
│   ├── requirements.txt           # Python dependencies
│   ├── render.yaml                # Render deployment config
│   ├── firebase-service-account.json
│   ├── RAG_System/                # RAG database & ingestion
│   │   ├── rag_database/          # Vector DB data
│   │   └── vec_data_dev.py        # Vector data development
│   ├── models/
│   │   └── all-MiniLM-L6-v2/      # Local embedding model
│   └── data/
│       └── INDRA_Processed_Data.csv  # GIS rainfall/groundwater data
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.tsx                # Main application
        ├── main.tsx               # Entry point
        ├── index.css              # Global styles
        ├── components/            # Reusable components
        ├── pages/                 # Page components
        ├── contexts/              # React contexts
        ├── lib/
        │   ├── firebase.ts        # Firebase config
        │   ├── supabase.ts        # Supabase client
        │   ├── firestore.ts       # Firestore operations
        │   └── contentApi.ts      # API integrations
        └── types/                 # TypeScript types
```

---

## Environment Variables

### Backend (`.env`)

Create a `.env` file in the `backend/` directory:

```env
# ==================== REQUIRED API KEYS ====================

# OpenRouter LLM API (https://openrouter.ai/)
OPENROUTER_API_KEY=your_openrouter_api_key

# Qdrant Vector Database (https://qdrant.tech/)
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key

# ==================== OPTIONAL CONFIGURATION ====================

# LLM Model (default: nvidia/nemotron-nano-12b-v2-vl:free)
LLM_MODEL=nvidia/nemotron-nano-12b-v2-vl:free
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2500

# RAG Configuration
RAG_COLLECTION_NAME=gis_rwh_rag_indra
RAG_RETRIEVER_K=2

# Server Settings
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG_MODE=false

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Firebase (uses firebase-service-account.json by default)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# GIS Data Path (default: ./data/INDRA_Processed_Data.csv)
GIS_DATA_PATH=./data/INDRA_Processed_Data.csv

# Embedding Model Path (default: ./models/all-MiniLM-L6-v2)
EMBEDDING_MODEL_PATH=./models/all-MiniLM-L6-v2
```

### Frontend (`.env`)

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Supabase (if using Supabase features)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** Firebase configuration is hardcoded in `src/lib/firebase.ts` for client-side use.

---

## Backend Setup

### Prerequisites
- Python 3.11+
- pip

### Installation

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. Save as `backend/firebase-service-account.json`

### Running the Server

```bash
# Development mode (with auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using main.py
python main.py
```

The API will be available at `http://localhost:8000`

### Health Check

```bash
curl http://localhost:8000/health
# Response: {"status": "healthy", "service": "INDRA Backend"}
```

---

## Frontend Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Other Commands

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Preview production build
npm run preview
```

---

## API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root endpoint |
| `GET` | `/health` | Health check |

### Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assessment` | Create RWH assessment |

### Chatbots
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chatbot/standard` | Urban RWH chatbot |
| `POST` | `/api/chatbot/rural` | Rural/Gramin chatbot |

### Water Management (INDRA-Gramin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gramin/water-management/predict` | AI water distribution prediction |
| `GET` | `/api/gramin/water-management/tips` | Water conservation tips |

### Crop Suggestions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gramin/crop-suggestions` | AI crop recommendations |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors/search` | Search RWH vendors |
| `GET` | `/api/vendors/diy-guide` | DIY installation guide |

### News & Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/news/water` | Water conservation news |
| `GET` | `/api/stats/water` | Water statistics |
| `GET` | `/api/blogs` | Blog posts |

### API Documentation

FastAPI auto-generates interactive API docs:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## Deployment

### Backend (Render)

The backend is configured for [Render](https://render.com/) deployment via `render.yaml`.

**Required Environment Variables on Render:**
- `OPENROUTER_API_KEY`
- `QDRANT_URL`
- `QDRANT_API_KEY`

**Pre-configured Variables:**
- `PYTHON_VERSION`: 3.11.4
- `LLM_MODEL`: nvidia/nemotron-nano-12b-v2-vl:free
- `RAG_COLLECTION_NAME`: standrd_rag
- `CORS_ORIGINS`: *
- `DEBUG_MODE`: false

### Frontend

Deploy the `frontend/` directory to any static hosting:
- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages

Set `VITE_API_URL` to your deployed backend URL.

---

## External Services Setup

### Qdrant Cloud

1. Create account at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a cluster
3. Copy the cluster URL and API key
4. Set `QDRANT_URL` and `QDRANT_API_KEY` in `.env`

### OpenRouter

1. Create account at [OpenRouter](https://openrouter.ai/)
2. Generate API key from dashboard
3. Set `OPENROUTER_API_KEY` in `.env`

### Firebase

1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password, Google)
3. Enable Firestore Database
4. Enable Storage
5. Download service account JSON for backend
6. Copy web config to `frontend/src/lib/firebase.ts`

---

## License

This project was developed for academic purposes at Delhi Technological University.
