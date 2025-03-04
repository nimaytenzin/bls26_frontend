/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminUnitLeasePaymentStatusComponent } from './admin-unit-lease-payment-status.component';

describe('AdminUnitLeasePaymentStatusComponent', () => {
  let component: AdminUnitLeasePaymentStatusComponent;
  let fixture: ComponentFixture<AdminUnitLeasePaymentStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUnitLeasePaymentStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUnitLeasePaymentStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
