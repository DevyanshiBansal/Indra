# INDRA Vendor Connect & DIY Guide

Complete implementation of the Vendor Search and DIY Guide feature for Rainwater Harvesting (RWH) implementation and maintenance.

## Features Implemented

### Backend (`vendor.py`)
1. **Multi-Category Vendor Search**
   - Local Hardware/Plumbing Stores
   - Mechanics & Contractors
   - Component Suppliers
   - Online Stores
   - Service Providers

2. **Smart Sorting Algorithm**
   - Sorts by Rating (descending)
   - Then by Distance (ascending)
   - Then by Price Range

3. **Comprehensive DIY Guide**
   - 10 detailed installation steps
   - Materials list with specifications
   - Cost estimation (₹15,000 - ₹30,000)
   - Time estimation (2-3 days)
   - Difficulty level (Intermediate)

4. **Additional Resources**
   - Cost-saving tips
   - Common mistakes to avoid
   - Safety guidelines
   - Optimization tips

### Frontend (`VendorConnectPage.tsx`)
1. **Search Interface**
   - Location-based search
   - Category filtering (All, Stores, Mechanics, Components, Online, Services)
   - Real-time results

2. **Vendor Display**
   - Categorized listings with icons
   - Rating display (1-5 stars)
   - Distance from user
   - Price range indicators (₹, ₹₹, ₹₹₹)
   - Contact information (phone, website)
   - One-click connect buttons

3. **DIY Section**
   - Expandable/collapsible interface
   - Overview cards (Difficulty, Time, Cost)
   - Expandable step-by-step instructions
   - Materials checklist
   - Tips organized by category

## API Endpoints

### 1. Search Vendors
```
GET /api/vendors/search
```

**Query Parameters:**
- `location` (required): User's city/area (e.g., "Delhi", "Mumbai")
- `search_type` (optional): "all", "stores", "mechanics", "components", "online", "services"
- `lat` (optional): User latitude for distance calculation
- `lon` (optional): User longitude for distance calculation

**Response:**
```json
{
  "success": true,
  "location": "Delhi",
  "timestamp": "2025-12-22T...",
  "results": {
    "stores": [...],
    "mechanics": [...],
    "components": [...],
    "online_stores": [...],
    "service_providers": [...]
  }
}
```

### 2. Get DIY Guide
```
GET /api/vendors/diy-guide
```

**Response:**
```json
{
  "success": true,
  "guide": {
    "title": "DIY Rainwater Harvesting System Installation",
    "difficulty": "Intermediate",
    "estimated_time": "2-3 days",
    "estimated_cost": "₹15,000 - ₹30,000",
    "materials_needed": [...],
    "steps": [...]
  },
  "tips": {
    "cost_saving_tips": [...],
    "common_mistakes": [...],
    "safety_tips": [...],
    "optimization_tips": [...]
  }
}
```

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Activate virtual environment (if not already active):**
   ```powershell
   & D:\Hackathon\IITD_INDRA\.venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```powershell
   python main.py
   ```

   Server will run on: `http://localhost:8000`

5. **Test the API:**
   - Health check: http://localhost:8000/health
   - API docs: http://localhost:8000/docs
   - Search vendors: http://localhost:8000/api/vendors/search?location=Delhi
   - DIY guide: http://localhost:8000/api/vendors/diy-guide

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd frontend
   ```

2. **Install dependencies (if not already done):**
   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm run dev
   ```

   Frontend will run on: `http://localhost:5173`

4. **Navigate to Vendor Connect:**
   - Go to the Vendor Connect page in the Urban mode
   - Enter a location (e.g., "Delhi", "Mumbai", "Bangalore")
   - Click "Search Vendors"
   - Browse results by category
   - Expand the DIY Guide section for installation instructions

## Usage Guide

### For Users

1. **Finding Vendors:**
   - Enter your city/location in the search box
   - Select "All Categories" or filter by specific type
   - Browse vendors sorted by rating and distance
   - Click "Connect Now" to call or visit website

2. **Category Filters:**
   - **Local Stores**: Hardware stores with RWH materials
   - **Mechanics & Contractors**: Installation specialists
   - **Component Suppliers**: Specific parts (filters, tanks, pipes)
   - **Online Stores**: E-commerce platforms
   - **Service Providers**: Consultation and maintenance

