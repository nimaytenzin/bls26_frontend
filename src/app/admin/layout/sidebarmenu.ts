export enum USERROLESENUM {
	'OWNER' = 'OWNER',
	'TENANT' = 'TENANT',
	'ADMIN' = 'ADMIN',
	'SUPERADMIN' = 'SUPERADMIN',
	'MANAGER' = 'MANAGER',
}
export const TENANTSIDEBARITEMS = [
	{
		label: 'Home',
		items: [
			{
				label: 'Dashboard',
				icon: 'pi pi-fw pi-home',
				routerLink: ['/tenant'],
			},
			{
				label: 'Lease',
				icon: 'pi pi-fw pi-file-o',
				routerLink: ['/tenant/lease'],
			},
			{
				label: 'Payments',
				icon: 'pi pi-fw pi-money-bill',
				routerLink: ['/tenant/payments'],
			},
			{
				label: 'Notifications',
				icon: 'pi pi-fw pi-bell',
				routerLink: ['/tenant/notifications'],
			},

			{
				label: 'Profile',
				icon: 'pi pi-fw pi-user',
				routerLink: ['/tenant/profile'],
			},
		],
	},
];

export const ADMINSIDEBARITEMS = [
	{
		label: 'Home',
		items: [
			{
				label: 'Dashboard',
				icon: 'pi pi-fw pi-home',
				routerLink: ['/admin'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
		],
	},

	{
		label: 'Manage',
		items: [
			{
				label: 'Movies',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-movies'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
			{
				label: 'Theatres & Halls',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-theatres'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},

			{
				label: 'Screenings',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-theatres'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
			{
				label: 'Search',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-properties/list-buildings'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
		],
	},

	{
		label: 'Users',
		items: [
			{
				label: 'Producers & Directors',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-lease/lands'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
			{
				label: 'Counter Staffss',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-lease/buildings'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
			{
				label: 'Admins',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-lease/units'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
		],
	},

	{
		label: 'Settings',
		items: [
			{
				label: 'Payout Settings',
				icon: 'pi pi-fw pi-file-excel',
				routerLink: ['/admin/master-transactions/building/rent/monthly'],
				roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
			},
		],
	},

	{
		label: 'Master Tables',
		items: [
			{
				label: 'Locations',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-locations/dzongkhags'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Languages',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-languages'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},

	{
		label: 'Hall Layout Designer',
		items: [
			{
				label: 'Design',
				icon: 'pi pi-fw pi-th-large',
				routerLink: ['/admin/master-roles'],
				roles: [USERROLESENUM.ADMIN],
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
