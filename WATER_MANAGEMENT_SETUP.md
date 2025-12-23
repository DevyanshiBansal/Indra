# Water Management System - Setup & Usage Guide

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
cd backend
pip install langchain-google-genai python-dotenv
```

### 2. Start Backend Server
```powershell
cd backend
python main.py
```
The server will start at: `http://localhost:8000`

### 3. Start Frontend
```powershell
cd frontend
npm run dev
```
The frontend will start at: `http://localhost:5173`

## 🧪 Test the Backend

Run the test script to verify the AI is working:
```powershell
cd backend
python test_water_management.py
```

## 📡 API Endpoints

### 1. Water Distribution Prediction
**POST** `/api/gramin/water-management/predict`

Request:
```json
{
  "total_water": 500000,
  "location": "Rampur GP",
  "season": "monsoon",
  "crop_type": "Rice",
  "cattle_count": 15,
  "household_members": 5
}
```

Response:
```json
{
  "distribution": {
    "irrigation": 200000,
    "cattle": 150000,
    "drinking": 150000,
    "remaining": 0
  },
  "recommendations": [
    "🌧️ Monsoon: Focus on rainwater harvesting",
    "🐄 Large herd: Ensure adequate water access"
  ],
  "ai_insights": "AI-generated recommendation based on RAG",
  "optimal_percentages": {
    "irrigation": 40.0,
    "cattle": 30.0,
    "drinking": 30.0
  }
}
```

### 2. Water Conservation Tips
**GET** `/api/gramin/water-management/tips?season=monsoon&crop_type=Rice`

Response:
```json
{
  "tips": [
    "Harvest rainwater effectively",
    "Maintain proper drainage channels",
    "Monitor water quality"
  ]
}
```

## 🎯 How It Works

### Backend Architecture

```
water_management.py
├── WaterManagementAI (RAG Engine)
│   ├── HuggingFace Embeddings (Local Model)
│   ├── Qdrant Vector Store (Cloud)
│   └── Google Gemini API (LLM)
├── predict_water_distribution()
│   ├── Calculate optimal distribution
│   ├── Get AI insights via RAG
│   └── Generate recommendations
└── get_water_tips()
```

### Frontend Features

1. **AI Prediction Panel**: Input farm parameters
2. **Real-time Distribution**: Adjust sliders manually
3. **AI Insights**: RAG-powered recommendations
4. **Visual Charts**: Distribution breakdown

## 🔧 Configuration

Edit `.env` file in `backend/`:
```env
API_KEY=your_gemini_api_key_here
```

## 📊 Features Implemented

✅ RAG-based AI predictions using chatbot_rural.py logic  
✅ Smart water distribution based on:
  - Season (monsoon/summer/winter)
  - Crop type
  - Cattle count
  - Household size
  - Location

✅ Context-aware recommendations  
✅ Real-time frontend-backend integration  
✅ Interactive UI with manual overrides  

## 🐛 Troubleshooting

### Backend won't start
- Ensure all dependencies installed
- Check `.env` has valid `API_KEY`
- Verify Qdrant collection exists

### Frontend can't connect
- Ensure backend running on port 8000
- Check CORS settings in main.py
- Verify fetch URL is `http://localhost:8000`

### AI insights unavailable
- Check Gemini API key is valid
- Verify Qdrant collection "standrd_rag" exists
- Run `python test_water_management.py` to debug

## 🎨 Usage Flow

1. User opens Water Management Page (Gramin mode)
2. Fills in farm parameters (season, crop, cattle, etc.)
3. Clicks "Get AI Recommendation"
4. Backend:
   - Retrieves context from Qdrant vector store
   - Sends query to Gemini with RAG context
   - Calculates optimal distribution
   - Generates recommendations
5. Frontend displays:
   - AI insights
   - Recommended distribution
   - Conservation tips
6. User can manually adjust with sliders

## 🌟 Example Use Case

**Scenario**: Farmer in monsoon season with 15 cattle, growing rice

**Input**:
- Total Water: 500,000 L
- Season: Monsoon
- Crop: Rice
- Cattle: 15
- Household: 5 members

**AI Output**:
- Irrigation: 200,000 L (40%)
- Cattle: 150,000 L (30%)
- Drinking: 150,000 L (30%)
- Insights: "Focus on rainwater harvesting during monsoon. Rice requires consistent water supply. Maintain drainage to prevent waterlogging."

---

**Status**: ✅ Fully Integrated & Production Ready
