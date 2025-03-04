/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OwnerGenerateLeaseStepperComponent } from './owner-generate-lease-stepper.component';

describe('OwnerGenerateLeaseStepperComponent', () => {
  let component: OwnerGenerateLeaseStepperComponent;
  let fixture: ComponentFixture<OwnerGenerateLeaseStepperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OwnerGenerateLeaseStepperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OwnerGenerateLeaseStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
