import { createContext, useContext, useState, ReactNode } from 'react';

export type Mode = 'urban' | 'rural';

interface ThemeContextType {
  mode: Mode;
  toggleMode: () => void;
  colors: {
    primary: string;
    background: string;
    text: string;
    textSecondary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const urbanColors = {
  primary: '#0676c8',
  background: '#f0f7fc',
  text: '#000000',
  textSecondary: '#333333',
};

const ruralColors = {
  primary: '#32a854',
  background: '#f0faf3',
  text: '#000000',
  textSecondary: '#333333',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('urban');

  const toggleMode = () => {
    setMode((prev) => (prev === 'urban' ? 'rural' : 'urban'));
  };

  const colors = mode === 'urban' ? urbanColors : ruralColors;

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
