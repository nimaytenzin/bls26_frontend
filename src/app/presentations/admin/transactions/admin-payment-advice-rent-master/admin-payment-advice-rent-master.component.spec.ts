/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceRentMasterComponent } from './admin-payment-advice-rent-master.component';

describe('AdminPaymentAdviceRentMasterComponent', () => {
  let component: AdminPaymentAdviceRentMasterComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceRentMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceRentMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceRentMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
