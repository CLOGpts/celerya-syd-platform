// SYD Platform Design System
// Unified theme for SYD CYBER and SYD PROTOTIPO modules

export const SydTheme = {
  // Brand Colors
  colors: {
    primary: {
      main: '#1E3A8A', // Deep Blue - Authority & Trust
      light: '#3B82F6',
      dark: '#1E293B',
      gradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)'
    },
    cyber: {
      main: '#10B981', // Emerald - Security & Safety
      light: '#34D399',
      dark: '#059669',
      accent: '#6EE7B7'
    },
    prototipo: {
      main: '#F59E0B', // Amber - Analysis & Processing
      light: '#FCD34D',
      dark: '#D97706',
      accent: '#FDE68A'
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827'
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    },
    background: {
      default: '#FFFFFF',
      paper: '#F9FAFB',
      dark: '#111827',
      gradient: 'linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%)'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace"
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    cyber: '0 0 20px rgba(16, 185, 129, 0.3)',
    prototipo: '0 0 20px rgba(245, 158, 11, 0.3)'
  },

  // Transitions
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.3s ease',
    slow: 'all 0.5s ease'
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600
  }
};

// Module-specific theme extensions
export const ModuleThemes = {
  sydCyber: {
    primaryColor: SydTheme.colors.cyber.main,
    accentColor: SydTheme.colors.cyber.light,
    iconSet: 'security',
    specialEffects: {
      glow: true,
      scanlines: true
    }
  },
  sydPrototipo: {
    primaryColor: SydTheme.colors.prototipo.main,
    accentColor: SydTheme.colors.prototipo.light,
    iconSet: 'document',
    specialEffects: {
      paperTexture: true,
      highlighter: true
    }
  }
};

// Utility function to get module-specific styles
export const getModuleStyles = (module: 'cyber' | 'prototipo') => {
  return module === 'cyber' ? ModuleThemes.sydCyber : ModuleThemes.sydPrototipo;
};

export default SydTheme;