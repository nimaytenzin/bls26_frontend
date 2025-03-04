/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminGenerateUnitLeasePaymentAdviceComponent } from './admin-generate-unit-lease-payment-advice.component';

describe('AdminGenerateUnitLeasePaymentAdviceComponent', () => {
  let component: AdminGenerateUnitLeasePaymentAdviceComponent;
  let fixture: ComponentFixture<AdminGenerateUnitLeasePaymentAdviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminGenerateUnitLeasePaymentAdviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGenerateUnitLeasePaymentAdviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
