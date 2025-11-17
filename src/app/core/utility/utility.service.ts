import { EnumerationArea } from '../dataservice/location/enumeration-area/enumeration-area.dto';

export function GenerateFullEACode(enumArea: EnumerationArea): string {
	const parts: string[] = [];

	// Check and add Dzongkhag code
	if (enumArea.subAdministrativeZone?.administrativeZone?.dzongkhag) {
		parts.push(
			enumArea.subAdministrativeZone.administrativeZone.dzongkhag.areaCode
		);
	} else {
		return 'Missing Dzongkhag';
	}

	// Check and add Administrative Zone code (Gewog or Thromde)
	if (enumArea.subAdministrativeZone?.administrativeZone) {
		parts.push(enumArea.subAdministrativeZone.administrativeZone.areaCode);
	} else {
		return 'Missing Gewog/Thromde';
	}

	// Check and add Sub-Administrative Zone code (Lap or Chiwog)
	if (enumArea.subAdministrativeZone?.areaCode) {
		parts.push(enumArea.subAdministrativeZone?.areaCode);
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
