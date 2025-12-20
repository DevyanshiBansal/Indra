import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Image, ArrowRight, Droplets, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type AssessmentMode = 'select' | 'manual' | 'visual' | 'result';

export function AssessmentPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AssessmentMode>('select');
  const [formData, setFormData] = useState({
    spaceAvailable: '',
    numPeople: '',
    location: '',
    imageFile: null as File | null,
  });
  const [result, setResult] = useState<{
    potentialLiters: number;
    efficiencyScore: number;
    assessmentId: string;
  } | null>(null);

  const calculatePotential = (space: number, people: number) => {
    const avgRainfall = 800;
    const collectionEfficiency = 0.75;
    const potentialLiters = space * avgRainfall * collectionEfficiency;
    const waterNeed = people * 150 * 365;
    const efficiencyScore = Math.min((potentialLiters / waterNeed) * 100, 100);
    return { potentialLiters: Math.round(potentialLiters), efficiencyScore: Math.round(efficiencyScore) };
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const space = parseFloat(formData.spaceAvailable);
    const people = parseInt(formData.numPeople);
    const { potentialLiters, efficiencyScore } = calculatePotential(space, people);

    const { data, error } = await supabase
      .from('assessment_reports')
      .insert({
        assessment_type: 'manual',
        space_available: space,
        num_people: people,
        location: formData.location,
        potential_liters: potentialLiters,
        efficiency_score: efficiencyScore,
        mode: 'urban',
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      setResult({ potentialLiters, efficiencyScore, assessmentId: data.id });
      setMode('result');
    }
  };

  const handleVisualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const estimatedSpace = 100;
    const people = parseInt(formData.numPeople);
    const { potentialLiters, efficiencyScore } = calculatePotential(estimatedSpace, people);

    const { data, error } = await supabase
      .from('assessment_reports')
      .insert({
        assessment_type: 'visual',
        space_available: estimatedSpace,
        num_people: people,
        location: formData.location,
        image_url: 'placeholder-image-url',
        potential_liters: potentialLiters,
        efficiency_score: efficiencyScore,
        mode: 'urban',
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      setResult({ potentialLiters, efficiencyScore, assessmentId: data.id });
      setMode('result');
    }
  };

  const handleProceedToCost = () => {
    if (result) {
      navigate(`/cost-implementation?assessmentId=${result.assessmentId}`);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.text }}>
          Rainwater Harvesting Assessment
        </h1>

        {mode === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => setMode('manual')}
              className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
              <h2 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                Manual Entry
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Provide details about your property manually through a simple form.
              </p>
            </button>

            <button
              onClick={() => setMode('visual')}
              className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Image className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
              <h2 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                Visual Analysis
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Upload an image of your property for AI-powered space estimation.
              </p>
            </button>
          </div>
        )}

        {mode === 'manual' && (
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
              Manual Assessment Form
            </h2>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Available Space (sq meters)
                </label>
                <input
                  type="number"
                  required
                  value={formData.spaceAvailable}
                  onChange={(e) => setFormData({ ...formData, spaceAvailable: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.primary }}
                  placeholder="e.g., 150"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Number of People
                </label>
                <input
                  type="number"
                  required
                  value={formData.numPeople}
                  onChange={(e) => setFormData({ ...formData, numPeople: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="e.g., 4"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="flex-1 px-6 py-3 border-2 rounded-lg font-semibold hover:opacity-80 transition-opacity"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: colors.primary }}
                >
                  Calculate
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'visual' && (
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
              Visual Assessment
            </h2>
            <form onSubmit={handleVisualSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Upload Property Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Number of People
                </label>
                <input
                  type="number"
                  required
                  value={formData.numPeople}
                  onChange={(e) => setFormData({ ...formData, numPeople: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="e.g., 4"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="flex-1 px-6 py-3 border-2 rounded-lg font-semibold hover:opacity-80 transition-opacity"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: colors.primary }}
                >
                  Analyze
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'result' && result && (
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: colors.text }}>
              Your Assessment Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="text-center p-6 rounded-lg" style={{ backgroundColor: colors.background }}>
                <Droplets className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                  {result.potentialLiters.toLocaleString()}
                </h3>
                <p style={{ color: colors.textSecondary }}>Liters Saved Annually</p>
              </div>

              <div className="text-center p-6 rounded-lg" style={{ backgroundColor: colors.background }}>
                <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                  {result.efficiencyScore}%
                </h3>
                <p style={{ color: colors.textSecondary }}>Water Independence Score</p>
              </div>
            </div>

            <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.text }}>
                What This Means
              </h3>
              <p style={{ color: colors.textSecondary }}>
                {result.efficiencyScore >= 80
                  ? 'Excellent! Your property has high potential for rainwater harvesting. You can meet most of your water needs sustainably.'
                  : result.efficiencyScore >= 50
                  ? 'Good! Your property can significantly reduce dependency on municipal water supply through rainwater harvesting.'
                  : 'Fair. While rainwater harvesting will help, you may need to combine it with other water-saving measures.'}
              </p>
            </div>

            <button
              onClick={handleProceedToCost}
              className="w-full px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
              style={{ backgroundColor: colors.primary }}
            >
              <span>View Cost & Implementation</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
