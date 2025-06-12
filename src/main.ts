import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // Import provideHttpClient
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import CustomTheme from './assets/custom-theme';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(routes), // Provide the routes
		provideHttpClient(), // Provide HttpClient
		provideAnimationsAsync(),
		providePrimeNG({
			theme: {
				preset: CustomTheme,
			},
		}),
	],
}).catch((err) => console.error(err));
