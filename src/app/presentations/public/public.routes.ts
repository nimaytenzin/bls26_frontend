import { Routes } from '@angular/router';
import { PublicHomeComponent } from './public-home/public-home.component';
import { PublicSelectSeatsComponent } from './booking/public-select-seats/public-select-seats.component';
import { PublicLayoutComponentComponent } from './layout/public-layout-component/public-layout-component.component';
import { PaymentComponent } from './booking/payment/payment.component';
import { PublicEticketComponent } from './booking/public-eticket/public-eticket.component';
import { PublicMoviesComponent } from './public-movies/public-movies.component';
import { PublicHowToGuideComponent } from './public-how-to-guide/public-how-to-guide.component';
import { PublicSelectMovieScheduleComponent } from './booking/public-select-movie-schedule/public-select-movie-schedule.component';

export const publicRoutes: Routes = [
	{
		path: '',
		component: PublicLayoutComponentComponent,
		children: [
			{ path: '', component: PublicHomeComponent },
			{
				path: 'movies',
				component: PublicMoviesComponent,
			},
			{
				path: 'guide',
				component: PublicHowToGuideComponent,
			},
			{
				path: 'select-schedule/:id',
				component: PublicSelectMovieScheduleComponent,
			},
			{
				path: 'select-seats/:id',
				component: PublicSelectSeatsComponent,
			},

			{
				path: 'payment',
				component: PaymentComponent,
			},

			// Legacy routes for backward compatibility
			{
				path: 'movie/schedule/:movieId',
				redirectTo: 'select-schedule/:movieId',
			},
			{
				path: 'movie/select-seat/:movieId',
				redirectTo: 'select-seats/:movieId',
			},
		],
	},

	{
		path: 'eticket/:sessionId/:bookingId',
		component: PublicEticketComponent,
	},
];
