/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminBuildingRentPaidPaymentAdvicesComponent } from './admin-building-rent-paid-payment-advices.component';

describe('AdminBuildingRentPaidPaymentAdvicesComponent', () => {
  let component: AdminBuildingRentPaidPaymentAdvicesComponent;
  let fixture: ComponentFixture<AdminBuildingRentPaidPaymentAdvicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBuildingRentPaidPaymentAdvicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBuildingRentPaidPaymentAdvicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
