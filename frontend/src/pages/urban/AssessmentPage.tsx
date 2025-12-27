import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, MapPin, Home, IndianRupee,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  Calendar, Save, LogIn, Clock,
  CloudRain, Layers, Wrench, ChevronRight,
  Wallet, Settings, ArrowLeft, Users, Maximize2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createAssessment, updateUserProfile } from '../../lib/firestore';

interface AssessmentResult {
  assessment_id: string;
  user_details: any;
  location_data: any;
  rwh_analysis: any;
  cost_analysis: any;
  implementation: any;
  feasibility: any;
  recommendations: string[];
  timestamp: string;
}

// Water Fill Circle Animation Component
function WaterFillScore({ score, size = 180 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 65) return '#0676c8';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getGradient = (s: number) => {
    if (s >= 80) return 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)';
    if (s >= 65) return 'linear-gradient(180deg, #0676c8 0%, #0284c7 100%)';
    if (s >= 50) return 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
    return 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Gradient background header */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: getGradient(score) }}
      />

      {/* White wave cutout effect */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <defs>
          <clipPath id="waveClip">
            <path d="M0 60 Q25 50, 50 60 T100 60 V100 H0 Z">
              <animate
                attributeName="d"
                values="M0 60 Q25 50, 50 60 T100 60 V100 H0 Z;M0 60 Q25 70, 50 60 T100 60 V100 H0 Z;M0 60 Q25 50, 50 60 T100 60 V100 H0 Z"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="48" fill="white" clipPath="url(#waveClip)" />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white">{animatedScore}%</span>
        <span className="text-white/80 text-sm mt-1">Feasibility</span>
      </div>
    </div>
  );
}

