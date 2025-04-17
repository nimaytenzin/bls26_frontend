import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RegistrationService } from './registration.service';

@Component({
  selector: 'app-registration',
	standalone: false,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})

export class RegistrationComponent {
  currentStep = 0;
  registrationForm: FormGroup;

  constructor(private fb: FormBuilder, private registrationService: RegistrationService) {
    this.registrationForm = this.fb.group({
      child: this.fb.group({
        name: ['', Validators.required],
        preferredName: [''],
        cid: ['', Validators.required],
        avatarUrl: [''],
        studentCode: ['', Validators.required],
        dob: ['', Validators.required],
        gender: ['', Validators.required],
        facilityId: [''] // Optional, backend can fill this
      }),
      childNote: this.fb.group({
        medicalCondition: [''],
        specialInstruction: [''],
        notes: ['']
      }),
      parents: this.fb.array([this.createParentForm()])
    });
  }

  get parents(): FormArray {
    return this.registrationForm.get('parents') as FormArray;
  }

  createParentForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cid: ['', Validators.required],
      phone: ['', Validators.required]
    });
  }

  addParent() {
    this.parents.push(this.createParentForm());
  }

  removeParent(index: number) {
    if (this.parents.length > 1) this.parents.removeAt(index);
  }

  nextStep() {
    const currentGroup = this.getCurrentStepFormGroup();
    if (currentGroup.invalid) {
      currentGroup.markAllAsTouched();
      return;
    }
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  getCurrentStepFormGroup(): FormGroup {
    if (this.currentStep === 0) return this.registrationForm.get('child') as FormGroup;
    if (this.currentStep === 1) return this.registrationForm.get('childNote') as FormGroup;
    return this.registrationForm; // step 3 handles form array
  }

  onSubmit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.registrationService.completeRegistration(this.registrationForm.value).subscribe({
      next: () => alert('Registration successful!'),
      error: err => console.error('Registration failed', err)
    });
  }

	isInvalid(path: string): boolean {
		const control = this.registrationForm.get(path);
		return !!(control && control.touched && control.invalid);
	}

}
