import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PrimeNgModules } from '../../../../primeng.modules';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
	selector: 'app-public-e-ticket',
	templateUrl: './public-e-ticket.component.html',
	styleUrls: ['./public-e-ticket.component.scss'],
	imports: [CommonModule, PrimeNgModules, QRCodeComponent],
})
export class PublicETicketComponent implements OnInit {
	selectedSeats = [
		{ rowLabel: 'A', seatNumber: 12, price: 399, category: 'BASIC' },
		{ rowLabel: 'A', seatNumber: 13, price: 399, category: 'BASIC' },
		{ rowLabel: 'A', seatNumber: 14, price: 399, category: 'BASIC' },
		{ rowLabel: 'D', seatNumber: 1, price: 499, category: 'PREMIUM' },
	];

	ticket = {
		id: 123213,
		idString: '123132',
	};
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

	constructor() {}

	ngOnInit() {}
}