export function AssessmentPage() {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedPincode, setEditedPincode] = useState('');
  const [editedBudget, setEditedBudget] = useState(10000);
  const [savingProfile, setSavingProfile] = useState(false);

  // Initialize edit values from profile
  useEffect(() => {
    if (userProfile) {
      setEditedPincode(userProfile.pincode || '');
      setEditedBudget(userProfile.budget || 10000);
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!user || !editedPincode || editedPincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile(user.uid, {
        pincode: editedPincode,
        budget: editedBudget
      });
      await refreshUserProfile();
      setIsEditingProfile(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      setError('Please login to perform an assessment');
      return;
    }

    if (!userProfile.pincode || userProfile.pincode.length !== 6) {
      setError('Please set your pincode in profile settings first');
      setIsEditingProfile(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSavedToDb(false);

    try {
      const assessmentPayload = {
        name: userProfile.name,
        state: userProfile.state,
        district: userProfile.district,
        pincode: userProfile.pincode,
        n_members: userProfile.n_members,
        catchment_area: userProfile.catchment_area,
        farm_land_area: userProfile.farmland_area || 0,
        roof_type: userProfile.roof_type,
        roof_material: userProfile.roof_material,
        budget: userProfile.budget,
        project_status: 'planning'
      };

      const response = await fetch('http://localhost:8000/api/assessment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentPayload),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        await saveResultToDatabase(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || 'Assessment failed. Please check your pincode and try again.');
      }
    } catch (err) {
      console.error('Assessment error:', err);
      setError('Failed to connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const saveResultToDatabase = async (assessmentResult: AssessmentResult) => {
    if (!user || !userProfile) return;

    setSavingToDb(true);
    try {
      await createAssessment({
        userId: user.uid,
        name: userProfile.name,
        state: userProfile.state,
        district: userProfile.district,
        pincode: userProfile.pincode,
        n_members: userProfile.n_members,
        catchment_area: userProfile.catchment_area,
        farmland_area: userProfile.farmland_area || 0,
        roof_type: userProfile.roof_type,
        roof_material: userProfile.roof_material,
        budget: userProfile.budget,
        latitude: assessmentResult.location_data?.latitude || null,
        longitude: assessmentResult.location_data?.longitude || null,
        rwh_type: assessmentResult.rwh_analysis?.rwh_type || '',
        avg_rainfall: assessmentResult.location_data?.total_annual_rainfall || 0,
        cost: assessmentResult.cost_analysis?.total_estimated_cost || 0,
        project_status: 1,
        feasibility_score: assessmentResult.feasibility?.overall_score || 0,
        annual_harvestable_water: assessmentResult.rwh_analysis?.annual_harvestable_water_liters || 0,
        recommended_storage_capacity: assessmentResult.rwh_analysis?.recommended_storage_capacity_liters || 0,
        water_self_sufficiency_days: assessmentResult.rwh_analysis?.water_self_sufficiency_days || 0,
        recommendations: assessmentResult.recommendations || []
      });
      setSavedToDb(true);
    } catch (err) {
      console.error('Error saving to database:', err);
    } finally {
      setSavingToDb(false);
    }
  };

  // Login Required Screen
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#e6f2fa' }}>
            <LogIn className="w-10 h-10" style={{ color: '#0676c8' }} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#0676c8' }}>
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            Create an account with your location and property details to get a personalized RWH assessment.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: '#0676c8' }}
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (result) {
    return (
      <AssessmentResults
        result={result}
        userProfile={userProfile}
        onBack={() => { setResult(null); setSavedToDb(false); }}
        savedToDb={savedToDb}
        savingToDb={savingToDb}
        onSave={() => saveResultToDatabase(result)}
      />
    );
  }

  // Main Assessment Form - Matching Android App Design
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0676c8' }} className="pt-4 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">New Assessment</h1>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#e6f2fa' }}
              >
                <MapPin className="w-6 h-6" style={{ color: '#0676c8' }} />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-sm">Location</p>
                <p className="font-semibold text-gray-800">
                  {userProfile.district || 'Set Location'}, {userProfile.state || 'India'}
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-2">
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          {/* Property Name */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl">
            <Home className="w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Property Name"
              value={userProfile.name || ''}
              readOnly
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Two Column Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl">
              <Users className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <span className="text-gray-700">{userProfile.n_members || 4}</span>
                <span className="text-gray-400 text-sm ml-1">Dwellers</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl">
              <Maximize2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <span className="text-gray-700">{userProfile.catchment_area || 100}</span>
                <span className="text-gray-400 text-sm ml-1">Roof (sqm)</span>
              </div>
            </div>
          </div>

          {/* Open Space */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl">
            <Layers className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <span className="text-gray-700">{userProfile.farmland_area || 0}</span>
              <span className="text-gray-400 text-sm ml-1">Open Space (sqm)</span>
            </div>
          </div>

          {/* Roof Material Selection */}
          <div>
            <p className="font-semibold text-gray-800 mb-3">Roof Material</p>
            <div className="flex flex-wrap gap-3">
              {['Concrete', 'Tile', 'Metal', 'Asbestos'].map((material) => (
                <button
                  key={material}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${userProfile.roof_material === material
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  style={userProfile.roof_material === material ? { backgroundColor: '#0676c8' } : {}}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          {/* Edit Profile Modal */}
          {isEditingProfile && (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" style={{ color: '#0676c8' }} />
                Edit Settings
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={editedPincode}
                    onChange={(e) => setEditedPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="6-digit pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget: ₹{editedBudget.toLocaleString('en-IN')}
                  </label>
                  <input
                    type="range"
                    min={500}
                    max={20000}
                    step={500}
                    value={editedBudget}
                    onChange={(e) => setEditedBudget(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#0676c8' }}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2"
                  style={{ backgroundColor: '#32a854' }}
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !userProfile.pincode}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
            style={{ backgroundColor: '#0676c8' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Start Analysis
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {!userProfile.pincode && (
            <p className="text-center text-amber-600 text-sm font-medium flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Set your pincode to enable assessment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ProfileCard({ icon: Icon, label, value, highlight }: {
  icon: any; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
      <Icon className="w-5 h-5 mb-2" style={{ color: highlight ? '#f59e0b' : '#0676c8' }} />
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, description, color }: {
  icon: any; title: string; description: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <Icon className="w-6 h-6 mb-2" style={{ color }} />
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

// ==================== RESULTS COMPONENT ====================
interface AssessmentResultsProps {
  result: AssessmentResult;
  userProfile: any;
  onBack: () => void;
  savedToDb: boolean;
  savingToDb: boolean;
  onSave: () => void;
}

function AssessmentResults({ result, userProfile, onBack, savedToDb, savingToDb, onSave }: AssessmentResultsProps) {
  const { feasibility, cost_analysis, rwh_analysis, implementation, recommendations, location_data } = result;
  const navigate = useNavigate();

  const getFeasibilityColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 65) return '#0676c8';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getGradient = (score: number) => {
    if (score >= 80) return 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)';
    if (score >= 65) return 'linear-gradient(180deg, #0676c8 0%, #0284c7 100%)';
    if (score >= 50) return 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
    return 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
  };

  const score = feasibility?.overall_score || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Dynamic Color Header based on Score */}
      <div
        className="pt-4 pb-32 px-4"
        style={{ background: getGradient(score) }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Report Details</h1>
            <div className="w-10" />
          </div>

          {/* Score Circle - Centered */}
          <div className="flex justify-center">
            <div className="relative w-44 h-44">
              {/* White background circle */}
              <div className="absolute inset-0 rounded-full bg-white shadow-xl" />

              {/* Wave animation */}
              <svg className="absolute inset-0 w-full h-full rounded-full overflow-hidden" viewBox="0 0 100 100">
                <defs>
                  <clipPath id="circleClip">
                    <circle cx="50" cy="50" r="48" />
                  </clipPath>
                </defs>
                <g clipPath="url(#circleClip)">
                  <rect x="0" y={100 - score} width="100" height={score} fill={getFeasibilityColor(score)} opacity="0.2" />
                  <path
                    d={`M0 ${100 - score + 5} Q25 ${100 - score - 5}, 50 ${100 - score + 5} T100 ${100 - score + 5} V100 H0 Z`}
                    fill={getFeasibilityColor(score)}
                    opacity="0.4"
                  >
                    <animate
                      attributeName="d"
                      values={`M0 ${100 - score + 5} Q25 ${100 - score - 5}, 50 ${100 - score + 5} T100 ${100 - score + 5} V100 H0 Z;M0 ${100 - score + 5} Q25 ${100 - score + 10}, 50 ${100 - score + 5} T100 ${100 - score + 5} V100 H0 Z;M0 ${100 - score + 5} Q25 ${100 - score - 5}, 50 ${100 - score + 5} T100 ${100 - score + 5} V100 H0 Z`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              </svg>

              {/* Score Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-5xl font-bold"
                  style={{ color: getFeasibilityColor(score) }}
                >
                  {score}%
                </span>
                <span className="text-gray-500 text-sm">Feasibility</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-8 space-y-4">
        {/* Description Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <p className="text-gray-600 text-center">
            {feasibility?.recommendation || `Score is primarily driven by ${score >= 50 ? 'favorable' : 'challenging'} rainfall patterns and ${score >= 50 ? 'good' : 'limited'} soil permeability. The groundwater level at ${location_data?.groundwater_level || '24.47'}m is ${score >= 50 ? 'ideal' : 'not ideal'} for recharge.`}
          </p>
        </div>

        {/* Harvesting Potential Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f2fa' }}>
              <Droplets className="w-5 h-5" style={{ color: '#0676c8' }} />
            </div>
            <h3 className="font-bold text-gray-800">Harvesting Potential</h3>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annual Runoff</span>
              <span className="font-bold" style={{ color: '#0676c8' }}>
                {(rwh_analysis?.annual_harvestable_water_liters || 0).toLocaleString()} L
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tank Size</span>
              <span className="font-bold text-gray-800">
                {(rwh_analysis?.recommended_storage_capacity_liters || 0).toLocaleString()} L
              </span>
            </div>
            <p className="text-gray-400 text-sm italic pt-2">
              Note: Based on average rainfall and standard water demand for non-potable uses.
            </p>
          </div>
        </div>

        {/* Technical Solution Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
              <Wrench className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <h3 className="font-bold text-gray-800">Technical Solution</h3>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">System Type</span>
              <span className="font-bold" style={{ color: '#0676c8' }}>
                {rwh_analysis?.rwh_type || 'Rooftop Collection'}
              </span>
            </div>
            {rwh_analysis?.system_type_reason && (
              <p className="text-sm text-gray-500 italic bg-blue-50 p-2 rounded-lg">
                {rwh_analysis.system_type_reason}
              </p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Feasible</span>
              <span className="font-bold text-gray-800">{score >= 50 ? 'Yes' : 'Challenging'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Installation</span>
              <span className="font-bold text-gray-800">
                {rwh_analysis?.installation_type?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Above Ground'}
              </span>
            </div>

            {/* Tank Dimensions from LLM */}
            {rwh_analysis?.tank_dimensions && (
              <div className="pt-2 bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 font-semibold mb-3">Tank Specifications:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs">Height</p>
                    <p className="font-bold text-lg" style={{ color: '#0676c8' }}>
                      {rwh_analysis.tank_dimensions.height_meters || '1.5'}m
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs">Diameter</p>
                    <p className="font-bold text-lg" style={{ color: '#0676c8' }}>
                      {rwh_analysis.tank_dimensions.diameter_meters || '1.2'}m
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs">Capacity</p>
                    <p className="font-bold text-lg" style={{ color: '#22c55e' }}>
                      {(rwh_analysis.tank_dimensions.capacity_liters || 0).toLocaleString()}L
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs">Material</p>
                    <p className="font-bold text-sm text-gray-800">
                      {rwh_analysis.tank_dimensions.material_recommended || 'Plastic'}
                    </p>
                  </div>
                </div>
                {rwh_analysis.dimension_reasoning && (
                  <p className="text-xs text-gray-500 mt-3 italic">
                    {rwh_analysis.dimension_reasoning}
                  </p>
                )}
              </div>
            )}

            {/* Structural Notes */}
            {rwh_analysis?.structural_notes && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">{rwh_analysis.structural_notes}</p>
              </div>
            )}

            {/* Additional Components */}
            {rwh_analysis?.additional_components && rwh_analysis.additional_components.length > 0 && (
              <div className="pt-2">
                <p className="text-gray-600 text-sm mb-2">Required Components:</p>
                <div className="flex flex-wrap gap-2">
                  {rwh_analysis.additional_components.map((comp: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {comp.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Analysis Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
              <IndianRupee className="w-5 h-5" style={{ color: '#22c55e' }} />
            </div>
            <h3 className="font-bold text-gray-800">Cost Analysis</h3>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estimated Cost</span>
              <span className="font-bold" style={{ color: '#22c55e' }}>
                ₹{(cost_analysis?.total_estimated_cost || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annual Maintenance</span>
              <span className="font-bold text-gray-800">
                ₹{(cost_analysis?.annual_maintenance || 1000).toLocaleString()}/yr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payback Period</span>
              <span className="font-bold text-gray-800">
                {cost_analysis?.payback_estimate_years || 3} years
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                  <p className="text-gray-700 text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {!savedToDb && (
            <button
              onClick={onSave}
              disabled={savingToDb}
              className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              style={{ backgroundColor: '#22c55e' }}
            >
              {savingToDb ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Report
            </button>
          )}
          <button
            onClick={() => navigate('/vendors')}
            className="flex-1 py-4 rounded-2xl font-bold border-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
            style={{ borderColor: '#0676c8', color: '#0676c8' }}
          >
            Find Vendors
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {savedToDb && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Report saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
