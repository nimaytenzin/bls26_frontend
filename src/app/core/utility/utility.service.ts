import { EnumerationArea } from '../dataservice/location/enumeration-area/enumeration-area.dto';

export function GenerateFullEACode(enumArea: EnumerationArea): string {
	const parts: string[] = [];

	// Use first SAZ if multiple exist (for backward compatibility)
	const firstSaz = enumArea.subAdministrativeZones && enumArea.subAdministrativeZones.length > 0
		? enumArea.subAdministrativeZones[0]
		: null;

	// Check and add Dzongkhag code
	if (firstSaz?.administrativeZone?.dzongkhag) {
		parts.push(
			firstSaz.administrativeZone.dzongkhag.areaCode
		);
	} else {
		return 'Missing Dzongkhag';
	}

	// Check and add Administrative Zone code (Gewog or Thromde)
	if (firstSaz?.administrativeZone) {
		parts.push(firstSaz.administrativeZone.areaCode);
	} else {
		return 'Missing Gewog/Thromde';
	}

	// Check and add Sub-Administrative Zone code (Lap or Chiwog)
	if (firstSaz?.areaCode) {
		parts.push(firstSaz.areaCode);
	} else {
		return 'Missing Lap/Chiwog';
	}

	// Check and add Enumeration Area code
	if (enumArea) {
		parts.push(enumArea.areaCode);
	} else {
		return 'Missing Enumeration Area';
	}

	return parts.length > 0 ? parts.join('') : 'N/A';
}
