//mypreset.ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const CustomTheme = definePreset(Aura, {
	semantic: {
		primary: {
			50: '#eef3fe',
			100: '#dce7fd',
			200: '#b9cffc',
			300: '#96b7fa',
			400: '#739ff9',
			500: '#6F1C76', // Base primary
			600: '#355ac3',
			700: '#284392',
			800: '#1a2d62',
			900: '#0d1631',
			950: '#070b18',
		},
		accent: {
			50: '#fff3e0',
			100: '#ffe0b2',
			200: '#ffcc80',
			300: '#ffb74d',
			400: '#ffa726',
			500: '#ff9800',
			600: '#fb8c00',
			700: '#f57c00',
			800: '#ef6c00',
			900: '#e65100',
		},
		success: {
			50: '#e6f7f1',
			100: '#c2f0dd',
			200: '#9de8c9',
			300: '#79e1b5',
			400: '#54d9a1',
			500: '#2dbf78',
			600: '#1a9e5e',
			700: '#11794a',
			800: '#085435',
			900: '#032e1f',
		},
		danger: {
			50: '#fdecea',
			100: '#fbc5c1',
			200: '#f99f99',
			300: '#f67870',
			400: '#f45248',
			500: '#f36c6c',
			600: '#d32f2f',
			700: '#a82626',
			800: '#7e1c1c',
			900: '#531212',
		},
		warning: {
			50: '#fff8e1',
			100: '#ffecb3',
			200: '#ffe082',
			300: '#ffd54f',
			400: '#ffca28',
			500: '#ffb74d',
			600: '#ffa000',
			700: '#ff8f00',
			800: '#ff6f00',
			900: '#e65100',
		},
		neutral: {
			50: '#f9f9fc',
			100: '#f5f7ff',
			200: '#e6e9f4',
			300: '#d0d3e0',
			400: '#b0b3c2',
			500: '#828795',
			600: '#555b6e',
			700: '#383d4b',
			800: '#1f232e',
			900: '#0f1117',
		},
		text: {
			primary: '#262a39',
			secondary: '#6c7380',
			muted: '#9ca3af',
			onPrimary: '#ffffff',
			onSecondary: '#ffffff',
			link: '#4270f4',
		},
		surface: {
			0: '#ffffff',
			50: '#f9f9fc',
			100: '#f5f7ff',
			200: '#e6e9f4',
			300: '#d0d3e0',
		},
	},

	tokens: {
		// ✅ Radius Tokens (Matches your SCSS $button-radius, $card-radius, etc.)
		radius: {
			sm: '4px',
			md: '8px',
			lg: '12px',
			xl: '16px',
			full: '9999px',
		},

		// ✅ Spacing Scale (Matches $spacing-sm to $spacing-xxl)
		spacing: {
			0: '0',
			1: '0.25rem', // xs
			2: '0.5rem', // sm
			3: '1rem', // md
			4: '1.5rem', // lg
			5: '2rem', // xl
			6: '4rem', // xxl
		},

		// ✅ Typography Tokens
		typography: {
			fontFamily: "'Poppins', sans-serif",
			sizes: {
				xs: '0.75rem',
				sm: '0.875rem',
				md: '1rem',
				lg: '1.25rem',
				xl: '1.5rem',
			},
			weights: {
				light: '300',
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700',
			},
			lineHeights: {
				tight: '1.2',
				normal: '1.5',
				relaxed: '1.75',
			},
		},

		// ✅ Shadows (Mapped from your SCSS shadow tokens)
		shadow: {
			1: '0 1px 3px rgba(0, 0, 0, 0.1)',
			2: '0 4px 6px rgba(0, 0, 0, 0.1)',
			3: '0 10px 20px rgba(0, 0, 0, 0.15)',
			card: '0 10px 25px rgba(0, 0, 0, 0.05)',
			modal: '0 12px 30px rgba(0, 0, 0, 0.2)',
			sidebar: '5px 0 20px rgba(0, 0, 0, 0.03)',
			topnav: '0 5px 20px rgba(0, 0, 0, 0.03)',
		},

		// ✅ Transitions (Smooth UI)
		transition: {
			duration: {
				fast: '0.15s',
				normal: '0.3s',
			},
			timing: 'ease-in-out',
		},

		// ✅ Border Widths (optional but helpful for fine-tuned control)
		borderWidth: {
			thin: '1px',
			base: '2px',
		},

		// ✅ Z-Index Layers (from your $z-index tokens)
		zIndex: {
			nav: 100,
			sidebar: 200,
			modal: 1000,
			tooltip: 1100,
		},

		// ✅ Opacity Tokens (for disabled states or overlays)
		opacity: {
			disabled: '0.6',
			muted: '0.4',
			overlay: '0.5',
		},

		// ✅ Focus ring outline (from $focus-ring SCSS)
		focusRing: {
			default: '0 0 0 3px rgba(66, 112, 244, 0.2)', // Matches $focus-ring
		},
	},
});

export default CustomTheme;
