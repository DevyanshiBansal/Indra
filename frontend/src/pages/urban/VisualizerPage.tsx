import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTheme } from '../../contexts/ThemeContext';
import { X } from 'lucide-react';
import * as THREE from 'three';

interface ComponentInfo {
  name: string;
  description: string;
}

function RainwaterSystem({ onComponentClick }: { onComponentClick: (info: ComponentInfo) => void }) {
  const tankRef = useRef<THREE.Mesh>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  useFrame((state) => {
    if (tankRef.current) {
      tankRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group>
      <mesh
        position={[0, 2, 0]}
        onClick={() =>
          onComponentClick({
            name: 'Rooftop Collection Area',
            description: 'The primary collection surface where rainwater is gathered. A larger rooftop area increases water collection capacity. Should be clean and free of debris for optimal harvesting.',
          })
        }
        onPointerOver={() => setHoveredPart('roof')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[4, 0.2, 3]} />
        <meshStandardMaterial color={hoveredPart === 'roof' ? '#0676c8' : '#8B4513'} />
      </mesh>

      <mesh position={[-1.8, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      <mesh
        position={[-1.8, 0.3, 0]}
        onClick={() =>
          onComponentClick({
            name: 'First Flush Diverter',
            description: 'Diverts the initial dirty water flow away from the storage tank. The first rain washes dust and debris from the roof, which should not enter your storage. This component ensures cleaner water collection.',
          })
        }
        onPointerOver={() => setHoveredPart('diverter')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={hoveredPart === 'diverter' ? '#32a854' : '#FF6B6B'} />
      </mesh>

      <mesh position={[-1.8, -0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      <mesh
        ref={tankRef}
        position={[0, -1.5, 0]}
        onClick={() =>
          onComponentClick({
            name: 'Storage Tank',
            description: 'The main water storage unit where harvested rainwater is stored. Capacity ranges from 1000 to 10000 liters depending on your needs. Should be covered, food-grade, and installed on a stable base.',
          })
        }
        onPointerOver={() => setHoveredPart('tank')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[1.5, 1.5, 2, 32]} />
        <meshStandardMaterial color={hoveredPart === 'tank' ? '#0676c8' : '#4A90E2'} opacity={0.8} transparent />
      </mesh>

      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 2.1, 32]} />
        <meshStandardMaterial color="#87CEEB" opacity={0.3} transparent />
      </mesh>

      <mesh
        position={[0, -2.8, 0]}
        onClick={() =>
          onComponentClick({
            name: 'Filter System',
            description: 'Removes physical impurities like leaves, insects, and sediment from the water. Multi-stage filtration includes mesh filters and sand filters for better water quality. Regular cleaning is essential.',
          })
        }
        onPointerOver={() => setHoveredPart('filter')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.6, 16]} />
        <meshStandardMaterial color={hoveredPart === 'filter' ? '#32a854' : '#FFD700'} />
      </mesh>

      <mesh
        position={[1.5, -1.5, 0]}
        onClick={() =>
          onComponentClick({
            name: 'Overflow Outlet',
            description: 'Allows excess water to exit when the tank reaches full capacity. Prevents overflow damage and redirects extra water to drains or garden areas. Essential safety feature for the system.',
          })
        }
        onPointerOver={() => setHoveredPart('overflow')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hoveredPart === 'overflow' ? '#0676c8' : '#666666'} />
      </mesh>

      <mesh
        position={[0, -3.5, 0]}
        onClick={() =>
          onComponentClick({
            name: 'Outlet Tap',
            description: 'Connection point for water distribution. Can be connected to pumps for household use or direct taps for garden watering. Should have proper valves for flow control.',
          })
        }
        onPointerOver={() => setHoveredPart('tap')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[0.3, 0.2, 0.3]} />
        <meshStandardMaterial color={hoveredPart === 'tap' ? '#32a854' : '#C0C0C0'} />
      </mesh>

      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#90EE90" />
      </mesh>
    </group>
  );
}

export function VisualizerPage() {
  const { colors } = useTheme();
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);

  return (
    <div className="min-h-screen transition-colors duration-300 py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.text }}>
          3D Rainwater Harvesting System
        </h1>

        <p className="text-center mb-8" style={{ color: colors.textSecondary }}>
          Click on any component to learn more. Drag to rotate the view.
        </p>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8" style={{ height: '600px' }}>
          <Canvas camera={{ position: [5, 3, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
            <RainwaterSystem onComponentClick={setSelectedComponent} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
        </div>

        {selectedComponent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedComponent(null)}
          >
            <div
              className="bg-white rounded-lg p-8 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {selectedComponent.name}
                </h2>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" style={{ color: colors.text }} />
                </button>
              </div>
              <p style={{ color: colors.textSecondary }}>{selectedComponent.description}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
              System Components
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <li>• Rooftop Collection Area</li>
              <li>• First Flush Diverter</li>
              <li>• Storage Tank</li>
              <li>• Filter System</li>
              <li>• Overflow Outlet</li>
              <li>• Outlet Tap</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
              Key Benefits
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <li>• Reduces water bills</li>
              <li>• Eco-friendly solution</li>
              <li>• Low maintenance</li>
              <li>• Long-term savings</li>
              <li>• Water independence</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
              Maintenance Tips
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <li>• Clean gutters monthly</li>
              <li>• Check filters regularly</li>
              <li>• Inspect tank annually</li>
              <li>• Monitor water quality</li>
              <li>• Clear overflow pipes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
