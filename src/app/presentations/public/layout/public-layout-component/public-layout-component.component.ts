import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PrimeNgModules } from '../../../../primeng.modules';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
	selector: 'app-public-layout-component',
	templateUrl: './public-layout-component.component.html',
	styleUrls: ['./public-layout-component.component.scss'],
	imports: [
		CommonModule,
		RouterModule,
		PrimeNgModules,
		NavbarComponent,
		FooterComponent,
	],
})
export class PublicLayoutComponentComponent implements OnInit {
	constructor(private router: Router) {}

	ngOnInit() {}
}
