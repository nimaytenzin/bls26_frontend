/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdvicePaidListComponent } from './admin-payment-advice-paid-list.component';

describe('AdminPaymentAdvicePaidListComponent', () => {
  let component: AdminPaymentAdvicePaidListComponent;
  let fixture: ComponentFixture<AdminPaymentAdvicePaidListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdvicePaidListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdvicePaidListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
