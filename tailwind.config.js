/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,ts,scss,css}", "./src/index.html"],
	theme: {
		extend: {},
	},
	plugins: [require("tailwind-scrollbar")],
};
