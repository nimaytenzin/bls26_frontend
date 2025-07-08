import { BASEAPI_URL } from '../constants/constants';

export function GETMEDIAURL(uri: string): string {
	return `${BASEAPI_URL}${uri}`;
}
export function generateSeatStyle(baseHex: string): {
	backgroundColor: string;
	border: string;
	color: string;
} {
	const borderAlpha = 1;
	const bgAlpha = 0.9;
	const textColor = '#ffffff';

	function hexToRgb(hex: string) {
		hex = hex.replace('#', '');
		if (hex.length === 3) {
			hex = hex
				.split('')
				.map((c) => c + c)
				.join('');
		}
		const bigint = parseInt(hex, 16);
		return {
			r: (bigint >> 16) & 255,
			g: (bigint >> 8) & 255,
			b: bigint & 255,
		};
	}

	function rgba(
		{ r, g, b }: { r: number; g: number; b: number },
		alpha: number
	): string {
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const rgb = hexToRgb(baseHex);

	return {
		backgroundColor: rgba(rgb, bgAlpha),
		border: `2px solid ${rgba(rgb, borderAlpha)}`,
		color: textColor,
	};
}
