/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        // TourBots AI Brand Colors - B2B Tech Platform
        'brand-primary': '#363ADF',      // Indigo-blue accent
        'brand-secondary': '#0EA5E9',    // Sky 500 (clarity, digital, modern)
        'brand-accent': '#06B6D4',       // Cyan 500 (innovation, AI)
        'success-green': '#10B981',      // Emerald 500 (slightly brighter)
        'warning-orange': '#F59E0B',     // Amber 500 (warmer, more inviting)
        
        // Text colors - dark theme hierarchy
        'text-primary-dark': '#F9FAFB',      // white
        'text-secondary-dark': '#E5E7EB',    // light gray
        'text-tertiary-dark': '#9CA3AF',     // medium gray
        'text-disabled-dark': '#6B7280',     // dark gray
        
        // Background colors - dark glassmorphism vibe
        'bg-primary-dark': '#0A0E1A',        // Darker slate (more depth)
        'bg-secondary-dark': '#1E293B',      // slate-800 
        'bg-tertiary-dark': '#334155',       // slate-700
        
        // Borders
        'border-dark': '#334155',            // slate-700
        'border-accent': '#475569',          // slate-600 (lighter on hover)
        
        // Status colors
        'error': '#EF4444',      // red-500
        'warning': '#F59E0B',    // amber-500
        'success': '#10B981',    // emerald-500
        'info': '#3B82F6',       // blue-500
        
        // Legacy palette (kept for backwards compatibility)
        'brand-blue': '#1E40AF',
        'ai-pink': '#DB2777',
        'text-primary-light': '#111827',
        'text-secondary-light': '#374151',
        'text-tertiary-light': '#6B7280',
        'text-disabled-light': '#9CA3AF',
        'bg-primary-light': '#FFFFFF',
        'bg-secondary-light': '#F9FAFB',
        'bg-tertiary-light': '#F3F4F6',
        'border-light': '#E5E7EB',
        'focus-ring': '#3B82F6',
        
        // Existing shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}