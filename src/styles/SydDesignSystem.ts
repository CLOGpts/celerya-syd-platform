/**
 * SYD DESIGN SYSTEM - TONALITÀ ESATTE
 * Documentato in comunicazioni-ui.txt
 * NON MODIFICARE QUESTI VALORI
 */

export const SydDesign = {
  // HEADER - ESATTAMENTE COME SYD CYBER
  header: {
    height: 'h-16',
    background: 'bg-gradient-to-r from-slate-900 to-blue-950',
    backgroundDark: '', // Non serve, sempre dark
    text: 'text-white',
    border: 'border-b border-blue-800/30',
    shadow: 'shadow-2xl',
    backdrop: 'backdrop-blur-sm',
    userBox: 'bg-gray-900/10',
    userBoxHover: 'hover:bg-gray-900/20',
    logoBox: 'w-10 h-10 bg-gray-900/10 rounded-lg',
    subtitle: 'text-blue-200'
  },

  // SIDEBAR - SCURA COME SYD CYBER
  sidebar: {
    width: 'w-80', // 320px ESATTI
    background: 'bg-slate-900',
    border: 'border-r border-slate-700',
    padding: 'p-4',
    titleText: 'text-slate-100 dark:text-white',
    menuItemNormal: 'text-slate-300 dark:text-slate-300',
    menuItemHover: 'hover:bg-gray-900 dark:hover:bg-slate-800',
    menuItemActive: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg',
    menuSpacing: 'space-y-2',
    statusDot: 'w-2 h-2 bg-black0 animate-pulse',
    statusText: 'text-slate-500 dark:text-slate-400'
  },

  // BOTTONI
  buttons: {
    height: 'h-10', // 40px ESATTI SEMPRE
    padding: 'px-4',
    borderRadius: 'rounded-lg',
    shadow: 'shadow-md hover:shadow-lg',
    transform: 'hover:scale-105',
    transition: 'transition-all duration-200',
    disabled: 'disabled:opacity-50',

    // Gradienti per variante
    gradients: {
      blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      red: 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700',
      purple: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
      teal: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'
    }
  },

  // CARDS
  cards: {
    background: 'bg-gray-900 dark:bg-slate-800',
    borderRadius: 'rounded-xl', // 12px
    padding: 'p-6', // 24px
    shadow: 'shadow-lg hover:shadow-xl',
    border: 'border border-slate-800 dark:border-slate-700',
    transform: 'transform hover:scale-105',
    transition: 'transition-all duration-200'
  },

  // BACKGROUND GENERALE - SEMPRE SCURO COME SYD CYBER
  backgrounds: {
    main: 'bg-slate-950',
    chat: 'bg-slate-950'
  },

  // TESTO
  text: {
    title: 'text-2xl font-bold text-slate-100 dark:text-white',
    subtitle: 'text-lg font-semibold text-slate-100 dark:text-white',
    normal: 'text-sm text-slate-300 dark:text-slate-300',
    small: 'text-xs text-slate-500 dark:text-slate-400',
    buttonFont: 'font-medium'
  },

  // SPACING STANDARD
  spacing: {
    p4: 'p-4', // 16px
    p6: 'p-6', // 24px per card
    spaceY2: 'space-y-2', // 8px vertical gap
    spaceY3: 'space-y-3', // 12px vertical gap
    gap2: 'gap-2', // 8px flexbox
    gap3: 'gap-3', // 12px flexbox
    gap4: 'gap-4', // 16px flexbox
    mt6: 'mt-6', // 24px margin top
    mb4: 'mb-4' // 16px margin bottom
  },

  // ANIMAZIONI
  animations: {
    duration: 'duration-200',
    pulse: 'animate-pulse',
    scaleHover: 'hover:scale-105'
  }
};

// Helper function per combinare classi
export const cls = (...classes: string[]) => classes.filter(Boolean).join(' ');

// Export dei preset completi
export const headerClasses = cls(
  SydDesign.header.height,
  SydDesign.header.background,
  SydDesign.header.backgroundDark,
  SydDesign.header.text,
  SydDesign.header.shadow,
  SydDesign.header.backdrop,
  SydDesign.header.border
);

export const sidebarClasses = cls(
  SydDesign.sidebar.width,
  SydDesign.sidebar.background,
  SydDesign.sidebar.border
);

export const cardClasses = cls(
  SydDesign.cards.background,
  SydDesign.cards.borderRadius,
  SydDesign.cards.padding,
  SydDesign.cards.shadow,
  SydDesign.cards.border,
  SydDesign.cards.transition
);