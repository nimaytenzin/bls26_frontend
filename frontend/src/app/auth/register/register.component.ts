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
  selectedRole: 'parent' | 'eccd' = 'parent';

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      organization: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  selectRole(role: 'parent' | 'eccd') {
    this.selectedRole = role;

    const orgCtrl = this.registerForm.get('organization');

    if (role === 'eccd') {
      orgCtrl?.setValidators([Validators.required]);
    } else {
      orgCtrl?.clearValidators();
    }

    orgCtrl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formData = {
        ...this.registerForm.value,
        role: this.selectedRole
      };

      console.log('Register form submitted:', formData);
      // TODO: Send to backend
    }
  }
}
