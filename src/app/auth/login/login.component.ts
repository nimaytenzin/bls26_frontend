import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-login',
	standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		PublicNavbarComponent
	],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

	onSubmit(): void {
		if (this.loginForm.valid) {
			const { email, password } = this.loginForm.value;
			this.http.get<any[]>(`http://localhost:3000/users?email=${email}&password=${password}`).subscribe(users => {
				const user = users[0];
				if (user) {
					// Store user info in localStorage
					localStorage.setItem('currentUser', JSON.stringify(user));

					// Navigate based on user role
					if (user.role === 'admin') {
						this.router.navigate(['/admin-dashboard']); // Admin dashboard
					} else {
						this.router.navigate(['/dashboard']); // Regular user dashboard
					}
				} else {
					// Handle invalid credentials
					alert('Invalid email or password.');
				}
			});
		}
	}
}
