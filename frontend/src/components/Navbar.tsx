import { Link, useLocation, useNavigate } from 'react-router-dom'; // <--- 1. Import useNavigate
import { useTheme } from '../contexts/ThemeContext';

export function Navbar() {
  const { mode, toggleMode, colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate(); 

  const urbanLinks = [
    { path: '/assessment', label: 'Assessment' },
    { path: '/visualizer', label: '3D Visualizer' },
    { path: '/vendors', label: 'Vendor Connect' },
  ];

  const ruralLinks = [
    { path: '/gramin', label: 'Dashboard' },
    { path: '/gramin/water-management', label: 'Water Management' },
    { path: '/gramin/smart-cropping', label: 'Smart Cropping' },
  ];

  const links = mode === 'urban' ? urbanLinks : ruralLinks;

  // <--- 3. The New Logic Handler
  const handleToggle = () => {
    // First, switch the logic state
    toggleMode(); 
    
    // Then, physically move the user to the safe "Home" of the other world
    if (mode === 'urban') {
      navigate('/gramin'); // Going to Rural? Go to Rural Dashboard
    } else {
      navigate('/'); // Going to Urban? Go to Urban Home
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 shadow-md transition-colors duration-300"
      style={{ backgroundColor: colors.primary }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* ... Logo Section (Keep as is) ... */}
          <div className="flex items-center space-x-4">
             {/* ... image and text ... */}
             <div className="text-white">
             <a href="/">
               <h1 className="text-2xl font-bold">INDRA</h1>
             </a>
             </div>
          </div>

          {/* Links Section */}
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-white font-medium hover:opacity-80 transition-opacity ${
                  location.pathname === link.path ? 'border-b-2 border-white' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Toggle Section */}
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm font-medium">Standard</span>
            <button
              type="button"
              onClick={handleToggle}
              className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              // 6. VISUAL FIX: Use a semi-transparent white background so the toggle is visible against the navbar
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }} 
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  mode === 'rural' ? 'transform translate-x-7' : ''
                }`}
              />
            </button>
            <span className="text-white text-sm font-medium">Gramin</span>
          </div>
        </div>
      </div>
    </nav>
  );
}