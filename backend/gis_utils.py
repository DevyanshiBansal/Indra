"""
GIS Data Utility Module
Handles CSV-based GIS data with efficient search and sort algorithms
Provides location-based data for crop and water management recommendations
"""

import pandas as pd
from typing import Optional, Dict, List, Any
from pathlib import Path

# GIS Data File Path
GIS_DATA_PATH = "D:\Hackathon\IITD_INDRA\INDRA_Processed_Data.csv"


class GISDataManager:
    """Manages GIS data with efficient search and retrieval"""
    
    def __init__(self):
        self.data = None
        self._loaded = False
    
    def load_data(self):
        """Load GIS data from CSV"""
        if self._loaded:
            return True
        
        try:
            csv_path = Path(GIS_DATA_PATH)
            if not csv_path.exists():
                print(f"Warning: GIS data file not found at {GIS_DATA_PATH}")
                return False
            
            self.data = pd.read_csv(GIS_DATA_PATH, low_memory=False)
            self._loaded = True
            print(f"GIS Data loaded: {len(self.data)} records")
            return True
        except Exception as e:
            print(f"Error loading GIS data: {e}")
            return False
    
    def get_location_data(self, pincode: Optional[str] = None, 
                         district: Optional[str] = None,
                         state: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get GIS data for a location using hierarchical search
        Priority: Pincode > District > State
        """
        if not self._loaded:
            if not self.load_data():
                return None
        
        try:
            df = self.data
            
            # Search by pincode (highest priority)
            if pincode:
                result = df[df['pincode'].astype(str).str.contains(str(pincode), na=False)]
                if not result.empty:
                    return self._aggregate_location_data(result)
            
            # Search by district
            if district:
                result = df[df['District'].str.contains(district, case=False, na=False)]
                if not result.empty:
                    return self._aggregate_location_data(result)
            
            # Search by state
            if state:
                result = df[df['State'].str.contains(state, case=False, na=False)]
                if not result.empty:
                    return self._aggregate_location_data(result)
            
            return None
            
        except Exception as e:
            print(f"Error retrieving location data: {e}")
            return None
    
    def _aggregate_location_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Aggregate data from multiple rows for a location"""
        try:
            # Take first row for location details
            first_row = df.iloc[0]
            
            # Aggregate rainfall data (mean across multiple entries)
            monsoon_rainfall = df['Monsoon (Jun-Sep)'].mean() if 'Monsoon (Jun-Sep)' in df.columns else 0
            post_monsoon = df['Post-Monsoon (Oct-Dec)'].mean() if 'Post-Monsoon (Oct-Dec)' in df.columns else 0
            summer_rainfall = df['Summer/Pre-Monsoon (Mar-May)'].mean() if 'Summer/Pre-Monsoon (Mar-May)' in df.columns else 0
            winter_rainfall = df['Winter (Jan-Feb)'].mean() if 'Winter (Jan-Feb)' in df.columns else 0
            total_rainfall = df['Total Annual Rainfall (mm)'].mean() if 'Total Annual Rainfall (mm)' in df.columns else 0
            
            # Ground water data
            gw_recharge = df['Total Annual Ground Water Recharge (in BCM)'].mean() if 'Total Annual Ground Water Recharge (in BCM)' in df.columns else 0
            gw_resource = df['Annual Extractable Ground Water Resource (in BCM)'].mean() if 'Annual Extractable Ground Water Resource (in BCM)' in df.columns else 0
            gw_extraction = df['Current Annual Ground Water Extraction (in BCM) - Total'].mean() if 'Current Annual Ground Water Extraction (in BCM) - Total' in df.columns else 0
            gw_stage = df['Stage of Ground Water Extraction (%)'].mean() if 'Stage of Ground Water Extraction (%)' in df.columns else 0
            
            return {
                'pincode': str(first_row.get('pincode', '')),
                'district': str(first_row.get('District', '')),
                'state': str(first_row.get('State', '')),
                'latitude': float(first_row.get('latitude', 0)) if pd.notna(first_row.get('latitude')) else None,
                'longitude': float(first_row.get('longitude', 0)) if pd.notna(first_row.get('longitude')) else None,
                'rainfall': {
                    'monsoon': float(monsoon_rainfall) if pd.notna(monsoon_rainfall) else 0,
                    'post_monsoon': float(post_monsoon) if pd.notna(post_monsoon) else 0,
                    'summer': float(summer_rainfall) if pd.notna(summer_rainfall) else 0,
                    'winter': float(winter_rainfall) if pd.notna(winter_rainfall) else 0,
                    'total_annual': float(total_rainfall) if pd.notna(total_rainfall) else 0
                },
                'groundwater': {
                    'recharge_bcm': float(gw_recharge) if pd.notna(gw_recharge) else 0,
                    'resource_bcm': float(gw_resource) if pd.notna(gw_resource) else 0,
                    'extraction_bcm': float(gw_extraction) if pd.notna(gw_extraction) else 0,
                    'extraction_percentage': float(gw_stage) if pd.notna(gw_stage) else 0
                }
            }
        except Exception as e:
            print(f"Error aggregating location data: {e}")
            return None
    
    def get_nearby_districts(self, district: str, limit: int = 5) -> List[str]:
        """Get nearby districts (simple text similarity for now)"""
        if not self._loaded:
            if not self.load_data():
                return []
        
        try:
            all_districts = self.data['District'].dropna().unique()
            # Simple contains-based search
            nearby = [d for d in all_districts if district.lower() in d.lower() or d.lower() in district.lower()]
            return nearby[:limit]
        except:
            return []
    
    def get_water_stress_level(self, location_data: Dict[str, Any]) -> str:
        """Determine water stress level based on groundwater extraction"""
        try:
            extraction_pct = location_data.get('groundwater', {}).get('extraction_percentage', 0)
            
            if extraction_pct < 0 or extraction_pct > 100:
                return "Data Unavailable"
            elif extraction_pct < 70:
                return "Safe"
            elif extraction_pct < 90:
                return "Semi-Critical"
            elif extraction_pct < 100:
                return "Critical"
            else:
                return "Over-Exploited"
        except:
            return "Unknown"


# Singleton instance
gis_manager = GISDataManager()
