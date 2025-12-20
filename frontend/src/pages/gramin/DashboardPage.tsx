import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Users, Droplets, Home, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Panchayat {
  id: string;
  panchayat_name: string;
  location: string;
  total_households: number;
  total_water_capacity: number;
  irrigation_need: number;
  cattle_need: number;
  drinking_need: number;
  latitude: number;
  longitude: number;
}

export function DashboardPage() {
  const { colors } = useTheme();
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [selectedPanchayat, setSelectedPanchayat] = useState<Panchayat | null>(null);

  useEffect(() => {
    const fetchPanchayats = async () => {
      const { data, error } = await supabase.from('gram_panchayat_data').select('*');

      if (!error && data) {
        setPanchayats(data);
        if (data.length > 0) {
          setSelectedPanchayat(data[0]);
        }
      }
    };

    fetchPanchayats();
  }, []);

  const totalWaterUsed = selectedPanchayat
    ? selectedPanchayat.irrigation_need + selectedPanchayat.cattle_need + selectedPanchayat.drinking_need
    : 0;

  const waterUtilization = selectedPanchayat
    ? ((totalWaterUsed / selectedPanchayat.total_water_capacity) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen transition-colors duration-300 py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.text }}>
          Gram Panchayat Dashboard
        </h1>

        <div className="mb-8">
          <label className="block mb-2 font-medium" style={{ color: colors.text }}>
            Select Gram Panchayat
          </label>
          <select
            value={selectedPanchayat?.id || ''}
            onChange={(e) => {
              const panchayat = panchayats.find((p) => p.id === e.target.value);
              setSelectedPanchayat(panchayat || null);
            }}
            className="w-full md:w-96 px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: colors.primary }}
          >
            {panchayats.map((panchayat) => (
              <option key={panchayat.id} value={panchayat.id}>
                {panchayat.panchayat_name} - {panchayat.location}
              </option>
            ))}
          </select>
        </div>

        {selectedPanchayat && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Home className="w-12 h-12 mb-3" style={{ color: colors.primary }} />
                <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                  {selectedPanchayat.total_households}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Total Households
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <Droplets className="w-12 h-12 mb-3" style={{ color: colors.primary }} />
                <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                  {(selectedPanchayat.total_water_capacity / 1000).toFixed(0)}K
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Liters Water Capacity
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <Users className="w-12 h-12 mb-3" style={{ color: colors.primary }} />
                <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                  {selectedPanchayat.total_households * 5}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Estimated Population
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <TrendingUp className="w-12 h-12 mb-3" style={{ color: colors.primary }} />
                <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                  {waterUtilization}%
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Water Utilization
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-lg mb-12">
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
                Community Water Cluster Network
              </h2>
              <div className="relative h-96 rounded-lg overflow-hidden" style={{ backgroundColor: colors.background }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {selectedPanchayat.panchayat_name.split(' ')[0]}
                    </div>

                    {Array.from({ length: selectedPanchayat.total_households }).map((_, i) => {
                      const angle = (i / selectedPanchayat.total_households) * 2 * Math.PI;
                      const radius = 200;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;

                      return (
                        <div
                          key={i}
                          className="absolute w-6 h-6 rounded-full shadow-md"
                          style={{
                            backgroundColor: colors.primary,
                            opacity: 0.6,
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      );
                    })}

                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i / 8) * 2 * Math.PI;
                      const radius = 200;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;

                      return (
                        <svg
                          key={`line-${i}`}
                          className="absolute"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                          }}
                        >
                          <line
                            x1="50%"
                            y1="50%"
                            x2={`calc(50% + ${x}px)`}
                            y2={`calc(50% + ${y}px)`}
                            stroke={colors.primary}
                            strokeWidth="1"
                            opacity="0.3"
                          />
                        </svg>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p className="text-center mt-4" style={{ color: colors.textSecondary }}>
                Each droplet represents a household connected to the community water network
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  Water Distribution
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Irrigation
                      </span>
                      <span className="text-sm font-semibold" style={{ color: colors.text }}>
                        {((selectedPanchayat.irrigation_need / totalWaterUsed) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${(selectedPanchayat.irrigation_need / totalWaterUsed) * 100}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Cattle
                      </span>
                      <span className="text-sm font-semibold" style={{ color: colors.text }}>
                        {((selectedPanchayat.cattle_need / totalWaterUsed) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${(selectedPanchayat.cattle_need / totalWaterUsed) * 100}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Drinking
                      </span>
                      <span className="text-sm font-semibold" style={{ color: colors.text }}>
                        {((selectedPanchayat.drinking_need / totalWaterUsed) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${(selectedPanchayat.drinking_need / totalWaterUsed) * 100}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  Water Needs
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Irrigation</span>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      {(selectedPanchayat.irrigation_need / 1000).toFixed(0)}K L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Cattle</span>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      {(selectedPanchayat.cattle_need / 1000).toFixed(0)}K L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Drinking</span>
                    <span className="font-semibold" style={{ color: colors.text }}>
                      {(selectedPanchayat.drinking_need / 1000).toFixed(0)}K L
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-bold" style={{ color: colors.text }}>
                      Total
                    </span>
                    <span className="font-bold" style={{ color: colors.primary }}>
                      {(totalWaterUsed / 1000).toFixed(0)}K L
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    className="w-full px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Manage Water
                  </button>
                  <button
                    className="w-full px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.primary }}
                  >
                    View Crop Recommendations
                  </button>
                  <button
                    className="w-full px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Check Water Quality
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
