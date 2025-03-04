/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPlotPaymentAdviceListingsComponent } from './admin-plot-payment-advice-listings.component';

describe('AdminPlotPaymentAdviceListingsComponent', () => {
  let component: AdminPlotPaymentAdviceListingsComponent;
  let fixture: ComponentFixture<AdminPlotPaymentAdviceListingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPlotPaymentAdviceListingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPlotPaymentAdviceListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
