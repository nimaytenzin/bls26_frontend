interface SeatSelectionConfig {
	maxSeats: number;
	allowMultipleSelection: boolean;
	showPrices: boolean;
	enableSessionManagement: boolean;
	refreshIntervalSeconds: number; // in secondsrefreshIntervalSeconds
	sessionTimeoutSeconds: number; // in seconds
}

export const SEATSELECTIONCONFIG: SeatSelectionConfig = {
	maxSeats: 10,
	allowMultipleSelection: true,
	showPrices: true,
	enableSessionManagement: true,
	refreshIntervalSeconds: 30000, // 30 seconds
	sessionTimeoutSeconds: 3600, // 1 hour in seconds
};

export const SEATSELECTIONCONFIG_PUBLIC: SeatSelectionConfig = {
	maxSeats: 5,
	allowMultipleSelection: true,
	showPrices: true,
	enableSessionManagement: false,
	refreshIntervalSeconds: 60,
	sessionTimeoutSeconds: 300,
};
