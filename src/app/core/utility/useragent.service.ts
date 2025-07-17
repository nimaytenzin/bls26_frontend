import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DeviceInfo {
	deviceType: string; // "mobile", "tablet", "desktop"
	operatingSystem: string; // "android", "ios", "windows", etc.
	country: string; // "United States", "India", etc.
	city: string; // "New York", "Mumbai", etc.
}

export interface GeoLocationResponse {
	country_name: string;
	city: string;
	region: string;
	ip: string;
}

@Injectable({
	providedIn: 'root',
})
export class UserAgentService {
	private cachedDeviceInfo: Partial<DeviceInfo> | null = null;
	private cachedGeoInfo: { country: string; city: string } | null = null;

	constructor(private http: HttpClient) {}

	/**
	 * Get complete device information including geolocation
	 */
	async getDeviceInfo(): Promise<DeviceInfo> {
		const userAgent = navigator.userAgent;

		// Get device and OS info
		const deviceType = this.getDeviceType(userAgent);
		const operatingSystem = this.getOperatingSystem(userAgent);

		// Get geolocation info
		const geoInfo = await this.getGeoLocation();

		const deviceInfo: DeviceInfo = {
			deviceType,
			operatingSystem,
			country: geoInfo.country,
			city: geoInfo.city,
		};

		this.cachedDeviceInfo = deviceInfo;
		return deviceInfo;
	}

	/**
	 * Get device type from user agent
	 */
	getDeviceType(userAgent: string = navigator.userAgent): string {
		const ua = userAgent.toLowerCase();

		// Check for tablet first (more specific)
		if (
			ua.includes('ipad') ||
			(ua.includes('android') && !ua.includes('mobile')) ||
			ua.includes('tablet') ||
			(ua.includes('touch') && ua.includes('tablet'))
		) {
			return 'tablet';
		}

		// Check for mobile
		if (
			ua.includes('mobile') ||
			ua.includes('iphone') ||
			ua.includes('ipod') ||
			ua.includes('android') ||
			ua.includes('blackberry') ||
			ua.includes('webos') ||
			ua.includes('windows phone')
		) {
			return 'mobile';
		}

		// Default to desktop
		return 'desktop';
	}

	/**
	 * Get operating system from user agent
	 */
	getOperatingSystem(userAgent: string = navigator.userAgent): string {
		const ua = userAgent.toLowerCase();

		// Mobile OS
		if (ua.includes('android')) return 'android';
		if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod'))
			return 'ios';
		if (ua.includes('windows phone')) return 'windows-mobile';
		if (ua.includes('blackberry')) return 'blackberry';
		if (ua.includes('webos')) return 'webos';

		// Desktop OS
		if (ua.includes('windows nt')) return 'windows';
		if (ua.includes('mac os x') || ua.includes('macos')) return 'macos';
		if (ua.includes('linux')) return 'linux';
		if (ua.includes('ubuntu')) return 'ubuntu';
		if (ua.includes('debian')) return 'debian';
		if (ua.includes('fedora')) return 'fedora';
		if (ua.includes('centos')) return 'centos';

		// Fallback
		return 'unknown';
	}

	/**
	 * Get geolocation information (country and city)
	 */
	private async getGeoLocation(): Promise<{ country: string; city: string }> {
		// Return cached data if available
		if (this.cachedGeoInfo) {
			return this.cachedGeoInfo;
		}

		try {
			// Try multiple free IP geolocation services
			const geoInfo = await this.tryGeoLocationServices();

			// Cache the result
			this.cachedGeoInfo = geoInfo;
			return geoInfo;
		} catch (error) {
			console.warn('Failed to get geolocation:', error);
			// Return default values if geolocation fails
			const defaultGeo = { country: 'Unknown', city: 'Unknown' };
			this.cachedGeoInfo = defaultGeo;
			return defaultGeo;
		}
	}

	/**
	 * Try multiple geolocation services
	 */
	private async tryGeoLocationServices(): Promise<{
		country: string;
		city: string;
	}> {
		const services = [
			'https://ipapi.co/json/',
			'https://ip-api.com/json/',
			'https://ipinfo.io/json',
		];

		for (const service of services) {
			try {
				const result = await this.fetchGeoData(service).toPromise();
				if (result) {
					return result;
				}
			} catch (error) {
				console.warn(`Failed to fetch from ${service}:`, error);
				continue;
			}
		}

		throw new Error('All geolocation services failed');
	}

	/**
	 * Fetch geolocation data from a specific service
	 */
	private fetchGeoData(
		url: string
	): Observable<{ country: string; city: string } | null> {
		return this.http.get<any>(url).pipe(
			map((response) => {
				// Handle different API response formats
				if (url.includes('ipapi.co')) {
					return {
						country: response.country_name || 'Unknown',
						city: response.city || 'Unknown',
					};
				} else if (url.includes('ip-api.com')) {
					return {
						country: response.country || 'Unknown',
						city: response.city || 'Unknown',
					};
				} else if (url.includes('ipinfo.io')) {
					return {
						country: response.country || 'Unknown',
						city: response.city || 'Unknown',
					};
				}
				return null;
			}),
			catchError((error) => {
				console.warn('Geolocation service error:', error);
				return of(null);
			})
		);
	}

	/**
	 * Get browser information
	 */
	getBrowserInfo(userAgent: string = navigator.userAgent): string {
		const ua = userAgent.toLowerCase();

		if (
			ua.includes('chrome') &&
			!ua.includes('chromium') &&
			!ua.includes('edg')
		)
			return 'chrome';
		if (ua.includes('firefox')) return 'firefox';
		if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
		if (ua.includes('edg')) return 'edge';
		if (ua.includes('opera') || ua.includes('opr')) return 'opera';
		if (ua.includes('ie') || ua.includes('trident')) return 'internet-explorer';

		return 'unknown';
	}

	/**
	 * Check if device is mobile
	 */
	isMobile(userAgent: string = navigator.userAgent): boolean {
		return this.getDeviceType(userAgent) === 'mobile';
	}

	/**
	 * Check if device is tablet
	 */
	isTablet(userAgent: string = navigator.userAgent): boolean {
		return this.getDeviceType(userAgent) === 'tablet';
	}

	/**
	 * Check if device is desktop
	 */
	isDesktop(userAgent: string = navigator.userAgent): boolean {
		return this.getDeviceType(userAgent) === 'desktop';
	}

	/**
	 * Get cached device info (synchronous)
	 */
	getCachedDeviceInfo(): Partial<DeviceInfo> | null {
		return this.cachedDeviceInfo;
	}

	/**
	 * Clear cached data
	 */
	clearCache(): void {
		this.cachedDeviceInfo = null;
		this.cachedGeoInfo = null;
	}

	/**
	 * Get device info for seat selection DTO
	 */
	async getDeviceInfoForSeatSelection(): Promise<{
		deviceType: string;
		operatingSystem: string;
		country: string;
		city: string;
	}> {
		const deviceInfo = await this.getDeviceInfo();
		return {
			deviceType: deviceInfo.deviceType,
			operatingSystem: deviceInfo.operatingSystem,
			country: deviceInfo.country,
			city: deviceInfo.city,
		};
	}
}
