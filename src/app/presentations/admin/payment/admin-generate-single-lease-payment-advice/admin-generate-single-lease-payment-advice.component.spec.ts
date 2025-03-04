/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminGenerateSingleLeasePaymentAdviceComponent } from './admin-generate-single-lease-payment-advice.component';

describe('AdminGenerateSingleLeasePaymentAdviceComponent', () => {
  let component: AdminGenerateSingleLeasePaymentAdviceComponent;
  let fixture: ComponentFixture<AdminGenerateSingleLeasePaymentAdviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminGenerateSingleLeasePaymentAdviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGenerateSingleLeasePaymentAdviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
