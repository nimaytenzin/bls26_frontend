import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RegistrationService } from './registration.service';
import { FacilityService } from '../../core/services/facility.service'; // adjust the path accordingly


@Component({
  selector: 'app-registration',
	standalone: false,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  currentStep = 0;
  packages: any[] = [];

  registrationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private facilityContext: FacilityService
  ) {
    const selectedFacilityId = this.facilityContext.getFacilityId();

    this.registrationForm = this.fb.group({
      child: this.fb.group({
        name: ['', Validators.required],
        preferredName: [''],
        cid: ['', Validators.required],
        avatarUrl: [''],
        studentCode: ['', Validators.required],
        dob: ['', Validators.required],
        gender: ['', Validators.required],
        facilityId: [selectedFacilityId, Validators.required] // Set facilityId here
      }),
      childNote: this.fb.group({
        medicalCondition: [''],
        specialInstruction: [''],
        notes: ['']
      }),
      packageForm: this.fb.group({
        packageId: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required]
      }),
      parents: this.fb.array([this.createParentForm()])
    });
  }


  ngOnInit() {
    this.registrationService.getPackages().subscribe(res => this.packages = res);
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
    const stepControls = this.getCurrentStepFormGroup();
    if (stepControls.invalid) {
      stepControls.markAllAsTouched();
      return;
    }
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  getCurrentStepFormGroup(): FormGroup {
    if (this.currentStep === 0) return this.registrationForm.get('child') as FormGroup;
    if (this.currentStep === 1) return this.fb.group({
      childNote: this.registrationForm.get('childNote'),
      packageForm: this.registrationForm.get('packageForm')
    });
    return this.registrationForm;
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
