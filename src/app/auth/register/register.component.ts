import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { PrimeNgModules } from '../../shared/primeng/primeng.modules';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { Parent } from '../../core/models/parent.model';
import { ParentService } from '../../core/services/parent.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    PublicNavbarComponent,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    PrimeNgModules
  ],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private parentService: ParentService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cid: ['', Validators.required],
      phone: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const newParent: Partial<Parent> = {
        ...this.registerForm.value,
        avatarUrl: '' // Optional or to be updated after file upload
      };

      this.parentService.registerParent(newParent).subscribe({
        next: () => this.router.navigate(['/verify-notice']),
        error: (err) => console.error('Registration failed:', err)
      });
    }
  }
}
