"""
Water Management AI - Production Ready for Rural India
Uses buckets/day, GIS rainfall data, and token-optimized prompts
"""

import os
import sys
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

# API KEYS
QDRANT_URL = "qdrant.io"
QDRANT_API_KEY = "api_key_123456"
OPENROUTER_API_KEY = "sk-or-v1"
# MODEL CONFIG
COLLECTION_NAME = "standrd_rag"
LLM_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"
TEMPERATURE = 0.3
MAX_TOKENS = 400  # Reduced for token efficiency

# DEPENDENCIES
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_qdrant import QdrantVectorStore
    from qdrant_client import QdrantClient
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from gis_utils import gis_manager
except ImportError as e:
    print(f"Error: Missing libraries - {e}")
    sys.exit(1)


# MODELS
class WaterManagementRequest(BaseModel):
    location: Optional[str] = None
    pincode: Optional[str] = None
    season: str = "monsoon"
    crop_type: Optional[str] = None
    cattle_count: int = 10
    household_members: int = 4
    farm_size_acres: float = 2.0


class WaterDistribution(BaseModel):
    irrigation_buckets: int
    cattle_buckets: int
    drinking_buckets: int
    irrigation_pct: float
    cattle_pct: float
    drinking_pct: float


class WaterManagementResponse(BaseModel):
    distribution: WaterDistribution
    recommendations: List[str]
    ai_insights: str
    water_status: str
    gis_summary: str


