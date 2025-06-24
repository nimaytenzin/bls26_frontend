import { Component, OnInit } from '@angular/core';
import { PrimeNgModules } from '../../../primeng.modules';
import { CommonModule } from '@angular/common';
import { PublicETicketComponent } from '../../../shared/components/public-e-ticket/public-e-ticket.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
	selector: 'app-public-booking-confirmation',
	templateUrl: './public-booking-confirmation.component.html',
	styleUrls: ['./public-booking-confirmation.component.scss'],
	imports: [PrimeNgModules, CommonModule],
	providers: [DialogService],
})
export class PublicBookingConfirmationComponent implements OnInit {
	ref: DynamicDialogRef | undefined;

	selectedMovie = {
		id: 2,
		title: 'With love from Bhutan',
		description:
			'A heartfelt journey through the breathtaking landscapes of Bhutan, exploring love, tradition, and the pursuit of happiness.',
		image: 'posters/portrait.png',
		rating: 'PG',
		duration: '1h 55min',
		genre: ['Drama', 'Romance'],
		trailerUrl: 'https://youtu.be/eZHC0HkA4e8',
	};

	selectedHall = {
		name: 'Hall 1',
		location: 'Norzin Lam,Thimphu Thromde',
		theatreName: 'City Cinema',
	};
	selectedSeats = [
		{ rowLabel: 'A', seatNumber: 12, price: 399, category: 'BASIC' },
		{ rowLabel: 'A', seatNumber: 13, price: 399, category: 'BASIC' },
		{ rowLabel: 'A', seatNumber: 14, price: 399, category: 'BASIC' },
		{ rowLabel: 'D', seatNumber: 1, price: 499, category: 'PREMIUM' },
	];

	constructor(public dialogService: DialogService) {}

	ngOnInit(): void {
		// this.showEticket();
		console.log('Booking Confirmation Component Initialized');
	}

	calculateTotal(): number {
		return this.selectedSeats.reduce((sum, seat) => {
			return sum + seat.price;
		}, 0);
	}

	showEticket() {
		this.ref = this.dialogService.open(PublicETicketComponent, {
			header: '',
			showHeader: false,
			width: '400px',
			dismissableMask: true,
			styleClass: 'bg-transparent border-none',
		});
	}
}
