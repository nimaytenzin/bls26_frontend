export enum USERROLESENUM {
	'ADMIN' = 'ADMIN',
	'SUPERVISOR' = 'SUPERVISOR',
	'ENUMERATOR' = 'ENUMERATOR',
}

// Admin Sidebar Menu - aligned with admin.routes.ts
export const ADMINSIDEBARITEMS = [
	{
		label: 'Dashboard',
		items: [
			{
				label: 'Dashboard',
				icon: 'pi pi-fw pi-chart-bar',
				routerLink: ['/admin'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Sampled Enumeration Areas',
				icon: 'pi pi-fw pi-home',
				routerLink: ['/admin/master/dzongkhags'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	 
	{
		label: 'User Management',
		items: [
			{
				label: 'Users',
				icon: 'pi pi-fw pi-users',
				routerLink: ['/admin/user-management'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
];

// Supervisor Menu - Survey field operations and data submission
export const SUPERVISORMENUSIDEBARITEMS = [
	{
		label: 'Dashboard',
		items: [
			{
				label: 'Surveys',
				icon: 'pi pi-fw pi-list-check',
				routerLink: ['/supervisor/survey/active'],
				roles: [USERROLESENUM.SUPERVISOR],
			},
		],
	},
];

// Enumerator Menu - Field data collection (aligned with enumerator routes: dashboard + EA map/households)
export const ENUMERATORMENUSIDEBARITEMS = [
	{
		label: 'Dashboard',
		items: [
			{
				label: 'My Dashboard',
				icon: 'pi pi-fw pi-home',
				routerLink: ['/enumerator'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
		],
	},
];
