import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		PublicNavbarComponent,
	],
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.resetForm.valid) {
      const email = this.resetForm.value.email;
      console.log('Reset link requested for:', email);
      // TODO: Call backend to send reset link
    }
  }
}
