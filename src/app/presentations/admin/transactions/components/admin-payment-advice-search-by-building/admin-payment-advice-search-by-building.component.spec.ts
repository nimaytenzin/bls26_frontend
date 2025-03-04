/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AdminPaymentAdviceSearchByBuildingComponent } from './admin-payment-advice-search-by-building.component';

describe('AdminPaymentAdviceSearchByBuildingComponent', () => {
  let component: AdminPaymentAdviceSearchByBuildingComponent;
  let fixture: ComponentFixture<AdminPaymentAdviceSearchByBuildingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPaymentAdviceSearchByBuildingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPaymentAdviceSearchByBuildingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
