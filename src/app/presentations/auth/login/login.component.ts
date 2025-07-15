import { Component, HostListener, OnInit } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { APPNAME } from '../../../core/constants/constants';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import { PrimeNgModules } from '../../../primeng.modules';
import { LoginDto } from '../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-login',
	standalone: true,
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	imports: [CommonModule, ReactiveFormsModule, RouterModule, PrimeNgModules],
})
export class LoginComponent implements OnInit {
	loginForm!: FormGroup;
	isLoading = false;
	errorMessage = '';
	APPNAME = APPNAME;
	mouseX: number = 0;
	mouseY: number = 0;
	cursorX: number = 0;
	cursorY: number = 0;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router
	) {}

	ngOnInit(): void {
		// Initialize the form first
		this.loginForm = this.fb.group({
			phoneNumber: [
				17263764,
				[
					Validators.required,
					Validators.min(1000000),
					Validators.max(99999999999),
				],
			],
			password: ['overlord123', [Validators.required, Validators.minLength(6)]],
		});

		// Check if user is already authenticated
		if (this.authService.isAuthenticated()) {
			this.redirectToUserDashboard();
			return;
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
			phoneNumber: this.loginForm.value.phoneNumber,
			password: this.loginForm.value.password,
		};

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

		if (user) {
			if (this.authService.isAdmin()) {
				this.router.navigate(['/admin']);
			} else if (this.authService.isCounterStaff()) {
				this.router.navigate(['/counter-staff/sell-tickets']);
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
					fieldName === 'phoneNumber' ? 'Phone number' : 'Password'
				} is required`;
			}
			if (field.errors['minlength']) {
				return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
			}
			if (field.errors['min'] || field.errors['max']) {
				return 'Please enter a valid phone number';
			}
		}

		return '';
	}

	@HostListener('mousemove', ['$event'])
	onMouseMove(event: MouseEvent) {
		this.cursorX = event.clientX;
		this.cursorY = event.clientY;

		this.mouseX = (event.clientX / window.innerWidth - 0.5) * 100;
		this.mouseY = (event.clientY / window.innerHeight - 0.5) * 100;
	}

	getTopCircleStyle() {
		return {
			transform: `translate3d(${this.mouseX * 2}px, ${this.mouseY * 2}px, 0)`,
			transition: 'transform 0.6s cubic-bezier(0.33, 1, 0.68, 1)',
		};
	}

	getBottomCircleStyle() {
		return {
			transform: `translate3d(${-this.mouseX * 2}px, ${-this.mouseY * 2}px, 0)`,
			transition: 'transform 0.6s cubic-bezier(0.33, 1, 0.68, 1)',
		};
	}
}
