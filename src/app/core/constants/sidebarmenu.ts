import { USERROLESENUM } from './enums';

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
            },
        ],
    },

    {
        label: 'Management',
        items: [
            {
                label: 'Facility',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/facility'],
            },
            {
                label: 'Classes',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/class'],
            },
            {
                label: 'Facilitators',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/students'],
            },
            {
                label: 'Attendance',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/attendance'],
            },
            {
                label: 'Students',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/student/detailed'],
            },

            {
                label: 'Infrastructure',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/students'],
            },
        ],
    },

    {
        label: 'Payments',
        items: [
            {
                label: 'Package Setup',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/package'],
            },
            {
                label: 'Accounting Tool',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/accounting'],
            },
            // {
            //     label: 'Payments',
            //     icon: 'pi pi-fw pi-th-large',
            //     routerLink: ['/admin/master-lease/lands'],
            //     roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            // },
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
                label: 'Listings',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/owner/properties'],
            },
            {
                label: 'Search',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/search'],
            },
            {
                label: 'Map View',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/map'],
            },
        ],
    },

    {
        label: 'Tenants',
        items: [
            {
                label: 'Listing',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-users/tenants'],
            },
            {
                label: 'Search',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-users/admins'],
            },
        ],
    },
    {
        label: 'Lease',
        items: [
            {
                label: 'Lease Agreements',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-lease'],
            },
        ],
    },
    {
        label: 'Transactions',
        items: [
            {
                label: 'Rental Payments',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-transactions/invoices'],
            },
        ],
    },
    {
        label: 'Tools',
        items: [
            {
                label: 'Rental Income Report Generator',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-dzongkhags'],
            },
            {
                label: 'Property Tax Report Generator',
                icon: 'pi pi-fw pi-building',
                routerLink: ['/admin/master-admzones'],
            },
        ],
    },
];
