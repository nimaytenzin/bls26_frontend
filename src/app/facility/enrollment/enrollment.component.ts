import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { FacilityService } from '../../core/services/facility.service';
import { CommonModule } from '@angular/common';
import { Child, ChildNote } from '../../core/models/child.model';
import { Parent } from '../../core/models/parent.model';
import { Guardian } from '../../core/models/guardian.model';
import { PackageForm } from '../../core/models/package.model';
import { EnrollmentDto } from '../../core/models/enrollment.model';
import { switchMap, forkJoin } from 'rxjs';
import { SuccessToastComponent } from '../../shared/components/success-toast/success-toast.component';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss'],
  imports: [
		CommonModule,
		ReactiveFormsModule,
		SuccessToastComponent
	],
})
export class EnrollmentComponent implements OnInit {
  currentStep = 0;
  packages: any[] = [];
  enrollmentForm: FormGroup;
  childImageFile: File | null = null;
  parentImageFiles: (File | null)[] = [];
  guardianImageFiles: (File | null)[] = [];
	showToast = false;
	toastMessage = 'Enrollment successful!';



  @ViewChildren('parentFileInput') parentFileInputs!: QueryList<ElementRef>;

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
      guardians: this.fb.array([this.createGuardianForm()])
    });

    this.parentImageFiles.push(null);
    this.guardianImageFiles.push(null);
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

  get guardians(): FormArray {
    return this.enrollmentForm.get('guardians') as FormArray;
  }

  createParentForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cid: ['', Validators.required],
      phone: ['', Validators.required],
      avatarUrl: [''],
    });
  }

  createGuardianForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      relationship: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
      avatarUrl: [''],
    });
  }

  addParent() {
    this.parents.push(this.createParentForm());
    this.parentImageFiles.push(null);
  }

  removeParent(index: number) {
    if (this.parents.length > 1) {
      this.parents.removeAt(index);
      this.parentImageFiles.splice(index, 1);
    }
  }

  addGuardian() {
    this.guardians.push(this.createGuardianForm());
    this.guardianImageFiles.push(null);
  }

  removeGuardian(index: number) {
    if (this.guardians.length > 1) {
      this.guardians.removeAt(index);
      this.guardianImageFiles.splice(index, 1);
    }
  }

  triggerFileInput(inputId: string, index?: number): void {
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    fileInput?.click();
  }

  handleFileSelection(event: Event, type: 'child' | 'parent' | 'guardian', index?: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (type === 'child') {
        this.childImageFile = file;
        this.enrollmentForm.get('child.avatarUrl')?.setValue(file.name);
      } else if (type === 'parent' && index !== undefined) {
        this.parentImageFiles[index] = file;
        this.parents.at(index).get('avatarUrl')?.setValue(file.name);
      } else if (type === 'guardian' && index !== undefined) {
        this.guardianImageFiles[index] = file;
        this.guardians.at(index).get('avatarUrl')?.setValue(file.name);
      }
    }
  }

	prevStep() {
		if (this.currentStep > 0) {
			this.currentStep--;
		}
	}


	nextStep() {
		const stepControls = this.getCurrentStepFormGroup();
		if (stepControls.invalid) {
			stepControls.markAllAsTouched();
			return;
		}

		const maxStep = 3;
		if (this.currentStep < maxStep) {
			this.currentStep++;
		}
	}

	getCurrentStepFormGroup(): FormGroup {
		if (this.currentStep === 0) {
			return this.enrollmentForm.get('child') as FormGroup;
		}

		if (this.currentStep === 1) {
			return this.fb.group({
				childNote: this.enrollmentForm.get('childNote'),
				packageForm: this.enrollmentForm.get('packageForm'),
			});
		}

		if (this.currentStep === 2) {
			return this.fb.group({ parents: this.parents });
		}

		if (this.currentStep === 3) {
			return this.fb.group({ guardians: this.guardians });
		}

		return this.enrollmentForm;
	}

  onSubmit() {
    if (this.enrollmentForm.invalid) {
      this.enrollmentForm.markAllAsTouched();
      return;
    }

    const child: Child = this.enrollmentForm.get('child')?.value;
    const childNote: ChildNote = this.enrollmentForm.get('childNote')?.value;
    const packageForm: PackageForm = this.enrollmentForm.get('packageForm')?.value;
    const parents: Parent[] = this.enrollmentForm.get('parents')?.value;
    const guardians: Guardian[] = this.enrollmentForm.get('guardians')?.value;

    // Set image URLs
    if (this.childImageFile) {
      child.avatarUrl = this.childImageFile.name;
    }
    parents.forEach((p, i) => {
      if (this.parentImageFiles[i]) {
        p.avatarUrl = this.parentImageFiles[i]!.name;
      }
    });
    guardians.forEach((g, i) => {
      if (this.guardianImageFiles[i]) {
        g.avatarUrl = this.guardianImageFiles[i]!.name;
      }
    });

    child.facilityId = this.facilityContext.getFacilityId()!;

    this.enrollmentService.enrollChild(child).pipe(
      switchMap((savedChild) => {
        const childId = savedChild.id;
        const childNoteRequest = this.enrollmentService.enrollChildNote({ ...childNote, childId });
        const parentRequests = this.enrollmentService.enrollParents(parents, childId);
				const guardianRequests = this.enrollmentService.enrollGuardians(guardians, childId);

				return forkJoin({ childNoteRequest, parentRequests, guardianRequests }).pipe(
					switchMap(({ parentRequests, guardianRequests }) => {
						const parentIds: string[] = parentRequests
							.map(p => p.id?.toString())
							.filter((id): id is string => !!id);

						const guardianIds: string[] = guardianRequests
							.map(g => g.id?.toString())
							.filter((id): id is string => !!id);

						const enrollmentDto: EnrollmentDto = {
							childId: savedChild.id,
							parentIds,
							guardianIds,
							facilityId: child.facilityId,
							packageId: packageForm.packageId,
							start_date: packageForm.startDate,
							end_date: packageForm.endDate,
							status: 'active'
						};

						return this.enrollmentService.createEnrollment(enrollmentDto);
					})
				);

      })
    ).subscribe({
			next: () => {
				this.toastMessage = 'Enrollment successful!';
				this.showToast = true;
				setTimeout(() => (this.showToast = false), 3000);
			},
      error: (err) => console.error('Enrollment failed', err),
    });
  }

  isInvalid(path: string): boolean {
    const control = this.enrollmentForm.get(path);
    return !!(control && control.touched && control.invalid);
  }
}
