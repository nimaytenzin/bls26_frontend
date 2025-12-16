export enum USERROLESENUM {
	'ADMIN' = 'ADMIN',
	'SUPERVISOR' = 'SUPERVISOR',
	'ENUMERATOR' = 'ENUMERATOR',
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
		label: 'Survey Management',
		items: [
			{
				label: 'All Surveys',
				icon: 'pi pi-fw pi-list-check',
				routerLink: ['/admin/survey/master'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Create Survey',
				icon: 'pi pi-fw pi-plus-circle',
				routerLink: ['/admin/survey/create'],
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
				label: 'Gewog/Thromdes',
				icon: 'pi pi-fw pi-map-marker',
				routerLink: ['/admin/master/administrative-zones'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Chiwogs/LAPs',
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
			
		],
	},
	{

		label: 'Data Management',
		items: [
			{
				label: 'Auto KML Upload',
				icon: 'pi pi-fw pi-cloud-upload',
				routerLink: ['/admin/master/auto-kml-upload'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Auto Household Data Upload by Dzongkhag',
				icon: 'pi pi-fw pi-upload',
				routerLink: ['/admin/master/auto-household-data-upload-by-dzongkhag'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Single SAZ + EA Uploader',
				icon: 'pi pi-fw pi-upload',
				routerLink: ['/admin/master/saz-ea-upload'],
				roles: [USERROLESENUM.ADMIN],
			},
			{
				label: 'Two SAZs + EA Uploader',
				icon: 'pi pi-fw pi-upload',
				routerLink: ['/admin/master/two-sazs-ea-upload'],
				roles: [USERROLESENUM.ADMIN],
			},
		 
		],
	},
	{
		label: 'User Management',
		items: [
			{
				label: 'User Management',
				icon: 'pi pi-fw pi-shield',
				routerLink: ['/admin/user-management'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'Settings',
		items: [
			{
				label: 'Public Page Settings',
				icon: 'pi pi-fw pi-cog',
				routerLink: ['/admin/settings/public-page'],
				roles: [USERROLESENUM.ADMIN],
			},
		],
	},
	{
		label: 'Download',
		items: [
			{
				label: 'Download Data',
				icon: 'pi pi-fw pi-download',
				routerLink: ['/admin/reports/statistics'],
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
				label: 'Overview',
				icon: 'pi pi-fw pi-chart-bar',
				routerLink: ['/supervisor'],
				roles: [USERROLESENUM.SUPERVISOR],
			},
		],
	},
	{
		label: 'My Surveys',
		items: [
			{
				label: 'Active Surveys',
				icon: 'pi pi-fw pi-list-check',
				routerLink: ['/supervisor/survey/active'],
				roles: [USERROLESENUM.SUPERVISOR],
			},
		],
	},
];

// Enumerator Sidebar Menu - Field data collection
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
	{
		label: 'My Assignments',
		items: [
			{
				label: 'Active Surveys',
				icon: 'pi pi-fw pi-list-check',
				routerLink: ['/enumerator/surveys'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
			{
				label: 'Assigned Areas',
				icon: 'pi pi-fw pi-map-marker',
				routerLink: ['/enumerator/areas'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
		],
	},
	{
		label: 'Data Collection',
		items: [
			{
				label: 'Download Templates',
				icon: 'pi pi-fw pi-download',
				routerLink: ['/enumerator/templates'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
			{
				label: 'Add Household',
				icon: 'pi pi-fw pi-plus-circle',
				routerLink: ['/enumerator/household/add'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
			{
				label: 'My Submissions',
				icon: 'pi pi-fw pi-check-circle',
				routerLink: ['/enumerator/submissions'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
		],
	},
	{
		label: 'Household Listings',
		items: [
			{
				label: 'View All',
				icon: 'pi pi-fw pi-list',
				routerLink: ['/enumerator/households'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
			{
				label: 'Search Household',
				icon: 'pi pi-fw pi-search',
				routerLink: ['/enumerator/households/search'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
		],
	},
	{
		label: 'Progress',
		items: [
			{
				label: 'My Statistics',
				icon: 'pi pi-fw pi-chart-bar',
				routerLink: ['/enumerator/statistics'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
			{
				label: 'Collection Progress',
				icon: 'pi pi-fw pi-percentage',
				routerLink: ['/enumerator/progress'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
		],
	},
	{
		label: 'Profile',
		items: [
			{
				label: 'My Profile',
				icon: 'pi pi-fw pi-user',
				routerLink: ['/enumerator/profile'],
				roles: [USERROLESENUM.ENUMERATOR],
			},
		],
	},
];