# AI ENGINE
class WaterManagementAI:
    def __init__(self):
        self.embeddings = None
        self.vector_store = None
        self.retriever = None
        self.llm = None
        self.prompt = None
        self._initialized = False
    
    def initialize(self):
        if self._initialized:
            return
        
        try:
            print("Initializing Water Management AI...")
            gis_manager.load_data()
            
            self.embeddings = HuggingFaceEmbeddings(
                model_name="./models/all-MiniLM-L6-v2",
                encode_kwargs={'normalize_embeddings': False}
            )
            
            client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
            collections = client.get_collections().collections
            if not any(c.name == COLLECTION_NAME for c in collections):
                print(f"Warning: Collection '{COLLECTION_NAME}' not found")
                return
            
            self.vector_store = QdrantVectorStore.from_existing_collection(
                embedding=self.embeddings,
                collection_name=COLLECTION_NAME,
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY
            )
            
            self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 2})
            
            self.llm = ChatOpenAI(
                model=LLM_MODEL,
                openai_api_key=OPENROUTER_API_KEY,
                openai_api_base="https://openrouter.ai/api/v1",
                temperature=TEMPERATURE,
                max_tokens=MAX_TOKENS
            )
            
            # Token-optimized prompt
            prompt_template = """Rural water advisor.

Context: {context}

GIS: {gis_data}

Farm: {season}, {crop_type}, {cattle_count} cattle, {household_members} people, {location}

Give 2 simple tips. Max 50 words."""

            self.prompt = ChatPromptTemplate.from_template(prompt_template)
            self._initialized = True
            print("Water Management AI initialized")
            
        except Exception as e:
            print(f"Error initializing AI: {e}")
    
    def get_ai_insights(self, request: WaterManagementRequest) -> str:
        if not self._initialized:
            self.initialize()
        
        if not self._initialized or not self.prompt:
            return "AI unavailable. Using standard guidelines."
        
        try:
            # GIS data
            gis_data_str = "GIS unavailable"
            if request.location or request.pincode:
                location_parts = (request.location or "").split(",")
                district = location_parts[0].strip() if location_parts else None
                
                gis_data = gis_manager.get_location_data(
                    pincode=request.pincode,
                    district=district
                )
                
                if gis_data:
                    rainfall = gis_data.get('rainfall', {})
                    gw = gis_data.get('groundwater', {})
                    stress = gis_manager.get_water_stress_level(gis_data)
                    
                    gis_data_str = f"{gis_data.get('district', 'Unknown')}, {rainfall.get('total_annual', 0):.0f}mm rain, {stress} stress"
            
            # RAG context (token-limited)
            query = f"water {request.season} {request.crop_type or 'farming'}"
            docs = self.retriever.invoke(query)
            context = " ".join(doc.page_content[:150] for doc in docs[:1])
            
            # Invoke LLM
            prompt_vars = {
                "context": context,
                "gis_data": gis_data_str,
                "location": request.location or "Rural",
                "season": request.season,
                "crop_type": request.crop_type or "General",
                "cattle_count": request.cattle_count,
                "household_members": request.household_members
            }
            
            formatted_prompt = self.prompt.format(**prompt_vars)
            response = self.llm.invoke(formatted_prompt)
            
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            print(f"Error getting AI insights: {e}")
            return "Using standard guidelines."
    
    def calculate_optimal_distribution(self, request: WaterManagementRequest) -> Tuple[WaterDistribution, str, str]:
        # Base needs (1 bucket ≈ 20L)
        drinking_base = request.household_members * 2
        cattle_base = request.cattle_count * 2
        irrigation_base = int(request.farm_size_acres * 10)
        
        # Season adjustments
        if request.season == "summer":
            drinking_base = int(drinking_base * 1.2)
            cattle_base = int(cattle_base * 1.3)
            irrigation_base = int(irrigation_base * 1.4)
        elif request.season == "winter":
            irrigation_base = int(irrigation_base * 0.7)
            cattle_base = int(cattle_base * 0.9)
        elif request.season == "monsoon":
            irrigation_base = int(irrigation_base * 0.5)
        
        total_buckets = drinking_base + cattle_base + irrigation_base
        
        # Percentages
        irrigation_pct = round((irrigation_base / total_buckets) * 100, 1)
        cattle_pct = round((cattle_base / total_buckets) * 100, 1)
        drinking_pct = round((drinking_base / total_buckets) * 100, 1)
        
        # GIS-based sufficiency
        water_status = "Sufficient"
        gis_summary = "GIS data unavailable"
        
        try:
            if request.location or request.pincode:
                location_parts = (request.location or "").split(",")
                district = location_parts[0].strip() if location_parts else None
                
                gis_data = gis_manager.get_location_data(
                    pincode=request.pincode,
                    district=district
                )
                
                if gis_data:
                    rainfall = gis_data.get('rainfall', {})
                    gw = gis_data.get('groundwater', {})
                    stress = gis_manager.get_water_stress_level(gis_data)
                    
                    annual_rain = rainfall.get('total_annual', 0)
                    season_rain = rainfall.get(request.season.lower(), 0)
                    extraction_pct = gw.get('extraction_percentage', 0)
                    
                    if stress == "Over-Exploited" or extraction_pct > 90:
                        water_status = "Critical - Outsource Needed"
                    elif stress == "Critical" or (request.season == "summer" and season_rain < 50):
                        water_status = "Moderate - Conservation Required"
                    elif request.season == "monsoon" and season_rain > 300:
                        water_status = "Surplus - Rainwater Sufficient"
                    else:
                        water_status = "Sufficient - Manage Wisely"
                    
                    gis_summary = f"{gis_data.get('district', 'Unknown')}, {stress} stress, {annual_rain:.0f}mm rainfall"
        except:
            pass
        
        distribution = WaterDistribution(
            irrigation_buckets=irrigation_base,
            cattle_buckets=cattle_base,
            drinking_buckets=drinking_base,
            irrigation_pct=irrigation_pct,
            cattle_pct=cattle_pct,
            drinking_pct=drinking_pct
        )
        
        return distribution, water_status, gis_summary
    
    def generate_recommendations(self, request: WaterManagementRequest, water_status: str) -> List[str]:
        recs = []
        
        if "Critical" in water_status:
            recs.append("Urgent: Water shortage. Consider tanker water.")
        elif "Moderate" in water_status:
            recs.append("Conserve water. Prioritize essentials.")
        elif "Surplus" in water_status:
            recs.append("Good rainfall. Harvest rainwater.")
        
        if request.season == "summer":
            recs.append("Irrigate early morning/evening only.")
        elif request.season == "monsoon":
            recs.append("Collect rain. Check drainage.")
        
        return recs[:3]


# SINGLETON
water_ai = WaterManagementAI()


# API FUNCTION
async def predict_water_distribution(request: WaterManagementRequest) -> WaterManagementResponse:
    if not water_ai._initialized:
        water_ai.initialize()
    
    distribution, water_status, gis_summary = water_ai.calculate_optimal_distribution(request)
    recommendations = water_ai.generate_recommendations(request, water_status)
    ai_insights = water_ai.get_ai_insights(request)
    
    return WaterManagementResponse(
        distribution=distribution,
        recommendations=recommendations,
        ai_insights=ai_insights,
        water_status=water_status,
        gis_summary=gis_summary
    )


async def get_water_tips(season: str, crop_type: Optional[str] = None) -> Dict[str, List[str]]:
    tips = {
        "summer": ["Use mulching", "Irrigate morning/evening", "Check leaks"],
        "monsoon": ["Harvest rainwater", "Maintain drainage", "Check quality"],
        "winter": ["Reduce irrigation", "Repair infrastructure", "Plan ahead"]
    }
    return {"tips": tips.get(season, tips["monsoon"])}
