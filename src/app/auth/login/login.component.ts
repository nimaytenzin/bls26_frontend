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

      this.http.get<User[]>(`http://localhost:3000/owners?email=${email}&password=${password}`)
        .subscribe((users) => {
          const user = users[0];
          if (user) {
            this.authService.login(user);

            if (user.role === 'admin') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          } else {
            alert('Invalid email or password.');
          }
        });
    } else {
      this.loginForm.markAllAsTouched(); // force display of validation errors
    }
  }
}
