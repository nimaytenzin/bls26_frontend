/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceSecurityDepositMasterComponent } from './admin-payment-advice-security-deposit-master.component';

describe('AdminPaymentAdviceSecurityDepositMasterComponent', () => {
  let component: AdminPaymentAdviceSecurityDepositMasterComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceSecurityDepositMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceSecurityDepositMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceSecurityDepositMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
