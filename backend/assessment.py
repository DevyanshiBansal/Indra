"""
INDRA - Intelligent Assessment Module
AI/ML-powered Rainwater Harvesting Assessment System
Uses on-device embeddings and hybrid ML models for cost prediction and feasibility analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import json
import os
import aiohttp
from dotenv import load_dotenv

# Import local modules
from gis_utils import GISDataManager
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv()

# Initialize Router
router = APIRouter(prefix="/api/assessment", tags=["assessment"])

# Load local embedding model
MODEL_PATH = "./models/all-MiniLM-L6-v2"
embedding_model = None

# OpenRouter Configuration
OPENROUTER_API_KEY = "sk-or-v1-..." # TODO: Replace with your actual OpenRouter API key
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

def load_embedding_model():
    """Load the local sentence transformer model"""
    global embedding_model
    if embedding_model is None:
        try:
            embedding_model = SentenceTransformer(MODEL_PATH)
            print(f"✅ Loaded embedding model from {MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Error loading embedding model: {e}")
    return embedding_model

async def get_llm_recommendations(context: Dict[str, Any]) -> str:
    """Get AI-powered recommendations using OpenRouter LLM"""
    if not OPENROUTER_API_KEY:
        return "AI recommendations unavailable (API key not configured)"
    
    try:
        prompt = f"""
You are an expert in Rainwater Harvesting (RWH) systems in India. Analyze the following assessment and provide 3-5 specific, actionable recommendations.

Location: {context['district']}, {context['state']}
Annual Rainfall: {context['rainfall']} mm
Household Members: {context['members']}
Catchment Area: {context['catchment']} sq m
Budget: ₹{context['budget']}
Roof Type: {context['roof_type']}
Roof Material: {context['roof_material']}
Groundwater Status: {context['gw_status']}
Feasibility Score: {context['feasibility_score']}/100

Provide practical recommendations focusing on:
1. Cost optimization
2. Water quality improvements
3. Seasonal strategies
4. Maintenance practices
5. Government schemes or subsidies available

