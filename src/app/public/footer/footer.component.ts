import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	imports: [CommonModule],
})
export class FooterComponent {
	currentYear = new Date().getFullYear();
	socialLinks = [
		{ name: 'Facebook', icon: 'pi pi-facebook' },
		{ name: 'Instagram', icon: 'pi pi-instagram' },
		{ name: 'Twitter', icon: 'pi pi-twitter' },
		{ name: 'TikTok', icon: 'pi pi-clock' },
		{ name: 'YouTube', icon: 'pi pi-youtube' },
	];

	downloadLinks = [
		{ platform: 'Apple', icon: 'pi pi-apple' },
		{ platform: 'Android', icon: 'pi pi-android' },
		{ platform: 'Huawei', icon: 'pi pi-mobile' },
	];
}
