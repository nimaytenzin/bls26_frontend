import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-register',
	standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
	imports: [
		PublicNavbarComponent,
		ReactiveFormsModule
	],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cid: ['', Validators.required],
      phone: ['', Validators.required],
      facility: ['', Validators.required] // New field
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const newUser = {
        ...this.registerForm.value,
        role: 'owner', // Automatically assign 'owner'
        isVerified: false // until they verify email
      };

      // Simulate API call (or save to localStorage or json-server)
      console.log('User registered:', newUser);
      this.router.navigate(['/verify-notice']);
    }
  }
}

// if I am not mistaken, there will be no details related to the facility which means the ECCD Centre Name is not required.
