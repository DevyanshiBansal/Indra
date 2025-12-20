import { useTheme } from '../../contexts/ThemeContext';
import { Droplets, TrendingUp, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  const { colors } = useTheme();

  const news = [
    {
      title: 'New Government Subsidy for Rainwater Harvesting',
      date: '10 Dec 2024',
      description: 'Get up to 50% subsidy on installation costs for residential properties.',
    },
    {
      title: 'Water Conservation Success Story: Mumbai',
      date: '8 Dec 2024',
      description: 'Local community saves 2 million liters annually through INDRA initiative.',
    },
    {
      title: 'Workshop: DIY Rainwater Harvesting',
      date: '5 Dec 2024',
      description: 'Free workshop on building your own rainwater collection system.',
    },
  ];

  const stats = [
    { icon: Droplets, value: '50M+', label: 'Liters Saved' },
    { icon: Users, value: '10K+', label: 'Users' },
    { icon: TrendingUp, value: '40%', label: 'Water Savings' },
    { icon: Award, value: '95%', label: 'Satisfaction' },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>
            Welcome to INDRA
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: colors.textSecondary }}>
            Join India's largest initiative for sustainable water management. Every drop counts
            towards a water-secure future.
          </p>
          <div className="mt-8">
            <Link
              to="/assessment"
              className="inline-block px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.primary }}
            >
              Start Your Assessment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow"
            >
              <stat.icon className="w-12 h-12 mx-auto mb-3" style={{ color: colors.primary }} />
              <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                {stat.value}
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: colors.text }}>
            Why Rainwater Harvesting?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
                Reduce Water Bills
              </h3>
              <p style={{ color: colors.textSecondary }}>
                Save up to 40% on your monthly water expenses by harvesting free rainwater.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
                Sustainable Living
              </h3>
              <p style={{ color: colors.textSecondary }}>
                Contribute to environmental conservation and reduce dependence on municipal water.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
                Ground Water Recharge
              </h3>
              <p style={{ color: colors.textSecondary }}>
                Help replenish underground aquifers and maintain the water table level.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: colors.text }}>
            Latest News & Notifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-sm mb-2" style={{ color: colors.primary }}>
                  {item.date}
                </p>
                <h3 className="text-lg font-bold mb-3" style={{ color: colors.text }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
