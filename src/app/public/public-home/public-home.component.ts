import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicPreLoaderComponent } from '../public-pre-loader/public-pre-loader.component';

@Component({
	selector: 'app-public-home',
	templateUrl: './public-home.component.html',
	styleUrls: ['./public-home.component.scss'],
	standalone: true,
	imports: [CommonModule, PublicPreLoaderComponent],
})
export class PublicHomeComponent implements OnInit {
	showPreloader: boolean = true;

	constructor() {}

	ngOnInit() {
		// Hide preloader after 5 seconds
		setTimeout(() => {
			this.showPreloader = false;
		}, 5000);
	}
}