3. **DIY Installation:**
   - Click "DIY Rainwater Harvesting Guide"
   - Review overview (difficulty, time, cost)
   - Check materials needed
   - Follow step-by-step instructions
   - Read tips for better implementation

### Vendor Information Displayed

Each vendor card shows:
- **Name**: Business name
- **Rating**: 1-5 star rating
- **Description**: Services/products offered
- **Location**: Address with distance in km
- **Contact**: Phone number
- **Website**: Link to business website
- **Price Range**: Budget indicator (₹/₹₹/₹₹₹)

## Technical Architecture

### Backend Architecture

```
backend/
├── vendor.py          # Main vendor search logic
├── main.py           # FastAPI application & routes
└── requirements.txt  # Python dependencies
```

**Key Components:**
- `VendorResult`: Pydantic model for vendor data
- `DIYGuide`: Pydantic model for DIY instructions
- `VendorSearchService`: Service class with search & sort logic
- FastAPI endpoints with async handlers

**Sorting Algorithm:**
```python
def sort_key(vendor):
    rating_score = -(vendor.rating or 0)      # Higher is better
    distance_score = vendor.distance or 999   # Lower is better
    price_score = price_map[vendor.price_range]
    return (rating_score, distance_score, price_score)
```

### Frontend Architecture

**Component Structure:**
- Location search input
- Category filter buttons
- DIY guide (expandable)
- Vendor cards (categorized)

**State Management:**
- `vendors`: Object with categorized vendor arrays
- `diyGuide`: DIY installation guide
- `locationInput`: User's search location
- `activeCategory`: Selected filter
- `showDIY`: DIY section visibility
- `expandedStep`: Currently expanded step

**API Integration:**
- Fetch vendors on location search
- Load DIY guide on mount
- Error handling for network issues

## Future Enhancements

### Planned Features

1. **Real Web Scraping**
   - Integrate with Google Maps API
   - Scrape JustDial, IndiaMART
   - Real-time data updates

2. **Geolocation**
   - Auto-detect user location
   - Calculate accurate distances
   - Map view with vendor pins

3. **User Reviews**
   - Allow users to rate vendors
   - Add reviews and photos
   - Verified purchase badges

4. **Advanced Filtering**
   - Price range slider
   - Availability status
   - Certification filters
   - Language preferences

5. **Booking System**
   - Schedule consultations
   - Request quotes
   - Track service requests

6. **Vendor Dashboard**
   - Vendor registration
   - Profile management
   - Lead management

## Color Scheme

Following INDRA brand guidelines:
- **Primary Blue**: `#0676c8ff` - Buttons, headers, icons
- **Secondary Green**: `#32a854` - Success states, eco-features
- **Rating Gold**: `#FFD700` - Star ratings

## Dependencies

### Backend
- `fastapi==0.104.1` - Web framework
- `uvicorn==0.24.0` - ASGI server
- `pydantic==2.5.0` - Data validation
- `aiohttp==3.9.1` - Async HTTP client
- `beautifulsoup4==4.12.2` - Web scraping

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- Lucide React (icons)

## Testing

### Backend Tests
```powershell
# Test vendor search
curl "http://localhost:8000/api/vendors/search?location=Delhi"

# Test DIY guide
curl "http://localhost:8000/api/vendors/diy-guide"
```

### Frontend Tests
1. Search with different locations
2. Filter by each category
3. Test DIY guide expansion
4. Test "Connect Now" buttons
5. Verify responsive design

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Module not found:**
```powershell
pip install -r requirements.txt
```

### Frontend Issues

**CORS errors:**
- Ensure backend is running on port 8000
- Check CORS configuration in main.py

**No vendors displayed:**
- Check browser console for errors
- Verify backend API is responding
- Check network tab for 200 responses

## Contact & Support

For issues or questions:
- Check backend logs in terminal
- Check browser console for errors
- Verify both servers are running
- Review API documentation at http://localhost:8000/docs

---

**Built for INDRA - Initiative for Drainage and Rainwater Acquisition**

Making rainwater harvesting accessible through technology and community support.
