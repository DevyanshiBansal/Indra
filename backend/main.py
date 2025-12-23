"""
FastAPI Main Application for INDRA Backend
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

# Import vendor module
from vendor import search_vendors_handler, get_diy_guide_handler

# Import water management module
from water_management import (
    predict_water_distribution,
    get_water_tips,
    water_ai,
    WaterManagementRequest,
    WaterManagementResponse
)

# Import crop suggestion module
from crop_suggestion import (
    get_crop_suggestions,
    initialize_crop_system,
    CropInput,
    CropSuggestionResponse
)

# Import chatbot modules
from chatbot_standard import (
    chat_standard,
    standard_chatbot,
    ChatRequest,
    ChatResponse
)
from chatbot_rural import (
    chat_rural,
    rural_chatbot
)

# Import assessment module
from assessment import router as assessment_router, load_embedding_model

app = FastAPI(
    title="INDRA API",
    description="Initiative for Drainage and Rainwater Acquisition - Backend API",
    version="1.0.0"
)

# Include assessment router
app.include_router(assessment_router)

# Initialize crop suggestion system on startup
@app.on_event("startup")
async def startup_event():
    """Initialize AI systems on server startup"""
    print("\nStarting INDRA Backend Services...")
    print("-" * 50)
    
    # Initialize Assessment Embedding Model
    try:
        print("Initializing Assessment AI (Embedding Model)...")
        load_embedding_model()
        print("Assessment AI ready")
    except Exception as e:
        print(f"Assessment AI warning: {e}")
    
    # Initialize Water Management AI
    try:
        print("Initializing Water Management AI...")
        water_ai.initialize()
        if water_ai._initialized:
            print("Water Management AI ready")
        else:
            print("Water Management AI: Limited functionality")
    except Exception as e:
        print(f"Water Management AI warning: {e}")
    
    # Initialize Crop Suggestion AI
    try:
        print("Initializing Crop Suggestion AI...")
        initialize_crop_system()
        print("Crop Suggestion AI ready")
    except Exception as e:
        print(f"Crop Suggestion AI warning: {e}")
    
    # Initialize Standard Chatbot
    try:
        print("Initializing Standard Chatbot...")
        standard_chatbot.initialize()
        if standard_chatbot._initialized:
            print("Standard Chatbot ready")
        else:
            print("Standard Chatbot: Limited functionality")
    except Exception as e:
        print(f"Standard Chatbot warning: {e}")
    
    # Initialize Rural Chatbot
    try:
        print("Initializing Rural Chatbot...")
        rural_chatbot.initialize()
        if rural_chatbot._initialized:
            print("Rural Chatbot ready")
        else:
            print("Rural Chatbot: Limited functionality")
    except Exception as e:
        print(f"Rural Chatbot warning: {e}")
    
    print("-" * 50)
    print("INDRA Backend Ready")
    print("-" * 50)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "INDRA API - Rainwater Harvesting Platform",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "INDRA Backend"}


# Vendor Search Endpoints
@app.get("/api/vendors/search")
async def search_vendors(
    location: str = Query(..., description="User's location (city/area)"),
    search_type: str = Query("all", description="Type of vendor to search for"),
    lat: Optional[float] = Query(None, description="User latitude"),
    lon: Optional[float] = Query(None, description="User longitude")
):
    """
    Search for RWH vendors and service providers
    
    Args:
        location: User's city or area name
        search_type: 'all', 'stores', 'mechanics', 'components', 'online', 'services'
        lat: User's latitude (for distance calculation)
        lon: User's longitude (for distance calculation)
    
    Returns:
        Categorized list of vendors with details
    """
    try:
        result = await search_vendors_handler(location, search_type, lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching vendors: {str(e)}")


@app.get("/api/vendors/diy-guide")
async def get_diy_guide():
    """
    Get comprehensive DIY guide for RWH installation
    
    Returns:
        Complete DIY guide with step-by-step instructions and tips
    """
    try:
        result = await get_diy_guide_handler()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching DIY guide: {str(e)}")


# Placeholder endpoints for other modules
@app.post("/api/assessment")
async def create_assessment():
    """Placeholder for RWH assessment endpoint"""
    return {"message": "Assessment endpoint - To be implemented"}


# Chatbot Endpoints
@app.post("/api/chatbot/standard", response_model=ChatResponse)
async def chatbot_standard_endpoint(request: ChatRequest):
    """
    Standard/Urban chatbot for rainwater harvesting queries
    
    Args:
        request: User message
    
    Returns:
        AI-powered response focused on urban RWH
    """
    try:
        result = await chat_standard(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Standard chatbot error: {str(e)}")


@app.post("/api/chatbot/rural", response_model=ChatResponse)
async def chatbot_rural_endpoint(request: ChatRequest):
    """
    Rural/Gramin chatbot for farming and water management queries
    
    Args:
        request: User message
    
    Returns:
        AI-powered response focused on rural water management and farming
    """
    try:
        result = await chat_rural(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rural chatbot error: {str(e)}")


# Water Management Endpoints (INDRA-Gramin)
@app.post("/api/gramin/water-management/predict", response_model=WaterManagementResponse)
async def predict_optimal_distribution(request: WaterManagementRequest):
    """
    AI-powered water distribution prediction for rural communities
    
    Args:
        request: Water management parameters (total water, season, crop, cattle, etc.)
    
    Returns:
        Optimal water distribution with AI insights and recommendations
    """
    try:
        result = await predict_water_distribution(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting water distribution: {str(e)}")


@app.get("/api/gramin/water-management/tips")
async def get_conservation_tips(
    season: str = Query(..., description="Current season (summer/monsoon/winter)"),
    crop_type: Optional[str] = Query(None, description="Type of crop being cultivated")
):
    """
    Get water conservation tips based on season and crop type
    
    Args:
        season: Current season
        crop_type: Optional crop type for specific recommendations
    
    Returns:
        List of actionable water conservation tips
    """
    try:
        result = await get_water_tips(season, crop_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tips: {str(e)}")


# Crop Suggestion Endpoints (INDRA-Gramin Smart Cropping)
@app.post("/api/gramin/crop-suggestions", response_model=CropSuggestionResponse)
async def get_ai_crop_recommendations(request: CropInput):
    """
    AI-powered crop suggestions based on location, soil, season, and water availability
    
    Args:
        request: Crop input parameters (location, soil, season, water, farm size)
    
    Returns:
        Top 5 crop recommendations ranked by price/water ratio with environmental considerations
    """
    try:
        result = await get_crop_suggestions(request)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=f"AI response error: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating crop suggestions: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
