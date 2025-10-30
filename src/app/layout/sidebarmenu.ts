export enum USERROLESENUM {
	'ADMIN' = 'ADMIN',
	'THEATRE_MANAGER' = 'THEATRE_MANAGER',
	'EXECUTIVE_PRODUCER' = 'EXECUTIVE_PRODUCER',
	'COUNTER_STAFF' = 'COUNTER_STAFF',
	'CUSTOMER' = 'CUSTOMER',
	// Legacy roles - keeping for backward compatibility
	'OWNER' = 'OWNER',
	'TENANT' = 'TENANT',
	'SUPERADMIN' = 'SUPERADMIN',
	'MANAGER' = 'MANAGER',
}
// Admin Sidebar Menu - Full system access
export const ADMINSIDEBARITEMS = [
	{
		label: 'Dashboard',
		items: [
			{
				label: 'Overview',
				icon: 'pi pi-fw pi-chart-bar',
				routerLink: ['/admin'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'Data Viewer',
		items: [
			{
				label: 'Dzongkhag  Viewer',
				icon: 'pi pi-fw pi-plus-circle',
				routerLink: ['/admin/master-bookings/create'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Admin Zone Viewer',
				icon: 'pi pi-fw pi-plus-circle',
				routerLink: ['/admin/master-bookings/create'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Sub Adm Zone  Viewer',
				icon: 'pi pi-fw pi-plus-circle',
				routerLink: ['/admin/master-bookings/create'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'EA Zone  Viewer',
				icon: 'pi pi-fw pi-plus-circle',
				routerLink: ['/admin/master-bookings/create'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'Master Data',
		items: [
			{
				label: 'Dzongkhags',
				icon: 'pi pi-fw pi-map',
				routerLink: ['/admin/master/dzongkhags'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Administrative Zones',
				icon: 'pi pi-fw pi-map-marker',
				routerLink: ['/admin/master/administrative-zones'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Sub Administrative Zones',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master/sub-administrative-zones'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Enumeration Areas',
				icon: 'pi pi-fw pi-sitemap',
				routerLink: ['/admin/master/enumeration-areas'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Current Listings',
				icon: 'pi pi-fw pi-ticket',
				routerLink: ['/admin/master/current-household-listings'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'Survey Manager',
		items: [
			{
				label: 'Surveys',
				icon: 'pi pi-fw pi-list-check',
				routerLink: ['/admin/survey/master'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'User Management',
		items: [
			{
				label: 'Admin',
				icon: 'pi pi-fw pi-users',
				routerLink: ['/admin/user-management'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Admin',
				icon: 'pi pi-fw pi-users',
				routerLink: ['/admin/user-management'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'Transactions',
		items: [
			{
				label: 'Transactions',
				icon: 'pi pi-fw pi-credit-card',
				routerLink: ['/admin/master-transactions'],
				roles: [USERROLESENUM.ADMIN],
			},
			// {
			// 	label: 'Payouts',
			// 	icon: 'pi pi-fw pi-credit-card',
			// 	routerLink: ['/admin/master-payout-settings'],
			// 	roles: [USERROLESENUM.ADMIN],
			// },
		],
	},
	{
		label: 'System Configuration',
		items: [
			{
				label: 'Locations',
				icon: 'pi pi-fw pi-map-marker',
				routerLink: ['/admin/master-locations'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Languages',
				icon: 'pi pi-fw pi-globe',
				routerLink: ['/admin/master-languages'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Genres',
				icon: 'pi pi-fw pi-tags',
				routerLink: ['/admin/master-genres'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
];

// Theatre Manager Sidebar Menu - Theatre-specific management
export const THEATREMANAGERSIDEBARITEMS = [
	{
		label: 'Dashboard',
		items: [
			{
				label: 'Theatre Overview',
				icon: 'pi pi-fw pi-chart-bar',
				routerLink: ['/theatre-manager'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
			{
				label: 'Performance Analytics',
				icon: 'pi pi-fw pi-chart-line',
				routerLink: ['/theatre-manager/analytics'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
		],
	},
	{
		label: 'Theatre Operations',
		items: [
			{
				label: 'My Theatres',
				icon: 'pi pi-fw pi-building',
				routerLink: ['/theatre-manager/theatres'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
			{
				label: 'Hall Management',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/theatre-manager/halls'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
			{
				label: 'Screenings',
				icon: 'pi pi-fw pi-calendar',
				routerLink: ['/theatre-manager/screenings'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
		],
	},
	{
		label: 'Bookings & Sales',
		items: [
			{
				label: 'Bookings',
				icon: 'pi pi-fw pi-ticket',
				routerLink: ['/theatre-manager/bookings'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
			{
				label: 'Walk-in Sales',
				icon: 'pi pi-fw pi-shopping-cart',
				routerLink: ['/theatre-manager/walk-in-sales'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
			{
				label: 'Reports',
				icon: 'pi pi-fw pi-file-pdf',
				routerLink: ['/theatre-manager/reports'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
		],
	},
	{
		label: 'Staff Management',
		items: [
			{
				label: 'Counter Staff',
				icon: 'pi pi-fw pi-users',
				routerLink: ['/theatre-manager/counter-staff'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
			{
				label: 'Staff Schedules',
				icon: 'pi pi-fw pi-calendar-plus',
				routerLink: ['/theatre-manager/staff-schedules'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
		],
	},
	{
		label: 'Profile',
		items: [
			{
				label: 'My Profile',
				icon: 'pi pi-fw pi-user',
				routerLink: ['/theatre-manager/profile'],
				roles: [USERROLESENUM.THEATRE_MANAGER],
			},
		],
	},
];

// Executive Producer Sidebar Menu - Content and financial management
export const EXECUTIVEPRODUCERSIDEBARITEMS = [
	{
		label: 'Dashboard',
		items: [
			{
				label: 'Overview',
				icon: 'pi pi-fw pi-chart-bar',
				routerLink: ['/executive-producer'],
				roles: [USERROLESENUM.EXECUTIVE_PRODUCER],
			},
		],
	},
	{
		label: 'Content Management',
		items: [
			{
				label: 'Movies',
				icon: 'pi pi-fw pi-video',
				routerLink: ['/executive-producer/movies'],
				roles: [USERROLESENUM.EXECUTIVE_PRODUCER],
			},
			{
				label: 'Screenings',
				icon: 'pi pi-fw pi-calendar',
				routerLink: ['/executive-producer/screenings'],
				roles: [USERROLESENUM.EXECUTIVE_PRODUCER],
			},
		],
	},
	{
		label: 'Operations',
		items: [
			{
				label: 'Bookings',
				icon: 'pi pi-fw pi-ticket',
				routerLink: ['/executive-producer/bookings'],
				roles: [USERROLESENUM.EXECUTIVE_PRODUCER],
			},
		],
	},
	{
		label: 'Financial Management',
		items: [
			{
				label: 'Revenue',
				icon: 'pi pi-fw pi-money-bill',
				routerLink: ['/executive-producer/revenue'],
				roles: [USERROLESENUM.EXECUTIVE_PRODUCER],
			},
		],
	},
];

// Counter Staff Sidebar Menu - Basic operations
export const COUNTERSTAFFSIDEBARITEMS = [
	{
		label: 'Ticket Operations',
		items: [
			{
				label: 'Sell Tickets',
				icon: 'pi pi-fw pi-shopping-cart',
				routerLink: ['/counter-staff/sell-tickets'],
				roles: [USERROLESENUM.COUNTER_STAFF],
			},
			{
				label: 'Check Bookings',
				icon: 'pi pi-fw pi-search',
				routerLink: ['/counter-staff/check-bookings'],
				roles: [USERROLESENUM.COUNTER_STAFF],
			},
			{
				label: 'Scan Ticket',
				icon: 'pi pi-fw pi-barcode',
				routerLink: ['/counter-staff/scan-ticket'],
				roles: [USERROLESENUM.COUNTER_STAFF],
			},
		],
	},
];

export const OWNERSIDEBARITEMS = [
	{
		label: 'Home',
		items: [
			{
				label: 'Dashboard',
				icon: 'pi pi-fw pi-home',
				routerLink: ['/owner'],
			},
		],
	},
	{
		label: 'Properties',
		items: [
			{
				label: 'Thram & Plots',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/owner/properties'],
			},
			{
				label: 'Building & Units',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/owner/properties'],
			},
		],
	},

	{
		label: 'Lease',
		items: [
			{
				label: 'Listing',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/owner/lease'],
			},
		],
	},
	{
		label: 'Payments',
		items: [
			{
				label: 'Payments',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/owner/payments'],
			},
			{
				label: 'Invoices',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/owner/payments'],
			},
		],
	},
];
