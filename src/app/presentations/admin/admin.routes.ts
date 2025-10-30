import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { LayoutComponent } from '../../layout/layout.component';
import { AdminUserManagementComponent } from './user-mangement/admin-user-management/admin-user-management.component';
import { AdminMasterDzongkhagsComponent } from './master-data/admin-master-dzongkhags/admin-master-dzongkhags.component';
import { AdminMasterAdministrativeZonesComponent } from './master-data/admin-master-administrative-zones/admin-master-administrative-zones.component';
import { AdminMasterSubAdministrativeZonesComponent } from './master-data/admin-master-sub-administrative-zones/admin-master-sub-administrative-zones.component';
import { AdminMasterEnumerationAreasComponent } from './master-data/admin-master-enumeration-areas/admin-master-enumeration-areas.component';
import { AdminMasterCurrentHouseholdListingsComponent } from './master-data/admin-master-current-household-listings/admin-master-current-household-listings.component';
import { AdminMasterSurveyComponent } from './survey/admin-master-survey/admin-master-survey.component';
import { AdminDzongkhagDataViewerComponent } from './data-viewer/admin-dzongkhag-data-viewer/admin-dzongkhag-data-viewer.component';
import { AdminAdminstrativeZoneDataViewerComponent } from './data-viewer/admin-adminstrative-zone-data-viewer/admin-adminstrative-zone-data-viewer.component';
import { AdminSubAdminstrativeZoneDataViewerComponent } from './data-viewer/admin-sub-adminstrative-zone-data-viewer/admin-sub-adminstrative-zone-data-viewer.component';
import { AdminEnumerationAreaDataViewerComponent } from './data-viewer/admin-enumeration-area-data-viewer/admin-enumeration-area-data-viewer.component';

export const adminRoutes: Routes = [
	{
		path: 'admin',
		component: LayoutComponent,
		// canActivate: [AdminGuard],
		// canActivateChild: [AdminGuard],
		// data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
		children: [
			{
				path: '',
				component: AdminDashboardComponent,
			},

			// User Management Routes
			{
				path: 'user-management',
				component: AdminUserManagementComponent,
			},

			//Mater data managmenet
			{
				path: 'master',
				children: [
					{
						path: 'dzongkhags',
						component: AdminMasterDzongkhagsComponent,
					},
					{
						path: 'administrative-zones',
						component: AdminMasterAdministrativeZonesComponent,
					},
					{
						path: 'sub-administrative-zones',
						component: AdminMasterSubAdministrativeZonesComponent,
					},
					{
						path: 'enumeration-areas',
						component: AdminMasterEnumerationAreasComponent,
					},
					{
						path: 'current-household-listings',
						component: AdminMasterCurrentHouseholdListingsComponent,
					},
				],
			},
			{
				path: 'survey',
				children: [
					{
						path: 'master',
						component: AdminMasterSurveyComponent,
					},
				],
			},

			{
				path: 'data-view',
				children: [
					{
						path: 'dzongkhag/:id',
						component: AdminDzongkhagDataViewerComponent,
					},
					{
						path: 'admzone/:id',
						component: AdminAdminstrativeZoneDataViewerComponent,
					},
					{
						path: 'sub-admzone/:id',
						component: AdminSubAdminstrativeZoneDataViewerComponent,
					},
					{
						path: 'eazone/:id',
						component: AdminEnumerationAreaDataViewerComponent,
					},
				],
			},
		],
	},
];
