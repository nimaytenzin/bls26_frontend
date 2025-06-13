import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminMasterMoviesComponent } from './movie/admin-master-movies/admin-master-movies.component';
import { AdminMasterTheatreComponent } from './theatre/admin-master-theatre/admin-master-theatre.component';
import { AdminMasterLanguageComponent } from './master/admin-master-language/admin-master-language.component';

export const adminRoutes: Routes = [
	{
		path: 'admin',
		component: LayoutComponent,
		children: [
			{
				path: '',
				component: AdminDashboardComponent,
			},
			{
				path: 'master-movies',
				component: AdminMasterMoviesComponent,
			},
			{
				path: 'master-theatres',
				component: AdminMasterTheatreComponent,
			},

			//master tables
			{
				path: 'master-languages',
				component: AdminMasterLanguageComponent,
			},
		],
	},
];
