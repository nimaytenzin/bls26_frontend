/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminReceivePaymentPaymentAdviceModalComponent } from './admin-receive-payment-payment-advice-modal.component';

describe('AdminReceivePaymentPaymentAdviceModalComponent', () => {
  let component: AdminReceivePaymentPaymentAdviceModalComponent;
  let fixture: ComponentFixture<AdminReceivePaymentPaymentAdviceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminReceivePaymentPaymentAdviceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminReceivePaymentPaymentAdviceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
