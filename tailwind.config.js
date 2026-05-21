/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Site-wide theme tokens. Values mirror the CSS custom properties
        // declared in src/app/globals.css so utility classes and inline
        // var(--token) usage stay in sync.
        background:      'var(--background)',
        surface:         'var(--surface)',
        'card-bg':       'var(--card-bg)',

        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          border:  'var(--sidebar-border)',
          active:  'var(--sidebar-active)',
          hover:   'var(--sidebar-hover)',
          text:    'var(--sidebar-text)',
          muted:   'var(--sidebar-text-muted)',
          icon:    'var(--sidebar-icon)',
          section: 'var(--sidebar-section)',
        },

        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',

        'border-soft':    'var(--border)',
        divider:          'var(--divider)',
        'input-bg':       'var(--input-bg)',
        'input-border':   'var(--input-border)',

        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
        },
      },
      boxShadow: {
        card: 'var(--card-shadow)',
      },
    },
  },
  plugins: [],
}
