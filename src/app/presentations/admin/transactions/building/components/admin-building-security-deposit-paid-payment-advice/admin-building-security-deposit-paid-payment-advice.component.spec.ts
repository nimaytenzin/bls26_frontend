/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingSecurityDepositPaidPaymentAdviceComponent } from './admin-building-security-deposit-paid-payment-advice.component';

describe('AdminBuildingSecurityDepositPaidPaymentAdviceComponent', () => {
  let component: AdminBuildingSecurityDepositPaidPaymentAdviceComponent;
  let fixture: ComponentFixture<AdminBuildingSecurityDepositPaidPaymentAdviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingSecurityDepositPaidPaymentAdviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingSecurityDepositPaidPaymentAdviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