Keep each recommendation concise (1-2 sentences) and actionable.
"""
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                OPENROUTER_BASE_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://indra-rwh.app",
                    "X-Title": "INDRA RWH Assessment"
                },
                json={
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['choices'][0]['message']['content']
                else:
                    print(f"OpenRouter API error: {response.status}")
                    return "AI recommendations temporarily unavailable"
    except Exception as e:
        print(f"LLM error: {e}")
        return "AI recommendations temporarily unavailable"

# Initialize GIS Manager
gis_manager = GISDataManager()

# Pydantic Models
class AssessmentInput(BaseModel):
    """User input for RWH assessment"""
    name: str = Field(..., description="User's name")
    state: str = Field(..., description="State")
    district: str = Field(..., description="District")
    pincode: str = Field(..., description="Pincode")
    n_members: int = Field(..., description="Number of household members", ge=1)
    catchment_area: float = Field(..., description="Catchment area in sq meters", ge=0)
    farm_land_area: Optional[float] = Field(0, description="Farm land area in acres")
    roof_type: str = Field(..., description="Roof type (Flat/Sloped/Mixed)")
    roof_material: str = Field(..., description="Roof material (RCC/Tiles/Metal/Asbestos)")
    budget: float = Field(..., description="Budget for RWH in INR", ge=0)
    project_status: Optional[str] = Field("planning", description="Project status")

class AssessmentOutput(BaseModel):
    """Complete assessment output"""
    # Input confirmation
    user_details: Dict[str, Any]
    
    # Generated location data
    location_data: Dict[str, Any]
    
    # RWH Analysis
    rwh_analysis: Dict[str, Any]
    
    # Cost Analysis
    cost_analysis: Dict[str, Any]
    
    # Implementation Plan
    implementation: Dict[str, Any]
    
    # Feasibility Score
    feasibility: Dict[str, Any]
    
    # Recommendations
    recommendations: List[str]
    
    # Timestamp
    assessment_id: str
    timestamp: str


class RWHCostPredictor:
    """ML-based cost prediction using statistical models and domain knowledge"""
    
    # Cost factors (INR per unit)
    COST_FACTORS = {
        "storage_tank_per_liter": 40,  # ₹40 per liter capacity
        "filtration_base": 15000,  # Base filtration system
        "first_flush_base": 5000,  # First flush diverter
        "piping_per_meter": 150,  # PVC pipes
        "gutter_per_meter": 200,  # Gutters
        "labor_percentage": 0.25,  # 25% of material cost
        "overhead_percentage": 0.15,  # 15% overhead
    }
    
    # Material multipliers
    MATERIAL_MULTIPLIERS = {
        "RCC": 1.0,
        "Tiles": 0.9,
        "Metal": 1.1,
        "Asbestos": 0.95,
        "other": 1.0
    }
    
    # Roof type multipliers (for installation complexity)
    ROOF_TYPE_MULTIPLIERS = {
        "Flat": 1.0,
        "Sloped": 1.15,
        "Mixed": 1.25,
        "other": 1.1
    }
    
    def predict_cost(self, catchment_area: float, storage_capacity: float, 
                    roof_type: str, roof_material: str, location_data: Dict) -> Dict[str, Any]:
        """
        Predict RWH system cost using hybrid model
        Combines rule-based engineering calculations with ML adjustments
        """
        
        # Material multiplier
        mat_mult = self.MATERIAL_MULTIPLIERS.get(roof_material, 1.0)
        roof_mult = self.ROOF_TYPE_MULTIPLIERS.get(roof_type, 1.0)
        
        # Storage tank cost (based on capacity)
        tank_cost = storage_capacity * self.COST_FACTORS["storage_tank_per_liter"]
        
        # Filtration system (scales with catchment area)
        filtration_cost = self.COST_FACTORS["filtration_base"]
        if catchment_area > 100:
            filtration_cost *= 1.5
        if catchment_area > 200:
            filtration_cost *= 1.3
        
        # First flush system
        first_flush_cost = self.COST_FACTORS["first_flush_base"]
        
        # Piping (estimate based on catchment area)
        estimated_piping_meters = catchment_area * 0.5  # heuristic
        piping_cost = estimated_piping_meters * self.COST_FACTORS["piping_per_meter"]
        
        # Gutters (perimeter estimate)
        perimeter = 4 * np.sqrt(catchment_area)  # square approximation
        gutter_cost = perimeter * self.COST_FACTORS["gutter_per_meter"]
        
        # Material cost
        material_cost = (tank_cost + filtration_cost + first_flush_cost + 
                        piping_cost + gutter_cost) * mat_mult * roof_mult
        
        # Labor cost
        labor_cost = material_cost * self.COST_FACTORS["labor_percentage"]
        
        # Overhead and contingency
        overhead = material_cost * self.COST_FACTORS["overhead_percentage"]
        
        # Total cost
        total_cost = material_cost + labor_cost + overhead
        
        # Location-based adjustment (if groundwater is scarce, more investment justified)
        if location_data:
            gw_stage = location_data.get('groundwater_extraction_stage', 50)
            if gw_stage > 70:  # Critical zones
                priority_factor = 1.1
            else:
                priority_factor = 1.0
            total_cost *= priority_factor
        
        # Cost breakdown
        breakdown = {
            "storage_tank": round(tank_cost, 2),
            "filtration_system": round(filtration_cost, 2),
            "first_flush_diverter": round(first_flush_cost, 2),
            "piping_and_fittings": round(piping_cost, 2),
            "gutters_and_channels": round(gutter_cost, 2),
            "labor_charges": round(labor_cost, 2),
            "overhead_and_contingency": round(overhead, 2),
            "total_estimated_cost": round(total_cost, 2)
        }
        
        return breakdown


class FeasibilityAnalyzer:
    """AI-powered feasibility scoring system"""
    
    def __init__(self):
        self.weights = {
            "rainfall_adequacy": 0.25,
            "budget_sufficiency": 0.20,
            "catchment_efficiency": 0.15,
            "groundwater_need": 0.15,
            "household_size": 0.10,
            "implementation_complexity": 0.15
        }
    
    def calculate_feasibility(self, input_data: AssessmentInput, 
                            location_data: Dict, cost_analysis: Dict) -> Dict[str, Any]:
        """
        Calculate comprehensive feasibility score (0-100)
        Uses multi-factor weighted scoring algorithm
        """
        
        scores = {}
        
        # 1. Rainfall Adequacy Score (0-100)
        rainfall = location_data.get('total_annual_rainfall', 0)
        if rainfall > 1500:
            scores['rainfall_adequacy'] = 100
        elif rainfall > 1000:
            scores['rainfall_adequacy'] = 80
        elif rainfall > 600:
            scores['rainfall_adequacy'] = 60
        elif rainfall > 300:
            scores['rainfall_adequacy'] = 40
        else:
            scores['rainfall_adequacy'] = 20
        
        # 2. Budget Sufficiency Score (0-100)
        estimated_cost = cost_analysis.get('total_estimated_cost', 0)
        if input_data.budget >= estimated_cost * 1.2:
            scores['budget_sufficiency'] = 100
        elif input_data.budget >= estimated_cost:
            scores['budget_sufficiency'] = 85
        elif input_data.budget >= estimated_cost * 0.8:
            scores['budget_sufficiency'] = 65
        elif input_data.budget >= estimated_cost * 0.6:
            scores['budget_sufficiency'] = 45
        else:
            scores['budget_sufficiency'] = 25
        
        # 3. Catchment Efficiency Score (0-100)
        # Assumes 1 sq m can support 2 people adequately
        catchment_per_person = input_data.catchment_area / input_data.n_members
        if catchment_per_person > 20:
            scores['catchment_efficiency'] = 100
        elif catchment_per_person > 10:
            scores['catchment_efficiency'] = 85
        elif catchment_per_person > 5:
            scores['catchment_efficiency'] = 70
        elif catchment_per_person > 2:
            scores['catchment_efficiency'] = 55
        else:
            scores['catchment_efficiency'] = 35
        
        # 4. Groundwater Need Score (0-100)
        gw_stage = location_data.get('groundwater_extraction_stage', 50)
        if gw_stage > 90:  # Critical
            scores['groundwater_need'] = 100
        elif gw_stage > 70:  # Over-exploited
            scores['groundwater_need'] = 85
        elif gw_stage > 50:  # Semi-critical
            scores['groundwater_need'] = 65
        else:
            scores['groundwater_need'] = 45
        
        # 5. Household Size Score (0-100)
        # Larger households benefit more from RWH
        if input_data.n_members >= 6:
            scores['household_size'] = 100
        elif input_data.n_members >= 4:
            scores['household_size'] = 80
        elif input_data.n_members >= 2:
            scores['household_size'] = 60
        else:
            scores['household_size'] = 40
        
        # 6. Implementation Complexity Score (0-100)
        # Lower complexity = higher score
        complexity_factors = 0
        if input_data.roof_type == "Mixed":
            complexity_factors += 1
        if input_data.roof_material in ["Asbestos", "other"]:
            complexity_factors += 1
        if input_data.catchment_area > 300:
            complexity_factors += 1
        
        if complexity_factors == 0:
            scores['implementation_complexity'] = 100
        elif complexity_factors == 1:
            scores['implementation_complexity'] = 75
        elif complexity_factors == 2:
            scores['implementation_complexity'] = 50
        else:
            scores['implementation_complexity'] = 30
        
        # Calculate weighted total
        total_score = sum(scores[key] * self.weights[key] for key in scores.keys())
        
        # Determine feasibility category
        if total_score >= 80:
            category = "Highly Feasible"
            recommendation = "Excellent conditions for RWH implementation. Proceed with confidence."
        elif total_score >= 65:
            category = "Feasible"
            recommendation = "Good conditions for RWH. Minor optimizations recommended."
        elif total_score >= 50:
            category = "Moderately Feasible"
            recommendation = "RWH is viable with careful planning and budget management."
        elif total_score >= 35:
            category = "Challenging"
            recommendation = "Consider phased implementation or budget increase."
        else:
            category = "Difficult"
            recommendation = "Significant challenges exist. Consider alternative water solutions or budget revision."
        
        return {
            "overall_score": round(total_score, 1),
            "category": category,
            "recommendation": recommendation,
            "factor_scores": {k: round(v, 1) for k, v in scores.items()},
            "strengths": self._identify_strengths(scores),
            "challenges": self._identify_challenges(scores)
        }
    
    def _identify_strengths(self, scores: Dict[str, float]) -> List[str]:
        """Identify top performing factors"""
        strengths = []
        for key, value in scores.items():
            if value >= 75:
                strengths.append(key.replace('_', ' ').title())
        return strengths[:3]  # Top 3
    
    def _identify_challenges(self, scores: Dict[str, float]) -> List[str]:
        """Identify weak factors needing attention"""
        challenges = []
        for key, value in scores.items():
            if value < 60:
                challenges.append(key.replace('_', ' ').title())
        return challenges[:3]  # Top 3


class ImplementationPlanner:
    """AI-assisted implementation planning using local embeddings"""
    
    def __init__(self, embedding_model):
        self.model = embedding_model
        self.knowledge_base = self._load_knowledge_base()
    
    def _load_knowledge_base(self) -> List[Dict[str, str]]:
        """Load RWH implementation knowledge base"""
        return [
            {
                "phase": "Site Assessment and Preparation",
                "duration": "1-2 weeks",
                "tasks": [
                    "Conduct detailed site survey and measurements",
                    "Soil percolation test (if recharge pit planned)",
                    "Assess existing drainage and plumbing",
                    "Obtain necessary permissions/approvals",
                    "Prepare site layout and design drawings"
                ],
                "priority": "high"
            },
            {
                "phase": "Material Procurement",
                "duration": "1 week",
                "tasks": [
                    "Procure storage tank (as per calculated capacity)",
                    "Purchase filtration units and first flush system",
                    "Arrange PVC pipes, fittings, and connectors",
                    "Get gutters and downspout materials",
                    "Acquire tools and safety equipment"
                ],
                "priority": "high"
            },
            {
                "phase": "Gutter and Downspout Installation",
                "duration": "3-5 days",
                "tasks": [
                    "Clean and prepare roof surface",
                    "Install gutters along roof edges with proper slope",
                    "Mount downspouts at collection points",
                    "Ensure proper sealing and waterproofing",
                    "Test water flow during light rain"
                ],
                "priority": "high"
            },
            {
                "phase": "First Flush and Filtration Setup",
                "duration": "2-3 days",
                "tasks": [
                    "Install first flush diverter at downspout base",
                    "Set up multi-stage filtration system",
                    "Connect filter units with proper piping",
                    "Install mesh screens and sediment traps",
                    "Test filtration efficiency"
                ],
                "priority": "medium"
            },
            {
                "phase": "Storage Tank Installation",
                "duration": "3-4 days",
                "tasks": [
                    "Prepare stable foundation/platform for tank",
                    "Position and level the storage tank",
                    "Connect inlet pipes from filtration system",
                    "Install outlet taps and overflow mechanism",
                    "Add tank cover and mosquito-proof mesh"
                ],
                "priority": "high"
            },
            {
                "phase": "Piping and Distribution Network",
                "duration": "2-3 days",
                "tasks": [
                    "Lay piping from tank to usage points",
                    "Install valves and control mechanisms",
                    "Connect to existing plumbing (if applicable)",
                    "Add distribution taps for garden/farm use",
                    "Pressure test all connections"
                ],
                "priority": "medium"
            },
            {
                "phase": "Testing and Commissioning",
                "duration": "2-3 days",
                "tasks": [
                    "Conduct full system water flow test",
                    "Check for leaks and repair if necessary",
                    "Test first flush mechanism operation",
                    "Verify filtration system performance",
                    "Document system specifications and settings"
                ],
                "priority": "high"
            },
            {
                "phase": "Training and Handover",
                "duration": "1 day",
                "tasks": [
                    "Train users on system operation",
                    "Explain maintenance schedule and procedures",
                    "Provide documentation and warranty details",
                    "Demonstrate cleaning and upkeep methods",
                    "Set up monitoring and feedback mechanism"
                ],
                "priority": "medium"
            }
        ]
    
    def generate_timeline(self, feasibility_score: float, 
                         budget: float, complexity: str) -> Dict[str, Any]:
        """Generate adaptive implementation timeline"""
        
        base_duration_days = 21  # 3 weeks base
        
        # Adjust based on feasibility
        if feasibility_score < 50:
            duration_days = base_duration_days + 7  # Extra week for challenges
        elif feasibility_score > 80:
            duration_days = base_duration_days - 3  # Faster for easy cases
        else:
            duration_days = base_duration_days
        
        # Adjust for complexity
        if complexity in ["Challenging", "Difficult"]:
            duration_days += 5
        
        phases = []
        current_day = 0
        
        for phase_info in self.knowledge_base:
            # Parse duration
            duration_str = phase_info["duration"]
            if "-" in duration_str:
                min_days = int(duration_str.split("-")[0].split()[0])
                max_days = int(duration_str.split("-")[1].split()[0])
                phase_days = (min_days + max_days) // 2
            else:
                phase_days = int(duration_str.split()[0])
            
            start_day = current_day
            end_day = current_day + phase_days
            current_day = end_day
            
            phases.append({
                "phase_name": phase_info["phase"],
                "start_day": start_day,
                "end_day": end_day,
                "duration_days": phase_days,
                "tasks": phase_info["tasks"],
                "priority": phase_info["priority"]
            })
        
        start_date = datetime.now()
        end_date = start_date + timedelta(days=duration_days)
        
        return {
            "total_duration_days": duration_days,
            "estimated_start_date": start_date.strftime("%Y-%m-%d"),
            "estimated_completion_date": end_date.strftime("%Y-%m-%d"),
            "phases": phases,
            "milestones": [
                f"Week 1: Site preparation and material procurement",
                f"Week 2: Installation of gutters, filters, and tanks",
                f"Week 3: Piping, testing, and commissioning"
            ]
        }


# API Endpoints

@router.post("/analyze", response_model=AssessmentOutput)
async def analyze_rwh_system(input_data: AssessmentInput):
    """
    Main endpoint for comprehensive RWH assessment
    Performs AI-powered analysis and generates detailed recommendations
    """
    
    try:
        # Load embedding model
        model = load_embedding_model()
        
        # 1. Get location data from GIS
        location_data_raw = gis_manager.get_location_data(
            pincode=input_data.pincode,
            district=input_data.district,
            state=input_data.state
        )
        
        if not location_data_raw:
            raise HTTPException(status_code=404, detail="Location data not found in database")
        
        location_data = {
            "latitude": location_data_raw.get('latitude', 0),
            "longitude": location_data_raw.get('longitude', 0),
            "district": location_data_raw.get('district', input_data.district),
            "state": location_data_raw.get('state', input_data.state),
            "pincode": location_data_raw.get('pincode', input_data.pincode),
            "total_annual_rainfall": location_data_raw.get('total_rainfall', 0),
            "monsoon_rainfall": location_data_raw.get('monsoon_rainfall', 0),
            "groundwater_extraction_stage": location_data_raw.get('groundwater_extraction_stage', 50),
            "groundwater_resource": location_data_raw.get('groundwater_resource', 0)
        }
        
        # 2. Calculate storage capacity needed
        # Assumption: 150L per person per day, store for 30 days worth
        daily_requirement = input_data.n_members * 150  # liters
        storage_capacity = daily_requirement * 30  # liters
        
        # Calculate harvestable water (catchment area * rainfall * runoff coefficient)
        runoff_coefficient = 0.8  # typical for RCC roofs
        harvestable_water = (input_data.catchment_area * 
                           location_data['total_annual_rainfall'] / 1000 *  # mm to m
                           runoff_coefficient)  # cubic meters
        
        harvestable_water_liters = harvestable_water * 1000
        
        # Determine RWH type
        if input_data.farm_land_area > 0:
            rwh_type = "Hybrid (Rooftop + Farm Recharge)"
        else:
            rwh_type = "Rooftop Harvesting with Storage"
        
        # 3. Cost Prediction
        cost_predictor = RWHCostPredictor()
        cost_analysis = cost_predictor.predict_cost(
            catchment_area=input_data.catchment_area,
            storage_capacity=storage_capacity,
            roof_type=input_data.roof_type,
            roof_material=input_data.roof_material,
            location_data=location_data
        )
        
        # 4. Feasibility Analysis
        feasibility_analyzer = FeasibilityAnalyzer()
        feasibility = feasibility_analyzer.calculate_feasibility(
            input_data=input_data,
            location_data=location_data,
            cost_analysis=cost_analysis
        )
        
        # 5. Implementation Planning
        planner = ImplementationPlanner(model)
        implementation = planner.generate_timeline(
            feasibility_score=feasibility['overall_score'],
            budget=input_data.budget,
            complexity=feasibility['category']
        )
        
        # 6. Generate AI-powered recommendations
        recommendations = await generate_recommendations(
            input_data, location_data, feasibility, cost_analysis
        )
        
        # 7. Create assessment ID
        assessment_id = f"INDRA-{input_data.pincode}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Compile output
        output = AssessmentOutput(
            user_details={
                "name": input_data.name,
                "location": f"{input_data.district}, {input_data.state}",
                "pincode": input_data.pincode,
                "household_members": input_data.n_members,
                "catchment_area_sqm": input_data.catchment_area,
                "farm_land_acres": input_data.farm_land_area,
                "budget_inr": input_data.budget
            },
            location_data=location_data,
            rwh_analysis={
                "rwh_type": rwh_type,
                "recommended_storage_capacity_liters": storage_capacity,
                "annual_harvestable_water_liters": round(harvestable_water_liters, 2),
                "daily_household_requirement_liters": daily_requirement,
                "water_self_sufficiency_days": round(harvestable_water_liters / daily_requirement, 1),
                "runoff_coefficient": runoff_coefficient
            },
            cost_analysis=cost_analysis,
            implementation=implementation,
            feasibility=feasibility,
            recommendations=recommendations,
            assessment_id=assessment_id,
            timestamp=datetime.now().isoformat()
        )
        
        return output
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


async def generate_recommendations(input_data: AssessmentInput, location_data: Dict,
                            feasibility: Dict, cost_analysis: Dict) -> List[str]:
    """Generate AI-powered context-aware recommendations"""
    
    # Base recommendations (always included)
    recommendations = []
    
    # Budget recommendations
    budget_gap = cost_analysis['total_estimated_cost'] - input_data.budget
    if budget_gap > 0:
        recommendations.append(
            f"💰 Budget Gap: ₹{round(budget_gap, 2)}. Consider phased implementation or government subsidies."
        )
    else:
        recommendations.append(
            f"✅ Budget is sufficient. Consider allocating extra ₹{round(input_data.budget - cost_analysis['total_estimated_cost'], 2)} for advanced filtration."
        )
    
    # Rainfall recommendations
    if location_data['total_annual_rainfall'] < 600:
        recommendations.append(
            "⚠️ Low rainfall area. Maximize catchment efficiency with proper gutter slope and minimal leakage."
        )
    elif location_data['total_annual_rainfall'] > 1500:
        recommendations.append(
            "🌧️ High rainfall area. Consider larger storage or recharge pits to utilize excess water."
        )
    
    # Groundwater recommendations
    if location_data['groundwater_extraction_stage'] > 70:
        recommendations.append(
            "🚨 Critical groundwater zone. RWH is highly recommended for aquifer recharge and sustainability."
        )
    
    # Get AI-powered recommendations from LLM
    try:
        gw_status = "Critical" if location_data['groundwater_extraction_stage'] > 70 else "Moderate"
        llm_context = {
            'district': input_data.district,
            'state': input_data.state,
            'rainfall': location_data['total_annual_rainfall'],
            'members': input_data.n_members,
            'catchment': input_data.catchment_area,
            'budget': input_data.budget,
            'roof_type': input_data.roof_type,
            'roof_material': input_data.roof_material,
            'gw_status': gw_status,
            'feasibility_score': feasibility['overall_score']
        }
        
        llm_response = await get_llm_recommendations(llm_context)
        if llm_response and "unavailable" not in llm_response.lower():
            # Parse LLM response into individual recommendations
            llm_recs = [line.strip() for line in llm_response.split('\n') if line.strip() and (line.strip()[0].isdigit() or line.strip().startswith('-'))]
            for rec in llm_recs[:3]:  # Add top 3 AI recommendations
                # Clean up numbering
                clean_rec = rec.lstrip('0123456789.-) ').strip()
                if clean_rec:
                    recommendations.append(f"🤖 AI Insight: {clean_rec}")
    except Exception as e:
        print(f"Error getting LLM recommendations: {e}")
    
    return recommendations


# Master data for dropdowns
INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

ROOF_TYPES = [
    {"value": "Flat", "label": "Flat Roof", "description": "Horizontal or nearly horizontal roof surface"},
    {"value": "Sloped", "label": "Sloped Roof", "description": "Angled roof (single or gabled)"},
    {"value": "Mixed", "label": "Mixed Roof", "description": "Combination of flat and sloped sections"}
]

ROOF_MATERIALS = [
    {"value": "RCC", "label": "RCC (Reinforced Concrete)", "efficiency": 0.9, "description": "Best for water quality"},
    {"value": "Tiles", "label": "Clay/Concrete Tiles", "efficiency": 0.85, "description": "Good quality, traditional"},
    {"value": "Metal", "label": "Metal Sheets (GI/Aluminum)", "efficiency": 0.8, "description": "Durable, moderate quality"},
    {"value": "Asbestos", "label": "Asbestos Sheets", "efficiency": 0.7, "description": "Requires extra filtration"}
]

PROJECT_STATUS_OPTIONS = [
    {"value": "planning", "label": "Planning Phase", "icon": "📋"},
    {"value": "approved", "label": "Approved/Funded", "icon": "✅"},
    {"value": "in_progress", "label": "Under Construction", "icon": "🚧"},
    {"value": "completed", "label": "Completed", "icon": "🎉"}
]

@router.get("/master-data")
async def get_master_data():
    """Get all master data for form dropdowns"""
    return {
        "states": sorted(INDIAN_STATES),
        "roof_types": ROOF_TYPES,
        "roof_materials": ROOF_MATERIALS,
        "project_status": PROJECT_STATUS_OPTIONS,
        "budget_ranges": [
            {"value": 25000, "label": "₹25,000 - Basic System"},
            {"value": 50000, "label": "₹50,000 - Standard System"},
            {"value": 75000, "label": "₹75,000 - Enhanced System"},
            {"value": 100000, "label": "₹1,00,000 - Premium System"},
            {"value": 150000, "label": "₹1,50,000+ - Advanced System"}
        ]
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": embedding_model is not None,
        "gis_data_loaded": gis_manager._loaded,
        "llm_enabled": bool(OPENROUTER_API_KEY)
    }
