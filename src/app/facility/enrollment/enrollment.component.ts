import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { FacilityService } from '../../core/services/facility.service'; // adjust the path accordingly


@Component({
  selector: 'app-enrollment',
	standalone: false,
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss']
})
export class EnrollmentComponent implements OnInit {
  currentStep = 0;
  packages: any[] = [];

  enrollmentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private enrollmentService: EnrollmentService,
    private facilityContext: FacilityService
  ) {
    const selectedFacilityId = this.facilityContext.getFacilityId();

    this.enrollmentForm = this.fb.group({
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
		const facilityId = this.facilityContext.getFacilityId();
		if (!facilityId) return;

		this.enrollmentService.getPackages().subscribe(res => {
			this.packages = res.filter(pkg => pkg.facilityId === facilityId); // Filter by selected facility
		});
	}


  get parents(): FormArray {
    return this.enrollmentForm.get('parents') as FormArray;
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
    if (this.currentStep === 0) return this.enrollmentForm.get('child') as FormGroup;
    if (this.currentStep === 1) return this.fb.group({
      childNote: this.enrollmentForm.get('childNote'),
      packageForm: this.enrollmentForm.get('packageForm')
    });
    return this.enrollmentForm;
  }

  onSubmit() {
    if (this.enrollmentForm.invalid) {
      this.enrollmentForm.markAllAsTouched();
      return;
    }

    this.enrollmentService.completeEnrollment(this.enrollmentForm.value).subscribe({
      next: () => alert('Enrollment successful!'),
      error: err => console.error('Enrollment failed', err)
    });
  }

  isInvalid(path: string): boolean {
    const control = this.enrollmentForm.get(path);
    return !!(control && control.touched && control.invalid);
  }
}
