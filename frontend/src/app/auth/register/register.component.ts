import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  selectedRole: 'parent' | 'provider' = 'parent';

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      organization: [''], // only used for providers
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  selectRole(role: 'parent' | 'provider') {
    this.selectedRole = role;
    if (role === 'provider') {
      this.registerForm.get('organization')?.setValidators([Validators.required]);
    } else {
      this.registerForm.get('organization')?.clearValidators();
    }
    this.registerForm.get('organization')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formData = {
        ...this.registerForm.value,
        role: this.selectedRole
      };

      console.log('Registration Data:', formData);
      // TODO: send to backend
    }
  }
}
