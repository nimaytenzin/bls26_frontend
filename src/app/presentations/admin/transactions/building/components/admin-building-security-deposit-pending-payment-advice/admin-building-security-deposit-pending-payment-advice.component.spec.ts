/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingSecurityDepositPendingPaymentAdviceComponent } from './admin-building-security-deposit-pending-payment-advice.component';

describe('AdminBuildingSecurityDepositPendingPaymentAdviceComponent', () => {
  let component: AdminBuildingSecurityDepositPendingPaymentAdviceComponent;
  let fixture: ComponentFixture<AdminBuildingSecurityDepositPendingPaymentAdviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingSecurityDepositPendingPaymentAdviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingSecurityDepositPendingPaymentAdviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
