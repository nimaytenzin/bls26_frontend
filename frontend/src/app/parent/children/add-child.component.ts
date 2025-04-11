import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'add-child',
  standalone: false,
  templateUrl: './add-child.component.html',
  styleUrls: ['./add-child.component.scss']
})
export class AddChildComponent {
  childForm: FormGroup;
  isChecking = false;
  eccdValid = false;
  eccdName = '';

  constructor(private fb: FormBuilder) {
    this.childForm = this.fb.group({
      name: ['', Validators.required],
      dob: ['', Validators.required],
      eccdCode: ['', Validators.required]
    });
  }

  validateCode() {
    const code = this.childForm.get('eccdCode')?.value?.trim();
    if (!code) return;

    this.isChecking = true;
    this.eccdValid = false;
    this.eccdName = '';

    // Simulated backend check - replace with actual service call
    setTimeout(() => {
      if (code === 'LITTLESTEPS123') {
        this.eccdValid = true;
        this.eccdName = 'LittleSteps ECCD Center';
      } else {
        this.eccdValid = false;
        this.eccdName = '';
      }
      this.isChecking = false;
    }, 1000);
  }

  onSubmit() {
    if (this.childForm.valid && this.eccdValid) {
      const childData = {
        ...this.childForm.value,
        eccdName: this.eccdName,
        status: 'pending'
      };
      console.log('Submitted child:', childData);
      // TODO: Call backend service to save the child
    }
  }
}