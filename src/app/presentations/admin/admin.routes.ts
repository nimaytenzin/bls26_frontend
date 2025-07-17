import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminMasterMoviesComponent } from './movie/admin-master-movies/admin-master-movies.component';
import { AdminMovieDetailComponent } from './movie/admin-movie-detail/admin-movie-detail.component';
import { AdminMasterTheatreComponent } from './theatre-hall/admin-master-theatre/admin-master-theatre.component';
import { AdminMasterLanguageComponent } from './master/admin-master-language/admin-master-language.component';
import { LayoutComponent } from '../../layout/layout.component';
import { AdminMasterGenreComponent } from './master/admin-master-genre/admin-master-genre.component';
import { AdminMasterLocationsComponent } from './master/admin-master-locations/admin-master-locations.component';
import { AdminMasterScreeningComponent } from './screening/admin-master-screening/admin-master-screening.component';
import { AdminMasterBookingsComponent } from './booking/admin-master-bookings/admin-master-bookings.component';
import { AdminCreateBookingComponent } from './booking/components/admin-create-booking/admin-create-booking.component';
import { AdminUserManagementComponent } from './user-mangement/admin-user-management/admin-user-management.component';

import { AdminMasterPayoutSettingsComponent } from './payouts/admin-master-payout-settings/admin-master-payout-settings.component';
import { AdminMasterTransactionComponent } from './transactions/admin-master-transaction/admin-master-transaction.component';

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
			{
				path: 'master-movies',
				component: AdminMasterMoviesComponent,
			},
			{
				path: 'master-movies/:id',
				component: AdminMovieDetailComponent,
			},
			{
				path: 'master-movies/:id/edit',
				component: AdminMovieDetailComponent,
				data: { editMode: true },
			},
			{
				path: 'master-movies/:id/media',
				component: AdminMovieDetailComponent,
				data: { mediaMode: true },
			},
			{
				path: 'master-theatres',
				component: AdminMasterTheatreComponent,
			},

			{
				path: 'master-screenings',
				component: AdminMasterScreeningComponent,
			},
			{
				path: 'master-bookings',
				component: AdminMasterBookingsComponent,
			},
			{
				path: 'master-bookings/create',
				component: AdminCreateBookingComponent,
			},
			{
				path: 'master-transactions',
				component: AdminMasterTransactionComponent,
			},

			// User Management Routes
			{
				path: 'user-management',
				component: AdminUserManagementComponent,
			},

			//master tables
			{
				path: 'master-languages',
				component: AdminMasterLanguageComponent,
			},
			{
				path: 'master-genres',
				component: AdminMasterGenreComponent,
			},
			{
				path: 'master-locations',
				component: AdminMasterLocationsComponent,
			},
			{
				path: 'master-casts',
				component: AdminMasterLocationsComponent,
			},
			//Payout setttings
			{
				path: 'master-payout-settings',
				component: AdminMasterPayoutSettingsComponent,
			},
		],
	},
];
