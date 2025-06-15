import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import CustomTheme from './assets/custom-theme';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(routes), // Provide the routes
		provideHttpClient(withInterceptors([authInterceptor])), // Provide HttpClient with functional interceptor
		provideAnimationsAsync(),
		providePrimeNG({
			theme: {
				preset: CustomTheme,
			},
		}),
	],
}).catch((err) => console.error(err));
