/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceSearchByPlotComponent } from './admin-payment-advice-search-by-plot.component';

describe('AdminPaymentAdviceSearchByPlotComponent', () => {
  let component: AdminPaymentAdviceSearchByPlotComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceSearchByPlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceSearchByPlotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceSearchByPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
