/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceSearchByTenantComponent } from './admin-payment-advice-search-by-tenant.component';

describe('AdminPaymentAdviceSearchByTenantComponent', () => {
  let component: AdminPaymentAdviceSearchByTenantComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceSearchByTenantComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceSearchByTenantComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceSearchByTenantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
