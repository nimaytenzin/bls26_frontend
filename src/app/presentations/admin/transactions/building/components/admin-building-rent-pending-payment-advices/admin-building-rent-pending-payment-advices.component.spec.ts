/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingRentPendingPaymentAdvicesComponent } from './admin-building-rent-pending-payment-advices.component';

describe('AdminBuildingRentPendingPaymentAdvicesComponent', () => {
  let component: AdminBuildingRentPendingPaymentAdvicesComponent;
  let fixture: ComponentFixture<AdminBuildingRentPendingPaymentAdvicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingRentPendingPaymentAdvicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingRentPendingPaymentAdvicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
