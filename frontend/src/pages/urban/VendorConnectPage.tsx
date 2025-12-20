import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapPin, Phone, Mail, Star, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Vendor {
  id: string;
  name: string;
  location: string;
  materials: string[];
  contact_phone: string;
  contact_email: string;
  rating: number;
}

export function VendorConnectPage() {
  const { colors } = useTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase.from('vendors').select('*').order('rating', { ascending: false });

      if (!error && data) {
        setVendors(data);
        setFilteredVendors(data);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    let filtered = vendors;

    if (locationFilter) {
      filtered = filtered.filter((vendor) =>
        vendor.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (materialFilter) {
      filtered = filtered.filter((vendor) =>
        vendor.materials.some((material) =>
          material.toLowerCase().includes(materialFilter.toLowerCase())
        )
      );
    }

    setFilteredVendors(filtered);
  }, [locationFilter, materialFilter, vendors]);

  const allMaterials = Array.from(new Set(vendors.flatMap((v) => v.materials)));

  return (
    <div className="min-h-screen transition-colors duration-300 py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.text }}>
          Connect with Trusted Vendors
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.primary }}
          >
            <Filter className="w-5 h-5" />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Filter by Location
                </label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g., Mumbai, Delhi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.primary }}
                />
              </div>

              <div>
                <label className="block mb-2 font-medium" style={{ color: colors.text }}>
                  Filter by Material
                </label>
                <select
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.primary }}
                >
                  <option value="">All Materials</option>
                  {allMaterials.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                  {vendor.name}
                </h2>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 fill-current" style={{ color: '#FFD700' }} />
                  <span className="font-semibold" style={{ color: colors.text }}>
                    {vendor.rating}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{vendor.location}</span>
                </div>

                <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{vendor.contact_phone}</span>
                </div>

                <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{vendor.contact_email}</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-sm" style={{ color: colors.text }}>
                  Materials Offered:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.materials.map((material) => (
                    <span
                      key={material}
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => window.open(`mailto:${vendor.contact_email}`, '_blank')}
                className="w-full px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary }}
              >
                Connect Now
              </button>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl" style={{ color: colors.textSecondary }}>
              No vendors found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
