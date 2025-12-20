import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Droplets, TrendingUp, IndianRupee, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Crop {
  id: string;
  crop_name: string;
  water_requirement: number;
  profit_potential: number;
  market_price: number;
  season: string;
}

export function SmartCroppingPage() {
  const { colors } = useTheme();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [sortBy, setSortBy] = useState<'water' | 'profit'>('profit');
  const [seasonFilter, setSeasonFilter] = useState<string>('');

  useEffect(() => {
    const fetchCrops = async () => {
      const { data, error } = await supabase.from('crop_recommendations').select('*');

      if (!error && data) {
        setCrops(data);
      }
    };

    fetchCrops();
  }, []);

  const filteredCrops = crops
    .filter((crop) => !seasonFilter || crop.season === seasonFilter)
    .sort((a, b) => {
      if (sortBy === 'water') {
        return a.water_requirement - b.water_requirement;
      } else {
        return b.profit_potential - a.profit_potential;
      }
    });

  const seasons = Array.from(new Set(crops.map((c) => c.season)));

  const getWaterEfficiencyScore = (crop: Crop) => {
    const profitPerLiter = crop.profit_potential / crop.water_requirement;
    const maxProfitPerLiter = Math.max(...crops.map((c) => c.profit_potential / c.water_requirement));
    return Math.round((profitPerLiter / maxProfitPerLiter) * 100);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.text }}>
          Smart Crop Recommendations
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'water' | 'profit')}
                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: colors.primary }}
              >
                <option value="profit">Highest Profit</option>
                <option value="water">Lowest Water Need</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                Filter by Season
              </label>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: colors.primary }}
              >
                <option value="">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div
                className="w-full px-4 py-2 rounded-lg text-center font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {filteredCrops.length} Crops Found
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCrops.map((crop, index) => {
            const efficiencyScore = getWaterEfficiencyScore(crop);
            return (
              <div
                key={crop.id}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden"
              >
                {index < 3 && (
                  <div
                    className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Top {index + 1}
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-4 mt-2" style={{ color: colors.text }}>
                  {crop.crop_name}
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Water Need
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      {(crop.water_requirement / 1000).toFixed(0)}K L
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Profit Potential
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      ₹{(crop.profit_potential / 1000).toFixed(0)}K
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Market Price
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      ₹{crop.market_price}/kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Season
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      {crop.season}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      Water Efficiency Score
                    </span>
                    <span className="text-sm font-bold" style={{ color: colors.primary }}>
                      {efficiencyScore}/100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${efficiencyScore}%`,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: colors.background }}
                >
                  <p style={{ color: colors.textSecondary }}>
                    {efficiencyScore >= 80
                      ? 'Excellent water efficiency with high profit margins'
                      : efficiencyScore >= 60
                      ? 'Good balance of water use and profit potential'
                      : 'Consider for areas with abundant water supply'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
            Cropping Guidelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h3 className="font-bold mb-3" style={{ color: colors.primary }}>
                Kharif Season
              </h3>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Monsoon crops (June - October)
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• High water availability</li>
                <li>• Rice, Millets, Cotton</li>
                <li>• Natural irrigation support</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h3 className="font-bold mb-3" style={{ color: colors.primary }}>
                Rabi Season
              </h3>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Winter crops (November - March)
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Requires irrigation</li>
                <li>• Wheat, Pulses, Vegetables</li>
                <li>• Higher market prices</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h3 className="font-bold mb-3" style={{ color: colors.primary }}>
                Zaid Season
              </h3>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Summer crops (March - June)
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Short duration crops</li>
                <li>• Vegetables, Melons</li>
                <li>• High water efficiency needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
