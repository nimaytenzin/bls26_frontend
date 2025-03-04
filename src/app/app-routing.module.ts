import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { AdminLayoutComponent } from './presentations/layout/admin/admin-layout.component';
import { TenantLayoutComponent } from './presentations/layout/tenant/tenant-layout.component';
import { TenantProfileComponent } from './presentations/tenant/profile/tenant-profile.component';
import { OwnerLayoutComponent } from './presentations/layout/owner/owner-layout.component';
import { RoleGuard } from './core/guards/role.guard';
import { USERROLESENUM } from './core/constants/enums';
import { PrivacyComponent } from './privacy/privacy.component';

@NgModule({
    imports: [
        RouterModule.forRoot(
            [
                {
                    path: '',
                    loadChildren: () =>
                        import(
                            './presentations/public/public-routing.module'
                        ).then((m) => m.PublicRoutingModule),
                },
                {
                    path: 'privacy',
                    component: PrivacyComponent
                },
                {
                    path: 'auth',
                    loadChildren: () =>
                        import('./presentations/auth/auth.module').then(
                            (m) => m.AuthModule
                        ),
                },

                {
                    path: 'admin',
                    component: AdminLayoutComponent,
                    // canActivate: [RoleGuard],
                    // data: {
                    //     roles: [USERROLESENUM.ADMIN, USERROLESENUM.MANAGER],
                    // },
                    children: [
                        {
                            path: '',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/dashboard/admin-dashboard-routing.module'
                                ).then((m) => m.AdminDashboardRoutingModule),
                        },
                        {
                            path: 'master-properties',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/buildings/admin-master-properties-routing.module'
                                ).then(
                                    (m) => m.AdminMasterPropertiesRoutingModule
                                ),
                        },
                        {
                            path: 'master-roles',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/roles/admin-roles.routing.modules'
                                ).then((m) => m.AdminMasterRolesRoutingModule),
                        },
                        {
                            path: 'master-bank-accounts',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/bankaccounts/admin.bankaccount.routing.module'
                                ).then(
                                    (m) => m.AdminMasterBankAccountRoutingModule
                                ),
                        },

                        {
                            path: 'master-users',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/users/admin-user-routing.module'
                                ).then((m) => m.AdminUserRoutingModule),
                        },
                        {
                            path: 'master-locations',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/locations/admin-master-locations-routing.module'
                                ).then(
                                    (m) => m.AdminMasterPropertiesRoutingModule
                                ),
                        },
                        {
                            path: 'master-users',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/users/admin-user-routing.module'
                                ).then((m) => m.AdminUserRoutingModule),
                        },

                        {
                            path: 'master-lease',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/lease/admin-master-lease-agreements-routing.module'
                                ).then(
                                    (m) =>
                                        m.AdminMasterLeaseAgreementsRoutingModule
                                ),
                        },
                        {
                            path: 'master-transactions',
                            loadChildren: () =>
                                import(
                                    './presentations/admin/transactions/admin-transaction.routing.modules'
                                ).then(
                                    (m) => m.AdminMasterTransactionRoutingModule
                                ),
                        },
                    ],
                },

                {
                    path: 'tenant',
                    component: TenantLayoutComponent,
                    canActivate: [RoleGuard],
                    data: { roles: [USERROLESENUM.TENANT] },
                    children: [
                        {
                            path: '',
                            loadChildren: () =>
                                import(
                                    './presentations/tenant/dashboard/tenant-dashboard.routing.modules'
                                ).then((m) => m.TenantDashboardRoutingModule),
                        },
                        {
                            path: 'lease',
                            loadChildren: () =>
                                import(
                                    './presentations/tenant/lease/tenant-lease.routing.modules'
                                ).then((m) => m.TenantLeaseRoutingModule),
                        },
                        {
                            path: 'payments',
                            loadChildren: () =>
                                import(
                                    './presentations/tenant/payments/tenant-payments.routing.modules'
                                ).then((m) => m.TenantPaymentsRoutingModule),
                        },
                        {
                            path: 'maintenance',
                            loadChildren: () =>
                                import(
                                    './presentations/tenant/maintenance/tenant-maintenance.routing.modules'
                                ).then((m) => m.TenantMaintenanceRoutingModule),
                        },
                        {
                            path: 'notifications',
                            loadChildren: () =>
                                import(
                                    './presentations/tenant/notifications/tenant-notifications.routing.modules'
                                ).then(
                                    (m) => m.TenantNotificationsRoutingModule
                                ),
                        },
                        {
                            path: 'profile',
                            component: TenantProfileComponent,
                        },
                    ],
                },

                {
                    path: 'owner',
                    component: OwnerLayoutComponent,
                    canActivate: [RoleGuard],
                    data: { roles: [USERROLESENUM.OWNER] },
                    children: [
                        {
                            path: '',
                            loadChildren: () =>
                                import(
                                    './presentations/owner/dashboard/owner-dashboard.routing.modules'
                                ).then((m) => m.OwnerDashboardRoutingModule),
                        },
                        {
                            path: 'properties',
                            loadChildren: () =>
                                import(
                                    './presentations/owner/properties/owner-properties.routing.modules'
                                ).then((m) => m.OwnerPropertiesRoutingModule),
                        },
                    ],
                },
            ],
            {
                scrollPositionRestoration: 'enabled',
                anchorScrolling: 'enabled',
                onSameUrlNavigation: 'reload',
            }
        ),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
