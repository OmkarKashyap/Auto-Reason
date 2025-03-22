/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",  // Updated path to catch all files in src
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'documenso-dark': '#1C1C1C',
        'documenso-green': '#7AE600',
        'documenso-button': '#99FF00',
      },
      maxWidth: {
        '8xl': '1400px',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}