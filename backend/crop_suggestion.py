"""
Crop Suggestion System with AI-Powered Recommendations
Production-ready RAG + GIS + LLM architecture for intelligent crop selection
Uses OpenRouter with Llama model for water-efficient farming recommendations
"""

import os
import sys
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import json

# API KEYS AND CONFIGURATION
QDRANT_URL = "qdrant.io"
QDRANT_API_KEY = "api_key_123456"
OPENROUTER_API_KEY = "sk-or-v1"

# MODEL CONFIGURATION
COLLECTION_NAME = "standrd_rag"
LLM_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"
TEMPERATURE = 0.3
MAX_TOKENS = 2000

# DEPENDENCIES
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_qdrant import QdrantVectorStore
    from qdrant_client import QdrantClient
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.runnables import RunnablePassthrough
    from gis_utils import gis_manager
except ImportError as e:
    print("Error: Missing required libraries")
    print("Install: pip install langchain-huggingface langchain-qdrant qdrant-client langchain-openai pandas")
    sys.exit(1)


# PYDANTIC MODELS
class CropInput(BaseModel):
    """Input parameters for crop suggestion"""
    location: str = Field(..., description="Location/district of the farm")
    pincode: Optional[str] = Field(None, description="Area pincode for GIS data")
    soil_type: str = Field(..., description="Type of soil")
    season: str = Field(..., description="Planting season (Kharif/Rabi/Zaid)")
    water_availability: str = Field(..., description="Water availability (Low/Medium/High)")
    farm_size_acres: float = Field(..., description="Farm size in acres")
    rainfall_mm: Optional[float] = Field(None, description="Annual rainfall in mm")


class CropRecommendation(BaseModel):
    """Individual crop recommendation"""
    crop_name: str
    water_requirement_liters: float
    estimated_market_price_per_kg: float
    yield_per_acre_kg: float
    total_profit_estimate: float
    price_per_liter_ratio: float  # Price efficiency
    environmental_impact_score: int  # 1-10 (10 = best)
    soil_health_impact: str  # Positive/Neutral/Negative
    farmer_ease_score: int  # 1-10 (10 = easiest)
    rank: int
    justification: str


class CropSuggestionResponse(BaseModel):
    """Complete crop suggestion response"""
    recommendations: List[CropRecommendation]
    season_context: str
    water_context: str
    general_advice: str


# AI SYSTEM PROMPT
CROP_SUGGESTION_PROMPT = """Crop advisor for Indian farmers.

GIS: {gis_data}
Inputs: {location}, {soil_type}, {season}, {water_availability}, {farm_size_acres} acres

Context: {context}

Task: Suggest 5 crops ranked by price/water ratio.

RULES:
1. Output ONLY valid JSON
2. No markdown, no extra text
3. Keep justification under 15 words
4. Use realistic Indian crop data

JSON format:
{{
  "recommendations": [
    {{
      "crop_name": "Rice",
      "water_requirement_liters": 600000,
      "estimated_market_price_per_kg": 30,
      "yield_per_acre_kg": 3000,
      "total_profit_estimate": 50000,
      "price_per_liter_ratio": 0.083,
      "environmental_impact_score": 7,
      "soil_health_impact": "Neutral",
      "farmer_ease_score": 8,
      "rank": 1,
      "justification": "High yield good market demand suitable season"
    }}
  ],
  "season_context": "Season tips max 10 words",
  "water_context": "Water tips max 10 words",
  "general_advice": "Summary max 15 words"
}}"""


# INITIALIZATION
embeddings = None
vector_store = None
retriever = None
llm = None
rag_chain = None


