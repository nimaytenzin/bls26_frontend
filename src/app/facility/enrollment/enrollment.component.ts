import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { FacilityService } from '../../core/services/facility.service';

@Component({
  selector: 'app-enrollment',
  standalone: false,
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss'],
})
export class EnrollmentComponent implements OnInit {
  currentStep = 0;
  packages: any[] = [];
  enrollmentForm: FormGroup;
  childImageFile: File | null = null;
  parentImageFiles: File[] = [];

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
        avatarUrl: [''], // For storing the uploaded child image URL
        studentCode: ['', Validators.required],
        dob: ['', Validators.required],
        gender: ['', Validators.required],
        facilityId: [selectedFacilityId, Validators.required],
      }),
      childNote: this.fb.group({
        medicalCondition: [''],
        specialInstruction: [''],
        notes: [''],
      }),
      packageForm: this.fb.group({
        packageId: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
      }),
      parents: this.fb.array([this.createParentForm()]),
    });
  }

  ngOnInit() {
    const facilityId = this.facilityContext.getFacilityId();
    if (!facilityId) return;

    this.enrollmentService.getPackages().subscribe((res) => {
      this.packages = res.filter((pkg) => pkg.facilityId === facilityId);
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
      phone: ['', Validators.required],
      avatarUrl: [''], // For storing the uploaded parent image URL
    });
  }

  addParent() {
    this.parents.push(this.createParentForm());
  }

  removeParent(index: number) {
    if (this.parents.length > 1) this.parents.removeAt(index);
  }

  onFileChange(event: Event, type: 'child' | 'parent', parentIndex?: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (type === 'child') {
        this.enrollmentForm.get('child.avatarUrl')?.setValue(file.name);
      } else if (type === 'parent' && parentIndex !== undefined) {
        this.parents.at(parentIndex).get('avatarUrl')?.setValue(file.name);
      }
    } else {
      console.log('No file selected or input is invalid.');
    }
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
    if (this.currentStep === 1)
      return this.fb.group({
        childNote: this.enrollmentForm.get('childNote'),
        packageForm: this.enrollmentForm.get('packageForm'),
      });
    return this.enrollmentForm;
  }

  onSubmit() {
    if (this.enrollmentForm.invalid) {
      this.enrollmentForm.markAllAsTouched();
      return;
    }
  
    const formData = new FormData();
    formData.append('child', JSON.stringify(this.enrollmentForm.get('child')?.value));
    formData.append('childNote', JSON.stringify(this.enrollmentForm.get('childNote')?.value));
    formData.append('packageForm', JSON.stringify(this.enrollmentForm.get('packageForm')?.value));
    formData.append('parents', JSON.stringify(this.enrollmentForm.get('parents')?.value));
  
    if (this.childImageFile) {
      formData.append('childImage', this.childImageFile);
      console.log('Child Image File:', this.childImageFile.name);
    }
  
    this.parentImageFiles.forEach((file, index) => {
      if (file) {
        formData.append(`parentImage${index}`, file);
        console.log(`Parent ${index} Image File:`, file.name);
      }
    });
  
    console.log('FormData:', formData);
  
    this.enrollmentService.completeEnrollment(formData).subscribe({
      next: () => alert('Enrollment successful!'),
      error: (err) => console.error('Enrollment failed', err),
    });
  }

  isInvalid(path: string): boolean {
    const control = this.enrollmentForm.get(path);
    return !!(control && control.touched && control.invalid);
  }
}