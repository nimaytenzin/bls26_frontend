import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { Owner } from '../../core/models/owner.model';
import { OwnerService } from '../../core/services/owner.service';
import { CommonModule } from '@angular/common';

import { PrimeNgModules } from '../../shared/primeng/primeng.modules';

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
    private ownerService: OwnerService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cid: ['', Validators.required],
      phone: ['', Validators.required],
      facility: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const newOwner: Owner = {
        ...this.registerForm.value,
        role: 'owner',
        isVerified: false
      };

      this.ownerService.registerOwner(newOwner).subscribe({
        next: () => this.router.navigate(['/verify-notice']),
        error: (err) => console.error('Registration failed:', err)
      });
    }
  }
}
