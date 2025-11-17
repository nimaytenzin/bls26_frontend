/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,ts,scss,css}", "./src/index.html"],
	theme: {
		extend: {
			colors: {
				primary: {
					50: "#edf0fe",
					100: "#d6dffd",
					200: "#b0c2fb",
					300: "#82a4f9",
					400: "#4d88f7",
					500: "#226cd7",
					600: "#1a57af",
					700: "#114084",
					800: "#092d60",
					900: "#03183a",
					950: "#02102a",
				},
			},
		},
	},
	plugins: [require("tailwind-scrollbar")],
};
