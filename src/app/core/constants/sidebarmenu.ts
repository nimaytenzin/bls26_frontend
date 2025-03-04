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
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
        ],
    },

    {
        label: 'Properties',
        items: [
            {
                label: 'Owners',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-users/owners'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Thrams',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/thrams'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Plots',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/plots'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Buildings',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/list-buildings'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Units',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/units'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Search',
                icon: 'pi pi-fw pi-search',
                routerLink: ['/admin/master-properties/search'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Map View',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-properties/map-view'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
        ],
    },

    {
        label: 'Lease',
        items: [
            {
                label: 'Land Lease',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-lease/lands'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Building Lease',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-lease/buildings'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Unit Lease',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-lease/units'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Search',
                icon: 'pi pi-fw pi-search',
                routerLink: ['/admin/master-lease/search'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
        ],
    },

    {
        label: 'Transactions-Building',
        items: [
            {
                label: 'Rents',
                icon: 'pi pi-fw pi-file-excel',
                routerLink: ['/admin/master-transactions/building/rent'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Security Deposits',
                icon: 'pi pi-fw pi-file-excel',
                routerLink: [
                    '/admin/master-transactions/building/security-deposits',
                ],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },

            // {
            //     label: 'Receipts',
            //     icon: 'pi pi-fw pi-th-large',
            //     routerLink: ['/admin/master-transactions/invoices'],
            // },
            // {
            //     label: 'Remittance',
            //     icon: 'pi pi-fw pi-th-large',
            //     routerLink: ['/admin/master-transactions/invoices'],
            // },
        ],
    },

    {
        label: 'Transactions-Land',
        items: [
            {
                label: 'Rents',
                icon: 'pi pi-fw pi-file-excel',
                routerLink: ['/admin/master-transactions/land/rent'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            {
                label: 'Security Deposits',
                icon: 'pi pi-fw pi-file-excel',
                routerLink: [
                    '/admin/master-transactions/land/security-deposits',
                ],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },

            // {
            //     label: 'Receipts',
            //     icon: 'pi pi-fw pi-th-large',
            //     routerLink: ['/admin/master-transactions/invoices'],
            // },
            // {
            //     label: 'Remittance',
            //     icon: 'pi pi-fw pi-th-large',
            //     routerLink: ['/admin/master-transactions/invoices'],
            // },
        ],
    },

    {
        label: 'Transactions',
        items: [
            {
                label: 'Search Transactions',
                icon: 'pi pi-fw pi-search',
                routerLink: ['/admin/master-transactions/search'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
        ],
    },
    {
        label: 'Users',
        items: [
            {
                label: 'Managers',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-users/managers'],
                roles: [USERROLESENUM.ADMIN],
            },

            {
                label: 'Tenants',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-users/tenants'],
                roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
            },
            // {
            //     label: 'Admins',
            //     icon: 'pi pi-fw pi-th-large',
            //     routerLink: ['/admin/master-users/admins'],
            // },
        ],
    },

    {
        label: 'Locations',
        items: [
            {
                label: 'Dzongkhags',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-locations/dzongkhags'],
                roles: [USERROLESENUM.ADMIN],
            },
            {
                label: 'Administrative Zones',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-locations/adm-zones'],
                roles: [USERROLESENUM.ADMIN],
            },
            {
                label: 'SubAdministrative Zones',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-locations/subadm-zones'],
                roles: [USERROLESENUM.ADMIN],
            },
        ],
    },

    {
        label: 'System',
        items: [
            {
                label: 'Roles',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-roles'],
                roles: [USERROLESENUM.ADMIN],
            },
            {
                label: 'Bank Accounts',
                icon: 'pi pi-fw pi-th-large',
                routerLink: ['/admin/master-bank-accounts'],
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
