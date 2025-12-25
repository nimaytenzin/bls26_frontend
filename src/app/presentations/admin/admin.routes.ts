import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { LayoutComponent } from '../../layout/layout.component';
import { AdminMasterDzongkhagsComponent } from './master-data/admin-master-dzongkhags/admin-master-dzongkhags.component';
import { AdminMasterAdministrativeZonesComponent } from './master-data/admin-master-administrative-zones/admin-master-administrative-zones.component';
import { AdminMasterSubAdministrativeZonesComponent } from './master-data/admin-master-sub-administrative-zones/admin-master-sub-administrative-zones.component';
import { AdminMasterEnumerationAreasComponent } from './master-data/admin-master-enumeration-areas/admin-master-enumeration-areas.component';
import { AdminAutoKmlUploadComponent } from './master-data/admin-auto-kml-upload/admin-auto-kml-upload.component';
import { AdminAutoHouseholdDataUploadByDzongkhagComponent } from './master-data/admin-auto-household-data-upload-by-dzongkhag/admin-auto-household-data-upload-by-dzongkhag.component';
import { AdminSazEaUploadComponent } from './master-data/admin-saz-ea-upload/admin-saz-ea-upload.component';
import { AdminMultiSazSingleEaUploadComponent } from './master-data/admin-multi-saz-single-ea-upload/admin-multi-saz-single-ea-upload.component';
import { AdminMasterSurveyComponent } from './survey/admin-master-survey/admin-master-survey.component';
import { AdminDzongkhagDataViewerComponent } from './data-viewer/admin-dzongkhag-data-viewer/admin-dzongkhag-data-viewer.component';
import { AdminAdminstrativeZoneDataViewerComponent } from './data-viewer/admin-adminstrative-zone-data-viewer/admin-adminstrative-zone-data-viewer.component';
import { AdminSubAdminstrativeZoneDataViewerComponent } from './data-viewer/admin-sub-adminstrative-zone-data-viewer/admin-sub-adminstrative-zone-data-viewer.component';
import { AdminEnumerationAreaDataViewerComponent } from './data-viewer/admin-enumeration-area-data-viewer/admin-enumeration-area-data-viewer.component';
import { AdminSurveyViewerComponent } from './survey/admin-survey-viewer/admin-survey-viewer.component';
import { AdminSurveyCreatorComponent } from './survey/survey-creator/admin-survey-creator.component';
import { AdminNationalDataViewerComponent } from './data-viewer/admin-national-data-viewer/admin-national-data-viewer.component';
import { AdminUserManagementComponent } from './user-mangement/admin-user-management/admin-user-management.component';
import { AdminPublicPageSettingsComponent } from './settings/admin-public-page-settings/admin-public-page-settings.component';
import { EaLineageViewerComponent } from './EA-Operations/history-tracking/ea-lineage-viewer/ea-lineage-viewer.component';
import { EaHistoryViewerComponent } from './EA-Operations/history-tracking/ea-history-viewer/ea-history-viewer.component';
import { EaSplitOperationComponent } from './EA-Operations/merge-split/ea-split-operation/ea-split-operation.component';
import { EaMergeOperationComponent } from './EA-Operations/merge-split/ea-merge-operation/ea-merge-operation.component';
import { AdminListSplittedEasComponent } from './EA-Operations/merge-split/admin-list-splitted-eas/admin-list-splitted-eas.component';
import { AdminListMergedEasComponent } from './EA-Operations/merge-split/admin-list-merged-eas/admin-list-merged-eas.component';

export const adminRoutes: Routes = [
	{
		path: 'admin',
		component: LayoutComponent,
		// canActivate: [AdminGuard],
		// canActivateChild: [AdminGuard],
		// data: { roles: [UserRole.ADMIN] },
		children: [
			{
				path: '',
				component: AdminNationalDataViewerComponent,
			},

			// User Management Routes
			{
				path: 'user-management',
				component: AdminUserManagementComponent,
			},

			// Settings Routes
			{
				path: 'settings',
				children: [
					{
						path: 'public-page',
						component: AdminPublicPageSettingsComponent,
					},
				],
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
						path: 'auto-kml-upload',
						component: AdminAutoKmlUploadComponent,
					},
					{
						path: 'auto-household-data-upload-by-dzongkhag',
						component: AdminAutoHouseholdDataUploadByDzongkhagComponent,
					},
					{
						path: 'saz-ea-upload',
						component: AdminSazEaUploadComponent,
					},
					{
						path: 'multi-saz-ea-upload',
						component: AdminMultiSazSingleEaUploadComponent,
					},
				],
			},
			{
				path: 'survey',
				children: [
					{
						path: '',
						component: AdminMasterSurveyComponent,
					},
					{
						path: 'master',
						component: AdminMasterSurveyComponent,
					},
					{
						path: 'create',
						component: AdminSurveyCreatorComponent,
					},
					{
						path: 'viewer',
						component: AdminSurveyViewerComponent,
					},
					{
						path: 'viewer/:id',
						component: AdminSurveyViewerComponent,
					},
					{
						path: 'details/:id',
						component: AdminSurveyViewerComponent,
					},
					{
						path: 'manage-areas/:id',
						component: AdminSurveyViewerComponent, // For now, reuse the same component
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
			{
				path: 'ea-operations',
				children: [
					{
						path: 'tracking/lineage/:id',
						component: EaLineageViewerComponent,
					},
					{
						path: 'tracking/history/:id',
						component: EaHistoryViewerComponent,
					},
					{
						path: 'split',
						component: AdminListSplittedEasComponent,
					},
					{
						path: 'merge',
						component: AdminListMergedEasComponent,
					},
				],
			},
			{
				path: 'reports',
				children: [
					{
						path: 'geographic-statistical-code',
						loadComponent: () =>
							import(
								'./reports/geographic-statistical-code/geographic-statistical-code.component'
							).then((m) => m.GeographicStatisticalCodeComponent),
					},
					// {
					// 	path: 'dzongkhag-ea-summary',
					// 	loadComponent: () =>
					// 		import(
					// 			'./reports/dzongkhag-ea-summary/dzongkhag-ea-summary.component'
					// 		).then((m) => m.DzongkhagEASummaryComponent),
					// },
				],
			},
		],
	},
];
