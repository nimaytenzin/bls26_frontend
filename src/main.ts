import { bootstrapApplication } from '@angular/platform-browser';
import {
	provideRouter,
	withEnabledBlockingInitialNavigation,
	withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import CustomTheme from './assets/custom-theme';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(
			routes,
			withInMemoryScrolling({
				scrollPositionRestoration: 'top', // Scrolls to top on navigation
				anchorScrolling: 'enabled', // Allows scrolling to anchors (#id)
			}),
			withEnabledBlockingInitialNavigation() // Optional: blocks initial navigation until app is ready
		), // Provide the routes with scroll configuration
		provideHttpClient(withInterceptors([authInterceptor])), // Provide HttpClient with functional interceptor
		provideAnimationsAsync(),
		providePrimeNG({
			theme: {
				preset: CustomTheme,
			},
		}),
	],
}).catch((err) => console.error(err));
