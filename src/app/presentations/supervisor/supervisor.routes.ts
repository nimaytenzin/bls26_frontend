import { Routes } from '@angular/router';
import { LayoutComponent } from '../../layout/layout.component';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard.component';
import { SupervisorActiveSurveysComponent } from './survey-management/supervisor-active-surveys/supervisor-active-surveys.component';
import { SupervisorSurveyDetailedViewComponent } from './survey-management/supervisor-survey-detailed-view/supervisor-survey-detailed-view.component';
import { UserRole } from '../../core/dataservice/auth/auth.interface';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminDzongkhagDataViewerComponent } from '../admin/data-viewer/admin-dzongkhag-data-viewer/admin-dzongkhag-data-viewer.component';
import { AdminDashboardComponent } from '../admin/dashboard/admin-dashboard.component';
import { AdminNationalDataViewerComponent } from '../admin/data-viewer/admin-national-data-viewer/admin-national-data-viewer.component';

export const supervisorRoutes: Routes = [
	{
		path: 'supervisor',
		component: LayoutComponent,
		canActivate: [AuthGuard],
		canActivateChild: [AuthGuard],
		data: { roles: [UserRole.SUPERVISOR] },
		children: [
			{ path: '', component: SupervisorActiveSurveysComponent },
			{
				path: 'survey',
				children: [
					{ path: 'active', component: SupervisorActiveSurveysComponent },
					{
						path: 'detailed/:surveyId',
						component: SupervisorSurveyDetailedViewComponent,
					},
					{
						path: '',
						redirectTo: 'active',
						pathMatch: 'full',
					},
				],
			},
		],
	},
];
