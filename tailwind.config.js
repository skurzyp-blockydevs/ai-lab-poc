/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                vapor: '#dce1e3', // Approximate color based on usage
                'black-out': '#0d0d0d', // Approximate
                primary: '#3b82f6', // Approximate default primary
                'hedera-green': '#00ff00', // Approximate
                foreground: '#1a1a1a', // Approximate
            }
        },
    },
    plugins: [],
}
