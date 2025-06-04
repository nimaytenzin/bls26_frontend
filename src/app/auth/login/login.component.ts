import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { AuthService } from '../auth.service';
import { User } from '../../core/models/user.model';

import { PrimeNgModules } from '../../shared/primeng/primeng.modules';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PublicNavbarComponent,
		PrimeNgModules
  ],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

	onSubmit(): void {
		if (this.loginForm.valid) {
			const { email, password } = this.loginForm.value;

			this.http.post<User>('http://localhost:3000/api/auth/login', { email, password })
				.subscribe({
					next: (user) => {
						this.authService.login(user);
						const redirectPath = this.authService.getRedirectPathByRole(user.role);
						this.router.navigate([redirectPath]);
					},
					error: (err) => {
						console.error('Login failed:', err);
						alert('Invalid email or password.');
					}
				});
		} else {
			this.loginForm.markAllAsTouched();
		}
	}

}
