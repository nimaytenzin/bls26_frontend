import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicNavbarComponent } from '../shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
	imports: [
		PublicNavbarComponent,
    RouterModule, // Required for routerLink to work
	],
})
export class LandingComponent {

}
