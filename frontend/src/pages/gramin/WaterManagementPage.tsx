import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Droplets, RefreshCw } from 'lucide-react';

export function WaterManagementPage() {
  const { colors } = useTheme();
  const [totalWater, setTotalWater] = useState(500000);
  const [irrigation, setIrrigation] = useState(200000);
  const [cattle, setCattle] = useState(150000);
  const [drinking, setDrinking] = useState(150000);

  const totalAllocated = irrigation + cattle + drinking;
  const remaining = totalWater - totalAllocated;

  const getPercentage = (value: number) => {
    return ((value / totalWater) * 100).toFixed(1);
  };

  const resetToOptimal = () => {
    setIrrigation(Math.round(totalWater * 0.4));
    setCattle(Math.round(totalWater * 0.3));
    setDrinking(Math.round(totalWater * 0.3));
  };

  return (
    <div className="min-h-screen transition-colors duration-300 py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.text }}>
          Water Management System
        </h1>

        <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
              Total Water Available
            </h2>
            <div className="flex items-center space-x-2">
              <Droplets className="w-8 h-8" style={{ color: colors.primary }} />
              <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                {(totalWater / 1000).toFixed(0)}K L
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium" style={{ color: colors.text }}>
              Adjust Total Water Capacity (Liters)
            </label>
            <input
              type="range"
              min="100000"
              max="1000000"
              step="10000"
              value={totalWater}
              onChange={(e) => setTotalWater(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
                  ((totalWater - 100000) / 900000) * 100
                }%, #e5e7eb ${((totalWater - 100000) / 900000) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex justify-between text-sm mt-1" style={{ color: colors.textSecondary }}>
              <span>100K L</span>
              <span>1000K L</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
              Water Distribution
            </h2>
            <button
              onClick={resetToOptimal}
              className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.primary }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Optimal Distribution</span>
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium" style={{ color: colors.text }}>
                  Irrigation
                </label>
                <span className="font-bold" style={{ color: colors.primary }}>
                  {(irrigation / 1000).toFixed(0)}K L ({getPercentage(irrigation)}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={totalWater}
                step="5000"
                value={irrigation}
                onChange={(e) => setIrrigation(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
                    (irrigation / totalWater) * 100
                  }%, #e5e7eb ${(irrigation / totalWater) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium" style={{ color: colors.text }}>
                  Cattle
                </label>
                <span className="font-bold" style={{ color: colors.primary }}>
                  {(cattle / 1000).toFixed(0)}K L ({getPercentage(cattle)}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={totalWater}
                step="5000"
                value={cattle}
                onChange={(e) => setCattle(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
                    (cattle / totalWater) * 100
                  }%, #e5e7eb ${(cattle / totalWater) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium" style={{ color: colors.text }}>
                  Drinking Water
                </label>
                <span className="font-bold" style={{ color: colors.primary }}>
                  {(drinking / 1000).toFixed(0)}K L ({getPercentage(drinking)}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={totalWater}
                step="5000"
                value={drinking}
                onChange={(e) => setDrinking(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
                    (drinking / totalWater) * 100
                  }%, #e5e7eb ${(drinking / totalWater) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`rounded-lg p-6 shadow-lg ${remaining >= 0 ? 'bg-white' : 'bg-red-50 border-2 border-red-500'}`}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: remaining >= 0 ? colors.text : '#dc2626' }}>
              {remaining >= 0 ? 'Water Balance' : 'Over Allocated!'}
            </h3>
            <div className="flex items-center justify-between">
              <span style={{ color: colors.textSecondary }}>Remaining Water</span>
              <span
                className="text-2xl font-bold"
                style={{ color: remaining >= 0 ? colors.primary : '#dc2626' }}
              >
                {(remaining / 1000).toFixed(0)}K L
              </span>
            </div>
            {remaining < 0 && (
              <p className="mt-4 text-sm text-red-600">
                You have over-allocated water by {Math.abs(remaining / 1000).toFixed(0)}K liters. Please adjust your distribution.
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              Distribution Chart
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    Irrigation
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.text }}>
                    {getPercentage(irrigation)}%
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${getPercentage(irrigation)}%`,
                      backgroundColor: colors.primary,
                    }}
                  >
                    {irrigation > totalWater * 0.1 && `${getPercentage(irrigation)}%`}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    Cattle
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.text }}>
                    {getPercentage(cattle)}%
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${getPercentage(cattle)}%`,
                      backgroundColor: colors.primary,
                      opacity: 0.8,
                    }}
                  >
                    {cattle > totalWater * 0.1 && `${getPercentage(cattle)}%`}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    Drinking
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.text }}>
                    {getPercentage(drinking)}%
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${getPercentage(drinking)}%`,
                      backgroundColor: colors.primary,
                      opacity: 0.6,
                    }}
                  >
                    {drinking > totalWater * 0.1 && `${getPercentage(drinking)}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
            Recommended Water Distribution Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h4 className="font-bold mb-2" style={{ color: colors.primary }}>
                Irrigation (40%)
              </h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Adequate water for crop cultivation during growing seasons.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h4 className="font-bold mb-2" style={{ color: colors.primary }}>
                Cattle (30%)
              </h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Essential water for livestock health and dairy production.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h4 className="font-bold mb-2" style={{ color: colors.primary }}>
                Drinking (30%)
              </h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Clean drinking water for household consumption and hygiene.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
