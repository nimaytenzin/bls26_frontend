/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceBuildingPaidListComponent } from './admin-payment-advice-building-paid-list.component';

describe('AdminPaymentAdviceBuildingPaidListComponent', () => {
  let component: AdminPaymentAdviceBuildingPaidListComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceBuildingPaidListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceBuildingPaidListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceBuildingPaidListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