def initialize_crop_system():
    """Initialize crop suggestion system with RAG + GIS"""
    global embeddings, vector_store, retriever, llm, rag_chain
    
    print("Initializing INDRA Crop Suggestion System...")
    
    # Load GIS data
    gis_manager.load_data()
    
    # Load embedding model
    print("Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="./models/all-MiniLM-L6-v2",
        encode_kwargs={'normalize_embeddings': False}
    )
    
    # Connect to Qdrant
    print("Connecting to Qdrant...")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    collections = client.get_collections().collections
    if not any(c.name == COLLECTION_NAME for c in collections):
        print(f"Warning: Collection '{COLLECTION_NAME}' not found")
        print("System will work with limited context")
    
    vector_store = QdrantVectorStore.from_existing_collection(
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 2})  # Reduced for token efficiency
    
    # Initialize OpenRouter LLM
    print("Connecting to OpenRouter...")
    llm = ChatOpenAI(
        model=LLM_MODEL,
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS
    )
    
    # Test LLM connection
    try:
        test_response = llm.invoke("Say 'OK'")
        print(f"LLM test successful: {test_response.content[:50]}")
    except Exception as e:
        print(f"WARNING: LLM test failed: {e}")
    
    # Create RAG chain
    prompt = ChatPromptTemplate.from_template(CROP_SUGGESTION_PROMPT)
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    def format_input(inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Format inputs with GIS data"""
        # Get GIS data
        gis_data_str = "GIS data not available"
        location = inputs.get('location', '')
        pincode = inputs.get('pincode')
        
        if location or pincode:
            location_parts = location.split(",")
            district = location_parts[0].strip() if location_parts else None
            
            gis_data = gis_manager.get_location_data(
                pincode=pincode,
                district=district
            )
            
            if gis_data:
                rainfall_info = gis_data.get('rainfall', {})
                gis_data_str = f"""District: {gis_data.get('district', 'Unknown')}
State: {gis_data.get('state', 'Unknown')}
Annual Rainfall: {rainfall_info.get('total_annual', 0):.0f} mm
Monsoon Rainfall: {rainfall_info.get('monsoon', 0):.0f} mm
Summer Rainfall: {rainfall_info.get('summer', 0):.0f} mm
Groundwater Stress: {gis_manager.get_water_stress_level(gis_data)}"""
        
        # Retrieve context from RAG (limit to 2 docs, first 300 chars each)
        query = f"crop {inputs.get('season', '')} {inputs.get('soil_type', '')}"
        docs = retriever.invoke(query)
        context = " ".join(doc.page_content[:300] for doc in docs[:2])  # Limit tokens
        
        return {
            "context": context,
            "gis_data": gis_data_str,
            "location": inputs.get("location", ""),
            "soil_type": inputs.get("soil_type", ""),
            "season": inputs.get("season", ""),
            "water_availability": inputs.get("water_availability", ""),
            "farm_size_acres": inputs.get("farm_size_acres", ""),
            "rainfall_mm": inputs.get("rainfall_mm", "N/A")
        }
    
    rag_chain = (
        format_input
        | prompt
        | llm
        | StrOutputParser()
    )
    
    print("Crop Suggestion System ready")


async def get_crop_suggestions(crop_input: CropInput) -> CropSuggestionResponse:
    """Get AI-powered crop suggestions with RAG + GIS + LLM"""
    # Initialize if needed
    if rag_chain is None:
        initialize_crop_system()
    
    try:
        # Prepare input
        input_dict = {
            "location": crop_input.location,
            "pincode": crop_input.pincode,
            "soil_type": crop_input.soil_type,
            "season": crop_input.season,
            "water_availability": crop_input.water_availability,
            "farm_size_acres": crop_input.farm_size_acres,
            "rainfall_mm": crop_input.rainfall_mm if crop_input.rainfall_mm else "N/A"
        }
        
        # Get AI response
        print(f"Generating crop suggestions for {crop_input.location}...")
        response = rag_chain.invoke(input_dict)
        
        # Check for empty response
        if not response or len(response.strip()) == 0:
            print("ERROR: LLM returned empty response")
            print(f"Input dict: {input_dict}")
            # Use fallback immediately
            raise ValueError("Empty LLM response")
        
        print(f"LLM Response length: {len(response)} chars")
        print(f"Response preview: {response[:200]}...")
        
        # Extract JSON from response
        cleaned = response.strip()
        
        # Remove markdown code blocks
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        
        # Find JSON object
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            cleaned = cleaned[start:end+1]
        else:
            print(f"ERROR: No JSON object found in response")
            raise ValueError("No JSON in response")
        
        cleaned = cleaned.strip()
        print(f"Extracted JSON length: {len(cleaned)} chars")
        
        # Parse JSON
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Cleaned JSON: {cleaned[:500]}")
            # Return fallback response
            return CropSuggestionResponse(
                recommendations=[
                    CropRecommendation(
                        crop_name="Rice",
                        water_requirement_liters=600000,
                        estimated_market_price_per_kg=30,
                        yield_per_acre_kg=3000,
                        total_profit_estimate=50000,
                        price_per_liter_ratio=0.083,
                        environmental_impact_score=7,
                        soil_health_impact="Neutral",
                        farmer_ease_score=8,
                        rank=1,
                        justification="High yield good market demand"
                    ),
                    CropRecommendation(
                        crop_name="Wheat",
                        water_requirement_liters=450000,
                        estimated_market_price_per_kg=25,
                        yield_per_acre_kg=2500,
                        total_profit_estimate=40000,
                        price_per_liter_ratio=0.089,
                        environmental_impact_score=8,
                        soil_health_impact="Positive",
                        farmer_ease_score=9,
                        rank=2,
                        justification="Low water use easy to grow"
                    )
                ],
                season_context=f"Suitable crops for {crop_input.season} season",
                water_context=f"Optimized for {crop_input.water_availability} water",
                general_advice="AI unavailable. Using default recommendations."
            )
        
        return CropSuggestionResponse(**result)
        
    except Exception as e:
        print(f"Error: {e}")
        # Return fallback
        return CropSuggestionResponse(
            recommendations=[
                CropRecommendation(
                    crop_name="Rice",
                    water_requirement_liters=600000,
                    estimated_market_price_per_kg=30,
                    yield_per_acre_kg=3000,
                    total_profit_estimate=50000,
                    price_per_liter_ratio=0.083,
                    environmental_impact_score=7,
                    soil_health_impact="Neutral",
                    farmer_ease_score=8,
                    rank=1,
                    justification="High yield good market"
                )
            ],
            season_context=f"For {crop_input.season}",
            water_context=f"{crop_input.water_availability} water",
            general_advice="Error occurred. Using fallback data."
        )

