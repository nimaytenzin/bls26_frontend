import { Routes } from '@angular/router';
import { PublicHomeComponent } from './public-home/public-home.component';
import { PublicSelectMovieScheduleComponent } from './public-select-movie-schedule/public-select-movie-schedule.component';
import { PublicSelectSeatsComponent } from './public-select-seats/public-select-seats.component';
import { PublicLayoutComponentComponent } from './public-layout-component/public-layout-component.component';
import { PublicBookingConfirmationComponent } from './public-booking-confirmation/public-booking-confirmation.component';
import { PaymentComponent } from './payment/payment.component';
import { BestSeatComponent } from './best-seat/best-seat.component';
import { PublicEticketComponent } from './public-eticket/public-eticket.component';

export const publicRoutes: Routes = [
	{
		path: '',
		component: PublicLayoutComponentComponent,
		children: [
			{ path: '', component: PublicHomeComponent },
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

			{
				path: 'booking-confirmation',
				component: PublicBookingConfirmationComponent,
			},
			{
				path: 'best-seat-layout',
				component: BestSeatComponent,
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
