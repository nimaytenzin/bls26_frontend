import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-set-password',
	standalone: true,
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss'],
	imports: [
		CommonModule,
		ReactiveFormsModule,
	]
})
export class SetPasswordComponent implements OnInit {
  form!: FormGroup;
  userId!: string;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id') || '';

    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.valid && !this.form.errors?.['passwordMismatch']) {
      this.http.patch(`http://localhost:3000/users/${this.userId}`, {
        password: this.form.value.password
      }).subscribe(() => {
        this.router.navigate(['/auth/login']);
      });
    }
  }
}
