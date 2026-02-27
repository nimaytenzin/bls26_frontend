import { Routes } from '@angular/router';
import { LayoutComponent } from '../../layout/layout.component';
import { AdminNationalDataViewerComponent } from './data-viewer/admin-national-data-viewer/admin-national-data-viewer.component';
import { AdminUserManagementComponent } from './user-mangement/admin-user-management/admin-user-management.component';
import { AdminMasterDzongkhagsComponent } from './master-data/admin-master-dzongkhags/admin-master-dzongkhags.component';
import { AdminMasterEnumerationAreasComponent } from './master-data/admin-master-enumeration-areas/admin-master-enumeration-areas.component';
import { AdminEnumerationAreaDataViewerComponent } from './data-viewer/admin-enumeration-area-data-viewer/admin-enumeration-area-data-viewer.component';

export const adminRoutes: Routes = [
	{
		path: 'admin',
		component: LayoutComponent,
		children: [
			{ path: '', component: AdminNationalDataViewerComponent },
			{ path: 'user-management', component: AdminUserManagementComponent },
			{
				path: 'master',
				children: [
					{ path: 'dzongkhags', component: AdminMasterDzongkhagsComponent },
					{ path: 'enumeration-areas', component: AdminMasterEnumerationAreasComponent },
				],
			},
			{
				path: 'data-view',
				children: [
 					{ path: 'eazone/:id', component: AdminEnumerationAreaDataViewerComponent },
					 { path: 'dzongkhag/:id', component: AdminEnumerationAreaDataViewerComponent },
				],
			},
			 
		],
	},
];
