import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import { PrimeNgModules } from '../../../primeng.modules';
import { LoginDto } from '../../../core/dataservice/auth/auth.interface';

declare const particlesJS: any;

@Component({
	selector: 'app-login',
	standalone: true,
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	imports: [CommonModule, ReactiveFormsModule, RouterModule, PrimeNgModules],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
	loginForm!: FormGroup;
	isLoading = false;
	errorMessage = '';

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router
	) {}

	ngOnInit(): void {
		// Initialize the form first
		this.loginForm = this.fb.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(6)]],
		});

		// // Check if user is already authenticated
		// if (this.authService.isAuthenticated()) {
		// 	this.redirectToUserDashboard();
		// 	return;
		// }
	}

	ngAfterViewInit(): void {
		this.loadParticlesJS();
	}

	ngOnDestroy(): void {
		// Cleanup particles if needed
		try {
			const particlesElement = document.getElementById('particles-js');
			if (particlesElement) {
				particlesElement.innerHTML = '';
			}
		} catch (error) {
			// Ignore cleanup errors
		}
	}

	private loadParticlesJS(): void {
		// Wait for particles.js to load from CDN with multiple retry attempts
		this.waitForParticlesJS(0);
	}

	private waitForParticlesJS(attempt: number): void {
		const maxAttempts = 10;
		const retryDelay = 200;

		if (attempt >= maxAttempts) {
			console.warn(
				'Particles.js failed to load after multiple attempts. Continuing without particles.'
			);
			return;
		}

		if (typeof particlesJS !== 'undefined') {
			// particlesJS is loaded, initialize it
			this.initializeParticles();
		} else {
			// Not loaded yet, try again after a delay
			setTimeout(() => {
				this.waitForParticlesJS(attempt + 1);
			}, retryDelay);
		}
	}

	private initializeParticles(): void {
		// Check if particles element exists and particlesJS is available
		const particlesElement = document.getElementById('particles-js');
		if (!particlesElement) {
			console.warn('Particles element not found');
			return;
		}

		if (typeof particlesJS === 'undefined') {
			console.warn('Particles.js library not available');
			return;
		}

		try {
			particlesJS('particles-js', {
				particles: {
					number: {
						value: 50,
						density: {
							enable: true,
							value_area: 800,
						},
					},
					color: {
						value: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
					},
					shape: {
						type: 'circle',
						stroke: {
							width: 1,
							color: '#bfdbfe',
						},
					},
					opacity: {
						value: 0.6,
						random: true,
						anim: {
							enable: true,
							speed: 1,
							opacity_min: 0.3,
							sync: false,
						},
					},
					size: {
						value: 8,
						random: true,
						anim: {
							enable: true,
							speed: 2,
							size_min: 4,
							sync: false,
						},
					},
					line_linked: {
						enable: false,
					},
					move: {
						enable: true,
						speed: 1,
						direction: 'top',
						random: true,
						straight: false,
						out_mode: 'out',
						bounce: false,
						attract: {
							enable: false,
						},
					},
				},
				interactivity: {
					detect_on: 'canvas',
					events: {
						onhover: {
							enable: true,
							mode: 'bubble',
						},
						onclick: {
							enable: true,
							mode: 'repulse',
						},
						resize: true,
					},
					modes: {
						bubble: {
							distance: 150,
							size: 12,
							duration: 2,
							opacity: 0.8,
							speed: 3,
						},
						repulse: {
							distance: 100,
							duration: 0.6,
						},
					},
				},
				retina_detect: true,
			});
			console.log('Particles.js initialized successfully');
		} catch (error) {
			console.warn(
				'Error initializing particles.js, continuing without particles:',
				error
			);
			// Don't throw error - let the login page continue to work
		}
	}

	login(): void {
		if (this.loginForm.invalid) {
			this.markFormGroupTouched();
			return;
		}

		this.isLoading = true;
		this.errorMessage = '';

		const loginDto: LoginDto = {
			email: this.loginForm.value.email,
			password: this.loginForm.value.password,
		};

		console.log('Attempting login with:', loginDto);
		this.authService.login(loginDto).subscribe({
			next: (response) => {
				console.log('Login successful:', response);
				this.isLoading = false;
				this.redirectToUserDashboard();
			},
			error: (error) => {
				console.error('Login error:', error);
				this.isLoading = false;
				this.errorMessage = error.message || 'Login failed. Please try again.';
			},
		});
	}

	/**
	 * Redirect user to appropriate dashboard based on role
	 */
	private redirectToUserDashboard(): void {
		const user = this.authService.getCurrentUser();
		console.log(user);
		if (user) {
			console.log('Redirecting based on user role:', user.role);
			console.log('IsSupervisor:', this.authService.isSupervisor());
			console.log('IsAdmin:', this.authService.isAdmin());
			console.log('IsEnumerator:', this.authService.isEnumerator());
			if (this.authService.isAdmin()) {
				this.router.navigate(['/admin']);
			} else if (this.authService.isSupervisor()) {
				this.router.navigate(['/supervisor']);
			} else if (this.authService.isEnumerator()) {
				this.router.navigate(['/enumerator']);
			} else {
				this.router.navigate(['/']);
			}
		} else {
			this.router.navigate(['/']);
		}
	}

	/**
	 * Mark all form controls as touched to show validation errors
	 */
	private markFormGroupTouched(): void {
		Object.keys(this.loginForm.controls).forEach((key) => {
			const control = this.loginForm.get(key);
			control?.markAsTouched();
		});
	}

	/**
	 * Check if form field has error
	 */
	hasFieldError(fieldName: string): boolean {
		const field = this.loginForm.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	/**
	 * Get field error message
	 */
	getFieldError(fieldName: string): string {
		const field = this.loginForm.get(fieldName);

		if (field && field.errors && field.touched) {
			if (field.errors['required']) {
				return `${
					fieldName === 'phoneNumber' ? 'Email address' : 'Password'
				} is required`;
			}
			if (field.errors['minlength']) {
				return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
			}
			if (field.errors['email']) {
				return 'Please enter a valid email address';
			}
		}

		return '';
	}

	/**
	 * Navigate back to home page
	 */
	navigateToHome(): void {
		this.router.navigate(['/']);
	}
}
