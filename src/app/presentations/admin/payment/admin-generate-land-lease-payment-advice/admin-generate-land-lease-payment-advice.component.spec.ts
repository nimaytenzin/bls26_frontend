/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminGenerateLandLeasePaymentAdviceComponent } from './admin-generate-land-lease-payment-advice.component';

describe('AdminGenerateLandLeasePaymentAdviceComponent', () => {
  let component: AdminGenerateLandLeasePaymentAdviceComponent;
  let fixture: ComponentFixture<AdminGenerateLandLeasePaymentAdviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminGenerateLandLeasePaymentAdviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGenerateLandLeasePaymentAdviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
